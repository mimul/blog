---
templateKey: "blog-post"
title: "Make에 대해 알아야할 7가지"
description: "Make에 대해 알아야할 7가지 정리함."
author: "미물"
authorURL: "https://mimul.com"
date: "2014-10-27T18:12:44.000Z"
lastModificationTime: "2014-10-27T18:12:44.000Z"
image: "/img/blog/makefile.png"
commentId: "7-things-you-should-know-about-make-2014-10-27"
tags:
  - Makefile
---

Make 파일에 대해 그나마 괜찮은 블로그 포스트가 하나 있어 소개합니다. 제목은 [Make 대해 알아야 할 7 가지](http://www.alexeyshmalko.com/2014/7-things-you-should-know-about-make/)인데, 이것만 보면 makefile을 만들거나 만든거에 대한 이해를 도와줄 수 있을 거 같습니다.

구체적인 내용은 아래와 같습니다.

Make는 다양한 유형의 파일들을 자동 빌드하는데 간단하면서도 강력한 도구이다. 그러나 makefile을 작성할 때 문제가 발생하는 프로그래머들도 있고, Make의 기본 지식이 없어 기존에 있는 것을 다시 만드느라 시간을 낭비하는 프로그래머들도 있다.

#### 1. Make는 어떻게 동작하나?

기본적으로 Make는 첫번째 target에서 시작한다. 이 target을 디폴트 목표(goal)라고 한다.

Make는 현재 디렉토리의 makefile을 읽고 가장 먼저 룰(규칙) 처리를 시작한다. 그러나 Make가 완전히 이 룰(규칙)을 처리하기 전에 룰(규칙)이 종속 파일에 대한 룰을 먼저 처리해야 한다. 각 파일들은 자신의 룰에 따라 처리된다.

사실 이것은 각 target의 재귀 알고리즘으로 되어 있다.

- target을 빌드하는 룰(규칙)을 찾아낼 것이다. 만약 target을 빌드할 룰(규칙)이 없다면, Make는 실패한다.
- target의 전제 조건이 있는 경우 그 전제 조건과 함께 알고리즘이 실행된다.
- target이 존재하지 않거나 전제 조건의 갱신 시간이 target의 갱신 시간보다 이후인 경우 target과 관련된 레시피를 실행한다. 레시피가 실패한다면, (보통) Make도 실패한다.

#### 2. 할당 유형

Make는 makefile을 쓰는 것을 단순화하기 위해 변수가 지원된다. =, ?=, :=, ::=, +=, !=연산자 중 하나를 가지고 할당된다. 각 연산자의 차이점은 다음과 같다.

- =는 지연된 값을 변수에 할당한다. 즉, 변수가 사용될 때마다 변수의 값이 요구된다는 의미이다. 쉘 명령의 결과를 대입할 때 - 변수가 읽혀질 때마다 쉘 명령이 실행된다는 것을 잊지 마시라.
- :=와 ::=는 기본적으로 같은 의미다. 이러한 대입은 변수값을 한 번만 처리하고 그 값을 저장한다. 단순하고 강력하다. 이런 유형의 할당은 디폴트로 선택되어야 한다.
- ?= 는 변수가 정의되지 않은 경우에만 :=역할을 한다. 그렇지 않은 경우는 아무것도 하지 않는다.
- +=는 더하기 대입 연산자이다. 변수가 미리 :=또는 ::=에 설정되어 있는 경우, 우변은 즉시 값으로 간주된다. 그렇지 않으면 지연된 값으로 간주된다.
- !=는 쉘 대입 연산자다. 우변은 즉시 평가되고 쉘에 전달된다. 결과는 좌변의 변수에 저장된다.

#### 3. 패턴 룰

동일한 룰(규칙)을 가진 파일을 많이 가지고 있는 경우 모든 target을 일치시키기 위해 패턴 규칙을 쉡게 정의할 수 있다. 패턴 규칙은 target에 '%'가 있는 것을 제외하고는 보통의 룰(규칙)과 비슷하다. 패턴 룰의 타겟은 파일 이름과 일치하는 패턴이라고 판단되며 '%'는 공백이 아닌 부분 문자열에 일치시킬 수 있다.

내 블로그 디렉토리에는 다음과 같은 Makefile을 만들 수 있다.
```
all: \
    build/random-advice.html \
    build/proactor.html \
    build/awesome_skype_fix.html \
    build/ide.html \
    build/vm.html \
    build/make.html \

build/%.html: %.md
    Markdown.pl $^ > $@
```

$@가 target을 의미하는 반면, $^의존 관계를 의미하는 자동 변수다. 그래서 이 룰은 단순히 마크다운 파일 변환기에 전달하는 룰이다. 패턴 룰의 작성과 자동 변수에 대한 자세한 내용은 [매뉴얼](http://www.gnu.org/software/make/manual/make.html#Pattern-Rules)를 참조 하라.

#### 4. 디폴트 묵시적 룰

GNU Make에는 기본 룰(규칙)이 있다. 많은 경우 명시적 룰을 사용할 필요는 없다. 디폴트 묵시적 룰 목록은 C, C++, 어셈블러 프로그램의 컴파일 룰과 그들을 링킹(연결)하는 것을 포함하되 제한은 없다. 전체 목록은 [Make 설매뉴얼](https://www.gnu.org/software/make/manual/html_node/Catalogue-of-Rules.html)에서 볼 수 있다.

Makefile에 아무것도 하지 않는 것도 가능하다. 예를 들어, 단순히 hello.c라는 파일에 프로그램 소스 코드를 저장하고 단순히 make hello를 실행할 수도 있다. Make는 hello.c에서 hello.o를 자동으로 컴파일하고 hello에 링킹(연결)한다.


레시피는 $(CC) $(CPPFLAGS) $(CFLAGS) -c형식으로 정의한다. 변수를 변경하여 룰을 바꿀 수 있다. 소스 파일을 clang으로 컴파일하기 위해서는 단순히 CC := clang라인을 추가해주면 된다. 나는 작은 테스트 프로그램을 저장할 디렉토리에 아주 작은 Makefile을 가지고 있다.

```
CFLAGS := -Wall -Wextra -pedantic -std=c11
CXXFLAGS := -Wall -Wextra -pedantic -std=c++11
```

#### 5. 와일드 카드와 함수
현재 디렉토리의 모든 C와 C++ 소스 파일을 컴파일하려면 종속성을 위해 다음의 코드를 사용하자.

```
$(patsubst %.cpp,%.o,$(wildcard *.cpp)) $(patsubst %.c,%.o,$(wildcard *.c))
```
wildcard는 패턴과 일치하는 모든 파일을 검색하고, patsubst는 적절한 파일 확장자를 .o로 대체한다.

Make는 텍스트를 변환하기 위한 많은 기능이 있으며, $(function arguments) 형식으로 호출한다.

함수의 전체 목록은 [매뉴얼](https://www.gnu.org/software/make/manual/make.html#Functions)을 참조하시라.

쉼표 뒤의 공백은 인수의 일부로 간주되는 점에 주의하자. 공간이 있으면 몇몇 함수에서 예기치 않은 결과가 발생할 수 있기 때문에 나는 쉼표 뒤에 공간을 전혀 두지 않는 것을 추천한다.

[call 함수](https://www.gnu.org/software/make/manual/make.html#Call-Function)와 사용자 정의 함수, 그리고 [eval 함수](https://www.gnu.org/software/make/manual/make.html#Eval-Function)에서 매개 변수화된 템플릿과 같은 것을 쓸 수도 있다.

#### 6. 검색 경로

Make는 특별한 변수 VPATH가 모든 필요 조건을 위한 PATH처럼 사용된다. 또한 VPATH 변수는 디렉토리 이름을 콜론이나 공백으로 구분한다. 디렉토리의 순서는 Make가 검색하는 순서이다. 이 룰은 모든 파일이 현재 디렉토리에 존재하는 것처럼, 필요 조건 목록에서 파일 이름을 지정할 수 있도록 한다.

또한 세밀한 vpath 지시어도 있다. 이것은 패턴과 일치하는 파일에 대해 검색 경로를 지정할 수 있다. 따라서 include 디렉토리에 모든 헤더를 저장한다면, 다음 행처럼 사용할 수 있다.
```
vpath %.h include
```
그러나, Make는 룰의 필요 조건 부분만 바꾸지, 룰 자체를 바꾸지 않기 때문에 룰에서 명시적인 파일 이름에 의존하지 않는다. 대신 $^같은 자동 변수를 사용해야 한다.

필요요건에 대한 디렉토리 검색에 대한 자세한 내용은 Make 설명서를 참조하세요.

#### 7. makefile의 디버깅

makefile을 디버깅하기 위한 몇 가지 방법이 있다.

**Printing**

첫번째는 단순히 옛날 방식의 출력 방법이다. 다음 Make 함수중 하나를 사용하여 그 표현식의 값을 출력할 수 있다.
$(info ...)$(warning ...)$(error ...)

이 라인을 통과하면 Make는 그 표현식의 값을 뿌려준다.
출력에 의한 추적 방법은 이미 알고 있을 것이다.

**Remake**

Makefile을 디버깅하기 위해 쓰여진 특별한 프로그램도 있다. Remake는 지정된 target에서 멈춰 일어난 것들을 확인하고 Make의 내부 상태를 바꿀 수 있다. 좀 더 자세한 내용은 [Remake와 함께 makefile 디버깅에 대한 아티클](https://www.usenix.org/legacy/event/lisa11/tech/full_papers/Bernstein.pdf)를 읽어 보기 바랍니다.

makefile의 디버깅에 대한 또다른 방법을 위해서라면 [makefile 디버깅에 관한 좋은 기사](https://www.cs.rit.edu/usr/local/pub/jeh/courses/QUARTERS/Tools/Handouts/02-Make+Ant/debugging-make.pdf)도 읽어보자.
