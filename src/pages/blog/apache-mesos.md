---
templateKey: "blog-post"
title: "Apache Mesos 소개"
description: "Mesos의 개요, 구조, 활용사례, 설치를 과정 소개."
author: "미물"
authorURL: "https://mimul.com"
date: "2013-10-25T20:45:44.000Z"
lastModificationTime: "2013-10-25T20:45:44.000Z"
image: "/img/apache-mesos.png"
commentId: "apache-mesos-2013-10-25"
tags:
  - Mesos
  - Apache
---

Twitter의 Rob Benson이 "앞으로 트위터의 인프라는 Mesos로 간다."고 해 개인적으로 관심을 좀 가지고 있다가 AirBnB의 오픈 소스 스케쥴링 시스템인 Chronos가 Mesos기반에서 돌아가는 것을 보고 급 관심에서 오는 궁금함을 못참고 조사를 해 봤습니다.

#### 개요

먼저 어원을 알아보면, UC 버클리 RAD Lab의 [Nexus: A Common Substrate for Cluster Computing](http://www.eecs.berkeley.edu/Pubs/TechRpts/2009/EECS-2009-158.pdf) 논문에서 출발해서 AMP Lab의 [Mesos: A Platform for Fine-Grained Resource Sharing in the Data Center](https://amplab.cs.berkeley.edu/wp-content/uploads/2011/06/Mesos-A-Platform-for-Fine-Grained-Resource-Sharing-in-the-Data-Center.pdf)라는 논문에 이르러 Mesos라는 용어가 탄생하게 되었다. 참고로 두 논문의 이름은 다르지만 저자 들은 한명 외에는 모두 같은 것으로 보아 랩의 이름이 과거에는 RAD Lab이었다가 현재는 AMP Lab으로 바뀐거 같다.

데이터 센터 내의 자원을 공유/격리를 관리하는 기술로 개발된 Mesos는 응용 프로그램과 풀링된 서버 간의 추출 레이어로 작동되며, 분산 환경에서 작업 실행을 최적화 할 수 있으며, 1만대 노드에도 대응이 가능하고, ZooKeeper를 이용한 내결함성, 멀티 자원 스케줄링, Web 기반 관리 UI, Java 및 Python, C++ 용 API의 제공과 같은 특징을 가지고 있다. 이것을 이용하여 Hadoop, MPI, Hypertable, Spark 같은 응용 프로그램을 동적 클러스터 환경에서 리소스 공유와 분리를 통해 자원 최적화가 가능하게 된다.
즉, Mesos는 클러스터에서 사용 가능한 계산 자원을 추적하고 사용자의 요구에 따라 그것을 할당하는 일을 한다고 말할 수 있다.

좀 이해를 쉽게 도울 수 있는, 기존의 자원 할당 매커니즘과 Mesos의 매커니즘을 잘 보여주는 그림이 있다.

![Mesos Dynamic Resource Allocation](/img/mesos-dynamic.png)

Mesos의 매커니즘은 클러스터링 환경에서 동적으로 자원을 할당하고 격리해 주는 매커니즘을 가지고 있어 장점으로 활용되고 있다. 이는 응용 프로그램에 맞는 최적의 자원을 할당(공유된 기존 자원을 적절하게 할당)해서 돌아가기 때문에 응용 프로그램 간의 자원 간섭을 Mesos가 막아줘(격리) 독립적으로 응용프로램이 해당 자원을 잘 활용해서 실행을 완료하게 끔 해준다.

#### 아키텍처

**1. 기본 구조**

![Mesos Architecture](/img/mesos-architecture3.jpg)

Mesos는 각 클러스터 의 노드에서 실행되는 Slave 데몬과 이 Slave 데몬을 관리하는 Master 데몬, 그리고 Slave에서 Task로 실행되는 Mesos 애플리케이션(Frameworks라고도 함)들로 구성된다.

Master 데몬은 애플리케이션 간의 디테일한 리소스(CPU , 메모리 등)의 공유를 가능하게 한다. 각각의 자원 요청은 다음과 같은 목록으로 구성된다. <slave ID, resource1: amount1, resource2, amount2, …>. Master는 주어진 정책에 따라 각 프레임워크에 대해 얼마나 많은 자원을 할당할지 여부를 결정한다. 여기에서 "정책"은 Fair Sharing, Strict Sharing 등이 제공된다. 다양한 정책 세트에 지원하기 위해 Master 데몬은 플러그인 메커니즘과 같은 새로운 할당 모듈을 쉽게 추가할 수 있는 모듈형 아키텍처를 채용하고 있다.

Mesos에서 실행되는 프레임워크는 다음 두가지 콤포넌트로 구성되어 있다. 하나는 Scheduler인데, Master에 필요한 리소스 요청을 등록한다. 다른 하나는 Executor로, Slave노드상에서 런칭해 프레임워크의 Task들을 수행한다.(좀 더 자세한 Scheduler/Executor의 내용은 [App/Framework 개발 가이드](https://mesos.apache.org/documentation/latest/app-framework-development-guide/)를 참조하라.) Master가 각 프레임워크에 대해 얼마나 많은 자원을 할당 할지를 결정할 때, 각 프레임워크의 Scheduler는 제안된 리소스안에 어느 것을 사용할지를 결정한다. 프레임워크는 제공된 자원을 수령한 경우 프레임워크는 Mesos에 대해 어떤 작업을 수행할 것인지의 실행 정보를 전달한다. Mesos는 프레임워크에서 받은 실행 정보를 바탕으로 Slave 노드에서 Task들을 구동시킨다.

**2. 자원 할당 예**

![Mesos Resource Allocation](/img/mesos-architecture-example.jpg)

위 그림은 Mesos의 자원 할당과 관련된 흐름을 나타내고 있다.
Slave1은 자신이 4CPU와 4GB의 메모리를 사용할 수 있는지 Master에게 알린다. Master는 할당 정책을 실행하고 Framework1 대해 모든 사용 가능한 자원을 할당하기로 결정한다.
Master는 Slave1이 4CPU와 4GB의 메모리를 사용할 수 있는지 Framework1에 통지한다.
Framework1의 Scheduler는 Master에게 Slave에서 실행하려는 두 개의 Task 정보 알린다. 첫번째 Task에는 2CPU & 1GB 메모리를, 두번째 Task에는 1CPU & 2GB 메모리를 필요로 하는 정보를 통보한다.
마지막으로, Master는 Slave1에 Task를 보내고, Framework의 Executor에 적절한 자원을 할당하고, 두 개의 작업을 차례 차례로 런칭한다.(그림의 점선 라인으로 묘사되어 있다) 그 상태에서 나머지 1CPU & 1GB 메모리가 할당되지 않았기 때문에 자원 할당 모듈은 Framework2에 할당 된다.
자원 배분 프로세스는 작업이 실행 완료되고 자원이 해제되면 다시 배분 작업을 수행한다.

Mesos가 제공하는 thin 인터페이스는 각 Framework가 개별적으로 확장될 수 있게 되어 있다. 하지만, 여기에 하나의 의문점이 남는다. "각 Framework에는 제약이 존재하지만, Mesos는 개별 Framework의 제약 조건을 몰라도 이러한 Framework의 제약성을 어떻게 만족시킬 수 있을까?" 예를 들어, Framework가 요구하는 데이터가 어디에 저장되어 있는지 Mesos는 모르는데, 어떻게 Framework는 데이터 지역성(locality)을 달성할 수 있을까? 이러한 의문에 대해서 Mesos는 Framework쪽에서 리소스 요청을 거부할 수 있도록 하는것으로 대응하고 있다. Framework는 Mesos에서 배분 받은 자원을 자신의 제약 조건을 충족하지 못하는 경우 거부한다. 특별히, 지연 스케줄링라는 심플한 정책을 가지고 있다. 이것은 Framework측이 입력 데이터가 저장되는 노드를 획득할까지의 제한된 시간동안 대기를 허용하는 것을 통해, 이를 이용하여 Framework측의 데이터 지역성(locality)을 극복할 수 있다.

#### 활용 사례

Mesos의 사용자에는 Twitter, Facebook, AirBnb, Conviva, UC Berkeley, UC San Francisco 등이 있는데, 가장 활발하게 사용하고 있는 Twitter에서는 일찍부터 Mesos을 도입해 운영 환경에서 사용하고 있다고 한다.

그리고 AirBnb에서는 Chronos라는 잡스케쥴 관리 시스템에서 잡 자원 할당에 이 Mesos를 사용하고 있다.

#### 설치 방법

**1. 설치 매뉴얼**

아래는 CentOS 6.4에서 설치한 순서를 나타낸다.

```bash
$ sudo yum install autoconf make gcc gcc-c++ patch
  python-devel git libtool java-1.7.0-openjdk-devel zlib-devel libcurl-devel
  openssl-devel libsasl2-dev tar ntp cyrus-sasl-devel
$ wget http://apache.tt.co.kr/maven/maven-3/3.0.5/binaries/
apache-maven-3.0.5-bin.tar.gz
$ tar xvfz apache-maven-3.0.5-bin.tar.gz

$ wget http://download.savannah.gnu.org/releases/libunwind/libunwind-1.1.tar.gz
$ tar xvfz libunwind-1.1.tar.gz
$ cd libunwind-1.1
$ ./configure
$ make
$ sudo make install

$ wget http://apache.tt.co.kr/zookeeper/zookeeper-3.4.5/zookeeper-3.4.5.tar.gz
$ tar xvfz zookeeper-3.4.5.tar.gz
$ cd zookeeper-3.4.5
$ cp zoo_sample.cfg zoo.cfg
$ vi zoo.cfg
$ dataDir 수정해줌.
$ bin/zkServer.sh start

$ vi ~/.bash_profile
M2_HOME=/home/vagrant/server/apache-maven-3.0.5;export M2_HOME
PATH 추가

JAVA_HOME=/usr/lib/jvm/java-1.7.0-openjdk-1.7.0.45.x86_64;export JAVA_HOME
PATH 추가
source ~/.bash_profile

git clone https://github.com/apache/mesos.git
cd mesos

./bootstrap
./configure --prefix=/home/vagrant/server/mesos --with-webui
 --with-included-zookeeper --disable-perftools
make
sudo make install

./mesos-master  --zk=zk://localhost:2181/mesos &
./mesos-slave --master=zk://localhost:2181/mesos &
```

**2. 대시보드 화면**

Mesos 관련 대시보드 화면은 아래와 같다. 이 화면을 통해 자원의 이용환경을 볼 수 있다.

![Mesos Dashboard](/img/mesos_dashboard.png)

#### 참조 사이트 및 논문

- [Nexus: A Common Substrate for Cluster Computing](http://www.eecs.berkeley.edu/Pubs/TechRpts/2009/EECS-2009-158.pdf)
- [Mesos: A Platform for Fine-Grained Resource Sharing in the Data Center](https://amplab.cs.berkeley.edu/wp-content/uploads/2011/06/Mesos-A-Platform-for-Fine-Grained-Resource-Sharing-in-the-Data-Center.pdf)
- [Mesos Architecture](https://mesos.apache.org/documentation/latest/architecture/)
