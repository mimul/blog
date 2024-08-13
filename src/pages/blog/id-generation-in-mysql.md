---
templateKey: "blog-post"
title: "DB 테이블의 키인 ID 생성에 대한 방법 고찰 : UUID의 진화, MySQL 사용자를 위한 방법, 글로벌 기업의 ID 생성 사례"
description: "MySQL에서 ID 생성에 대해 알아야할 것들을 정리하고 글로벌 기업들의 사례를 조사해 정리함."
author: "미물"
authorURL: "https://mimul.com"
date: "2022-03-22T19:33:45.000Z"
lastModificationTime: "2022-03-23T19:33:45.000Z"
image: "/img/blog/twitter_snowflake.png"
commentId: "id-generation-in-mysql-2022-03-22"
tags:
  - MySQL
  - ID
---
MySQL의 ID를 auto_increment 사용시에 대두되는 문제점으로는 ID가 예측가능하기에 공격 등 보안에 취약하고 분산된 DB 환경에서 ID의 Uniqueness 문제가 발생하는 등의 문제점을 직면하게 된다. 그래서 이를 타개하기 위해서 UUID의 진화적 측면과 MySQL 사용자를 위한 방법 그리고 글로벌 기업들은 어떻게 ID를 생성하는지 리서치해 볼 필요가 있다. 그래서 이를 조사하고 고민한 것들에 대해 기술한다.

## UUID를 Primary Key로 사용할 때 이슈

MySQL InnoDB의 테이블은 인덱스는 트리 구조(B+Tree)를 가지며, 기본 키(Primary Key)는 리프 페이지에 테이블의 값을 가지는 클러스터 인덱스 구조를 가진다.

![MySQL Clusted Index](/img/blog/mysql_cluster_index.png)

- 기본 키의 트리 구조에서 데이터는 리프 페이지에 유지된다.
- 페이지 사이즈의 디폴트는 16KB(※innodb_page_size로 변경 가능)
- 향후 업데이트에 대비하여 1/16을 남기고 15/16을 활용한다.

구조적으로 기본 키의 오름차순 또는 내림차순으로 INSERT 하는 경우의 효율이 가장 높고 리프 페이지가 양단에 순차적으로 추가된다. 도중에 데이터가 삽입되지 않는 경우의 각 리프 페이지의 사용 상황은 항상 15/16이 된다. 위 그림과 같이 인덱스는 데이터가 정렬된 상태로 되어 있다. 그래서 해당 구조에 임의 값(UUID처럼 순서를 보장하지 않는)을 등록하려면 이미 있는 레코드 사이에 데이터를 삽입해야 한다.
레코드를 등록하고 싶은 리프 페이지에 빈 공간이 있으면 그대로 저장할 수 있지만, 빈 공간이 없으면 하나의 리프 페이지를 분할하여 두 부분으로 나누게 되는 작업이 추가된다. 오름차순/내림차순 기본 키는 리프 페이지 분할이 발생하지 않기 때문에 한 리프 페이지에 10개의 레코드를 유지할 수 있는 것에 비해 랜덤값의 경우 평균 7.5 레코드로 저장 효율이 25% 떨어질 수 있다. InnoDB에서 랜덤 값을 기본 키로 했을 때의 INSERT의 퍼포먼스에 대해서는 다양한 검증에 대한 [글들](https://kccoder.com/mysql/uuid-vs-int-insert-performance/)이 있다. 순차적인 Primary Key와의 비교에서는, 대략 레코드 수가 적을때는 비슷한 성능을 내지만 레코드가 증가하면 랜덤치의 성능이 떨어지게 되어 결과적으로 10~20배 이상의 차이가 날 수 있다. 그래서 UUID를 Primary Key로 하려면 순차적으로 ID를 생성할 수 있도록 하는게 성능상으로 좋아진다.

## 순서가 보장되는 ID 생성 방법 조사

**1. MySQL8의 uuid_to_bin에서 스왑 기능 사용**

MySQL8에는 ```uuid_to_bin()```함수가 준비되어 있으며 UUID를 16진수 표현에서 바이너리로 변환하여 32byte(하이픈 생략)에서 16byte로 변환하여 유지할 수 있다. ```uuid_to_bin()```의 두번째 인수에 1을 전달하면 UUID를 생성 할 때 교체한 경과 시간의 상위 비트와 하위 비트를 다시 바꾼 다음 바이너리 변환을 해준다. 이것에 의해 UUID의 경과 시간의 치환이 상쇄되기 때문에, 경과 시간이 그대로의 비트 표현으로 유지되게 되어 순차가 보장된다.

![uuid_to_bin](/img/blog/uuid_to_bin.png)

MySQL상에서 커맨드로 동작을 확인을 해보면 아래와 같다.
```
mysql> set @uuid = 'e8ba3536-7d1f-4aeb-89eb-874cbb0aa48f';
Query OK, 0 rows affected (0.00 sec)

mysql> select bin_to_uuid(uuid_to_bin(@uuid));
+--------------------------------------+
| bin_to_uuid(uuid_to_bin(@uuid))      |
+--------------------------------------+
|e8ba3536-7d1f-4aeb-89eb-874cbb0aa48f  |
+--------------------------------------+
1 row in set (0.00 sec)

mysql> select uuid_to_bin(@uuid, 1);
+----------------------------------------------+
| uuid_to_bin(@uuid, 1)                        |
+----------------------------------------------+
| 0x4AEB7D1FE8BA353689EB874CBB0AA48F           |
+----------------------------------------------+
1 row in set (0.00 sec)

mysql> select bin_to_uuid(uuid_to_bin(@uuid, 1), 1);
+---------------------------------------+
| bin_to_uuid(uuid_to_bin(@uuid, 1), 1) |
+---------------------------------------+
| e8ba3536-7d1f-4aeb-89eb-874cbb0aa48f  |
+---------------------------------------+
1 row in set (0.00 sec)

mysql> select bin_to_uuid(uuid_to_bin(@uuid, 1));
+--------------------------------------+
| bin_to_uuid(uuid_to_bin(@uuid, 1))   |
+--------------------------------------+
| 4aeb7d1f-e8ba-3536-89eb-874cbb0aa48f |
+--------------------------------------+
1 row in set (0.00 sec)
```

**2. ULID**

ULID (Universally Unique Lexicographically Sortable Identifier)는 UUID의 단점을 극복하고자 만들어졌다. ULID 스펙이나 언어별 구현 정보는 [여기](https://github.com/ulid/spec)에 있다.

![ULID](/img/blog/ulid.png)

- 48bit 타임스탬프
- 80bit Randomness(무작위)

으로 구성되어 있다. 특징은 아래와 같다.

- UUID와의 128비트 호환성
- 1ms당 1.21e+24의 고유한 ULID가 생성됨
- 사전식으로 정렬 가능
- 36글자의 UUID와는 대조적으로 표준적으로 26글자의 문자열로 인코딩
- 대문자 소문자를 구별하지 않음
- 특수문자 없음(URL safe)
- ID 시계열 비교/순서 보장

UUIDv4, v7, ULID 의 비교를 해보면

|형식    | 정렬 가능성 | 단조 증가성(순서) | 무작위 정도   | 데이터형  |
| :---  | :---     | :---:         | :---       | :---    |
| UUIDv4 | 불가능    | 없음           | 122 bits   | CHAR(36)|
| UUIDv7 | 가능     | 있음           | 62 bits    | CHAR(36)|
| ULID   | 가능     | 있음           | 80 bits    | CHAR(26)|

**3. Twitter Snowflake**

Zookeeper와 연동되어 구동되며, 스칼라로 구현했고, 64비트로 작은 사이즈로 인덱싱 크기를 작게 할 수 있다. 자세한 내용은 [여기](https://blog.twitter.com/engineering/en_us/a/2010/announcing-snowflake)에 기술되어 있다.

![Twitter Snowflake](/img/blog/twitter_snowflake.png)

- 1비트 사인
- 41bit 타임 스탬프
- 10bit 머신 ID(데이터 센터 ID + 워커 ID)
- 12bit 시퀀스

로 구성되어 있다. 특징은 아래와 같다.

- ID 시계열 비교/순서 보장
- ID 시간 복원 가능
- ID 생성 속도 좋음
- 64비트로 작은 사이즈
- 69년이 자나야 오버플로우 됨

**4. Sharding & IDs at Instagram**

Twitter의 Snowflake를 참고로 DB 테이블을의 논리적인 shard를 고려해서 PL/PGSQL(PostgreSQL에서 지원되는 프로그래밍 언어)로 구현했고, 64비트로 작은 사이즈로 인덱싱 크기를 작게 할 수 있다. 자세한 내용은 [여기](https://engineering.instagram.com/sharding-ids-at-instagram-1cf5a71e5a5c)에 기술되어 있다.

![Instagram shard ID](/img/blog/instagram_shard_id.png)

- 41bit 타임 스탬프
- 13bit 샤드 ID
- 10bit auto-incrementing 시퀀스 정보

로 구성되어 있다. 특징은 아래와 같다.

- ID 시계열 비교/순서 보장
- ID 생성 속도 좋음
- 64비트로 작은 사이즈

**5. Firebase PushID**

모두 120bit로 구성되어 있으며, 인덱스 사이즈가 좀 커질 수 있다. 자세한 내용은 [여기서](https://firebase.googleblog.com/2015/02/the-2120-ways-to-ensure-unique_68.html) 볼 수 있다.

![Firebase PushID](/img/blog/firebase_push_id.png)

- 48bit 타임스탬프
- 72bit 랜덤(무작위)

으로 구성되어 있다. ULID보다 랜덤 bit수가 조금 적다. 특징은 아래와 같다.

- ID 시계열 비교/순서 보장
- ID 생성 속도 좋음
- ID 예측이 불가능함

**6. Baidu UID generator**

Twitter의 Snowflake를 참고로 Java 언어로 구현했고 64비트 길이로 인덱스 사이즈를 줄일 수 있다. 자세한건 [여기서](https://github.com/baidu/uid-generator) 볼 수 있다.

![Baidu UID generator](/img/blog/baidu_uid.png)

- 1bits sign
- 28bits delta seconds
- 22bits worker id
- 13bits sequence

로 구성되어 있다. 특징은 아래와 같다.

- ID 시계열 비교/순서 보장
- ID 생성 속도 좋음
- 64비트로 작은 사이즈

**7. UUID v6, v7, v8**

UUID v6, v7, v8은 타임 스탬프로 정렬할 수 있는 새로운 [UUID 초안 사양](https://www.ietf.org/archive/id/draft-ietf-uuidrev-rfc4122bis-00.html)이 2021년부터 만들어지고 있다.

- UUID Version v6: 그레고리력 기반(UUID Version v1 개선)
- UUID Version v7: Unix Time Stamp 기반
- UUID Version v8: 고유 사양(실험적 또는 공급업체별 요구사항에서 사용)

## 참조 사이트

- [ULIDs and Primary Keys](https://blog.daveallie.com/ulid-primary-keys)
- [7 Famous Approaches to Generate Distributed ID with Comparison Table](https://blog.devgenius.io/7-famous-approaches-to-generate-distributed-id-with-comparison-table-af89afe4601f)
