---
templateKey: "blog-post"
title: "스타트업 개발자가 리눅스 서버에 들어가면 언제나 하는 작업들"
description: "스타트업 개발자가 리눅스 서버에 들어가면 언제나 하는 작업들에 대해서 명령어 사용법, 문제를 짚을 수 있는 지표들을 정리함."
author: "미물"
authorURL: "https://mimul.com"
date: "2019-09-26T22:17:18.000Z"
lastModificationTime: "2019-09-26T22:17:18.000Z"
image: "/img/blog/LinuxPerformanceObservabilityTool.png"
commentId: "linux-server-operations-2019-09-26"
tags:
  - Linux
  - Monitoring
---

인프라 엔지니어는 아니지만, 서비스를 운영하면 당연 서버 운영도 해야 하기에 매일 서버에 들어가서 모니터링을 하게 되는데, 이것을 좀 정리를 하면 추후 더 보완 및 개선할 수 있는 여지가 있을 것 같아 정리해봅니다. 성능 관점에서 접근하려면 Netflix 기술 블로그 글 [Linux Performance Analysis in 60,000 Milliseconds](https://medium.com/netflix-techblog/linux-performance-analysis-in-60-000-milliseconds-accc10403c55)를 참고하는 것도 좋을거 같습니다. 그리고 잘못된 부분이나 보완할 부분, 더 나은 방법 등 여러 의견을 댓글로 남겨주시면 검토 후 반영하겠습니다.

#### 0. README 파일 읽기

서버에 들어가게 되면 아직 습관화되지 않는 것들도 있고, 잊어버릴 수도 있어서 의식하는 차원에서 README파일을 작성해 놓고 가끔식 보면서 서버 모니터링을 하고 있습니다.

**1) 서버에 부하가 걸리는 명령이면 ionice 커맨드를 앞에 붙인다.**

```bash
# ionice -c 2 -n 7 nice -n 19
# -c 2: 디스크 I/O의 실행 우선 순위 조정
# -n 7: 명령의 우선 순위를 낮추는
# -n 19: 프로세스 실행 우선 순위를 가장 낮게
```

**2) less, more 활용하도록 노력한다.**

vi 대신 내용 보기는 less나 more, cat을 잘 활용하자.

| 명령    | 설명                                                                                          |
| ------ | -------------------------------------------------------------------------------------------- |
| less   | 파일의 내용을 표시하며 스크롤 있고, vi와 달리 전체 파일을 로드하지 않기 때문에 시작이 빠고 q를 누르면 종료.          |
| more   | 파일의 내용을 표시하며 스크롤 있고, 첫 행까지 표시하고 종료. less와 달리 q 버튼으로 종료해도 출력이 터미널에 남아 있음 |

**3) 작업 결과 등의 일시적인 파일 저장은 /tmp와 /var/tmp에 저장해 일부로 지우는 명령 안날려도 됨**

- /tmp를 (tmpfs에 마운트 된 경우) 다시 시작하면 파일이 사라짐.
- /var/tmp는 다시 시작해도 파일은 사라지지 않고 /tmp보다 오랜 기간 유지됨.
- /tmp(10일), /var/tmp(30일) 둘다 정기적으로 지워짐.(# more /usr/lib/tmpfiles.d/tmp.conf 확인 가능)

**4) 데몬 구동/중지는 systemd로**

LimitFSIZE, LimitNOFILE, LimitNPROC, Restart 옵션을 주어 데몬의 지속적인 서비스를 가능하게 해준다.

**5) 커맨드에 패스워드를 입력하지 않기**

보안 차원에서 이 습관은 중요하다.

다음부터는 실행하는 커맨드와 설명, 주목할 값들을 기술합니다. 참고로 보안을 이유로 개발서버에서 진행을 했고 OS는 CentOS7을 사용합니다.

#### 1. root 계정의 로그인 실패 정보 확인

아래는 계정별 로그인 실패 건수를 확인하고 로그인 실패가 1000단위가 넘어갈 경우 주기적으로 ssh 포트 변경, root 계정의 패스워드를 변경해 준다.

```bash
$ perl -ne 'print "$1\n" if(/Failed password for (\w.+) from/)' /var/log/secure | sort | uniq -c | sort -rn |head -10
248 root
 43 invalid user 123456
 25 invalid user admin
  6 invalid user test
  3 invalid user user
  2 invalid user 123
  1 invalid user oracle
  1 invalid user com
  1 invalid user ubuntu
  1 invalid user password
```

아래는 IP별로 로그인 실패 시도 건수이고 건수가 IP는 블럭킹해준다.

```
$ perl -ne 'print "$1\n" if(/Failed password\D+((\d+\.){3}\d+)/)' /var/log/secure | sort | uniq -c | sort -rn |head -10
98 197.248.10.108
34 115.238.236.74
21 51.38.57.78
14 195.154.112.70
3 92.222.216.71
2 203.115.15.210
1 5.39.79.48
1 203.110.179.26
1 195.154.113.173
1 94.191.108.176
```

#### 2. 서버 가동 시간 확인 (uptime)

```bash
# uptime
 10:56:58 up 708 days, 1 min,  1 user,  load average: 0.00, 0.02, 0.05
```
load averages에 이어 1분, 5분, 15분 단위로 숫자가 표시된다. CPU 사용 지연, I/O 대기 등 처리 지연 정보를 담고 있다. 이것으로도 서버의 부하정도를 짐작할 수 있다. 1분 평균 숫자가 15분 평균보다 크게되면 부하가 진행되고 있다고 예측할 수 있다.

#### 3. 시스템 오류 메세지 확인

- dmesg를 통해 segfault, oom-killer os레벨의 오류 메세지 확인.
```bash
# dmesg | tail
```
- messages에서 커널과 OS의 표준 프로세스의 로그를 봄.
```bash
# cat /var/log/messages | egrep -i "emerg|alert|crit|error|warn|fail"
```
- secure 로그를 통해 ssh 연결 실패 정보를 보고 횟수가 많은지 파악해서 패스워드 변경 주기를 앞당기는 근거로 활용함.
```bash
# cat /var/log/secure |tail
```

#### 4. 메모리 확인(free)

CentOs7에서 메모리 용량을 확인하는 free 명령으로 얻을 수 있는 버퍼 및 캐시 영역에는 스왑 영역도 포함되어 있으며, 단순히 메모리 사용 용량 = 메모리 전체 - free - buff/cache 식으로 계산하면 메모리 사용 용량을 과소 평가하게 된다. 최신의 linux 커널은 이러한 부분을 고려하여 메모리 정보를 표시하고 있다.

```bash
# free
              total        used        free      shared  buff/cache   available
Mem:        7747768     4060148      219100      402732     3468520     2964992
Swap:       2097148      347400     1749748

# cat /proc/meminfo |grep 'MemTotal\|MemFree\|Buffers\|Cached'
MemTotal:        7747768 kB
MemFree:          217628 kB
Buffers:          434212 kB
Cached:          2604220 kB
SwapCached:        42892 kB
```

메모리 정보 확인 스크립트.

```bash
# cat memory-usage-free.sh
#!/bin/bash
export LANG=C, LC_ALL=C

free | awk '
    BEGIN{
        total=0; used=0; available=0; rate=0;
    }

    /^Mem:/{
        total = $2;
        available = $7;
    }

    END {
        used = total - available;
        rate= 100 * used / total;
        printf("total(KB)\tused(KB)\tavailable(KB)\tused-rate(%)\n");
        printf("%d \t %d \t %d \t %.1f\n", total, used, available, rate);
    }';

# ./memory-usage-free.sh
total(KB)	used(KB)	available(KB)	used-rate(%)
7747768 	4783068 	2964700 	    61.7
```

#### 5. 파일 시스템 확인(df)

```bash
# df -Th
Filesystem                Type      Size  Used Avail Use% Mounted on
/dev/xvda3                ext4       17G  8.2G  7.6G  52% /
devtmpfs                  devtmpfs  3.9G     0  3.9G   0% /dev
tmpfs                     tmpfs     3.7G     0  3.7G   0% /dev/shm
tmpfs                     tmpfs     3.7G  467M  3.3G  13% /run
tmpfs                     tmpfs     3.7G     0  3.7G   0% /sys/fs/cgroup
/dev/xvda1                ext4      969M  184M  719M  21% /boot
tmpfs                     tmpfs     757M     0  757M   0% /run/user/0
/dev/mapper/DataVG-Data00 ext3       79G   45G   31G  60% /app
tmpfs                     tmpfs     757M     0  757M   0% /run/user/500
tmpfs                     tmpfs     757M     0  757M   0% /run/user/302
```

디스크 사용량 순으로 확인하려면 아래와 같다.

```bash
# ionice -c 2 -n 7 nice -n 19 du -scm /* | sort -rn
54234 total
45280 /app
3047  /data
2339  /usr
1558  /logs
603 /var
584 /opt
475 /run
182 /boot
132 /home
38  /etc
...
```

scm 옵션은 하위 디렉토리 숨기기 + 전체 디스크 사용량 표시 + M 바이트 형식으로 표시이고 rn 옵션은 사용량이 많은 순서로 + 수치로 비교.

#### 6. 네트워크 상태 확인

**1) 네트워크 상태 확인**

netmon.sh 스크립트를 실행하여 TIME_WAIT가 많을 경우 커널 튜닝을 진행하고 CLOSE_WAIT 등이 있을 경우 비정상적인 상황을 모니터링 한다.

```bash
#!/bin/bash
COUNT=10
while :
do
        if [ $COUNT = 10 ]
        then
                printf "+--------+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+ \n"
                printf "|  TIME  |ESTAB|LISTN|T_WAT|CLOSD|S_SEN|S_REC|C_WAT|F_WT1|F_WT2|CLOSI|L_ACK| \n"
                printf "+--------+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+ \n"
                COUNT=0
        fi
        COUNT=`expr $COUNT + 1`
        TIME=`/bin/date +%H:%M:%S`
        printf "|%s" ${TIME}
        netstat -an | \
        awk 'BEGIN {
                CLOSED = 0;
                LISTEN = 0;
                SYN_SENT = 0;
                SYN_RECEIVED = 0;
                ESTABLISHED = 0;
                CLOSE_WAIT = 0;
                FIN_WAIT_1 = 0;
                FIN_WAIT_2 = 0;
                CLOSING = 0;
                LAST_ACK = 0;
                TIME_WAIT = 0;
                OTHER = 0;
                }
                $6 ~ /^CLOSED$/ { CLOSED++; }
                $6 ~ /^CLOSE_WAIT$/ { CLOSE_WAIT++; }
                $6 ~ /^CLOSING$/ { CLOSING++; }
                $6 ~ /^ESTABLISHED$/ { ESTABLISHED++; }
                $6 ~ /^FIN_WAIT1$/ { FIN_WAIT_1++; }
                $6 ~ /^FIN_WAIT2$/ { FIN_WAIT_2++; }
                $6 ~ /^LISTEN$/ { LISTEN++; }
                $6 ~ /^LAST_ACK$/ { LAST_ACK++; }
                $6 ~ /^SYN_SENT$/ { SYN_SENT++; }
                $6 ~ /^SYN_RECV$/ { SYN_RECEIVED++; }
                $6 ~ /^TIME_WAIT$/ { TIME_WAIT++; }

                END {
                        printf "| %4d| %4d| %4d| %4d| %4d| %4d| %4d| %4d| %4d| %4d| %4d|\n",ESTABLISHED,LISTEN,TIME_WAIT,CLOSED,SYN_SENT,SYN_RECEIVED,CLOSE_WAIT,FIN_WAIT_1,FIN_WAIT_2,CLOSING,LAST_ACK;
                }'
        sleep 2
done
```

실행을 하면 아래와 같은 결과물을 볼 수 있다.

```bash
$ netmon.sh
+--------+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
|  TIME  |ESTAB|LISTN|T_WAT|CLOSD|S_SEN|S_REC|C_WAT|F_WT1|F_WT2|CLOSI|L_ACK|
+--------+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
|18:28:27|  230|   24|   88|    0|    0|    0|    1|    0|    0|    0|    0|
|18:28:29|  230|   24|   88|    0|    0|    0|    1|    0|    0|    0|    0|
```

**2) 네트워크 포트별 커넥션 수 확인**

connections_port.sh를 실행하여 로컬 서버의 LISTEN 포트별로 커넥션수를 모니터링 할 수 있다.

```bash
#!/bin/bash

grep -v "rem_address" /proc/net/tcp  | awk 'function hextodec(str,ret,n,i,k,c){
    ret = 0
    n = length(str)
    for (i = 1; i <= n; i++) {
        c = tolower(substr(str, i, 1))
        k = index("123456789abcdef", c)
        ret = ret * 16 + k
    }
    return ret
} {x=hextodec(substr($2,index($2,":")-2,2)); for (i=5; i>0; i-=2) x = x"."hextodec(substr($2,i,2))}{print x":"hextodec(substr($2,index($2,":")+1,4))}' | sort | uniq -c | sort -rn
```

실행을 하면 아래와 같은 커넥션수가 많은 포트별로 결과물을 볼 수 있다. 커넥션수가 예상보다 많은 포트는 모니터링 대상이 된다.

```bash
$ ./connections_port.sh | head -10
     40 172.10.0.34:4455
     36 172.10.0.34:34001
      6 172.10.0.34:22001
      5 172.10.0.34:3401
      3 172.10.0.34:2112
      2 172.10.0.34:443
      2 172.10.0.34:3003
      1 172.10.0.34:9090
      1 172.10.0.34:58947
      1 172.10.0.34:58946
```

#### 7. 부하 상황 확인

**1) 실시간 OS 전체의 상황을 파악하는 데 가장 적합한 명령(top)**

```bash
# ionice -c 2 -n 7 nice -n 19 top -c
top - 16:23:33 up 708 days,  5:16,  1 user,  load average: 0.00, 0.01, 0.05
Tasks: 216 total,   1 running, 215 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.3 us,  0.2 sy,  0.0 ni, 99.6 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
KiB Mem :  7747768 total,  1486568 free,  3926668 used,  2334532 buff/cache
KiB Swap:  2097148 total,  1797684 free,   299464 used.  3085096 avail Mem

  PID USER   PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
21086 user1  20   0 4939348 1.052g  14316 S   0.7 14.2   2:06.99 /bin/java -Djava.util.logging.config.file=....
28596 user1  20   0  138788   4412   2928 S   0.7  0.1  46:37.03 /bin/httpd -f ...
63578 user1  20   0 4891980 1.090g  14840 S   0.7 14.7   8:26.39 /bin/java -server -XX:+UseG1GC -XX:G1RSetUpdatingPauseTimePercent=5 ...
28632 user1  20   0  138364   4256   2916 S   0.3  0.1  47:08.71 /app/apache/bin/httpd -f /app/apache/conf/httpd.conf -k start
30213 user1  20   0 4897136 862568  11164 S   0.3 11.1 137:15.45 /bin/java -server -XX:+UseG1GC -XX:G1RSetUpdatingPauseTimePercent=5 ...
```

"-c"를 쓰면 프로세스 목록 창에 표시되는 프로세스 이름이 인자의 정보도 포함됩니다. top 화면으로 이동한 다음 1를 입력하면 각 CPU 코어의 활용도를 개별적으로 볼 수 있다.

- us(user): OS의 유저에서 사용한 CPU 비율. 응용 프로그램(위의 경우 java, httpd 등)에서 처리 과정에 CPU를 사용하고 있다는 의미.
- sy(system): OS의 커널에서 사용한 CPU 비율. system이 높은 경우 OS의 자원(파일 디스크립터와 포트 등)을 가진 경우이다. 커널 파라미터 튜닝에 의해 부하를 낮출 수 있다. fork 횟수가 많은 등 부하가 높은 시스템 호출을 응용 프로그램이 했을 가능성이 있고 strace를 통해 더 자세하게 조사할 수 있다.
- wa(iowait) : 디스크 I/O에 사용된 CPU 비율. iowait가 높은 경우는 iostat 명령어를 통해 디스크 I/O 상황을 볼 수 있다.

| PR     | NI          | VIRT     | RES      | SHR       | S   | %CPU     | %MEM      | TIME+   |
| ------ | ----------- | -------- | -------- | --------- | --- | -------- | --------- | ------- |
| 우선 순위 | 상대 우선 순위  | 가상 메모리 | 실제 메모리 | 공유 메모리  | 상태 | CPU 사용률 | 메모리 사용률 | 실행 시간 |

S : Process Status. 다음 중 상태인지를 보여주고 있다.
- D : 인터럽트 불가
- R : 실행 중
- S : 잠
- T : 정지 중
- Z : 좀비 프로세스

**2) CPU 사용량, 읽기 및 쓰기 I/O량, 메모리 사용량(sar)**

```bash
# sar -u 3 10
Linux 3.10.0-327.4.5.el7.x86_64 (test01)   10/11/2019  _x86_64_  (4 CPU)

03:04:04 PM     CPU     %user     %nice   %system   %iowait    %steal     %idle
03:04:07 PM     all      0.25      0.00      0.25      0.00      0.00     99.49
03:04:10 PM     all      0.25      0.00      0.17      5.39      0.08     94.11
03:04:13 PM     all      0.17      0.00      0.17      0.00      0.00     99.66
03:04:16 PM     all      0.00      0.00      0.08      0.08      0.08     99.75
03:04:19 PM     all      0.25      0.00      0.34      0.08      0.00     99.33
03:04:22 PM     all      0.17      0.00      0.17      1.52      0.00     98.15
03:04:25 PM     all      0.08      0.00      0.08      0.00      0.08     99.75
03:04:28 PM     all      0.17      0.00      0.25      1.68      0.08     97.82
03:04:31 PM     all      0.08      0.00      0.08      0.00      0.00     99.83
03:04:34 PM     all      0.42      0.00      0.17      0.00      0.08     99.33
Average:        all      0.19      0.00      0.18      0.88      0.04     98.72
```

- %user는 사용자 영역에서의 CPU 사용률.
- %nice는 우선 순위 변경된 프로세스를 통해 사용자 영역에서 CPU가 사용된 활용도.
- %system은 커널 영역에서의 CPU 사용률.
- %iowiat가 표시되는 경우 CPU가 I/O 작업을 기다리고 있었음을 나타내는데, 시간의 비율로 보여준다.
- %idle은 디스크 I/O 대기에서 CPU가 기다리던 시간의 비율.

**3) CPU 사용률, 대기/차단된 프로세스 정보(vmstat)**

```bash
# vmstat 1 10
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 1  0      0 2669616 403776 24131636    0    0     0     3    0    0  0  0 100  0  0
 0  0      0 2669848 403776 24131636    0    0     0     0  370  411  0  0 100  0  0
 0  0      0 2669816 403776 24131640    0    0     0     0  164  249  0  0 100  0  0
 0  0      0 2669848 403776 24131640    0    0     0     4  437  469  0  0 100  0  0
 0  0      0 2669848 403776 24131644    0    0     0    16  717  746  0  0 100  0  0
 0  0      0 2669880 403776 24131644    0    0     0     0  400  388  0  0 100  0  0
 0  0      0 2669848 403776 24131648    0    0     0     0  154  233  0  0 100  0  0
 0  0      0 2669880 403776 24131648    0    0     0    96  191  274  0  0 100  0  0
 0  0      0 2669880 403776 24131648    0    0     0     0  205  288  0  0 100  0  0
```

- r: CPU에서 실행 및 순서를 기다리고있는 프로세스의 수. r값이 CPU 수보다 많으면 포화 상태.
- b: 차단된 프로세스 수.
- si, so: 스왑과 스왑. 제로가 아닌 값이 있으면 메모리 부족.
- us, sy, id, wa, st: CPU 시간의 분석에서 모든 CPU에 대한 평균 값. 각 사용자 시간, 시스템(커널) 시간, 유휴, 대기 시간, I/O 지연, steal된 시간.

**4) 프로세스당 상황(ps)**

- CPU 점유율 높은 순서로 내림차순으로 정렬시켜 보고 점유율 높은 프로세스를 확인할 수 있다.

```bash
# ps aux --sort=-%cpu
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
xxx        358  2.3 14.2 4944476 1101092 ?     Sl   10:32   2:25 /bin/java -Djava.util.logging.config.file=....
mongod   46779  0.6  0.8 1040956 65488 ?       Sl   Jun14 1033:47 /usr/bin/xxx --quiet -f /etc/mongod.conf run
xxx      63578  0.6 14.7 4888896 1143848 ?     Sl   Oct10   7:13 /bin/java -server -XX:+UseG1GC -XX:G1RSetUpdatingPauseTimePercent=5 ...
yyy       3835  0.2  6.8 5508620 532304 ?      Sl   Sep02 134:33 /bin/xxx --basedir=... --datadir=... --plugin-dir=...
xxx      30213  0.2 11.1 4897136 862456 ?      Sl   Sep02 136:39 /bin/java -server -XX:+UseG1GC -XX:G1RSetUpdatingPauseTimePercent=5 ...
```

- 프로세스의 친자관계를 볼 수 있다.(pstree도 가능)

```bash
# ps auxf

```

**5) 스토리지 측의 성능 정보(iostat)**

```bash
# iostat -dx 5
Linux 3.10.23-327.4.5.el7.x86_64 (test01)   10/11/2019  _x86_64_  (4 CPU)

Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
xvda              0.00     0.95    0.01    1.14     0.09     9.13    16.04     0.01    4.93   15.92    4.86   1.98   0.23
xvdb              0.00    10.88    0.01    2.89     0.27    62.86    43.55     0.03   11.47   39.67   11.37   0.51   0.15
dm-0              0.00     0.00    0.01   13.59     0.27    62.86     9.28     0.07    5.03   39.62    5.00   0.11   0.15

Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
xvda              0.00     3.40    0.00    2.20     0.00    22.40    20.36     0.00    0.45    0.00    0.45   0.45   0.10
xvdb              0.00     5.20    0.00    2.80     0.00    46.40    33.14     0.00    0.71    0.00    0.71   0.29   0.08
dm-0              0.00     0.00    0.00    7.60     0.00    46.40    12.21     0.01    0.92    0.00    0.92   0.11   0.08
```

첫번째의 출력값은 디스크 장치가 활성화되고 나서 현재까지의 누적 값이며, 현재의 상황을 아는 경우는 두번째 이후의 출력에서 보여준다. 보통 IOPS[r/s(초당 읽기 섹터 수), w/s(초당 쓰기 섹터 수)]와 %util을 주의깊게 본다.

#### 8. 주기적으로 하는 것

- SSH 포트 변경
- 계정 패스워드 변경
- bash_history 점검 : curl, mysql 등의 커맨드 실행할때 계정 정보를 넣어서 실행하는 것을 감시한다. 아이디와 패스워드가 bash_history에 남아 있어 보안 문제가 대두된다. history에서 제거하려면
  * ```bash # history | less ``` 명령어를 통해 행버호를 안다음
  * ```bash # history -d 108 ``` 명령어를 통해 삭제한다.
- 근원적으로 패스워드를 안남게 하려면 아래와 같이 몇가지 경우에 대해 처리 방법을 기술한다.
  * curl의 경우는
  ```bash
  # read -sp "Please input your password: " __pass; echo
  # curl -u "user:${__pass}" http://fittobe.com
  ```
  * 통해 패스워드 이력을 남기지 않는다. mysql의 경우는 -p 이후에 패스워드를 입력하지 않고 엔트 다음에 패스워드를 입력하면 된다.
