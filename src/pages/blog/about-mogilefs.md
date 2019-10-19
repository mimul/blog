---
templateKey: "blog-post"
title: "MogileFS(Distributed File System) 개요와 설치 과정에서 본 이해"
description: "MogileFS Overview, 아키텍처, 설치를 해봄으로써 전체 시스템의 구조를 이해할 수 있음."
author: "미물"
authorURL: "https://mimul.com"
date: "2009-12-03T14:00:00.000Z"
lastModificationTime: "2009-12-03T14:00:00.000Z"
image: "/img/blog/distributed.jpg"
commentId: "about-mogilefs-2009-12-03"
tags:
  - MogileFS
  - Distributed File System
---

MogileFS는 Hadoop DFS(큰 사이즈에 적합)와 달리, 소규모 용량에 적합하게 설계 되어 있습니다. 그래서 멀티미디어(이미지 혹은 소규모 동영상 파일) 파일 서비스에 유용할 거 같아서 전체 구조와 프로세스, 설치하면서 아키텍처의 이해도를 높이는데 목표를 두고 포스팅을 하겠습니다.

### MogileFS Overview

**1) 개요**

- Application Level
  * 특별한 커널 모듈은 필요하지 않음

- No SPOF(single point of failure)
  * 세 개의 컴포넌트들(Storage Nodes, Trackers, Tracker's DB(s))은 복수 개의 머신에서 수행될 수 있으므로, SPOF는 없음.
  * Tracker는 Storage Node와 같은 머신에서 실행할 수 있어, 최소 2개의 머신이 권장함.

- Automatic File Replication
  * 파일들은 그들의 'class'에 따라 각기 다른 Storage Node에 자동적으로 replicate 됨. 또한, 자동으로 복제될 때 마다 카운트를 하고 최소 카운트를 만족하는 충분한 용량을 가진 스토리지 노드로 복제됨.
  * 예를 들어 포토 호스팅 서비스라면, 원본 JPEG는 최소 리플리카를 3으로, 썸네일 및 크기가 조절된 버전들은 1 또는 2로 설정할 수 있음.
  * 이러한 방식으로, RAID를 사용하지 않고 불필요한 데이터를 복수 개 저장하지 않고 비용을 절감할 수 있음.

- Better than RAID
  * non-SAN RAID 설정에서는 디스크는 중복되지만 호스트는 중복되지 않는다. 따라서 전체 머신이 고장나면 파일들은 접근할 수 없게 됨.
  * MogileFS는 서로 다른 호스트상의 장치들간의 파일들도 replicate하기 때문에 파일들은 항상 접근 가능하다.

- Flat Namespace
  * 파일들은 flat하고 전역적인 네임스페이스 안의 이름을 가진 키로서 식별됨.
  * 네임스페이스는 얼마든지 많이 만들 수 있기 때문에, 잠재적으로 키들이 충돌하는 여러 개의 애플리케이션들이 하나의 MogileFS 설치상에서 실행될 수 있음.

- Shared-Nothing
  * MogileFS는 공유된 디스크들로 비싼 SAN에 의존하지 않는다. 모든 머신들은 자신의 로컬 디스크를 가진다.

- No RAID required
   . MogileFS Storage Node들의 로컬 디스크들은 RAID로 구성하든, 하지 않는 상관없다. 그러나, MogileFS가 지원하지 않는 어떤 안정성을 위해 RAID 구성하지 않아도 된다. 구성하지 않으면 보다 싸다.

- Local filesystem agnostic
  * MogileFS Storage Node상의 로컬 디스크들은 다양한 형태의 파일시스템(ext3, XFS, etc...)들을 선택이 가능함.
  * MogileFS는 자신의 내부 디렉토리 해싱을 하므로 "디렉토리당 최대 파일", 혹은 "디렉토리당 최대 디렉토리" 등의 파일시스템 제한과 무관함.

**2) 지원하지 않는 것들**

- POSIX Compliant
  * MogileFS를 대상으로 보통의 유닉스 애플리케이션이나 DB를 실행할 수 없다. 이것은 한 번 쓰는 파일을 아카이빙하고 계속해서 읽기만 하는 것을 의미한다.(파일의 수정은 새로운 버전의 파일로 덮어쓰기 하는 것으로 가능하기는 하다.)
  * 파일들을 저장하고 회수하기 위해서는 애플리케이션들이 MogileFS 클라이언트 라이브러리를 사용해야 한다는 것을 의미이며, 보통 다음과 같은 과정을 밟는다:
  1) Tracker에게 넣고 싶은 것과 얻고 싶은 것에 대해 알려줌.
  2) 애플리케이션이 파일을 읽거나 쓸 수 있다고 Tracker가 알려주는 장소들 중 하나에 HTTP GET/PUT을 사용하여 파일을 읽거나 씀.
  * FUSE binding을 프로토타이핑해 두어 MogileFS를 애플리케이션 지원 없이 사용할 수도 있지만, 그런 제품이 준비된 것은 아니라고 함.

- Completely portable ... yet
  * 코드에 어느 정도 Linux-isms이 있는데, 특히 HTTP 전송 코드가 그렇다. 이것을 걷어내고 portable하게 만들 계획이라고 함.

**3) High-level overview of MogileFS**

- The involved parties are
  * Application : 파일을 저장하고 로드하려는 주체.
  * Tracker (the mogilefsd process) : 애플리케이션에서의 모든 클라이언트 커뮤니케이션(수행될 오퍼레이션을 요청하기)을 관리하는 이벤트 기반의 부모 프로세스/메시지 버스, mogilefsd 자식 프로세스와의 커뮤니케이션 핸들링과 그러한 요청들에 대한 "query workders"를 로드밸랜싱, HA를 위해서는 서로 다른 호스트에서 2개의, 로드밸런싱을 위해서는 그 이상의 tracker를 실행해야 함. mogilefsd 하의 자식 프로세스들은 다음 작업을 수행한다.
  1) Replication : 파일의 리플리케이션.
  2) Deletion : 네임스페이스에서의 삭제는 즉각적이며, 파일시스템에서의 삭제는 비동기적임.
  3) Query : 클라이언트의 요청에 응답.
  4) Reaper : 디스크 처리 실패 후 리플리케이션을 위해 파일 재 큐잉.
  5) Monitor : 호스트와 장치들의 안정성 및 상태 모니터링.
  * Database : MogileFS의 메타데이터(네임스페이스, 어떤 파일이 어디에 있는가 등)를 저장하는 DB, 이것은 HA 설정내에 들어있어야 하므로 SPOF가 없음.
  * Storage Nodes : 파일들이 저장되는 곳. DELETE, PUT 등이 수행되는 그저 HTTP 서버들. WebDAV 서버들도 좋지만, mogstored가 권장 됨. mogilefsd는 서로 다른 포트에 두 개의 서버를 사용하도록 설정될 수 있고 모든 DAV 오퍼레이션(및 sideband 모니터링)에 mogtored을 사용하고, GET 오퍼레이션에 빠르고 가벼운 HTTP 서버를 선택해서 사용할 수 있음. 보통은 마운트지점당 하나의 fat SATA 디스크를 가짐. 각 디스크는 /var/mogdata/devNN에 마운트 됨.

- High-level flow:
  * 애플리케이션이 파일 열기를 요청. Tracker로의 라이브러리를 통해, 이용 가능한 것 아무에게나 RPC를 통해 요청. create_open 요청.
  * Tracker는 요청이 갈 수 있는 곳에 대해 로드밸런싱 판단을 하고, 애플리케이션에 가능한 몇 개의 위치를 알려준다.
  * 애플리케이션은 그 중 하나의 위치에 쓰기를 실행한다. 도중에 쓰기에 실패하면 또 다른 곳에 쓰기를 재시도할 수 있다.
  * 애플리케이션(클라이언트)은 create_close API 안에, 어디에 쓰기를 수행했는지를 Tracker에게 알려준다.
  * Tracker는 그 이름을 도메인의 네임스페이스에 DB를 통해 링크한다.
  * Tracker는 그 파일이 속한 클래스의 리플리케이션 정책에 부합될 때까지 백그라운드로 리플리케이션을 시작한다.
  * 이후 애플리케이션이 그 도메인+키(키는 파일이름)에 대해 get_paths 요청을 발행하면, Tracker는 database/memcache/etc에 물어본 다음 해당 파일이 접근할 수 있는 모든 URL을 응답해 준다. 각 위치에서 I/O 활용도에 기반하여 비중이 정해진다.
  * 애플리케이션은 그 URL들을 순서대로 시도해 본다. Tracker는 지속적으로 모든 호스트와 장치들을 모니터링하기 때문에 죽은 대상을 반환하지 않고, 디폴트로 반환된 리스트 안의 첫번째 아이템이 존재하는지를 두 번 체크한다.

**4) 논리적 구조**
- domain
  * 파일의 최고 수준 분리. 파일 키는 도메인 안에서 유니크하다.
  * 도메인은 도메인 내의 파일들을 정의하는 클래스들의 집합으로 구성된다.
  * 예) fotobilder, livejournal

- class
  * 각각의 파일은 정확히 하나의 클래스에 속한다.
  * 클래스는 하나의 도메인의 일부이다.
  * 클래스는 파일 하나의 최소 리플리카 수를 지정한다.
  * 예) userpicture, userbackup, phonepost.
  * 클래스는 추가적인 replication 정책을 가질 수 있다.

- key
  * 파일을 식별하는 유니크한 문자열.
  * 키들은 도메인 내에서 유니크하다.
  * 예) userpicture:34:39, phonepost:93:3834, userbackup:15.
  * 가짜 구조도 사용할 수 있다.

- minimum replica count (mindevcount)
  * 클래스가 가지는 프로퍼티로서 어떤 클래스에 속하는 파일들이 서로 다른 장치들에 몇 번이나 복제되어야 하는지를 나타내는 수.

- file
  * 파일은 MogileFS에 업로드하는 bit 들의 컬렉션을 말하며, 파일들은 최소 복제 카운트(mindevcount)에 따라 복제된다. 각 파일들은 키을 가지며, 클래스의 한 부분이고 하나의 돔인에 위치한다.

- fid
  * 파일의 내부적인 수치적 표현. 모든 파일은 유니크한 fid를 가진다. 파일이 덮어쓰기 되면 새로운 fid를 받는다.

### MogileFS 설치

**1) MogileFS Architecture**

![MogileFS Architecture](/img/blog/mogilefs_architecture.png)

**2) 호스트**

```bash
192.168.1.1 mimul1 - Tracker Server
192.168.1.2 mimul2 - Storage Server
192.168.1.3 mimul3 - mysql
```

**3) 서버 정보**

- OS : Centos 5.7 x86_64
- Perl : v5.8.8

**4) 설치**

- ```yum -y install perl-libwww-perl```

- cpan 설치 - 지역 선택 이외엔 디폴트(Asia/Korea)
```bash
> cpan 엔터
>
```

- Perl 라이브러리 설치
```bash
cpan> install Net::Netmask
cpan> install Danga::Socket
cpan> install IO::AIO #Linux::AIO
cpan> install Perlbal
cpan> install MogileFS::Client
cpan> install DBI
cpan> install DBD::mysql
cpan> exit
```

- MogileFS 라이브러리 설치
```bash
> wget http://cpan.sarang.net/authors/id/D/DO/DORMANDO/MogileFS-Server-2.55.tar.gz
> tar xvfz MogileFS-Server-2.55.tar.gz
> cd MogileFS-Server-2.55
> perl Makefile.PL
> make
> make install
> wget http://cpan.sarang.net/authors/id/D/DO/DORMANDO/MogileFS-Utils-2.21.tar.gz
> tar xvfz MogileFS-Utils-2.21.tar.gz
> cd MogileFS-Utils-2.21
> perl Makefile.PL
> make
> make install
```

- mysql 계정 및 데이터 베이스 생성(mimul3) : 파일의 메타정보를 mysql에 저장 관리됨.
```sql
mysql> create database mogilefs;
mysql> grant all on mogilefs.* to 'mogile'@'%' identified by 'mogileadmin';
mysql> flush privileges;
```

- DB 스키마 설정(mysql)
```bash
> mogdbsetup --dbhost=192.168.1.3 --dbname=mogilefs --dbuser=mogile --dbpassword=mogileadmin
```

**5) Tracker/Storage 서버 설정**

- 두 서버에 /etc/security/limits.conf 수정
```bash
user soft nofile 65536
user hard nofile 65536
```

- Tracker Server(mimul1)
```bash
> groupadd mogile
> useradd -g mogile mogile
> mkdir -p /etc/mogilefs
> cd /etc/mogilefs
> wget http://code.sixapart.com/svn/mogilefs/tags/mogilefs-server-2.37/conf/mogilefsd.conf
> mkdir -p /var/mogdata
> cat mogilefsd.conf
daemonize = 1
# Database connection information
db_dsn = DBI:mysql:mogilefs:host=192.168.1.3
db_user = mogile
db_pass = mogileadmin
> sudo -u mogile mogilefsd -c /etc/mogilefs/mogilefsd.conf --daemon # Daemon 구동
```

- Storage Server(mimul2)
```bash
> groupadd mogile
> useradd -g mogile mogile
> chown -R mogile:mogile /var/mogdata
> mkdir -p /etc/mogilefs
> cd /etc/mogilefs
> wget http://code.sixapart.com/svn/mogilefs/tags/mogilefs-server-2.37/conf/mogstored.conf
> mkdir -p /var/mogdata
> cat mogstored.conf
maxconns = 10000
httplisten = 0.0.0.0:7500
mgmtlisten = 0.0.0.0:7501
docroot = /var/mogdata
> mkdir -p /var/mogdata/dev1
> mkdir -p /var/mogdata/dev2
> chown -R mogile:mogile /var/mogdata/*
> mogstored --daemon #Daemon 구동
```

**6) host, device, domain, class 등록**

- Tracker Server(mimul1)
```bash
> mogadm check
Checking trackers...
  127.0.0.1:7001 ... OK
Checking hosts...
No devices found on tracker(s).
> mogadm host add 192.168.1.2 --port=7500
> mogadm check
Checking trackers...
  127.0.0.1:7001 ... OK
Checking hosts...
  [ 1] 192.168.1.2 ... skipping; status = down
No devices found on tracker(s).
> mogadm device add 192.168.1.2 1
> mogadm device add 192.168.1.2 2
> mogadm host mark 192.168.1.2 alive
> mogadm check
Checking trackers...
  127.0.0.1:7001 ... OK
Checking hosts...
  [ 1] 192.168.1.2 ... OK
Checking devices...
host device size(G)  used(G)  free(G)  use%   ob state   I/O%
---- ------ ------- -------- -------- ------ ---------- -----
[1] dev1    26.109   4.571   21.538   17.51%  writeable   0.0
[1] dev2    26.109   4.571   21.538   17.51%  writeable   0.0
---- ------ ------- -------- -------- ------
            total:  52.219    9.143    43.076  17.51%
> mogadm host list
192.168.1.2 [1]: alive
  IP:       192.168.1.2:7500
> mogadm device list
192.168.1.2 [1]: alive
                  used(G) free(G) total(G)
dev1: alive      4.571   21.537  26.108
dev2: alive      4.571   21.537  26.108
> mogadm domain add mimul
> mogadm class add mimul normal --mindevcount=2
> mogadm domain list
 domain     class     mindevcount   replpolicy  
---------- --------- ------------- ------------
 mimul      normal      2          MultipleHosts()
```

**7) 파일 업로드 테스트**

- 커맨드 실행 결과
```bash
> mogtool --trackers=127.0.0.1:7001 --domain=mimul --class=normal inject --nobigfile /root/mogail_test.txt test1
Upload so far: 14 bytes [100.00% complete]
> mogtool --trackers=127.0.0.1:7001 --domain=mimul --class=normal extract test1 /root/mogail_return.txt
Fetching piece 1...
Trying http://192.168.1.2:7500/dev2/0/000/000/0000000008.fid...
Done.
```

- Perl 클라이언트 실행 결과
```perl
#!/usr/bin/perl
use strict;
use warnings;
use MogileFS::Client;
my $mogfs = MogileFS::Client->new(
    domain => 'mimul',
    hosts  => [ '192.168.1.1:7001' ],
);
die "Unable to initialize MogileFS object." unless $mogfs;
my $key = "hello";
my $class = "normal";
my $fh = $mogfs->new_file($key, $class) or die $mogfs->errstr;
my $file_contents = "Hello, MogileFS!!";
$fh->print($file_contents) or die $mogfs->errstr;
$fh->close or die $mogfs->errstr;
my $data = $mogfs->get_file_data($key);
die $mogfs->errstr unless $data;
print $$data . "\n";
```

**8) MogileFS 내부의 파일 노드 관리**

- MogileFS 내부적으로 관리되는 VFS에서 파일의 확장자는. fid입니다. 초기 설정시 만든 mindevcount = 2 normal class를 지정했기 때문에 dev1, dev2 두 개의 device에 복사. 복사되는 device는 사용 가능한 것 (status = alive) 중에서 무작위 선택됨.

- 물리 파일 정보
```bash
> ls /var/mogdata/**/**/**/**/*.fid
/var/mogdata/dev1/0/000/000/0000000008.fid  
/var/mogdata/dev2/0/000/000/0000000008.fid
```

- 메타 정보 : MogileFS에서 파일을 fid라는 id로 관리하고 file 테이블 파일의 key class를 저장하고 있으며, 또한 file_on 테이블 파일이 어떤 device에 복사되고 있는지를 관리하고 있다.
```sql
> mysql -u mogile -p mogileadmin
mysql> select * from file;
+-----+------+-------+--------+---------+----------+
| fid | dmid | dkey  | length | classid | devcount |
+-----+------+-------+--------+---------+----------+
|   8 |    1 | test1 |     14 |       1 |        2 |
+-----+------+-------+--------+---------+----------+
mysql> select * from file_on;
+-----+-------+
| fid | devid |
+-----+-------+
|   8 |     1 |
|   8 |     2 |
+-----+-------+
mysql> select * from device;
+-------+--------+--------+--------+----------+---------+------------+
| devid | hostid | status | weight | mb_total | mb_used | mb_asof    |
+-------+--------+--------+--------+----------+---------+------------+
|     1 |      1 | alive  |    100 |    26735 |    4682 | 1324887639 |
|     2 |      1 | alive  |    100 |    26735 |    4682 | 1324887639 |
+-------+--------+--------+--------+----------+---------+------------+
mysql> select * from host;
+------+------+--------+------------+--------+-----------+-------+-------+
|hostid|status|http_port|http_get_port|hostname|hostip   | altip |altmask|
+------+------+--------+------------+--------+-----------+-------+-------+
|    1 |alive |   7500 |       NULL |192.168.1.2|192.168.1.2|NULL|NULL   |
+------+------+--------+------------+-----------+-----------+----+-------+
1 row in set (0.00 sec)
```

- DB 정보의 device, host 정보를 가지고 파일의 URL을 조립 가능함
  * key에서 fid를 취득 (file 테이블) - / 0/000/000/0000000008.fid가 결정
  * fid에서 device id를 취득 (file_on 테이블) - /dev1, /dev2 결정
  * device id에서 host id를 취득(device 테이블)
  * host id에서 host 정보를 취득 (host 테이블) - http://192.168.1.2:7500을 결정
  * http://192.168.1.2:7500/dev1/0/000/000/0000000008.fid, http://192.168.1.2:7500/dev2/0/000/000/0000000008.fid URL로도 조회 가능.

### MogileFS users(레퍼런스 사이트)

- 주로 이미지, 음악, 비디오 ,사용자가 올린 파일들을 저장하는 저장소로 활용함. MogileFS는 주로 작은 파일 저장소로 각광받고 있음.
- 사용 사이트들 : last.fm, SixApart, TypePad, Vox, YellowBot, Wikispaces, Footnote, KWICK! Community, livejournal, hatena, SugarSync

### 참조 사이트

- [MogileFS](https://github.com/mogilefs/)
