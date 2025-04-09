---
templateKey: "blog-post"
title: "Thoughtworks Technology Radar에 대해"
description: "Thoughtworks Technology Radar를 조사해 기술 트렌드, 작합한 기술의 선택 방법, echnology Radar의 활용방법 등에 대해 기술함" 
author: "미물"
authorURL: "https://mimul.com"
date: "2021-01-28T08:44:25.000Z"
lastModificationTime: "2021-03-09T22:55:35.000Z"
image: "/img/blog/tech_trends.jpg"
commentId: "tech-blog-2021-01-28"
tags:
  - Tech Trend
  - Tech Radar
---
개인의 사이드 프로젝트 시에도, 기업의 서비스 만들때도 항상 고민을 하게 만드는게 적정 기술이죠. 보통은 기존 인력이 가지고 있는 기술선에서 타협을 보고 선정을 하는데, 서비스가 확장되고 트래픽도 늘어나게 되면서 다른 기술의 선택을 고민하게 되는데, 이 때는 선택의 시간이 적다는 환경에 직면하게 됩니다. 기술 트렌드를 파악하는데, 적합한 기술의 선택에 도움을 줄 수 있는 방안들이 있다면 작은 시간에도 기술 선택에 망설임이 없어지게 되죠. 기술 선정과 트렌드 파악 등에 도움이 될 수 좋은 방법중에 하나인 [Technology Radar](https://www.thoughtworks.com/radar)에 대해 조사한 내용을 정리해 봤습니다.

#### 적정 기술 선택의 어려움

기술은 계속 새로운 것이 나타나고 없어지고 발전하는 소프트웨어 개발 분야에서 우리 조직에 적합한 기술을 선택하는 것은 항상 어려운 문제다. 기업에서 이용하는 많은 기술 영역(개발 기법, 프레임워크, 프로그램 언어, 툴이나 라이브러리, 플랫폼) 각각에 대해 롱리스트를 작성하고, 자신의 조직에 있던 평가 기준이나 가설에 근거해 평가를 하는 등의 활동을 한다. 그리고 현재 채용한 기술이 1 ~ 2년 후에 다시 재평가가 필요한 상황이 온다. 성숙된 조직을 가진 기업은 크게 무리가 없지만, 성숙된 조직을 가지고 있지 않은 스타트업이나, 충분한 기술 투자를 할 수 없는 중소기업, Bottom Up이 잘 안되는(수평적이지 않는) 대기업들은 적합한 기술을 선정하는 것은 어려운 일이다.

또, 평가에 대한 바이어스도 많다. 기술의 평판, 로컬적인 특성, 벤더의 영업력, 인플루언서에 의한 편향, 그리고 플랫한 평가를 하고 있다고 표방하고 있는 외부 리서치 기업의 리포트는 스폰서 등에 의해 바이어스가 끼어 있을 수 있고 기본적으로는 우리 조직의 평가 방법의 진부함(업데이트 부재), 개개인의 선호도 편차 등으로 실효성이 떨어지는 문제 등이 일어날 수 있다. 그래서 기업에서 신뢰가 가는 기술 선정 도구가 뭐가 있을까 찾다가 [Martin Fowler](https://martinfowler.com/)가 속해 있는 Thoughtworks에서 만든 [Technology Radar](https://www.thoughtworks.com/radar)를 보게 되었다.

#### Thoughtworks Technology Radar란 무엇인가?

![Thoughtworks Technology Radar](/img/blog/tech_radar.png)

Technology Radar에서 주요 시각화 리포트에 사용되는 용어들을 살펴보면 각 키워드를 Blip(후보 기술들), 카테고리를 Quadrant(4분면의 영역), 평가한 결과의 위치를 Ring이라고 부른다.

Technology Radar는 소프트웨어 개발에 관련된 최신 기술 트렌드를 카테고리와 성숙도 평가(Ring)로 시각화를 해 반년마다(년 2회) 발표하는 보고서이다. 전세계에서 일어나는 프로젝트의 경험에 근거하고 있으며, 현장에서 얻은 지식으로부터 향후 프로젝트에서 검토해야 할 기술 요소들을 정리하고 있다. 이 보고서는 특정 업체의 제품을 홍보하지 않으며 수익 목적도 없다. 실제로 Thoughtworks는 벤더의 게재 요청을 받아들이지 않고 독립적인 관점에서 기술들을 선정하고 있다. 

주요 대상 독자는 소프트웨어 엔지니어, 아키텍트, CTO 등의 기술적 리더층이며 최신 기술을 이해하고 전략적으로 플랫폼과 툴을 선택하고, 자기 조직의 미래에 대비하기 위한 자료로서 활용할 수 있는 것이다.

#### Technology Radar의 선정 과정

Technology Radar는 Thoughtworks 사내 기술 권고 보드(TAB)라는 20명 정도의 수석 기술자 그룹에 의해 만들어 진다. TAB은 Thoughtworks CTO(Rachel Laycock)의 자문 그룹으로, 국적과 전문 분야가 다양한 기술 리더로 구성되어 있다. Radar 작성을 위해 TAB은 연 2회 대면으로 모여(또한 격주의 가상 회의도 실시), 전세계의 Thoughtworker로부터 사전에 정리된 후보 기술(Blip)을 검토한다. 후보 리스트는 각 프로젝트에서 발견하거나 신기술의 제안을 사내 공모(클라우드 소스)한 것으로, 충분히 중요하다고 인정된 것이 논의 대상이 된다.

TAB의 일 중 첫 번째는 Blip의 수집, 두번째는 Radar의 큐레이션(토론을 통해 리포트에 담을 수 있는 수까지 결정), 세번째는 Radar에 기재하는 리포트 쓰기, 네번째는 제작(번역 포함)이다. 미팅 당일 제안된 각 Blip은 미리 상정한 4가지 카테고리(Techniques, Tools, Platforms, Languages & Frameworks)과 Ring(Adopt, Trial, Assess, Hold)에 배치된 뒤, 멤버 전원이 하나하나 몇시간에 걸쳐 토론을 하게 된다. 처음에는 Blip이 약 400개 정도 된다.

Blip의 수집 단계에서는 참가자들은 포스트잇에 기술 후보를 적어서 관련 Ring안의 화이트보드에 붙이고 진행자는 비슷한 메모를 그룹화한다. 큐레이션을 위해서 토론을 하게 되는데, Blip을 수집한 사람이 설명을 하고 난 다음 참가자는 이 Blip은 어떻게 생각하는지 의견을 개진한다. 발언하려면 노란색 카드를 올리고 발언하려는 의사를 나타낸다. 회의 의장인 레베카가 발언 순서를 기록하고 차례로 발언해 나간다. 의장이 투표를 요청하면 회원은 녹색 카드로 찬성하고 빨간 카드로 반대 의사를 나타낸다. 1차적으로 Radar 게재할지를 결정하는데 보통 이단계에서는 130-150정도의 Blip 정도만 남는다. 씨닝을 거쳐, Blip수가 100에 가까워지면 마지막 단계인 한번 더 검토 단계를 거친다. 최종적으로 게재가 정해진 각 Blip에는 담당자가 붙어 사내 리뷰를 거쳐 해설문을 작성하고 다양한 언어로 번역되어 Radar 사이트의 Web판 및 PDF판으로서 공개가 된다.

각 Blip 평가 결과는 다음 네개의 레벨 Ring으로 분류된다.

| 용어       | 정의                               |설명 | 
| :-------- | :------------------------------- | :------------------------------- |
| Adopt     | 적극적으로 채용하고 싶은 기술          | 디폴트 옵션의 성숙도를 가진 기술           |
| Trial     | 시험적으로 소개할 가치가 있는 기술      | 사용은 가능하지만 실증되지 않은 기술.       |
| Assess    | 채택 수준은 아니지만 주목할만한 기술.    | 상세히 더 조사히고 실증되어야할 기술        |
| Hold      | 채용을 삼가야 할 기술.               | 경험적으로 지양되어야할 기술              |

#### 기업에서 Technology Radar 활용 방법

- 기술 선정 판단 근거 : Adopt링에 있는 기술은 성숙도가 높고 유용성이 입증된 것이므로, 프로젝트에서 요건에 맞는다면 적극적으로 도입을 검토할 수 있지만, Hold 링의 기술은 문제점이 지적되고 있기 때문에, 이용중이면 대체의 검토를 하고 신규 채택은 삼가하는 것이 좋다.
- 로드맵 수립에 활용 : Radar의 Trial과 Assess 링의 항목은 지금은 기술 성숙도가 높지 않지만, 장래성이 있는 기술이라고 생각하면 된다. CTO나 아키텍트 등 중장기의 기술 선택을 담당하는 사람이라면 Adopt도 중요하지만, Trial과 Assess 링의 동향도 파악해 두는 것도 중요하다.
- 엔지니어 기술 육성 및 학습 : Radar에 게재되는 기술은 지금 핫한 기술이나 실무로 효과를 발휘하고 있는 것들이므로 자신이 습득해야 할 스킬의 힌트가 될 수 있다.
- 자사 버전 [Technology Radar 만들기](https://www.thoughtworks.com/radar/byor) : Technology Radar의 개념은 외부에 공개되어 있으며 Thoughtworks는 레이더를 만드는 도구를 제공한다. 자사의 기술 스택과 후보 기술을 정리하고 Thoughtworks Radar와 같은 사분면과 링에 매핑함으로써, 자사에 있어서의 Adopt 기술, Hold 기술은 무엇인가를 객관적으로 논의할 수 있다.

#### 자사 버전 Technology Radar 만들기

먼저 호스팅된 [Build Your Own Radar 서비스](https://radar.thoughtworks.com/) 사용하는 경우와 [Docker Hub에 게시되어 있는 컨테이너](https://hub.docker.com/r/wwwthoughtworks/build-your-own-radar)에서 시작하는 경우 두가지 경우가 있다. 여기에서는 Build Your Own Radar 서비스로 진행한다.

그 다음으로 Technology Radar 파일을 만들고 공개된 URL로 입력을 해야한다. 포맷은 크게 3종류(Google Sheets, CSV, JSON)가 있는데, 여기에서는 Google Sheets의 샘플로 [ThoughtWorks Technology Radar Vol. 32](https://docs.google.com/spreadsheets/d/1gwdxMG8mq6U_GZbHH4RKIv-aRoJXReCpwbFLWX7ENL4/edit?usp=sharing)를 공유한다. 

마지막으로 Build my radar 버튼을 클릭하면 Technology Radar 시각화 리포트가 생성된다.


#### 참조 사이트

- [How to create your enterprise technology radar](https://www.thoughtworks.com/insights/blog/technology-strategy/how-to-create-your-enterprise-technology-radar)
- [Inside the Technology Radar: A Thoughtworks documentary](https://www.youtube.com/watch?v=w_u8mQpTuhc)