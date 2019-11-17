---
templateKey: "blog-post"
title: "디스크 IO 성능 - I/O 스케줄러"
description: "I/O Scheduler의 종류와 설정 방법, 설정별로 MySQL 서버 BMT, 튜닝 포인트 등을 설명함."
author: "미물"
authorURL: "https://mimul.com"
date: "2010-04-08T23:53:22.000Z"
lastModificationTime: "2010-04-08T23:53:22.000Z"
image: "/img/blog/io_scheduler.jpg"
commentId: "io-scheduler-2010-04-08"
tags:
  - I/O Scheduler
  - MySQL
  - Linux
---

I/O 스케줄러는 디스크 I/O 를 효율화하기 위한 기능이다. Kernel 2.6.10에서 deadline, noop, cfq, anticipatory 네종류가 있으며, 디폴트는 cfq.
OS 내에 있는 I/O scheduler 디자인을 결정하는 핵심 요소가 throughput vs. latency(response time)이다.
그리고 우리가 운영하는 서비스에서 특히 File I/O가 맞은 아키텍처에서는 튜닝 포인트 중에 하나라는 것도 알아두어야 한다.

#### I/O Elevator

I/O Scheduler는 Request Queue를 적절히 조작하여 seek time을 최소화하면서 global throughput을 최대화하는 것인데, 여기엔 merging과 sorting의 두개의 기본 동작이 쓰인다.
즉 request가 들어왔을 때 큐에 이미 그 request가 있거나 이웃한 block에 대한 request가 있을때 두개의 request를 합치는 것이다. 또한 디스크의 seek를 줄이기 위해서 새로 들어온 request를 FIFO 방식으로 뒤에 붙이는것이 아니라 이미 기다리고 있는 request들 사이에 block번호에 따라 sorting된 상태가 되게끔 삽입해 넣는 것이다.
이렇게 함으로써 디스크의 seek를 최소화하고 disk의 arm은 디스크를 왕복 횡단하면서 서비스를 할수 있게 된다. 그렇다고 해서, "굶고 있는(starving)" I/O request가 많아도 안된다. 적당히 공정성(fairness)을 유지해서, latency도 줄여주어야 한다. 이러한 모습은 마치 Elevator와 비슷하기 때문에 I/O Scheduler는 Elevator라고도 불린다.

![I/O Elevator](/img/blog/elevator.png)

블록 I/O Request 일단 Elevator에 넣어져, 예약된 후 Dispatch된다. Dispatch되는 Request는 RequestQueue에 넣어져 장치 드라이버가 I/O를 수행해 간다.

#### I/O Elevator 종류는?

**1. noop 스케줄러**

- No Operation. 아무것도 하지 않는 스케줄러.
- 주로 지능형 RAID 컨트롤러있거나, SSD사용하거나, 반도체 디스크 등 성능 좋은 디스크를 사용할 경우 선택되어지는 스케줄러로 커널은 아무것도 하지 않는 것이 부하를 줄일 수 있다는 생각이 기저에 있다.

![noop](/img/blog/noop.png)

**2. anticipatory(as) 스케줄러**

- 발생되는 I/O 요청에서 향후 발생되는 I/O 요청의 위치를 예측하고 위치 떨어진 I/O 요청 처리를 중지하고 위치 가까운 I/O 요청을 처리하는 방식이다.
- 지연 시간을 줄이고 처리량을 향상하는 것.
- 전통적인 하드 디스크와 비슷한 구조이다.
- 입출력을 기다려 모아서 처리하는 성질이 있어 지연 시간은 나쁘게 될 가능성도 있다.

**3. deadline 스케줄러**

- I/O 대기 시간의 한계점(deadline)을 마련하고, 그것이 가까워 온 것부터 먼저 처리한다.
- 처리량보다 지연에 최적화된 스케줄링을 한다.
- 읽기 및 쓰기를 모두 균형있게 처리한다.
- 몇몇 프로세스가 많은 수의 I/O를 발생시키는 환경에 적합하다.
- 데이터 베이스의 파일 시스템에 많이 사용된다.

![deadline](/img/blog/deadline.png)

**4. cfq(Completely Fair Queuing) 스케줄러**

- 프로세스마다 I/O 대기열을 가지고 최대한 균등하게 예약을 한다.
- 많은 프로세스들이 세세한 I/O를 많이 발생시킬 때 사용하면 좋다.
- Fedora Core 커널 패키지의 기본이다.

![cfq](/img/blog/cfq.png)

#### 설정 방법

**1. grub.conf 수정**
```bash
> vi /boot/grub/grub.conf
title Red Hat Enterprise Linux Server (2.6.18-8.el5)
root (hd0, 0)
kernel / vmlinuz-2.6.18-8.el5 ro root = /dev/vg0/lv0 elevator = deadline
initrd / initrd-2.6.18-8.el5.img
```

**2. scheduler 지정**
```bash
> echo 'deadline'> /sys/block/<device>/queue/scheduler
```

참고로 RHEL 5.3 on Xen에서 grub.conf에서 I/O 스케줄러에 무엇을 지정해도 noop가 되어 버린다. 그래서 설정할 경우 2번 방식으로 처리해야 한다.

#### MySQL Benchmark Write 테스트 결과

**1. 테스트 서버 환경**

- H/W 정보
CPU : Intel Xeon Quad-Core X3440(2.53GHz)
Memory : DDR3 PC3-10600 (1,333MHz) 2GB x 2
OS : Centos 5.7 x86_64
DISK : SATA2 500GB (7200.ES) - PC급

- I/O Scheduler
cfq와 deadline을 번갈하 셋팅하고 리붓해서 테스트 진행.

- /etc/security/limits.conf
```bash
mysql soft nproc  8192
mysql hard nproc  16384
mysql soft nofile 8192
mysql hard nofile 65536
```

- /etc/sysctl.conf
```bash
net.ipv4.tcp_fin_timeout = 5
net.ipv4.tcp_keepalive_time = 10
net.ipv4.tcp_tw_recycle = 1
net.ipv4.tcp_tw_reuse = 1
```

- my.cnf 설정(나머전 디폴트)
```bash
innodb_buffer_pool_size = 2G
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
max_connections=500
open-files-limit = 65535
```

- Memory Allocator
```bash
export LD_PRELOAD="/usr/local/lib/libtcmalloc.so"
```

- 테스트 테이블 레코드 사이즈 : 1024 bytes (insert 한 레코드 기준)

**2. BMT 결과**

현재 설치한 서버의 디폴트 I/O Scheduler는 cfq와 DB 서버에서 많이 설정해 사용하고 있는 deadline을 비교하여 Insert를 BMT한 결과 deadline 조금 앞선 결과를 보여주었다.

기존 서버가 죽어서 BMT 이미지를 찾고 있습니다. 조금만 기다려 주세요.

근데 위 BMT는 스토리지가 어떻게 구성되었는지 등의 환경에 따라 성능치가 다르게 나올 수 있다는 점은 알아두었으면 한다.

#### 요약

환경에 따라 차이가 있을 수 있으니, 무엇이 최고라고 말하기 어렵다. 4가지 설정에 대해서 테스트해 보고 최적의 스케줄러를 설정하는 것이 가장 바람직하다.

간략한 팁이라면,

- 디스크 I/O 성능이 좋다면(SSD 등-SSD 의 경우 디스크 헤드의 탐색이 없기 때문에) noop를 권장한다.
- DB서버에는 주로 deadline과 noop를 사용하는 사례가 많다고 하니 참고만 하시라.
- RAID로 구성된 DBMS 서버의 스케줄러는 cfq 보다 deadline을 권장한다.
- KVM은 deadline 스케줄러가 권장되고 있다.

#### 참조 사이트

- [Linux IO Schedulers](https://www.thomas-krenn.com/de/wiki/Linux_I/O_Scheduler)
