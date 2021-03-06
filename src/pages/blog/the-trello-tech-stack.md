---
templateKey: "blog-post"
title: "Trello 아키텍처 소개"
description: "Trello 아키텍처 클라이언트 사이드, 서버 사이드의 전반적인 소개, 프로덕션 릴리즈 등 정리."
author: "미물"
authorURL: "https://mimul.com"
date: "2012-02-07T10:23:45.000Z"
lastModificationTime: "2012-02-07T10:23:45.000Z"
image: "/img/trello-logo-blue.png"
commentId: "trello-architecture-2012-02-07"
tags:
  - Trello
  - Architecture
---

이번에는 우리가 개발 프로세스상에서도 많이 사용하고 있는 Trello 서비스의 아키텍처에 대해 알아보고자 합니다. Javascript 기반으로 Front/Backend를 구성하는데 도움이 될만한 자료라고 생각됩니다.

#### CoffeeScript

Trello의 클라이언트와 서버 모두 순수 자바스크립트 프로젝트로 시작되었고, 2011년 5월까지는 적어도 그렇게 유지되었는데 그 이후부터 CoffeeScript를 얼마나 좋아하는지 보기 위해서 CoffeeScript로 이중으로 개발해 포팅하기 시작했다. 그 후 우리는 CoffeeScript를 사랑함을 확인했고 곧, 나머지 모두의 코드도 CoffeeScript로 전환을 완료했다.

CoffeeScript는 JavaScript를 읽을 수 있는 컴파일 언어이다. 우리가 시작했을 때도 걱정이 되었던 부분이지만, 소스를 직접 디버깅하는 것보다 컴파일된 코드를 디버깅하는 것이 더 복잡성이 추가된다는 것에 대해 걱정을 많이 했었다. 우리가 시도를 했을때, 비록 변환이 크롬에서 디버깅할때 약간의 정신적인 노력이 필요하지만, CoffeeScript를 사용하는 것이 소스를 타켓 코드로 매핑하는 일도 너무나 명료했고, 또 코드도 간결하게 되었고, 가독성이 좋다는 것은 분명해 우리가 사용하는데에 있어서 설득력을 충분히 가지고 있었다.

JavaScript는 정말 멋진 언어이다. 잘 작성된 CoffeeScript는 Javascript와 같은 내용을 나타내는데에도 더 짧고 유연했다. 그리고 실질적인 디버깅의 간접적인 문제는 발생하지 않았다.

#### The Client

Trello 서버는 HTML 클라이언트 측 코드를 거의 다루고 있지 않다. Trello 페이지는 2K 쉘에서 하나의 경량화되고 압축된 JavaScript 파일(3'd Party 라이브러리와 컴파일된 CoffeeScript와 Mustache 템플릿을 포함한)과 CSS 파일(인라인된 이미지를 포함, LESS 소스를 컴파일해 압축한)로 구성된 것을 클라이언트 측 앱에서 당겨오는 구조로 되어 있다. 클라이언트 측 프로그램은 250K 이하의 크기로 Amazon의 CloudFront CDN에 캐시되어 있기 때문에 모든 지역에서 지연없이 서비스할 수 있다. 적당히 높은 대역을 확보한 경우에는 응용 프로그램을 브라우저에 서비스하는데 0.5초 정도면 가능하며, 그 이후는 캐시에서 서비스가 된다.

병렬적으로 첫 번째 페이지의 콘텐츠는 AJAX로 데이터를 로드하여 시작되며, 동시에 서버와 WebSocket 연결을 설정한다.

**1. BACKBONE.JS**

데이터 요청 처리를 할 때 Backbone.js는 무지 바빠진다. Backbone.js는 서버에서 view와 함께 보내진 model을 렌더링하고 다음과 같은 쉬운 방법을 Backbone.js는 제공한다.

view에서 생성된 HTML에서 DOM 이벤트를 감시하여 해당 model에 대응되는 메서드와 연결해서, 서버와 다시 동기화되면 다시 관련 method에 대응해 준다.
변경을 위해 model을 감시하고, 변경 사항을 반영하기 위해 model의 HTML 블록을 다시 렌더링한다.
이제 이러한 접근법으로 우리는 꽤 표준화되고, 이해하기 쉬우며, 유지보수가 용이한 클라이언트를 얻었다. 그리고 우리는 업데이트나 클라이언트측 model 재사용하기 위하여 클라이언트측 model 캐시 구조를 만들었다.

**2. PUSHSTATE**

클라이언트 앱 전체를 브라우저 창에서 로드하는 형태의 구조를 가지고 있지만, 우리는 또한 페이지 전환으로 인한 시간 비용을 낭비하고 싶지 않다. 페이지 간의 이동에는 HTML5 pushState를 사용하고 있어, 이 방법은 주소창에 적절하고 일관성 있는 링크를 부여할 수 있고, 전환 시점에 데이터를 읽고 적절한 Backbone.js 컨트롤러에 전달한다.

**3. MUSTACHE**

Mustache는 로직이 적은 템플릿 언어로서, 모델을 HTML로 변환해 주기 위해서 사용하고 있다. Mustache의 ‘Less is more’ 접근 덕분에 우리의 코드는 엉망으로 만들거나 클라이언트 논리가 뒤죽박죽 섞이지 않게 하도록 템플릿 코드를 재사용 할 수 있다.

#### Pushing and Polling

실시간 업데이트 자체는 새롭지 않지만, 협업툴에서는 정보를 공유하는 서비스이므로 중요한 기능이 된다.

**1. SOCKET.IO AND WEBSOCKETS**

브라우저 지원(Chrome/Firefox/Safari)이 되면, WebSocket 연결을 사용하여 서버는 다른 사용자의 변경 내용을 대체로 1초 이내에 동일한 채널을 수신하는 브라우저에 푸시 할 수 있다. 우리는 Socket.io를 수정해서 사용하고 있으며, 또, 수천의 WebSockets 연결을 유지하고 그 환경에서도 CPU나 Meory를 적게 사용하도록 지원하는 서버 라이브러리를 사용하고 있다. 그래서 브라우저상의 화면에서 어떤 일이 일어났을 때, 서버 프로세스에 전달되고 1초 이내에 여러분의 브라우저에 다시 전달된다.

**2. AJAX POLLING**

매력적이진 않지만, 잘 작동이 되었다.

![Trello Architecture](/img/blog/trello_archi_1.png)

WebSocket을 지원하지 않는 브라우저(예를 들어 Internet Explorer 같은)라면 사용자가 활성화되면 몇 초마다 콘텐츠 갱신을 위해 AJAX 요청을 하고 사용자가 유휴 상태가 되면, 10 초마다 폴링을 하고 있다. 서버의 설정 덕분에 적은 오버헤드로 HTTPS 요청을 서비스 할 수 있었으며, TCP 연결을 오픈하고 있으므로 필요할 때 폴링하여 어느 정도의 사용자 경험을 보장할 수 있었다. 우리는 Socket.io의 다운로드용으로 Comet을 시도해봤지만, 앱에 리스크가 존재해서 이용하는 것을 포기했다.

Trello을 런칭 직후 TechCrunch의 기사로 급격한 트래픽 증가에 대응할 수 없었던 때도 있었지만, WebSocket의 polling 전환과 polling active와 idle의 간격 튜닝을 통해 무사히 넘어갔다.

#### The Server

**1. NODE.JS**

Trello의 서버는 Node.js로 구축되어 있다. Trello는 대량의 커넥션 오픈을 필요로 하고 있고 업데이트를 즉시 전파하는 것을 원했기에, event-driven, non-blocking 서버가 적합하다는 판단을 하고 Node.js를 시험했다. Node.js는 단일 페이지 앱의 프로토타입 만들기에도 적합하다는 것을 알 수 있었다. Trello의 서버 프로토타입 버전은 정말 하나의 Node.js 프로세스 메모리에 모델을 배열로 운영하는 Function 라이브러리들이고 클라이언트는 웹소켓 레퍼들을 이용해 functions들을 호출하는 구조이다. 이러한 구조는 트렐로의 기능들을 빨리 시작할 수 있게하고 설계 또한 올바르게 진행되고 있는지 확인하는데 빠른 방법이다. Trello의 개발 관리와 우리 Fog Creek의 내부 프로젝트들은 동일한 프로토타입 버전으로 가져갔다.

우리는 프로토타입을 완료했을 떼, Node에 대해 그 기능과 성능에 대해 흥분했고 또한 사용하기에 좋고 편안했다. 그래서 아래의 구조를 추가하고 본격 채용하기로 했다.

- DB, 스키마(node-mongodb-native와 Mongoose)
- 라우터나 쿠키 같은 웹 기본 기술(Express와 Connect)
- 리스타트시 다운타임 없는 형태의 여러 서버 프로세스(Cluster)
- pub/sub 내부 프로세스와 Redis 기반의 데이터 공유(node_redis)

Node는 위대하며 많은 활동적인 개발자 커뮤니티로 인해 새롭고 유용한 라이브러리들을 많이 많들어 내 시간이 갈수록 더 좋아지고 있다. 그리고 우리가 제어 가능하고, 코드를 - 잘 유지하기 위해서 비동기 라이브러리(CoffeeScript에 의해 증가된 코드 간결성)를 훌륭하게 사용하고 있다.

**2. HAPROXY**

Web 서버의 로드 밸런스에 HAProxy을 사용한다. 머신 간의 라운드 로빈에 의해서 TCP의 균형을 잡고, 그 이외는 모두 Node.js에 맡긴다. WebSocket을 지원하도록 연결을 오랫동안 오픈하고 AJAX 폴링을 위해 TCP 연결을 재사용 한다.

**3. REDIS**

서버 프로세스간에 공유되는 데이터는 디스크에 영구히 저장하는 것이 아닌 임시 데이터를 위해서 Redis를 사용한다. 세션 활동 수준이나 임시 OpenID 키 등은 Redis에 저장한다. 만약 그 데이터가 소실되어도 앱측에서는 영향이 없도록 되어 있다. allkeys-lru 를 활성화하고 실제 필요한 공간보다 5배 정도 넓은 공간을 확보해서 실행한다. 그래서 Redis는 최근 액세스되지 않은 데이터는 자동으로 삭제되고 필요할 때 다시 구축된다.

Redis 사용중에 가장 흥미로운 사용법은 model의 변경 내용을 브라우저에 보내기 위한 short-polling의 대체이다. 객체가 서버 측에서 변경되었을 때, JSON 메시지를 모든 적절한 WebSocket에 보내 클라이언트에 알린다. 그리고 동일한 메시지를 변경의 영향을 받는 model을 위해 고정 길이 리스트 내에 보관한다. 또한, 리스트에 지금까지 몇 개의 메시지가 쌓여 있는지도 기록한다. 그런후 클라이언트가 서버를 AJAX 폴링하여 마지막 폴링 이후 객체에 변경 사항이 있는지 확인하면 권한 체크를 통해 모든 서버의 응답을 처리 할 수 있다. Redis는 놀랄만큼 빠르기 때문에 싱글 CPU에 영향을 주지 않고 초당 수천건의 체크를 수행할 수 있다.

Redis는 pub/sub 기능도 있어 객체 변경 내용의 메시지를 모든 서버 프로세스에 보내는 역할을 담당하고 있다. 한번 Redis 서버를 사용하고 있다면, 모든 일에 그것을 사용하기 시작할 것이다.

**4. MONGODB**

MongoDB는 우리의 전통적인 RDB의 욕구를 충족시켜준다. Trello가 전광석화같이 빠른 서비스가 되는 것을 원하고 있다. 우리가 알고 있는 멋지고 가장 성능에 집착하고 있는 팀중에 하나가 바로 우리의 이웃 자매 회사인 StackExchange이다. StackExchange팀의 말을 들어보면 SQL 서버를 이용하고 있어도 성능을 내기 위해 대부분의 데이터는 비정규화된 형태로 보관하고 필요한 경우에만 정규화하고(RDB) 있는 것으로 나타났다.

MongoDB에서는 빠르게 DB에 쓰기 위해서 관계형 DB 기능(예를 들어, arbitrary join)을 포기하고 더 빨리 읽을 수 있는 비정규화를 잘 지원할 수 있게 되어 있다. 카드의 데이터를 데이터베이스 내에 싱글 다큐멘트 안에 저장할 수 있고, 다큐먼트의 서브 필드(그리고 인덱스)에 쿼리를 걸 수 있다. 서비스가 급성장하고 있기 때문에, 읽기/쓰기의 용량을 조정할 수 있는 데이터 베이스를 가지고 있다는 것은 좋은 일이다. 또한, MongoDB는 복제, 백업, 복원에도 편리하다.

문서 저장을 엄격한 구조로 가지 않는 것에 대한 또 다른 장점은 DB 스키마 마이그레이션의 번거로움 없이 동일한 DB에 다른 버전의 Trello 코드를 수행 할 수 있다는 것이다. DB 업데이트 시 서비스를 중지해야 하는 경우는 거의 없다. 이 방식은 개발에 있어서도 쿨하다. 버그 소스를 찾기 위해 관계형 테스트 DB와 hg-bisect(혹은 git-bisect) 명령을 사용하면, 테스트 DB를 업그레이드/다운 그레이드(또는 필요한 속성과 함께 새로운 것을 추가하는)의 추가 작업은 정말 큰일을 만들어 일을 지연시킬 수 있는 확률이 높다.

#### 그 외

많이 사용하는 모듈은 Async.js 과 Underscore.js . Express , Hogan.js , AWS SDK for JavaScript 도 최근에는 이용하고 있다.

프로덕션 릴리스의 빈도는 주 3 ~ 5 회 정도이고. 긴급 수정 사항은 별도로 수시로 진행하고 있다. 패키지 과정은 CoffeeScript과 LESS 파일을 미리 컴파일하여 압축하고 CDN에 올리고 그 다음 정적 파일 준비도 할 수 있으면 준비해서 프로덕션 환경에 업로드한다. 9개의 상용 web 서버와 2대의 스테이징 서버가 운영중에 있다. 서버 1대씩 SSH를 통해 tarball 파일을 업로드 풀에서 제거 요청을 중지하고 socket을 kill하고, 노드 프로세스도 하나씩 kill한다. 프로세스가 모두 종료되면 다시 시작하고 로컬 호스트가 요청에 응답을 시작할 때까지 curl로 계속 그 web 프로세스를 HAProxy에 건네 준다. 그리고 다음 서버 작업에 임한다. 이 과정은 모두 자동화되어 있으며, 관리 화면(Graphite 데이터 베이스)에서 디스플레이 되고 있어, 무엇인가 문제가 보이면 즉시 롤백할 수 있도록 되어있다. 가까운 미래에 API를 구성하여 클라이언트 측을 서버 측과는 별도로 전개하는 형태로 진행할 것이다. 이 방법이 대단히 많은 클라이언트의 대응에도 훨씬 쉬워진다.

JASON 로그를 logstash + Elasticsearch + kibana 처리하고 있다. 최근에는 Chrome이나 Firefox에서 스택 추적이 잘 잡히지 않아 Amazon CloudFront는 Cross Origin에서 올바른 헤더를 돌려주지 않는 것이 있어, CloudFlare로 전환했지만, 루트 도메인의 CNAME 문제가 결국 하위 도메인을 채용하는 것으로 겨우 오류 모니터링이 안정화 되었다.

#### 참조 사이트

- [Trello Architecture](https://blog.trello.com/the-trello-tech-stack)
- [The Trello Tech Stack](https://prezi.com/skunatcrkp5m/trello-architecture/)
