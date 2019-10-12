---
templateKey: "blog-post"
title: "멀티 쓰레드 환경에서 메모리 할당자"
description: "메모리 할당자에 대한 설명과 종류, 활용 사례 등 기술함."
author: "미물"
authorURL: "https://mimul.com"
date: "2011-04-01T02:22:47.000Z"
lastModificationTime: "2011-04-01T02:22:47.000Z"
image: "/img/blog/malloc.jpg"
commentId: "malloc-in-multi-thread-2011-04-01"
tags:
  - Malloc
  - Linux
---
응용 프로그램에서 메모리 사용은 필수 불가결한 거죠. 그런데도 메모리에 대한 사용상 효율, 성능을 잘 고려하지 않고 그냥 있는 malloc을 사용하고 말죠. 그런데 트래픽이 많은 서비스가 요즘 많아지다보니 메모리 사용에도 신경을 써야하는 경우가 많습니다. 그래서 메모리 할당에 관해 정보를 정리하고 공유합니다.

메모리를 할당받기 위해 사용하는 malloc()함수는 일반적으로 glibc에 포함된 메모리 할당자에서 구현이 되어 있습니다. 그리고 메모리 할당자는 ptmalloc입니다. 메모리 할당자의 역할은 brk/sbrk/mmap등을 사용해서 시스템으로부터 큰 메모리 영역을 할당 받아서, 이것을 적절하게 분할하여 어플리케이션이 요청하는 메모리 할당을 처리하게 됩니다.

하지만, 빈번하게 메모리를 할당/해제하고 수십 개의 쓰레드가 동작하는 프로그램에서는 어쩔 수 없이 메모리 단편화(Memory Fragmentation)가 발생하여 메모리 사용량이 늘어나게 되죠.
그래서 규모가 큰 어플리케이션들은 glibc의 기본 메모리 할당자인 ptmalloc이 메모리 단편화 문제가 심하고, multi thread, multi processor에 대한 고려가 적어서 performance bottleneck이 존재하여 다른 메모리 할당자를 사용하는 경우가 있습니다.

#### 1. 데이터 섹션(메모리 사용 구조)

- 전역 메모리(Global Memory) : 지역 함수(Local Function), 전역 변수(Global Variable), 정적 변수(Static Variable)
- 스택 메모리(Stack Memory) : 지역변수와 매개 변수가 저장된 곳. 컴파일 타임에 크기 결정. 메모리 생명 주기를 알기 때문에 단편화가 안일어남.
- 힙 메모리(Heap Memory) : 동적 메모리 할당을 위한 곳. 프로그래머가 할당 및 해제해야 함. 런타임에 크기 결정. 메모리 생명 주기를 모르기 때문에 단편화가 일어남.

컴파일러 및 링커가 메모리 할당 기능을 수행할 때에는 메모리 단편화가 일어나지 않습니다. 왜냐하면 컴파일러가 데이터의 수명을 알고 있기 때문입니다.
메모리 할당자는 기본적으로 오버헤드, 내부 단편화, 외부 단편화 등 3가지 측면에서 메모리를 낭비합니다.

#### 2. 메모리 낭비 종류

- 오버헤드 : 메모리 할당자는 할당 상태를 설명해 주는 일부 데이터를 저장해야 하는데. 즉, 모든 자유 블록의 위치, 크기, 소유정보, 그리고 내부 상태와 관련된 정보를 저장해야 합니다. 일반적으로 메모리 할당자가 이러한 오버헤드(부가) 정보를 저장하기에 가장 좋은 장소는, 할당자가 자체 관리하는 메모리.
- 내부 단편화 : 모든 메모리 할당 작업은 프로세서 아키텍처에 따라 4, 8, 16으로 나뉠 수 있는 주소에서 시작되어야 함. 이렇게 미리 정의된 크기로만 클라이언트에게 블록을 할당하는 데는 또 다른 이유가 있을 수 있다. 만약 클라이언트가 41바이트 블록을 요청하면 42, 48 또는 그 이상의 바이트를 얻게 된다. 클라이언트가 요청한 크기를 반올림한 결과 남게 되는 여분의 공간. 이것이 내부 단편화.
- 외부 단편화 : 애플리케이션이 연속해서 세 블록을 할당한 후, 가운데를 제거하면 외부 단편화가 발생.

#### 3. Memory Allocator 종류

- tcMalloc : google에서 만듬. 작은 사이즈의 allocation에 최적화 된 것.
- jemalloc : linux,macosx에 최적화.firefox에서 쓰임.
- nedMalloc : 오픈소스. 간단함. 다른 것들보다 다 빠르다고 주장함. Windows에 최적화.dlmalloc에서 근감을 둠.

싱글 스레드 환경에서는 ptmalloc과 위의 메모리 관리자와의 성능과 효율이 크게 다르지 않을 수 있고 멀티 쓰레드 환경에서 위의 메모리 할당자를 사용하므로써 많은 성능 향상을 보았다고 함.

#### 4. tcMalloc 소개

- 작동 방식(성능 향상 방식)
  * 중앙 메모리 관리자와 쓰레드별 메모리 관리자를 구분하고 작은 크기(32K 이하)의 메모리 할당/해제 요청은 쓰레드별 메모리 관리자가 처리하고, 부족할 경우 중앙 메모리 관리자에서 얻어오는 방식으로 처리함.
  * 큰 메모리(32K 이상)는 전역 관리자에서 페이지 크기(4K) 단위로 클래스를 나누어 mmap()을 이용하여 할당하는 함.
- 지원 환경
  * Linux (32 and 64 bit), Windows (32 bit only), Solaris
  * NUMA-aware TCMalloc
- 사용 사례
  * Webkit, mySQL, HyperTable, memcache

#### 5. jemalloc 소개

- 작동 방식(성능 향상 방식)
  * 쓰레드별 메모리 관리자 Arena와 작은 단위의 잦은 메모리 할당의 경우, arena를 참조 하지 않고, 바로 malloc을 할 수 있도록, 각 스레드에게 thread cache라는 영역을 가지고 있어 성능 향상을 줌.
- 지원 환경
  * Linux, Windows, MacOSX
- 사용 사례
  * FireFox, Facebook

#### 6. nedMalloc 소개

- 작동 방식(성능 향상 방식)
  * dlmalloc에서 출발했고, 오픈 소스며 내용은 간단하지만 성능도 좋다는 평으로 알려짐.
- 지원 환경
  * Windows(32) 최적화됨, MacOSX, Linux
- 사용 사례
  * 소소한 개인 사용자 위주. 윈도우 개발자들이 많이 채택함. 일부 Javascript 엔진에 사용

#### 7. SLAB Allocator
- 슬랩은 내부 단편화 문제를 해결할 뿐만이 아니라 커널 내에서 흔히 일어나는 dynamic memory 할당의 overhead를 줄이기 위하여 캐싱하는 역할을 하여 성능 개선에도 큰 도움을 주고 있음.
- 캐시는 관리가 필요한 오브젝트 종류별로(예를 들면task_struct, file, buffer_head, inode 등) 작성되고 그 오브젝트의 슬랩을 관리하고 슬랩은 하나 이상의 연속된 물리 페이지로 구성되어 있으며, 일반적으로 하나의 페이지로 구성된다. 캐시는 이러한 슬랩들의 복수개로 구성됨.
- 자주 사용되는 오브젝트들을 미리 할당하여 놓고 사용자 요구가 있을 때 마다 바로 반환하는 것이다. 이것은 물리 메모리를 확보하기 위하여 검색 및 회수, 반환과 같은 긴 여행을 떠날 필요가 없으므로 시스템의 성능을 향상시킨다. 또한 다 사용된 오브젝트들을 반납받아 커널의 메모리 할당자에게 반환하지 않고 보관했다가 재사용하기 때문에 시스템의 성능을 향상시킬 수 있게 됨.

#### 8. 응용 예(MySQL-tcMalloc)

- MySQL 성능 향상 위한 tcMalloc 적용 예

```bash
// 64bit 머신일 경우에만 필요함. libunwind
$ wget http://download.savannah.gnu.org/releases/libunwind/libunwind-0.99-alpha.tar.gz
$ tar zxvf libunwind-0.99-alpha.tar.gz
$ cd libunwind-0.99-alpha/
CFLAGS=-fPIC ./configure
make CFLAGS=-fPIC
make CFLAGS=-fPIC install

$ wget http://google-perftools.googlecode.com/files/google-perftools-1.7.tar.gz
$ tar zxvf google-perftools-1.7.tar.gz
$ cd google-perftools-1.7/
$ ./configure
$ make && make install

$ vi /etc/ld.so.conf
/usr/local/lib 라인 추가
/sbin/ldconfig

$vi /usr/local/mysql/bin/mysqld_safe
export LD_PRELOAD=/usr/local/lib/libtcmalloc.so
```

운영 환경이라면 LD_PRELOAD 방식으로 하지 말고 -ltcmalloc 방식으로 사용하는걸 권장합니다.

#### 참고 사이트

- [TCMalloc : Thread-Caching Malloc](http://goog-perftools.sourceforge.net/doc/tcmalloc.html)
- [jemalloc](http://jemalloc.net/)
- [nedmalloc](https://www.nedprod.com/programs/portable/nedmalloc/)
