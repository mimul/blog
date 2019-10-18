---
templateKey: "blog-post"
title: "MySQL innodb_flush_method 튜닝 포인트"
description: "MySQL InnoDB 스토리지 엔진을 사용하면 매개 변수 innodb_flush_method가 있는데 이 설정 값의 의미와 테스트를 통해 튜닝 포인트를 검토."
author: "미물"
authorURL: "https://mimul.com"
date: "2010-05-15T21:20:46.000Z"
lastModificationTime: "2010-05-15T21:20:46.000Z"
image: "/img/topics/mysql.png"
commentId: "sysvar_innodb_flush_method-2010-05-15"
tags:
  - MySQL
  - MariaDB
---

MySQL InnoDB 스토리지 엔진을 사용하면 매개 변수 innodb_flush_method가 있는데 이 설정 값의 의미와 테스트를 통해 튜닝 포인트를 검토해 보고자 한다.

#### innodb_flush_method 매개 변수는?

MySQL InnoDB innodb_flush_method 매개 변수는 Unix/Linux에서 데이터 파일, 로그 파일을 읽고 쓰는 방법을 지정하는 것으로 [InnoDB Startup Options and System Variables](https://dev.mysql.com/doc/refman/8.0/en/innodb-parameters.html#sysvar_innodb_flush_method)에 따르면 다음과 같은 세가지 설정이 가능하다.

- fdatasync : 디폴트 설정. 데이터나 로그 파일을 열고 쓸 때 fsync()를 사용한다.
- O_DSYNC : 로그 파일을 읽고 쓸 때는 O_SYNC를 사용하고 데이터 파일을 읽고 쓸 때는 fsync()를 사용한다.
- O_DIRECT : 데이터 파일을 열 때는 O_DIRECT(솔라리스는 directio())를 사용하고 데이터 파일과 로그 파일을 쓸 때는 fsync()를 사용한다.

#### Direct I/O란?

O_DIRECT 플래그를 사용하여 파일을 열면 OS가 가지고 있는 Direct I/O기능을 이용할 수 있다. 즉, 이것은 OS의 캐시 메커니즘을 무시하는 기능이며, RDBMS는 자기 부담으로 데이터를 캐시 하니까 OS의 캐시 메커니즘은 필요 없어도 된다는 의미이다.

![Direct I/O](/img/blog/mysql_o_direct.png)

일반적으로 디스크의 파일에 액세스하는 경우 파일 캐시를 통과하게 되어 있는데 이 파일 캐싱 덕분에, 캐시 히트했을 경우에는 데이터 읽기 속도가 빨라진다. 또한, 파일 캐시를 이용한 지연된 쓰기 기능은 프로세스에 대한 쓰기 작업 성능이 향상된다.
Direct I/O를 사용하면 디스크상의 파일(데이터)에 액세스하기 위해 파일 캐시를 통과하지 않고 데이터는 응용 프로그램과 같은 프로세스와 디스크에 직접 전달된다.
RDBMS는 내부에 파일 캐시와 같은 도구를 갖추고 있다. 따라서 파일 캐시를 통하게 되면 캐시 처리가 2중으로 되어 불필요한 지연이 발생하여 Direct I/O와 같이 파일 캐시를 경유하지 않고 직접 디스크에 엑세스 하는 방안이 필요한 것이다.

#### 테스트를 통한 고찰

**1) 테스트 환경**

- 서버 자원
| Label        | Specification                       |
| ------------ | ----------------------------------- |
| CPU          | Intel Xeon Quad-Core X3440(2.53GHz) |
| OS           | Centos 5.7 x86_64                   |
| RAM          | DDR3 PC3-10600 (1,333MHz) 2GB x 2   |
| HDD          | SATA2 500GB (7200.ES)               |
| RDBMS        | MySQL 5.5.7                         |

- MySQL 설정 패턴
| Label                   | Specification                       |
| ----------------------- | ----------------------------------- |
| innodb_buffer_pool_size | 16MB, 32MB, 64MB, 128MB, 256MB      |
| innodb_flush_method     | fdatasync, O_DIRECT                 |
| Write Data Scale        | 500M                                |

- 테스트 테이블
```
CREATE TABLE user(
  id bigint(20) NOT NULL AUTO_INCREMENT,
  last_name varchar(256) DEFAULT NULL,
  first_name varchar(256) DEFAULT NULL,
  duty varchar(256) DEFAULT NULL,
  cellphone varchar(256) DEFAULT NULL,
  housephone varchar(256) DEFAULT NULL,
  telephone varchar(256) DEFAULT NULL,
  office_fax varchar(256) DEFAULT NULL,
  home_address varchar(256) DEFAULT NULL,
  office_address varchar(256) DEFAULT NULL,
  remark text,
  PRIMARY KEY (id),
  KEY NAME_INDEX (first_name,last_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

**2) 테스트 결과**

![테스트 결과](/img/blog/fdata_o_direct_test.png)

buffer_pool이 128M 이전은 fdatasync 방식이 성능이 더 높고 128M이후부터는 O_DIRECT 방식이 더 높은 성능 결과를 보여주고 있다.
앞쪽으로 fdatasync 방식이 더 성능이 높은 것은 InnoDB 버퍼 풀에 없는 데이터가 OS 파일 캐시에 있을 수 있어 디스크 I/O를 줄일 수 있기 때문에 성능 효과를 본 것 같다. 즉, OS 파일 캐시가 InnoDB 버퍼 풀에 대한 보조 캐시 역할을 한 것이라고 볼 수 있다.

#### 요약해 보면

O_DIRECT가 fdatasync에 비해 동등한 성능 이상을 발휘하기 위해서는

- 모든 데이터가 InnoDB 버퍼 풀에 들어가거나
- 물리 메모리의 절반 정도를 InnoDB 버퍼 풀에 할당하는 경우
- RAID 컨트롤러에 Write Cache가 붙어있고, 그 Write Cache가 Battery Backed Unit(BBU)이 있을 경우

중 하나의 조건을 충족해야 좋은 성능을 발취할 것으로 보인다. 그리고 O_DIRECT를 사용하는 장점은 Double buffering(MySQL Buffer Pool과 OS 캐시)을 막아 메모리를 효율적으로 사용하고, OS 캐시의 오동작 회피할 수 있을 수 있다.

데이터 베이스 이외에 기능들에서 File I/O가 많이 일어난다면, 트랜젝션의 양, 트랜젝션의 중량감 등도 고려되어야 하고 무조건 버퍼풀 많이 잡는 것도 문제니 꼭, 테스트를 많이 해서 시스템에 환경에 맞는 매개변수를 취사 선택해야 한다. 또한 이런 습관은 더 중요하다. 이론적 예측보다는, 그냥 좋다고 덥석 설정 값을 고정하기보다는 테스트를 해서 증명하는 것이 더 좋은 방법이다.

"추측하지 말라, 데이터를 보고 계산된 예측을 하라"

#### 참조 사이트

- [innodb_flush_method](https://dev.mysql.com/doc/refman/8.0/en/innodb-parameters.html#sysvar_innodb_flush_method)
