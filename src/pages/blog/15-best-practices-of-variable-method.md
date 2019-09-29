---
templateKey: "blog-post"
title: "변수와 메소드 네이밍에 관한 15가지 모범 사례"
description: "코딩 가이드에 참고할만한 좋은 아티클(15 Best Practices of Variable & Method Naming)에 있어 정리함."
author: "미물"
authorURL: "https://mimul.com"
date: "2012-03-01T17:50:16.000Z"
lastModificationTime: "2012-03-01T17:50:16.000Z"
image: "/img/style_guide.jpeg"
commentId: "15-best-practices-of-variable-method-2012-03-01"
tags:
  - Programming
  - Naming
---

코딩 스타일을 좋게 하는 방법 중에 하나가 네이밍을 일관되게 사용하는 것이다. 그래서 관련된 좋은 아티클, [15 Best Practices of Variable & Method Naming](http://codebuild.blogspot.com/2012/02/15-best-practices-of-variable-method.html)에 대해서 소개한다.

간략하게 정리해 보면..

1. 범위별로 충분히 짧게, 혹은 충분히 긴 변수 이름을 사용한다. 일반적으로 루프 카운터에는 하나의 문자로, 조건이나 루프 변수는 한 단어로, 메소드는 한/두단어로, 클래스에는 두/세 단어로, 전역 변수는 서/너 단어를 사용한다.

2. 구체적인 변수 이름을 사용한다. 예를 들어, "value", "equals", "data" 같은 변수 이름은 어떠한 경우에도 유효하지 않다.

3. 의미있는 변수 이름을 사용한다. 변수 이름은 저장되는 값을 정확하게 설명할 수 있어야 한다.

4. 변수 이름은 "o_", "obj_", "m_"등으로 시작하지 않는다. 변수 이름에 자신이 변수라고 자기 자신을 언급하는 태그는 필요 없다.

5. 변수에 관련된 회사의 네이밍 규칙을 따르고, 어플리케이션 내에서도 일관된 변수 이름에 쓴다. 예를 들어, txtUserName, lblUserName, cmbSchoolType 등과 같이. 그렇지 않으면, 가독성이 떨어지고 검색/바꾸기 툴 사용 측면에서 사용할 수 없게 된다.

6. 프로그래밍 언어의 표준을 따르자. 그리고 대/소문자 문자들을 일관되지 않게 사용하지 않는다. 예를 들어, userName, UserName, USER_NAME, m_userName, username 등에서 처럼 비 일관되게 사용하지 않는다.

- Java의 예로 올바른 네이밍은.
  * Camel Case(aka Upper Camel Case)를 클래스에 사용한다. VelocityResponseWriter
  * Lower Case(Lower Camel Case)를 패키지에 사용한다. com.company.project.ui
  * Mixed Case(aka Lower Camel Case)을 변수 로 사용한다. studentName
  * Upper Case를 상수로 사용한다. MAX_PARAMETER_COUNT = 100
  * Camel Case를 enum클래스에 사용하고 Upper Case를 enum 값으로 사용한다.
  * under bar는 상수와 enum값 이외의 어떠한 곳에서도 사용하지 않는다.(이들은 상수이다.)

7. 다른 컨텍스트에서는 동일 클래스내에서 동일 변수를 사용하지 않는다. 예를 들어, 메소드및 생성자, 클래스 등이다. 이렇게 하면 더 간단하게 이해하기 쉽고 관리하기 용이하게 할 수 있다.

8. 메소드및 조건 등에서 다른 목적이라면 동일 변수를 사용하지 않는다. 대신 새로 다른 이름의 변수를 준비한다. 이것은 이해하기 쉬움과 유지 보수의 용이성도 중요하다.

9. 변수 이름에 ASCII가 아닌 문자를 사용하지 않는다. 그들은 당신의 플랫폼에서 작동 할지도 모르지만, 다른 플랫폼에서 작동하지 않을 수 있다.

10. 너무 긴 변수 이름을 사용하지(예로, 50자 길이). 너무 긴 이름은 추잡하고, 읽기 어려운 코드이다. 게다가, 어떤 컴파일러는 최대 길이(character limit)에 의해 작동되지 않는다.

11. 네이밍을 위해 자연 언어를 하나로 정하고 그것을 사용한다. 예를 들어, 영어와 독일어가 혼합 된 이름은 비 일관적이고 읽기 힘들 것이다.

12. 메소드를 위해서도 의미 있는 네이밍을 사용한다. 이름은 메소드의 정확한 동작(action)을 구체적으로 나타내고, 대부분의 경우 동사로 시작(createPasswordHash 등)한다.

13. 메소드에 대해서도 회사의 네이밍 규칙에 따르고, 어플리케이션 내에서 일관되게 메소드 이름을 쓴다. 예를 들어, getTxtUserName(), getLblUserName(), isStudentApproved() 등이다. 그렇지 않으면, 가독성이 떨어지고, 검색/바꾸기 툴의 사용 측면에서 유효하지 않게 된다.

14. 프로그래밍 언어의 표준에 따라 대/소문자 문자열을 일되관하지 않는 상태로 사용하지 않는다. 예를 들어, getUserName, GetUserName, getusername 등의 혼합 말이다.

- Java 의 예로 올바른 경우는.
  * Mixed Case를 메소드 이름으로 사용한다. getStudentSchoolType
  * Mixed Case를 메소드 매개 변수에 사용한다. setSchoolName (String schoolName)

15. 의미있는 이름을 메소드의 매개 변수로 사용한다. 그렇게 되면, 문서가 없는 경우에도 코드 자체가 문서 역할을 하게 된다.
