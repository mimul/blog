---
templateKey: "blog-post"
title: "DevOps와 NoOps에 대하여"
description: "DevOps와 NoOps의 정의, 문화, 도구, 관련분야, 시너지 관계 등 정리."
author: "미물"
authorURL: "https://mimul.com"
date: "2011-11-17T23:10:01.000Z"
lastModificationTime: "2011-11-17T23:10:01.000Z"
image: "/img/topics/devops.png"
commentId: "devops-noops-2011-11-17"
tags:
  - DevOps
  - NoOps
---

작년부터 클라우드가 활성화되면서 해외 IT 계의 기사에서 "DevOps", "NoOps"라는 용어를 볼 기회가 증가하고 있다. 이젠 용어에 그칠것이 아니라, 신속하고 자동화된 개발 및 운영, 소프트웨어 품질과 관련된 새로운 무브먼트로 인식해야 될 것 같다.

#### DevOps(DevOps = Dev + Ops)란?

DevOps 용어는 Opscode의 CEO인 Jesse Robbins에 의해 최초로 불려졌다고 한다. [위키피디아](https://en.wikipedia.org/wiki/DevOps)의 정의를 살펴보면.

>"DevOps" is an emerging set of principles, methods and practices for communication, collaboration and integration between software development (application/software engineering) and IT operations (systems administration/infrastructure) professionals.[1] It has developed in response to the emerging understanding of the interdependence and importance of both the development and operations disciplines in meeting an organization's goal of rapidly producing software products and services.
DevOps은 개발 부문, 운영 부문, 품질 관리 부서 사이의 통합, 커뮤니케이션, 협업을 위한 일련의 메소드 및 시스템이라고 정의하고, 적기에 소프트웨어 제품이나 서비스를 출시를 목표로 하는 조직에 부합하기 위해서는 개발과 운영은 상호 의존을 해야한다는 의미다.

#### DevOps는 비즈니스 위험을 줄이기 위해 왜 개발 및 운영과 통합 해야하는가?

위키피디아의 내용을 인용해 보면 부득이한 큰 경우에만 릴리즈를 한꺼번에 한다면 그사이의 큰 변화로 인해 시스템에 위험이 커지지만, 수시로 작은 릴리스를 반복한다면 변화가 작아 위험도 작아진다는 것이다.

이렇게 빈번한 릴리스에 대한 개발 부문과 운영 부문이 협력하지 않으면 안된다는 것이 DevOps의 근저에 흐르는 생각인 거 같다.
그래서 DevOps는 개발에서 운영까지를 하나의 통합된 프로세스로 묶어내고 툴과 시스템을 표준화하고 통합하여 협업을 통해 의사소통의 효율성을 확보하고 매뉴얼 작업을 가능한 자동화하여 코드 통합, 테스트, 릴리즈 과정이 자동화될 수 있도록 환경을 구축하게 되는 것이다.

이 DevOps가 실현 되려면 문화와 도구가 중요하다.

개발 부서에서 새로운 기능 추가 요구에 운영 부서에서의 안정적인 시스템에 저해한다는 생각에 반영하는 것을 거부하는 일이 생긴다. 보이지 않는 싸움속에서 비즈니스 기획쪽의 임원이 안정적 운영이 목표가 아니라 새로운 비즈니스의 실현이라는 설득에 울며겨자먹기로 반영을 한다. 이런 보이지 않는 개발부서와 운영부서간에는 대립 관계가 존재한다. 더군다나 장애를 중시하는 임원들이 많아서 개발과 운영 부서는 더 안정적 운영에 신경을 쏟을 수 밖에 없는 구조가 되었다.
하지만, 비즈니스는 항상 새러운 기능과 기존 기능의 변화를 지속적으로 가져온다. 이는 시스템의 장애 원인으로 작용되고 있다.
어떻게 해야할까? 이런 장애의 이슈를 문화와 도구로 극복할 수 있는 방법을 찾는 것이다. 그러기 위해서는 개발 부서와 운영 부서가 서로 협업을 해야하는 경우가 많아지게 되며 결국 통합에 이를수 밖에 없다는 점이다.

#### 시너지를 낼 수 있는 문화는 어떤게 있을까?

개발와 운영의 가치를 인정해 주고 개발자/운영자를 존중해 주는 문화가 필요하다.
실패를 감싸주는 포용력이 있어야 한다.
실무에 집중할 수 있는 환경을 제공해 주는 것.
자유롭게 서로 토론할 수 있는 채널도 중요하다.
비즈니스를 위한 협업과 참여는 개발 초기에 투입되어야 한다.

#### 그들을 도울 수 있는 도구(Best Practices)는 어떤게 있을까?

자동화된 빌드와 릴리즈를 하라.그리고 한번에.
자동화된 인프라스트럭처와 시스템 프로비저닝을 갖춰라.
DevOps 팀간의 일관된 도구를 사용하라.
설정과 같은 코드는 어플리케이션 코드와 분리를 해라.
라이프 사이클내내 비기능적인 운영 요소들에 대해 관심을 가져라.
공유가 가능한 버전 관리 도구를 가져라.
감사시 릴리스를 추적할 수 있어야 한다.(요구사항에서 운영까지)
모델화된 수명주기를 갖춰라(예로 버전관리되는 SDLC)
Ops툴은 동일한 SDLC 아래 이뤄져야 한다.
자동화 코드는 코드이므로 자체 SDLC에 의해 통제되고 소프트웨어처럼 릴리즈한다.
측정 지표가 관리되고 공유되어야 한다.

#### DevOps에서 필요한 언어들...

[The Most Important Languages For DevOps](https://dzone.com/articles/most-important-languages) 아티클을 통해 DevOps에서 가장 활용도가 높은 언어를 살펴본다. 인기순으로 Bash(or Posix shell), SQL, Perl, Javascript(Node.js의 부상), PHP, Ruby, Java, Python 순이라고 한다. 최근 Docker, Kubernetes가 들어오면서 Go에 대한 활용도가 높아졌다. 특이하게 중요하게 생각한 Chef/Puppet은 필요하지만, Ruby를 배워야 하는 진입 장벽이 있어서 하위에 포진되어 있다. 이 내용은 개인적인 경험에서 나온 아티클이라 참고만 하기 바란다.

#### NoOps(No + Ops)란?
Forrester Research의 애널리스트 Mike Gualtieri 씨의 아티클 [I Don't Want DevOps. I Want NoOps](https://go.forrester.com/blogs/11-02-07-i_dont_want_devops_i_want_noops/)에서 그는 클라우드 환경이 되면 DevOps 커녕 운영 부서 자체가 필요 없다(NoOps)라고 했다. 그의 정의에 따르면..

> NoOps means that application developers will never have to speak with an operations professional again. NoOps will achieve this nirvana, by using cloud infrastructure-as-a-service and platform-as-a-service to get the resources they need when they need them.
NoOps는 개발자는 운영 부서와 이야기할 필요가 없다. NoOps는 IaaS와 PaaS를 통해 언제든지 필요한 자원을 필요한 때 획득할 수 있다는 점에서 낙원의 실현이다.

IaaS와 PaaS 따라 배포 프로세스가 개발자에게는 이상향이 된다는 것은 지나친 낙관주의다. 거기에는 다양한 플랫폼과 비즈니스가 존재하기 때문에 운영과 개발 과정이 달라 이렇게 단순화 시킨다는 것은 무리가 있다.

NoOps 용어는 지금 부터 1년전인 2011년 4월 Forrester에서 [Augment DevOps with NoOps](https://www.forrester.com/report/Augment+DevOps+With+NoOps/-/E-RES59203) 제목의 보고서를 공개하면서 가까운 장래에 일부 기업에서부터 클라우드 의존도가 높아지고, 개발자의 빌드, 테스트, 배포등의 작업들이 자동화 되어 결국 NoOps에 이를 것으로 예상하고 있다고 말했다. 클라우드 컴퓨터 시대에는 주문형 인프라와 자원의 Self Provisioning, 유연한 어플리케이션 아키텍처로 인해 개발자들의 협업 릴리스 작업의 필요성을 감소시켜 협업 중심의 Devops는 NoOps로 진화한다고 한다.
그 후 ReadWriteWeb에서 [From DevOps to NoOps: 10 Cloud Services You Should Be Using](https://readwrite.com/2011/11/14/from-devops-to-noops-10-cloud/)에서 DevOps를 넘어 NoOps로 가기 위한 인프라 스트럭처 도구들을 소개한 글을 올리기도 했다.

GigaOM에서 AppFog CEO인 Lucas Carlson가 [Why 2013 is the year of ‘NoOps’ for programmers](https://gigaom.com/2012/01/31/why-2013-is-the-year-of-noops-for-programmers-infographic/)이라는 Infographic을 통해 2013 년 프로그래머 NoOps의 해가 될 것이라고 예측하고 있다. 그 내용은 컴퓨터 모델이 1990년대의 데이터 센터에서 2000년대의 가상화 솔루션과 IaaS(AWS)로 진화됨에 따라 신흥 기업의 컴퓨팅 비용이 기하 급수적으로 감소하는 한편, 생산성이 기하 급수적으로 증가하는 모습이 나타나고 있다. 2011년이 되면서 SysOps 관리가 체계화 되면서 Chef와 Puppet 같은 표준 라이브러리를 통해 자동되가 급속도로 증가한다는 것이었다.

Carlson은 개발자의 60%는 프로그래밍하는데에, 40%는 운영(미들웨어, 네트워크, 가상화 하드웨어 관리, 프로비저닝, 보안)에 보내고 있다고 한다.
그리고 NetFlix도 [Ops, DevOps and PaaS (NoOps) at Netflix](http://perfcap.blogspot.com/2012/03/ops-devops-and-noops-at-netflix.html) 포스팅을 통해 리눅스 기반의 기반 AMI(아마존 머신 이미지)를 구축하고 긴 토론 후에 바이너리 저장소, Artifactory를 빌드 과정을 자동화하는 등의 NoOps로 가는 과정을 기술했다.

최근들어 NoOps에 대한 관심도 증가하고 있지만, NoOps라는 것이 말 그대로 운영 업무를 제거하는데 목표를 두고 있는 것이다. 개발자와 운영자들을 없애는 것이 아니라.
그리고 아웃소싱으로 비화될 수도 있는데 DevOps도 자산이라는 생각을 가졌으면 좋겠다.

#### DevOps, NoOps와 관련된 영역들은 뭐가 있나?

- Build
- Continuous Integration
- Dependency Management
- Packaging
- Repository
- Authentication/Authorization
- Content Distribution
- Schema Management
- Monitoring
- Service Management
- Code Coverage
- IDE
- Version Control System
- Unit Testing
- Server Virtualization
- System Configuration
- Documentation
- Change Management
- Process Orchestration
- Test Automation
- Configuration Management
- Provisioning

마지막으로 DevOps or NoOps is Not Silver Bullet!. 운영 분야에 어려운 문제를 해결해 주는 은총알은 아니다. 개발자와 운영자 각자의 영역에서 협업을 통해 운영 업무의 효율성을 높이고, 제품의 품질을 안정적으로, 높여 비즈니스의 가치를 높이는데에 있다.

#### 참조 사이트

- [DevOps](https://en.wikipedia.org/wiki/DevOps)
- [I Don't Want DevOps. I Want NoOps](https://go.forrester.com/blogs/11-02-07-i_dont_want_devops_i_want_noops/)
- [Augment DevOps with NoOps](https://www.forrester.com/report/Augment+DevOps+With+NoOps/-/E-RES59203)
- [From DevOps to NoOps: 10 Cloud Services You Should Be Using](https://readwrite.com/2011/11/14/from-devops-to-noops-10-cloud/)
- [Why 2013 is the year of ‘NoOps’ for programmers](https://gigaom.com/2012/01/31/why-2013-is-the-year-of-noops-for-programmers-infographic/)
- [Ops, DevOps and PaaS (NoOps) at Netflix](http://perfcap.blogspot.com/2012/03/ops-devops-and-noops-at-netflix.html)
- [The Most Important Languages For DevOps](https://dzone.com/articles/most-important-languages)
- [NoOps: Its Meaning and the Debate around ](https://www.infoq.com/news/2012/03/NoOps/)
- [A set of best practices useful to those practicing DevOps](https://code.google.com/archive/p/devops-toolchain/wikis/BestPractices.wiki)
