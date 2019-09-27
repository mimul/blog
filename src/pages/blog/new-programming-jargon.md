---
templateKey: "blog-post"
title: "새로운 프로그래밍 관련 은어(자곤)"
description: "Stack Overflow에서 New programming jargon you coined?라는 질문을 하고 이에 답한 것들중에 투표를 통해 30개 선별된 것에 대한 설명을 정리."
author: "미물"
authorURL: "https://mimul.com"
date: "2012-08-15T13:10:09.000Z"
lastModificationTime: "2012-08-15T13:10:09.000Z"
image: "/img/programming-jargon.png"
commentId: "new-programming-jargon-2012-08-15"
tags:
  - Programming
  - Jargon
---

이 포스트는 Stack Overflow에서 "New programming jargon you coined?"라는 질문을 하고 이에 답한 것들중에 투표를 통해 30개 선별된 것에 대한 설명을 정리한 것입니다.
살펴보니 재미있는 것이 많습니다. 우리나라도 한번 커뮤니티나 페이스북에서 공론화하면 좋을듯 합니다.
아래는 Stack Overflow를 기반으로 해 Coding Horror에서 정리한 포스트("Coding Horror : New Programming Jargon")를 제멋대로 의역해봤습니다. 오역이 있으면 댓글로 의견 부탁드립니다.

**1. Yoda Conditions**

![Yoda Conditions](/img/blog/yoda.png)

변수와 상수를 비교할 때는 상수를 왼쪽에 변수를 오른쪽에. 스타워즈의 요다가 "The sky is blue" 대신에 "if blue is the sky" 혹은 "The man is tall" 대신에 "if tall is the man"라고 말하는 것에서 옴.

**2. Pokemon Exception Handling**

![Pokemon Exception Handling](/img/blog/pokemon.jpg)
모든 예외는 다 잡아야 한다.
try {
}
catch (Exception ex) {
   // Gotcha!
}

**3. Egyptian Brackets**

![Egyptian Brackets](/img/blog/egyptian.jpg)

줄 끝에서 중괄호를 여는 스타일. 이집트인 그림 손의 위치가 출처임.
if (a == b) {
    printf("hello");
}

4. Smug Report

![Smug Report](/img/blog/smug.png)

시스템 디자인을 설계한 자신보다 더 많은 것을 알고 있다고 생각하는 사용자가 제출한 버그. 관련 단어로 Drug Report, Chug Report, Shrug Report.

5. A Duck

![Duck](/img/blog/duck.jpg)

관리에 관심을 끌기 위함이 아니라, 제품의 다른 관점에서 불필요한 변화를 피해기 위해서, 특별한 이유없이 추가된 기능. 결국 그 기능은 없어지게 된다.
아티스트가 어떤 애니메이션(배틀 체스의 여왕 애니메이션) 제작에 참여했을때 변화, 즉 일한 티를 내려고 한 혁신적인 솔루션은 다른 애니메이션에 영향을 주지 않는 선에서 오리 캐릭터를 추가하는 것이었다. 그런데 결국 프로듀서가 리뷰를 하고 나서 "오리를 제거하라"고 한마디를 남겼다.

6. Refuctoring

![Refuctoring](/img/blog/refuctoring.jpg)

잘 설계된 코드가 적용되었더라도 작게라도 이것 저것 뒤적거리면 나자신 이외에는 아무도 유지보수 할수 없는 코드가 된다.

7. Stringly Typed

![Stringly Typed](/img/blog/stringly.jpg)

올바른 코드 규칙(강한 타입)을 가지고 코딩을 하면 되는데, 함수의 파라미터를 적절한 타입을 사용하는 것이 아니라 문자열을 나열하는 식으로 코딩을 해, 코드는 이해할 수 없게 되고 심지어 에러를 유발하게 된다.

8. Heisenbug

![Heisenbug](/img/blog/heisenbug.png)

버그에 대해 연구를(찾을려면) 시작하면 그 특성이 변하거나 사라지는 버그. 출처는 불확정성 원리를 만든 하이젠 베르크에서 옴.

9. Doctype Decoration

![HeisDoctype Decorationenbug](/img/blog/HeisDoctype.jpg)

웹 디자이너가 doctype 선언문을 추가했지만 유효한 마크업을 작성하려고 신경쓰지 마라.
<!DOCTYPE html>
<BLINK>Now on sale!</BLINK>

10. Jimmy

![Jimmy](/img/blog/Jimmy.png)

Jimmy는 우둔한 신입 프로그래머의 이름. 잘 설계된 프레임워크 코드를 참조할 때 "Jimmy 방지"라는 용어를 언급한다.

11. Higgs-Bugson

![Higgs-Bugson](/img/blog/Higgs.png)

이벤트 로그 및 모호하고 입증되지 않는 사용자의 보고에 의해 약간의 가능성에 기초한 가상 버그들이 예측한다. 그러나 개발 컴퓨터에서 재현하기가 어렵다.(힉스 입자처럼)

12. Nopping

![Nopping](/img/blog/Nopping.jpg)

NOP는 어셈블리의 no operation의미로, 실제 아무 의미없는 명령이지만, 아무것도 안하는 것은 아니다.(NOP)

13. Unicorny

![Unicorny](/img/blog/Unicorny.jpg)

초기 계획 단계이기 때문에, 마치 공상하는 상태처럼 설명되지 않는 기능.

14. Baklava Code

![Baklava Code](/img/blog/Baklava.jpg)

터키의 얇은층이 많은 과자. 너무 많은 레이어를 가진 코드.

15. Hindenbug

![Hindenbug](/img/blog/Hindenbug.jpg)

Hindenbug호 폭발 사고의 비극인 데이터 손실로 인한 버그(데이터 레이어에서 발생하는 버그). Counterbug와 Bloombug가 관련 있음.

16. Fear Driven Development

![Fear Driven Development](/img/blog/Fear.jpg)

몇몇을 해고하거나 일정을 앞당기거나, 자원을 빼는 등이 관리자가 압력으로 행사하는 것.

17. Hydra Code

![Hydra Code](/img/blog/Hydra.jpg)

불사신의 히드라처럼 고칠 수없는 코드. 하나 버그를 고치면 새로운 2개의 버그가 발생한다. 고쳐도 고쳐도 새로운 문제가 나온다.

18. Common Law Feature

![Common Law Feature](/img/blog/CommonLaw.jpg)

잘못하고 있는 것에도 불구하고, 사양의 일부가 되어 버린 버그.

19. Loch Ness Monster Bug

![Loch Ness Monster Bug](/img/blog/LochNessMonster.jpg)

재현 가능성이 없고, 목격자가 1명 밖에 없는 정체 불명의 버그.

20. Ninja Comments

![Ninja Comments](/img/blog/Ninja.png)

보이지 않는 댓글, 비밀 댓글이나 의견이 없는 것. 즉, 코멘트가 없다.

21. Smurf Naming Convention

![Smurf](/img/blog/Smurf.png)

모든 클래스에 동일한 프리픽스가 붙어있다. 예로 사용자가 버튼을 클릭하면 SmurfAccountView가 SmurfAccountDTO를 SmurfAccountController에게 전달한다.

22. Protoduction

![Protoduction](/img/blog/Protoduction.jpg)

프로토타입인 채로 세상에 나온 것.

23. Rubber Ducking

![Rubber](/img/blog/Rubber.jpg)

문제를 해결하기 위해서 누군가에게 가서 대화와 듣기를 통해 해답을 얻을 수 있다는 생각에 해결책을 찾기 위해 오리 장난감에게 말을 건내는 것.

24. Banana Banana Banana

![Banana](/img/blog/Banana.png)

나중에 채워넣기 위해 임시적으로 적어 놓는 문구. IDE의 경고를 피하기 위해 우선 임시로 적는다.
/// <summary>
/// banana banana banana
/// </summary>
public CustomerValidationResponse Validate()

25. Bicrement

![Banana](/img/blog/Bicrement.png)

변수에 1을 더하는 대신 2를 더한다.

26. Reality 101 Failure

![Reality](/img/blog/Reality.jpg)

요구하는대로 움직이고 있지만, 배포될 때 문제가 오해로 밝혀져 쓸모 없는 코드가 되는 것.

27. Mad Girlfriend Bug

![Girlfriend](/img/blog/Girlfriend.jpg)

분명 이상한 일이 일어나고 있는데도 불구하고 소프트웨어는 문제없다라는 메세지만 남긴다.

28. Megamoth

![Megamoth](/img/blog/Megamoth.jpg)

MEGA MOnolithic meTHod(2천라인 이상의 코드). 두개의 화면에 걸쳐 있는 거대한 객체(소스).

29. Hooker Code

![Hooker](/img/blog/Hooker.jpg)

애플리케이션 다운 등을 종종 유발하는 코드.

30. Jenga Code

![Jenga](/img/blog/Jenga.jpg)

한 블록 변경하면 전체가 붕괴 할 것 같은 코드.
