---
templateKey: "blog-post"
title: "Apache event_mpm과 Nginx 성능 비교"
description: "All I Need To Know To Be A Better Programmer I Learned In Kindergarten이라는 오래된 글이지만, 훌륭한 프로그래머가 되는 것은 먼 곳에, 어려운 곳에 있지만은 않다는 느낌을 받아 실천해 보기로 하면서 정리함."
author: "미물"
authorURL: "https://mimul.com"
date: "2013-02-27T22:00:19.000Z"
lastModificationTime: "2013-02-27T22:00:19.000Z"
image: "/img/blog/apache-vs-nginx.png"
commentId: "apache_event_mpm_vs_nginx_performance-2013-02-27"
tags:
  - Apache
  - Nginx
---

Aapache 2.4 정식 버전의 event_mpm이 어떤 성능을 발휘하며 성능을 최대치로 올리기 위한 튜닝 정보 및 Nginx와 설정 및 성능 비교를 통해 본 Apache의 현재에 대해서 살펴보고자 한다. 과거 Apache와 Nginx의 성능 비교 자료들을 보면 대부분 Nginx의 성능이 월등하게 나온다는 것을 안다. 하지만, 여기서는 두가지 비교를 통해 최적의 사용 포인트를 개인적으로 짚어보는 의도가 강하다.

혹시 많이 사용해 보신분들이 이 글을 보시게되면 좋은 조언 부탁드립니다. 혹시 잘못 표기된 정보가 있으면 댓글로 첨언 부탁드립니다.

#### 성능 테스트를 위한 설정 정보들

Event방식의 NonBlocking이 좋은 건 Apache prefork 모듈처럼 하나의 프로세스에서 하나의 클라이언트를 처리하는 방식보다 적은 쓰레드로, 메모리 자원도 적게 사용해 클라이언트의 요청을 처리할 수 있게 해준다.
그만큼 웹 서버에서 DB단과의 클라이언트 요청 처리 lifecycle(데이터 읽고 가공해서 클라이언트로 전달하는 과정)에서의 I/O문제로 블럭킹 시간을 줄일 수 있어서 쓰레드가 많이 필요하지 않게 되는 구조이다. 물론 다중 쓰레드기반에서 전체 쓰레드에 영향을 주지 않고 개별 쓰레드단에서 리스크를 만들게 하는 리스크 해지 기능도 된다.
그리고 Apache event_mpm, Nginx의 설정방법에 대한 정보는 다양한 스트레스 테스트를 통해서 정리해 둘 필요가 있다. 참고로 여기 있는 설정들은 보편적인 부분이어서 각 사이트에 맞는 커스터마이징은 필수라는 것을 잊지 말아주었으면 합니다.

**1. Apache**

Apache는 2.4.4, apr-1.4.6, apr-util-1.5.2, 컴파일은 atomic API: --enable-nonportable-atomics=yes 추가해 줌.

```
EnableMMAP off
EnableSendfile on
Timeout 10
KeepAlive Off
MaxKeepAliveRequests 100
KeepAliveTimeout 2
UseCanonicalName Off
ServerTokens Prod
ServerSignature Off<IfModule mpm_event_module>
    ServerLimit            32
    MaxRequestWorkers      8192
    ThreadLimit            256
    StartServers           2048
    MinSpareThreads        2048
    MaxSpareThreads        2048
    ThreadsPerChild        256
    MaxConnectionsPerChild 0</IfModule>
```

**2. Nginx**

Nginx는 싱글 쓰레드방식으로 Master/Worker 구조로 되어 있다. Master는 Workder의 모니터, 시그널 핸들링, Worker에 노티 등을 해서 종료, 재설정(Reconfig), 업데이트(Master Upgrade) 등을 진행하고 Worker는 클라이언트의 요청을 처리하고, Master로부터 커맨드를 처리한다.
설정 정보는 아래와 같다.
```
worker_processes  2;
worker_rlimit_nofile 20000;

error_log /logs/nginx/error.log;
pid /etc/nginx/nginx.pid;

events {
    worker_connections  8192;
    multi_accept on;
    accept_mutex_delay  100ms;
    use epoll;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile on;
    tcp_nopush on;

    keepalive_timeout  5;
    keepalive_requests 100000;
    reset_timedout_connection on;
    client_body_timeout 15;
    client_header_timeout 15;
    send_timeout 2;

    tcp_nodelay on;
    server_tokens off;
    server_name_in_redirect off;

    gzip  on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript
     application/x-javascript application/xml;
    gzip_disable "MSIE [1-6]\.";
    server {
        listen       80;
        server_name  localhost;
        location / {
            root   /www;
            index  index.html index.htm;
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
```

#### 성능 테스트 결과

**1. 테스트 정보**

| Label        | Specification                       |
| ------------ | ----------------------------------- |
| CPU          | Intel Xeon Quad-Core X3440(2.53GHz) |
| OS           | Centos 5.7 x86_64                   |
| RAM          | DDR3 PC3-10600 (1,333MHz) 2GB x 2   |

테스트 도구는 ab로 진행했으며 테스트 페이지 사이즈는 50K. 테스트 스크립트는 아래에 기술해 둔다.

```
./abtest.sh http://192.168.2.28:8080/index.html 500 10000 500
```

abtest.sh의 테스트 스크립트는 아래와 같다.

```bash
#!/bin/sh

if [ $# -lt 4 ]; then
  echo "abtest.sh <url><start><max><inc>"
  echo ""
  exit 1
fi

url=$1
start=$2
max=$3
inc=$4

num=$start

while true
do
  /home/k2/server/httpd-2.4.4/bin/ab -n 100000 -c $num $url 2>/dev/null > $$

  tps=`cat $$ | grep Requests\ per\ second: | awk '{print $4;exit;}'`
  echo "$num $tps"
  num=`expr $num + $inc`
  if [ $num -gt $max ];then
    exit;
  fi
  sleep 10
done
```

**2. 테스트 결과**

위의 설정 정보는 성능 테스트를 여러 번 한 가운데 최적의 성능을 보여주는 것을 기술한 것이다. 그 기준은 동시 가입자가 늘어도 지속적인 성능을 유지하는 것을 목표로 삼았다. 위 최적의 설정 정보로 각 성능을 테스트한 결과는 아래 차트이다.

![test result](/img/blog/apache_nginx.png)

요약해 보자면 동일 기준으로 정적인 페이지 테스트에서 아직은 Nginx의 성능이 많이 앞선다. 나름 Apache의 성능 저하 원인으로는 아마도 strace를 살펴본 결과 futex에서의 waiting이 자주 발생하는 것으로 보아서 아직 성숙단계가 아닌 것처럼 보인다. 그래서 Nginx만큼 성능이 못나온 것으로 보인다.

```
> strace -fFp 8433
[pid  8625] futex(0x1831d5c, FUTEX_WAIT_PRIVATE, 1756, NULL
[pid  8624] futex(0x1831d5c, FUTEX_WAIT_PRIVATE, 1756, NULL
[pid  8623] futex(0x1831d5c, FUTEX_WAIT_PRIVATE, 1756, NULL
[pid  8622] futex(0x1831d5c, FUTEX_WAIT_PRIVATE, 1756, NULL
```

하지만, 용도에 맞추다보니 굳이 Apache를 사용하기를 고집한다면 prefork나 worker보다는 event 방식도 사용해 볼 가치가 있다. ^^

#### 튜닝 포인트들

**1. 커널 튜닝**

```
*. /etc/security/limits.conf
* soft nproc 999999
* hard nproc 999999
* soft nofile 999999
* hard nofile 999999

*. /etc/sysctl.conf
fs.file-max = 999999
net.ipv4.tcp_fin_timeout = 5
net.ipv4.tcp_keepalive_time = 10
net.ipv4.tcp_tw_recycle = 1
# increase system IP port limits to allow for more connections
net.ipv4.ip_local_port_range = 1024 65535

# increase TCP buffer sizes
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_mem = 786432 1048576 26777216

# number of packets to keep in backlog before the kernel starts dropping them
net.ipv4.tcp_max_syn_backlog = 3240000

# increase socket listen backlog
net.core.somaxconn = 3240000
net.ipv4.tcp_max_tw_buckets = 360000
net.core.netdev_max_backlog = 2500
vm.min_free_kbytes = 65536
vm.swappiness = 0
net.core.somaxconn = 65535
```

**2. Apache 에서 StartServers (Min|Max) SpareServers, MaxClients 같게.**

트래픽이 많은 곳에서 참고할만한 것 같다. 아래는 Apache의 운영시의 라이프사이클을 설정 정보와 함께 이해하기 쉽도록 매핑해 봤다.

![apache fork](/img/blog/apache_fork.png)

StartServers, (Min| Max) SpareServers, MaxClients가 같은 값의 경우 프로세스 수가 고정되므로, MinSpareServers을 위해서만 필요 이상으로 fork할 것도 없고, MaxSpareServers에 의해 남은 프로세스를 KILL 할 필요도 없다. 특히 EC2(Xen)와 같은 클라우드에서 서버를 운영한다면 fork비용이 바싸서 성능 저하요인을 줄일 수 있을거 같다.
그리고 CPU는 사용하지 않지만, IDLE 프로세스가 많아지면 메모리가 증가할 것이라고 생각할 수 있지만, CoW(Copy On Write)가 있기 때문에 메모리가 많이 소요되는 건 아니다.

**1) Copy On Write 개념**

Linux는 fork로 자식 프로세스를 생성한 경우, 부모의 가상 메모리 공간의 내용을 자식에 복사해야 한다. 그러나 제대로 한다고 전체 공간을 복사하는 것은 fork의 비용이 높아지고, 자식이 부모와 같은 프로세스로 실행이 계속되면 내용이 중복된 페이지가 많아져 효율이 좋지 않아진다. 그래서 Linux의 가상 메모리는 메모리 공간 전체를 복사하는 것이 아니라, 처음에는 부모와 자식으로 메모리 공간을 공유하고 있고 쓰기가 일어나는 시점에 쓰기가 일어난 페이지만 새로운 페이지에 복사해서 개별적으로 가져가는 구조로 이 문제를 해결한다. 이것이 Copy-On-Write(CoW)라는 전략이다.

**2) 메모리 공유 확인**

```
> cat /proc/16015/smaps | head
00400000-004b2000 r-xp 00000000 08:02 65434  /bin/bash
Size:               712 kB
Rss:                372 kB
Shared_Clean:       372 kB
Shared_Dirty:         0 kB
Private_Clean:        0 kB
Private_Dirty:        0 kB
Swap:                 0 kB
Pss:                186 kB
006b2000-006bc000 rw-p 000b2000 08:02 65434   /bin/bash
```

**3) CoW 공유하는 공간 Shared_Dirty**

공유되지 않은 개인 데이터는 Private_Dirty

**3. 그 외 설정**

- Apache의 경우 MaxClients = ServerLimit(프로세스 수) × ThreadsPerChild. 위 설정의 경우 : 8192 = 32 × 256.
- Nginx 같은 경우 위의 설정 정보를 참고 한다. 간단히 원리를 말하자면 worker_processes는 2 × number of cpus, worker_connections은 가능한 부하테스트 해서 임계치 지정, worker_rlimit_nofile 파일핸들 제약없도록 넉넉히, multi_accept on, accept_mutex_delay 100ms, keepalive_timeout 조정으로 대부분 정리된다.

추가적으로 더 옵션들을 가지고 서비스 특성에 맞체 조정이 필요하지만 여기서는 생략함.
