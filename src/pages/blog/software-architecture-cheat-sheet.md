---
templateKey: "blog-post"
title: "소프트웨어 아키텍트를 위한 팁"
description: "아키텍트가 알아야할 것 중에 가장 중요한 가치로 생각되는 것들을 한장의 시트로 정리한 Software Architecture cheat sheet라는 아티클 정리."
author: "미물"
authorURL: "https://mimul.com"
date: "2012-10-07T21:45:17.000Z"
lastModificationTime: "2012-10-07T21:45:17.000Z"
image: "/img/software-architect.png"
commentId: "software-architecture-cheat-sheet-2012-10-07"
tags:
  - Software
  - Architect
---

우리나라에서 소프트웨어 아키텍처를 만드는 아키텍트에게는 너무나 많은 짐이 부여되어 있고, 또한 아키텍트 본인 스스로도 수많은 사례들을 찾아서 그 방법들을 문제 해결에 적용해 보려 한다.

너무 많은 사례가 타인 합리와에 의해 자기 합리화가 된 것이다. 많은 사례를 적용한다는 것은 그만큼 프로젝트 이해 당사자들에게는 큰 짐이 아닐 수 없다. 어떻게 하면 핵심적인 요소들만 추려서 부담을 최소화하고 아키텍처를 유연하게 할지의 노력이 분명 필요해 보인다.

그리고 "소프트웨어 아키텍트가 알아야 할 97가지(원제: 97 Things Every Software Architect Should Know)"라는 책의 예에서 보듯이 Best Practices는 너무도 많다. 중요한 것은 자기 것으로 꾀어야 하는 것이다. 그런 차에 아키텍트가 알아야 할 것들 중에서 나름 잘 요약된 내용이 있어서 소개한다.

아키텍트가 알아야할 것 중에 가장 중요한 가치로 생각되는 것들을 한장의 시트로 정리한 [Software Architecture cheat sheet](https://gorban.org/2012/10/04/software-architecture-cheat.html)라는 아티클이다.
옳고 그름, 선택의 결정은 여러분이 하지만, 되새겨볼 만한 글이어서 여기 블로그에 정리해 본다.

아래 슬라이드는 Jacob Gorban이 스스로 정리한 한장의 시트이고, 이것을 인쇄하여 벽에 붙여 놨다고 한다.

![Architect Tips](/img/archi_tip.png)

그럼, 위의 요점들에 대한 내용을 설명한다.

#### Is this a “Good Idea”?(이것은 좋은 아이디어인가?)

이것은 Avoid “Good Ideas”의 부분을 인용한 것이다.

> 좋은 아이디어에 대해 간과해서는 안되는 것이 그것이 좋다는 것이다. 나쁜 아이디어는 누구나 인식하고 거부할 수 있다. 좋다는 것은 비즈니스 요구사항에 충족하는데 필요한 것이 아닌 애플리케이션 내에 요구사항을 벗어나거나 범위나, 복잡성 등의 부적절한 노력의 낭비 문제를 야기시킨다.

다른 한편으로, 그것이 정말 필요한 것인지, 제품에 불필요한 기능이 복잡하게 추가되는 현상(feature creep)은 아닌지 생각해봐야 한다. 소프트웨어의 복잡성은 기하급수적으로 증가하게 되고 기능이 두배가 된다면 코드는 기능의 두배이상으로 복잡해 진다.

#### DRY. Don’t Repeat Yourself.(반복하지 마라.)

DRY(코드든, 문서든 중복없이 간결하게)는 잘 알려진 소프트웨어 디자인 원칙이다. "Pragmatic Programmers"에서 "시스템에서 모든 지식은 단일적이고(중복이 없고), 애매하지 않고, 정말 신뢰할수 있게 표현되어야 한다." 설명하고 있다.

DRY는 이미 나에게 본능적으로 뿌리깊게 베어 있다. 아직도 내가 열정적인 아이디어를 중간에 잊지 않을려고 목전에서 상기시키고 있다.

#### Orthogonal?(직교성-독립성이 있나요?)

즉, 이것은 시스템의 다른 파트로부터 블록이나 모듈들을 어떻게 독립시키는가?에 대한 것이다. 소프트웨어에서 모듈화는 중요하다. 이렇게 되면 나중의 인생이 편해지고, 가독성이 높아져 이해가 쉬워진다. 직교성은 또한 결합도를 줄이는 디커플링도 포함된다.

#### Testable?(테스트가 가능한가?)


시스템에서 어떻게 테스트를 할지 생각하자. 테스트가 쉽게 되도록 설계되어 있냐? 테스트 가능성은 모듈성, 복잡성, 코드 스타일과 연관되어 있다. 여러분의 시스템과 코드에서 테스트 가능성은 무시할 수는 없다. 테스팅은 매우 중요하다. 매뉴얼 테스트도 좋지만, 자동화된 테스트는 더 좋다.

#### Is there another way?(다른 방법이 있는가?)

이것 또한 "Pragmatic Programmers."에 있다. 각 장에 좋은 인용들이 포함되어 있다. Emil-Augste Chartier가 "아이디어가 하나 밖에 없는것보다 위험한 것은 없다"고 말하고 있다.

종종 우리가 문제에 대해 생각했을 때 하나의 솔루션을 찾아내고 그 하나에 행복감을 느끼며 구현해 실행한다. 불행히도 종종 첫번째 솔루션은 베스트하지 않다. 다시 생각하고, 창의적으로, 다른 방법을 시도해 보라. 여러분이 더 많은 아이디어를 찾았을 때, 종종 첫번째에 것에 너무 매여있어 있게 되는데 실제는 다음의 것이 훨씬 더 나은 것인 경우가 많다.

#### Costs of changing this later(나중에 수정 비용은?)

결정을 채택하기 전에 고려하자. 프로젝트 후반부에 수정하는 것은 어떤 비용을 초래할까? 결정을 연기할 수 있냐? 당신의 결정이 불확실하다면 후반부에 수정할 때, 일을 파괴하지 않거나 불필요한 일을 만들지 않고 시스템을 설계할 수 있냐?는 것이다.

#### What if I didn’t have this problem?(만약 문제가 없었다면?)

이것은 "Don't Be a Problem Solver"에서 인용한 것이다.

> 아키텍트는 즉시 문제 해결 모드로 들어가도록 훈련되어 있다. 우리는 문제 자체에 대해 생각하는 것을 잊기도 하고 또한 문제에 대해 어떻게 생각해야할지 배우지 못했기도 하다. 문제를 단순히 받아들이는 것이 아니라, 실제 문제의 뼈대를 밝히기 위해 망원경처럼 줌인/줌아웃해서 관찰하는 것을 배워야 한다.
문제가 주어지면 즉시 해결할 것이 아니라, 문제 자체를 변경할 수 있는지를 살펴보자. 이 문제가 없으면 아키텍처가 어떻게 되는지를 자문 자답해 보는 것이다. 이렇게 하면 우아하고 영구적인 해결책을 인도해 줄 수도 있다.

#### What are facts and assumptions? Document rationale.(무엇이 사실이고 무엇이 가정인가? 근거를 문서화하자.)


"Challenge assumptions - especially your own"에서 왔다.

> 각각의 결정에는 어떠한 장단점(성능 vs 유지 보수, 비용 vs 개발 기간 등)이 있는지, 근거를 문서화하는 것은 소프트웨어 아키텍처의 모범 사례이다.
다양한 요인을 목록화하면 아키텍트들이 강조한(기록한) "가정"이, 소프트웨어 설계의 중대한 결정에 영향력을 미치고 있음을 아는데 도움을 준다. 종종 이런 가정들은 역사적 근거, 의견, 개발자의 구전 지식, FUD(fear, uncertainty, and doubt - 근거 없는 공포)에 기초하고 있다.

다른 한편으로, 소프트웨어 아키텍처 설계를 한다면 왜 그런 의사결정을 내렸는지, 무엇이 사실이고, 가정인지 생각한 것을 기록하라. 여러분의 가정을 체크하라.

> 사실과 가정은 소프트웨어를 지지하는 기둥이다. 그것이 무엇이든지 기초는 견고하게 해야한다.
