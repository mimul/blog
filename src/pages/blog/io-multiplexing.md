---
templateKey: "blog-post"
title: "I/O Multiplexing(select, poll, epoll, kqueue)"
description: "I/O Multiplexing 대두된 배경, select, poll, epoll, kqueue의 설명."
author: "미물"
authorURL: "https://mimul.com"
date: "2011-06-05T23:17:14.000Z"
lastModificationTime: "2011-06-05T23:17:14.000Z"
image: "/img/topics/devops.png"
commentId: "io-multiplexing-2012-04-02"
tags:
  - Multiplexing
  - Linux
---

네트워크 프로그래밍을 하거나 DB나 NoSQL, 심지어는 프로그래밍 언어까지 화자되는 용어들일겁니다. 가뜩이나 오픈 소스가 출현함으로 인해 기저에 지탱했던 아키텍처를 대신해 주어 이해없이 사용만으로 어플을 짜는 경우가 많았죠?
그래서 이들의 원리를 알고 사용하시면 더 좋은 퍼포먼스를 낼 수 있지 않을까해서 적어봅니다.

#### I/O Multiplexing 대두

네트워크 프로그램을 아무 생각없이 노가다로 구현하다보면, I/O 블럭킹이 발생해서 여러개의 다른 클라이언트에게 접속허용할 수 없거나 성능 저하를 겪는 경우가 발생하게 됩니다.
이를 해결하기 위한 방법들로는 아래와 같습니다.

- Fork: 프로세스를 새로 만드는 방법으로 클라이언트 요청이 있을때마다 프로세스를 복사하여 여러 사용자에게 서비스를 제공.
- Threads: 프로세스 방법이 아닌 쓰레스를 생성해서 여러 사용자들에게 서비스를 제공.
- I/O Multiplexing: 여러 소켓에 대해 I/O를 병행적으로 하는 기법. 다수의 프로세스 혹은 스레드를 만들지 않고도 여러 파일을 처리할 수 있기 때문에 less memory, less context switching이 가능해 성능 개선됨.
- 비동기 I/O: I/O가 비동기적으로 처리되는 기법. 시그널이 병행되어 존재함.
- Event Driven I/O: I/O multiplexing을 추상화함. libev, pyev, libevent 라이브러리가 있음.

이중에서 I/O Multiplexing 구현하기 위한 시스템 호출로 select, poll, epoll, kqueue등이 구현되어 있다.
I/O Multiplexing 기능은 프로그램에서 여러 파일 디스크립터를 모니터링해서 어떤 종류의 I/O 이벤트가 일어났는지 검사하고 각각의 파일 디스크립터가 Ready 상태가 되었는지 인지하는게 주요 목적이다.

아래는 select, poll, epoll, kqueue에 대해서 기술한다.

#### select

특징으로는

- 등록된 file descriptor를 하나하나 체크를 해야하고 커널과 유저 공간 사이에 여러번의 데이터 복사가 있음.
- 관리 file descriptor 수에 제한이 있음.
- 사용 쉽고 지원 OS가 많아 이식성 좋음.

file descriptor를 하나 하나에 체크하기 때문에 O(n)의 계산량이 필요합니다. 따라서 관리하는 file descriptor의 수가 증가하면 성능이 떨어진다. 또한 관리 수가 한정되어 있기 때문에 그 수를 초과하면 사용할 수 없다.

#### poll

poll은 거의 select와 동일하지만 다음과 같은 차이가 있다.

- 관리 file descriptor 무제한.
- 좀더 low level의 처리로 system call의 호출이 select보다 적음. 이식성 나쁨.
- 접속수가 늘어나면 오히려 fd당 체크 마스크의 크기가 select는 3bit인데 비해, poll은 64bit정도이므로 양이 많아지면 성능이 select보다 떨어짐.

#### epoll

linux커널 2.6.x이상 버전에만 지원되고 특징은 다음과 같다.

- 관리 fd의 수는 무제한.
- select, poll과 달리, fd의 상태가 kernel 에서 관리됨.
- 일일이 fd 세트를 kernel 에 보낼 필요가 없음.
- kernel이 fd를 관리하고 있기 때문에 커널과 유저스페이스 간의 통신 오버헤드가 대폭 줄어듬.

#### kqueue

BSD 계열의 epoll

#### libevent

파일 디스크립터에서 이벤트가 발생 했을 때 지정된 콜백 함수를 실행시켜주는 라이브러리이며, 시스템마다 서로 다른 I/O Multiplexing Method를 추상화시켜 준다.

poll, kqueue, event ports, select, poll, epoll을 지원하고 멀티쓰레드 환경에서도 사용이 가능하고 파일 디스크립터별로 타임아웃 기능이 있어 기존 Event-driven 방식으로 개발을 하면 적은 CPU/MEM 사용량으로 대량의 커넥션을 처리할 수 있지만, 실행 중에 코드의 일부분에서 블럭이 되면 서비스 전체가 멈춰버릴 위험성이 있다.

그래서 prefork된 다수의 쓰레드에서 각각 libevent를 사용해서 커넥션을 처리하도록 만들면 최악의 경우라도 해당 쓰레드에서 서비스하는 커넥션들만 문제가 생기도록 국한시킬 수 있고, 또한 멀티코어를 최대한 활용할 수 있도록 만들 수 있다.

프로그래밍을 하면 할 수록 베이스 지식의 중요성을 느끼게 된다. 이 베이스 지식이 없다면 그저 남이 해 놓은 오픈소스를 사용할 줄만 알지 거기서 벗어나지 못하게 된다는 것이다.
그만큼 오픈 소스의 단점인 필요 이상의 오버헤드(기능)를 감수해야 하고, 보이지 않은 심각한 버그에 대한 두려움도 같이 앉고 가야하는 점도 잊을 수가 없다.

#### 참조 사이트

- [poll vs select vs event-based](https://daniel.haxx.se/docs/poll-vs-select.html)
