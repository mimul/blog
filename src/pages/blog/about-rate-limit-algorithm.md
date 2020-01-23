---
templateKey: "blog-post"
title: "서비스 가용성 확보에 필요한 Rate Limiting Algorithm에 대해"
description: "Rate Limit 알고리즘(Leaky bucket, Token bucket, Fixed window counter, Sliding window log, Sliding window counter)과 주요 서비스들의 Rate Limit 정책 등에 정리한 글."
author: "미물"
authorURL: "https://mimul.com"
date: "2020-01-18T21:23:58.000Z"
lastModificationTime: "2020-01-18T21:23:58.000Z"
image: "/img/topics/algorithm.png"
commentId: "about-rate-limit-algorithm-2020-01-18"
tags:
  - Rate Limit Algorithm
  - Rest API
  - Leaky Bucket
  - Token Bucket
  - Fixed Window
  - Sliding Window
---
서비스를 운영하다보면 의도적이든 의도적이지 않던간에 서비스의 가용성(API레벨, 네트워크 레벨, 컨테이너 레벨, CPU 레벨이든)을 유지하기 위해서 클라이언트의 과도한 사용에 대해 스스로를 보호해야 합니다. 간과하기 쉽지만, 서비스의 가용성을 유지하기 위한 노력은 클라이언트 측(앱/웹))에도 같이 설계를 해주는 것이 바람직합니다. 서비스를 보호해주는 수단으로 Rate Limit 알고리즘 적용하는데, 이를 효과적으로 적용하기 위해서는 알고리즘에 대한 이해도를 높일 필요가 있고 또, 서비스의 트래픽 특성도 파악해 둘 필요가 있습니다. 여기에서는 Rate Limit 알고리즘 정리하는 것을 목표로 하고 간단한 알고리즘을 구현함으로써 이해도를 높이도록 하겠습니다.

## 왜 Rate Limit 알고리즘이 필요한가?

- 과도한 트래픽으로부터 서비스를 보호.
- Resource 사용에 대한 공정성과 합리성 유도.
- 트래픽 비용이 서비스 예산을 넘는 것을 방지.
- Rate에 대해 과금을 부과하는 Business Model로 활용.

## Rate Limit 알고리즘 종류

아래의 5가지 알고리즘을 잘 알고, 자신의 트래픽 패턴도 파악해 자사 서비스의 가용성에 문제가 되기전에 적절한 알고리즘을 선택해서 트래픽 제어를 할 필요가 있습니다. 알고리즘과 관련된 소스는 [Github](https://github.com/mimul/java-algorithm/tree/master/src/main/java/com/mimul/ratelimit)에 올려놨고 기본 window 단위는 초 기반으로 되어있으니 참고하세요.

##### 1. Leaky Bucket

네트워크로의 데이터 주입 속도의 상한을 정해 제어하고 네트워크에서 트래픽 체증을 일정하게 유지한다. 일정한 유출 속도(유출 속도는 고정된 값)를 제한하여 버스트 유입 속도를 부드럽게 한다.

![Leaky Bucket](/img/blog/rate_leakybucket.png)

- 고정 용량의 버킷에 다양한 유량의 물이 들어오면 버킷에 담기고 그 담긴물은 일정량 비율로 떨어진다.
- 들어오는 물의 양이 많아 버킷의 용량을 초과하게 되면 그 물은 버린다.
- 입력 속도가 출력 속도보다 크면 버킷에서 누적이 발생하고 누적이 버킷 용량보다 큰 경우 오버플로가 발생하여 데이터 패킷 손실이 발생할 수 있다.

아래는 Leaky Bucket을 구현한 샘플 소스이다.

**1.1 샘플 소스**

```java
public class LeakyBucket extends RateLimiter {
  private final long capacity;
  private long used;
  private final long leakInterval;
  private long lastLeakTime;

  protected LeakyBucket(int maxRequestPerSec) {
    super(maxRequestPerSec);
    this.capacity = maxRequestPerSec;
    this.used = 0;
    this.leakInterval = 1000 / maxRequestPerSec;
    this.lastLeakTime = System.currentTimeMillis();
  }

  @Override
  boolean allow() {
    leak();
    synchronized (this) {
      this.used++;
      if (this.used >= this.capacity) {
        return false;
      }
      return true;
    }
  }
  private void leak() {
    final long now = System.currentTimeMillis();
    if (now > this.lastLeakTime) {
      long millisSinceLastLeak = now - this.lastLeakTime;
      long leaks = millisSinceLastLeak / this.leakInterval;
      if(leaks > 0) {
        if(this.used <= leaks){
          this.used = 0;
        } else {
          this.used -= (int) leaks;
        }
        this.lastLeakTime = now;
      }
    }
  }
}

```

**1.2 채용 플랫폼**

- [Amazon MWS(Maketplace WEb Service)](https://docs.developer.amazonservices.com/en_IT/dev_guide/DG_Throttling.html)
- [NGINX](https://www.nginx.com/blog/rate-limiting-nginx/)
- [Uber-go rate limiter](https://github.com/uber-go/ratelimit)
- [Shopify](https://help.shopify.com/en/api/reference/rest-admin-api-rate-limits)
- [Guava RateLimiter](https://github.com/google/guava/blob/master/guava/src/com/google/common/util/concurrent/SmoothRateLimiter.java)

##### 2. Token Bucket

일시적으로 많은 트래픽이 와도 토큰이 있다면 처리가 가능하면서 토큰 손실 처리를 통해 평균 처리 속도를 제한할 수 있다. 즉, 평균 유입 속도를 제한하고 처리 패킷 손실없이 특정 수준의 버스트 요청 허용할 수 있다.

![Token Bucket](/img/blog/rate_tokenbucket.png)

- 토큰은 정해진 비율로 토큰 버킷에 넣는다.
- 버킷은 최대 n개의 토큰을 저장하며, 버킷이 가득차면 새로 추가된 토큰은 삭제되거나 거부된다.
- 요청이 들어오면 큐에 들어가며 요청을 처리하기 전에 토큰 버킷의 토큰을 획득해야 하며, 토큰을 보유한 후에 요청이 처리되며 처리된 후에는 토큰을 삭제한다.
- 토큰 버킷은 토큰이 배치되는 속도를 기반으로 액세스 속도를 제어한다.
- 전송 횟수를 누적할 수 있으며, 버킷이 가득차면 패킷 손실 없이 토큰이 손실된다.

아래는 Token Bucket을 구현한 샘플 소스이다.

**2.1 샘플 소스**

```java
public class TokenBucket extends RateLimiter {
  private int tokens;
  private int capacity;
  private long lastRefillTime;

  public TokenBucket(int maxRequestPerSec) {
    super(maxRequestPerSec);
    this.tokens = maxRequestPerSec;
    this.capacity = maxRequestPerSec;
    this.lastRefillTime = scaledTime();
  }

  @Override
  public boolean allow() {
    synchronized (this) {
      refillTokens();
      if (this.tokens == 0) {
        return false;
      }
      this.tokens--;
      return true;
    }
  }

  private void refillTokens() {
    final long now = scaledTime();
    if (now > this.lastRefillTime) {
      final double elapsedTime = (now - this.lastRefillTime);
      int refill = (int) (elapsedTime * this.maxRequestPerSec);
      this.tokens = Math.min(this.tokens + refill, this.capacity);
      this.lastRefillTime = now;
    }
  }

  private long scaledTime() {
    return System.currentTimeMillis() / 1000;
  }
}
```

**2.2 채용 플랫폼**

- AWS : [API Gateway](https://aws.amazon.com/ko/blogs/aws/new-usage-plans-for-amazon-api-gateway/), [EC2](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/throttling.html#throttling-limits), [EBS](https://aws.amazon.com/ko/blogs/aws/new-ssd-backed-elastic-block-storage/), CPU Credit
- [Spring Cloud Netflix Zuul](https://github.com/marcosbarbero/spring-cloud-zuul-ratelimit)
- [Bucket4j](https://github.com/vladimir-bukhtoyarov/bucket4j)

##### 3. Fixed Window Counter

정해진 시간 단위로 window가 만들어지고 요청 건수가 기록되어 해당 window의 요청 건수가 정해진 건수보다 크면 해당 요청은 처리가 거부된다. 이 알고리즘을 사용하면 경계의 시간대(12:59, 13:01초에 몰리면)에 요청이 오면 두배의 부하를 받게 된다. 즉, 구현은 쉽지만, 기간 경계의 트래픽 편향 문제가 발생된다.

![Fixed Window Counter](/img/blog/rate_fixed_window_counter.png)

- 버킷에는 정해진 시간 단위의 window(window 1번은 12:00 - 13:00, window 2번은 13:00 - 14:00)가 존재하고
- 시간 단위의 각 window는 요청이 오면 요청 건수가 기록된다.
- 시간당 정해진 요청 건수가 초과(여기서는 분당 4건이 상한)되는 9번의 요청은 거부된다.

아래는 Fixed Window Counter를 구현한 샘플 소스이다.

**3.1 샘플 소스**

```java
public class FixedWindowCounter extends RateLimiter {
  private final ConcurrentMap<Long, AtomicInteger> windows = new ConcurrentHashMap<>();
  private final int windowSizeInMs;

  protected FixedWindowCounter(int maxRequestPerSec, int windowSizeInMs) {
    super(maxRequestPerSec);
    this.windowSizeInMs = windowSizeInMs;
  }

  @Override
  boolean allow() {
    long windowKey = System.currentTimeMillis() / windowSizeInMs;
    windows.putIfAbsent(windowKey, new AtomicInteger(0));
    return windows.get(windowKey).incrementAndGet() <= maxRequestPerSec;
  }

  public String toString() {
    StringBuilder sb = new StringBuilder("");
    for(Map.Entry<Long, AtomicInteger> entry:  windows.entrySet()) {
      sb.append(entry.getKey());
      sb.append(" --> ");
      sb.append(entry.getValue());
      sb.append("\n");
    }
    return sb.toString();
  }
}
```

##### 4. Sliding Window Log

Fixed window counter의 단점인 기간 경계의 편향에 대응하기 위한 알고리즘이다. 하지만, window의 요청건에 대한 로그를 관리해야하기 때문에 구현과 메모리 비용이 높은 문제점이 있다.

![Sliding Window Log](/img/blog/rate_sliding-window-log.png)

- 분당 2건의 요청을 처리한다면 12초와 24초에 온 요청은 허용이 되고 36초에 온 요청 분당 2건처리 원칙에 의해 거부되고
- 1분 25초의 요청이 들어오면 12초와 14초에 온 요청 로그를 pop해서 꺼내 없애고 남은 건 바로 전 요청인 36초에 온거 하나만 있어서 1분 25초에 들어온 요청은 처리가 된다.

아래는 Sliding Window Log를 구현한 샘플 소스이다.

**4.1 생플소스**

```java
public class SlidingWindowLog extends RateLimiter {
  private final Queue<Long> windowLog = new LinkedList<>();

  protected SlidingWindowLog(int maxRequestPerSec) {
    super(maxRequestPerSec);
  }

  @Override
  boolean allow() {
    long now = System.currentTimeMillis();
    long boundary = now - 1000;
    synchronized (windowLog) {
      while (!windowLog.isEmpty() && windowLog.element() <= boundary) {
        windowLog.poll();
      }
      windowLog.add(now);
      log.info("current time={}, log size ={}", now, windowLog.size());
      return windowLog.size() <= maxRequestPerSec;
    }
  }
}
```

##### 5. Sliding Window Counter

Fixed window counter의 경계 문제와 Sliding window log의 로그 보관 비용 등의 문제점을 보완할 수 있는 알고리즘이다.

![Sliding Window Counter](/img/blog/rate_sliding-window.png)

- 분당 10건 처리한다면 1분안에 9건의 요청이 오고 1분과 2분 사이에는 5건이 요청온다고 가정.
- 1분 15초에 요청이 왔는데 1분 15초 지점은 1분과 2분 사이에서 25% 지점, 이전 기간은 1 - 0.25 = 75% 비율로 계산해서 9 * 0.75 + 5 = 14.75 > 10으로 한도를 초과했기 때문에 요청은 거부된다. 즉, 이전 window와 현재 window의 비율값으로 계산된 합이 처리 건수를 초과하면 거부된다.
- 1분 30초 시점에 요청이 온다면 이전 기간은 50%, 9 * 0.5 + 5 = 9.5 < 10이므로 해당 요청은 처리된다.

Sliding Window Counter는 window의 비율이 소수점이 나오게 되면 정확성이 떨어질 수는 있으나, Fixed window counter의 경계 문제와 Sliding window log의 로그 보관 비용 등의 문제점을 개선하게 된다. 아래는 Sliding Window Counter의 샘플 소스이다.

**5.1 샘플 소스**

```java
public class SlidingWindow extends RateLimiter {
  private final ConcurrentMap<Long, AtomicInteger> windows = new ConcurrentHashMap<>();
  private final int windowSizeInMs;

  protected SlidingWindow(int maxRequestPerSec, int windowSizeInMs) {
    super(maxRequestPerSec);
    this.windowSizeInMs = windowSizeInMs;
  }

  @Override
  boolean allow() {
    long now = System.currentTimeMillis();
    long curWindowKey = now / windowSizeInMs;
    windows.putIfAbsent(curWindowKey, new AtomicInteger(0));
    long preWindowKey = curWindowKey - 1000;
    AtomicInteger preCount = windows.get(preWindowKey);
    if (preCount == null) {
      return windows.get(curWindowKey).incrementAndGet() <= maxRequestPerSec;
    }
    double preWeight = 1 - (now - curWindowKey) / 1000.0;
    long count = (long) (preCount.get() * preWeight + windows.get(curWindowKey).incrementAndGet());
    return count <= maxRequestPerSec;
  }
}
```

**5.2 채용 플랫폼**

- [RateLimitJ](https://github.com/mokies/ratelimitj)

## 주요 서비스들의 Rate Limit 정보

Rate Limit이 적용하려면 [RFC 6585](http://tools.ietf.org/html/rfc6585)에 [429 Too Many Request](http://tools.ietf.org/html/rfc6585#section-4) HTTP 상태 코드가 제시되어 있고 [RateLimit Header Fields for HTTP](https://tools.ietf.org/id/draft-polli-ratelimit-headers-00.html) RFC 초안에도 나와 있듯이 RateLimit-Limit(허용되는 요청의 최대수), RateLimit-Remaining(남은 요청 수), RateLimit-Reset(요청 최대값이 재설정될 때까지의 시간) 정보를 Header에 같이 보내주면 좋다.

| 사이트 | 제한 정보 | 응답 정보(HTTP Status) | 응답 정보(Header) | 참조 사이트 |
| :---: | :--- | :---| :--- | :---|
| ![Twitter](/img/blog/icon-twitter.png) | 1일 100 트윗 | 429 Too Many Requests | x-rate-limit-limit, x-rate-limit-remaining, x-rate-limit-reset | [Twitter Rate Limits](https://developer.twitter.com/en/docs/basics/rate-limits) |
| ![Github](/img/blog/icon-github.png)| Basic Authentication or OAuth 활용한 API는 시간당 5000건, 미인증 API는 시간당 60건 | 403 Forbidden | X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset | [Github Rate Limits](https://developer.github.com/v3/#rate-limiting)|
| ![Slack](/img/blog/icon-slack.png)| 메시지 게시는 초당 1회, 다른 Web API methods는 분당 1 ~ 100회, Events는 시간당 30,000 | 429 Too Many Requests | Retry-After | [Slack Rate Limits](https://api.slack.com/docs/rate-limits)|
| ![Facebook](/img/blog/icon-facebook.png)| Applications은 시간당 유저수 * 200 | 403 Forbidden | call_count, total_cputime, total_time | [Facebook Rate Limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/) |
| ![Shopify](/img/blog/icon-shopify.png)| 40 Bucket size는 초당 2건, 80 Bucket size는 초당 4건 | 429 Too Many Requests | X-Shopify-Shop-Api-Call-Limit: 40/40, Retry-After: 2.0 | [Shopify Rate Limits](https://help.shopify.com/en/api/reference/rest-admin-api-rate-limits)|

## Rate Limit 모범 사례

- Rate Limit 알고리즘은 트래픽 패턴을 잘 분석한 다음 적합한 알고리즘을 선택해야 한다. 유료 서비스가 트래픽 체증에 민감해하지 않다면(관대한) Token Bucket 알고리즘을 선택하고 그 외에는 Fixed Wondow나 Sliding Window 알고리즘을 선택한다.
- 기본적으로 서비스 인프라 트래픽을 수용할 수 없는 시점에 도달했을 때 Rate Limit을 적용해야하며, 외부 서비스에 영향을 최소화하는 노력(Common한 API는 Rate Limit에 걸리지 않을 정도로 상한값을 높게 잡음 등)을 한 다음 Rate Limit을 적용하는게 좋다.
- 외부 개발자들에게 Rate Limit 정보를 명확하게 알려야하고, API 응답에도 요청 정보와 남은 정보 등 트래픽이 초과했을때 오류값 등을 명확히 정의해야 한다.

## Rate Limit 알고리즘 구현체(오픈 소스)

- [Bucket4j](https://github.com/vladimir-bukhtoyarov/bucket4j)
- [Resilience4j](https://github.com/resilience4j/resilience4j/tree/master/resilience4j-ratelimiter)
- [RateLimitJ](https://github.com/mokies/ratelimitj)
- [Spring Cloud Zuul RateLimit](https://github.com/marcosbarbero/spring-cloud-zuul-ratelimit)
- [Guava RateLimiter](https://github.com/google/guava/blob/master/guava/src/com/google/common/util/concurrent/SmoothRateLimiter.java)
- [Tollbooth](https://github.com/didip/tollbooth)
- [Uber-go rate limiter](https://github.com/uber-go/ratelimit)
- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit)
- [Flask-Limiter](https://github.com/alisaifee/flask-limiter)
- [Smyte RateLimit](https://github.com/smyte/ratelimit)

## 참조 사이트

- [RateLimit Header Fields for HTTP](https://tools.ietf.org/html/draft-polli-ratelimit-headers-01)
- [Leaky bucket](https://en.wikipedia.org/wiki/Leaky_bucket)
- [Token bucket](https://en.wikipedia.org/wiki/Token_bucket)
- [Rate Limiting Part 1](https://hechao.li/2018/06/25/Rate-Limiter-Part1/)
- [High-performance rate limiting](https://medium.com/smyte/rate-limiter-df3408325846)
