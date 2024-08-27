---
templateKey: "blog-post"
title: "캐시 설계에서 발생하는 문제들"
description: "아키텍처에서 캐시 설계를 하면서 일어날 수 있는 문제와 해결책들을 정리함."
author: "미물"
authorURL: "https://mimul.com"
date: "2020-04-17T23:10:01.000Z"
lastModificationTime: "2020-04-17T23:10:01.000Z"
image: "/img/blog/cache_no.png"
commentId: "cache-problem-2020-04-17"
tags:
  - Cache
  - Redis
---

분산 시스템의 설계에서 캐시는 성능 향상을 위해 매우 중요한 요소지만, 캐시를 설계함에 있어서 여러 문제점들을 고려하지 않는다면 오히려 성능상의 단점이나 가용성에 문제에 직면할 수 있다. 이 글에서는 자주 발생하는 캐시 설계의 문제와 해결 방법에 대해 정리해 본다.

### Cache penetration

DB에 존재하지 않는 값을 검색할 때 DB에서 반환된 빈 결과를 캐시하지 않을 때 발생하는 시나리오를 말한다. 이 경우 DB에 존재하지 않는 값을 반복적으로 검색하면 해당 값이 캐시되지 않기 때문에 각 검색에 대해 DB에 대한 액세스가 필요하다. 악의적인 사용자가 이러한 키를 사용하여 많은 수의 검색을 시도해 공격을 시도하면 DB 레이어가 자주 히트하여 결국 다운될 수 있게 된다.

아래는 cache penetration 현상에 대한 두가지 해결책에 대해 기술해 본다.

**해결책 1) Empty 결과 캐싱**

쿼리가 반환하는 데이터가 비어 있더라도 결과를 캐시하여 이 문제를 해결하게 된다.

![empty 캐싱](/img/blog/cache_penetration_ans1.png)

그러나 악의적인 사용자가 존재하지 않는 값을 대량으로 검색하면 캐시가 데이터베이스에 존재하지 않는 값으로 채워질 수 있다. 이 경우 캐시 공간이 낭비되고 정상적인 요청에서 캐시 적중률이 저하된다. 따라서 이 빈 캐시의 유효기간은 짧게 설정하는 것이 좋다.

"Empty 결과 캐싱" 방법을 사용하는 경우는 검색 키의 반복률이 높은 경우에 사용하면 좋다.

```
def get_data(key):
    # 기본 expire 시간(1시간)
    cache_time = 3600 

    cache_data = redis_client.get(key)
    if cache_data is not None:
        return cache_data
    else:
        cache_data = db.get(key)
        if cache_data is None:
            cache_data = ""
	    # cache expiration time 짧게 설정(30초)
	    cache_time = 30 
        redis_client.set(key, cache_data, cache_time)
        return cache_data
```

**해결책 2) 블룸 필터 사용**

데이터를 검색하기 전에 Bloom 필터를 사용하여 DB에 데이터가 없는지 여부를 결정한다. 존재하지 않는 데이터에 대해서는 조기 리턴을 실시해, 캐쉬나 데이타베이스에의 액세스가 발생하지 않게 한다.

![bloomfilter](/img/blog/cache_penetration_ans2.png)

이 경우는 존재할 수 있는 데이터의 경우 먼저 캐시를 검색하고 데이터가 없으면 DB에 액세스하여 결과를 fetch 한다. 검색 키의 반복률이 낮고 검색 키의 종류가 매우 많은 경우에는 블룸 필터를 사용하는 것이 효과적이다. 블룸필터를 알려면 [Bloom Filter 소개](https://www.mimul.com/blog/bloom-filter/)라는 글을 보면 좋을 것 같다.

```
def get_data(key):
    if not bloomfilter.might_contain(key):
        return None
	
    cache_data = redis_client.get(key)
    if cache_data is None: 
		cache_data = db.get(key)
		cache_time = 3600 
		redis_client.set(key, cache_data, cache_time)
    return cache_data
```

### Cache breakdown

다중 스레드 환경에서 발생하는 시나리오며 캐시 데이터가 만료 되었을 때, 만료된 데이터에 대한 액세스가 병렬로 발생하면 데이터베이스에 대한 쿼리가 동시에 여러번 발생하므로 부하가 급증하게 되는 시나리오를 말한다.

**해결책 1) 검색 키를 잠금****

다른 스레드는 데이터베이스를 쿼리하는 스레드가 실행을 마치고 데이터를 다시 캐시에 추가하고 락을 해제하기를 기다린다. 해당 키의 락이 해제가 되면 다른 스레드는 캐시에서 데이터를 검색할 수 있게 된다.

![검색키잠금](/img/blog/cache_breakdown_ans1.png)

이 방법은 간단하지만, 데이터베이스 액세스 중에 잠금을 얻어야 한다.

```
def get_data(key):
    cache_data = redis_client.get(key)
    if cache_data is None: 
        if lock.acquire(): 
            cache_data = db.get(key)
            if cache_data is not None:
            	cache_time = 3600
                redis_client.set(key, cache_data, cache_time)
            lock.release()
        else:  
            time.sleep(0.1)
            cache_data = redis_client.get(key)
    return cache_data

```

**해결책 2) 자주 액세스 되는 데이터가 캐시에서 expire 되지 않도록 하기**

캐시의 유효기간을 redis와는 별도로 데이터 자체에도 갖게 해, 별도의 데이터가 기한이 지났을 때에 백그라운드의 비동기 thread로 캐시를 갱신시킨다. 이렇게 하면 자주 액세스되는 데이터가 캐시에서 expire 되지 않는다.

```
def get_data(key):
    cache_data = redis_client.get(key)
    value = cache_data.get('value')
    timeout = cache_data.get('timeout')

    if timeout <= time.time():
        def run():
            key_mutex = "mutex:" + key
            if redis_client.setnx(key_mutex, "1"):
                redis_client.expire(key_mutex, 3 * 60)
                db_data = db.get(key)
                cache_time = 3600
                redis_client.set(key, db_data,cache_time)
                redis_client.delete(key_mutex)

        thread = threading.Thread(target=run)
        thread.start()

    return value
```

이 방법은 성능상 이점은 있지만 캐시 업데이트 중에 다른 스레드가 이전 데이터에 액세스할 수 있으므로 캐시 일관성을 엄격하게 보장하기가 어려울 수 있다. 보장해야 할 일관성 수준에 따라 선택을 해야 한다.

### Cache avalenche

대량의 캐시 데이터가 동시에 만료되거나 캐시 서비스가 다운되어 갑자기 모든 데이터 검색이 DB로 향해 DB 레이어에 과부하가 걸려 성능에 영향을 미치는 시나리오를 말한다.

**해결책 1) 만료 날짜를 무작위로 설정**

캐시 만료 시간을 같은 값으로 설정하는 것은 피하고 무작위 값을 설정하여 만료되는 시간을 균등하게 분산시킨다. 이렇게 하면 각 캐시의 만료 기간의 반복률이 줄어들고 동시에 많은 양의 캐시가 만료되는 것을 피할 수 있다.

```
def random_expiry(original_expiry, deviation_percentage = 15):
    deviation = original_expiry * (deviation_percentage / 100)

    # 최소/최대 기한 산출
    min_expiry = original_expiry - deviation
    max_expiry = original_expiry + deviation

    # 유효기간(최소/최대 기한 범위)을 랜덤하게 취득
    random_expiry = random.uniform(min_expiry, max_expiry)

    return random_expiry

```

**해결책 2) 캐시 서버 가용성 향상**

캐시 서버를 여러대를 두어 가용성을 높임으로써 캐시 서버가 다운되는 현상을 줄일 수 있다. 예를 들어 Redis를 사용하는 경우 Redis 클러스터를 사용할 수 있다. Redis 클러스터는 데이터를 여러 Redis 노드에 분산하여 캐시 가용성과 내결함성을 향상시켜 준다. 이렇게 되면 일부 노드에서 문제가 발생해도 다른 노드에서 요청을 처리할 수 있게 된다.

**해결책 3) Rate Limit**

지정된 시간 프레임 내에서 캐시 재생성을 트리거 할 수 있는 요청 수에 상한을 설정하여 서버에 대한 부하 급증을 방지한다. 데이터베이스에 대한 액세스 요청의 급증이 방지되어 서버 리소스가 고갈되는 것을 예방하게 된다. 

이렇게 되면 시스템의 안정성과 성능을 유지할 수 있다. Rate Limit 알고리즘을 알고 싶으면 [서비스 가용성 확보에 필요한 Rate Limiting Algorithm에 대해](https://www.mimul.com/blog/about-rate-limit-algorithm/) 글을 보면 된다.