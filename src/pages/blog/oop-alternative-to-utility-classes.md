---
templateKey: "blog-post"
title: "객체지향 프로그래밍으로 유틸리티 클래스를 대체하자."
description: "유틸리티 클래스를 안써본 사람은 거의 없을겁니다. 유틸리티 클래스가 좋다, 나쁘다는 논쟁꺼리지만, 객체지향의 관점에서 볼때 그래도 생각해볼 꺼리가 된다고 생각해, OOP Alternative to Utility Classes라는 아티클을 번역."
author: "미물"
authorURL: "https://mimul.com"
date: "2014-05-10T20:20:53.000Z"
lastModificationTime: "2014-05-10T20:20:53.000Z"
image: "/img/blog/avoid-utility-classes.jpg"
commentId: "oop-alternative-to-utility-classes-2014-05-10"
tags:
  - Java
---
유틸리티 클래스를 안써본 사람은 거의 없을겁니다. 유틸리티 클래스가 좋다, 나쁘다는 논쟁꺼리지만, 객체지향의 관점에서 볼때 그래도 생각해볼 꺼리가 된다고 생각해, [OOP Alternative to Utility Classes](https://www.yegor256.com/2014/05/05/oop-alternative-to-utility-classes.html)라는 아티클을 저자 허락하에 번역해 봅니다.

유틸리티 클래스(또는 헬퍼 클래스)는 정적 메소드만을 가지고 있고, 상태를 내포하지 않는 "구조"이다. [Apache Commons](http://commons.apache.org/)의 StringUtils, IOUtils, FileUtils과 [Guava](https://github.com/google/guava)의 Iterables, Iterators, 그리고 JDK7의 [Files](https://docs.oracle.com/javase/7/docs/api/java/nio/file/Files.html)등이 유틸리티 클래스가 좋은 예다.

유틸리티 클래스는 많은 곳에서 사용되는 공통 기능을 제공하기 때문에, 이런 설계 방법은 Java(또는 C#, Ruby 등) 세계에서는 매우 인기 있다.

여기엔, DRY 원칙을 따르고 중복을 피하는 것을 원한다. 그래서 유틸리티 클래스에 공통 코드를 넣고, 필요에 따라 재사용한다.
```Java
// This is a terrible design, don't reuse
public class NumberUtils {
  public static int max(int a, int b) {
    return a > b ? a : b;
  }
}
```

정말, 이것이 편리한 기술인가?

#### 유틸리티 클래스는 악이다

그러나, 객체 지향의 세계에서 유틸리티 클래스는 아주 나쁜(심하게 나쁘다고 생각하는 사람도 있을지도 모른다) 방법이다.

이 주제에 대해서는 많은 논란이 있다. 일부 들면, Nick Malik의 [헬퍼 클래스는 악인가?](https://blogs.msdn.microsoft.com/nickmalik/2005/09/06/are-helper-classes-evil/), Simon Hart의 [왜 헬퍼클래스, 싱글톤, 유틸리티 클래스는 대체로 나쁘낙?](https://smart421.wordpress.com/2011/08/31/why-helper-singletons-and-utility-classes-are-mostly-bad-2/), Marshal Ward의 [유틸리티 클래스를 피하기](https://github.com/marshallward/marshallward.org/blob/master/content/avoid_util_classes.rst), Dhaval Dalal의 [유틸 클래스를 죽여라!](https://dhavaldalal.wordpress.com/2010/12/22/kill-that-util-class/), Rob Bagby의 [헬퍼 클래스는 문제의 징후다.](http://www.robbagby.com/posts/helper-classes-are-a-code-smell/)

게다가, StackExchange에는 유틸리티 클래스에 대한 질문이 몇가지 있다. 예를 들어, [유틸리티 클래스가 악이라면 공통 코드를 어디에 두어야 하나?](https://stackoverflow.com/questions/3339929/if-a-utilities-class-is-evil-where-do-i-put-my-generic-code), [유틸리티 클래스는 악이다](https://stackoverflow.com/questions/3340032/utility-classes-are-evil)등이다.

이러한 논쟁을 요약해보면, 유틸리티 클래스는 적절한 객체가 아니라는 것이다. 그래서 객체 지향의 세계에선 적합하지 않다. 유틸리티 클래스는 당시 사람들이 기능 분할 패러다임에 익숙해져 있었기 때문에 절차적 언어에서 계승되었다.

여러분이 이 주장에 동의하고 유틸리티 클래스를 사용하는 것을 중지하고 싶어한다것을 가정하고 유틸리티 클래스를 어떻게 적절한 객체로 대체하는지를 예를 들면서 보여주겠다.

#### 절차적 프로그램의 예

예를 들어, 텍스트 파일을 읽고, 행단위로 분할하고, 각 라인을 손질(공백제거 등)하고, 그 결과를 다른 파일에 저장하고 싶다고 한다. 이것은 Apache Commons의 [FileUtils](http://commons.apache.org/proper/commons-io/javadocs/api-2.5/org/apache/commons/io/FileUtils.html)과 함께 구현되어 있다.
```Java
void transform(File in, File out) {
  Collection src = FileUtils.readLines(in, "UTF-8");
  Collection dest = new ArrayList(src.size());
  for (String line : src) {
    dest.add(line.trim());
  }
  FileUtils.writeLines(out, dest, "UTF-8");
}
```

위의 코드는 예뻐 보인다. 그러나, 이것은 절차적 프로그래밍이며, 객체 지향이 아니다. 코드의 각 라인에서 데이터(byte와 bit)를 조작하고 컴퓨터의 어디에서 데이터를 가지고, 어디에 쓸 것인지를 명시적으로 지시하고 있다. 즉, 실행 절차를 정의하고 있다.

#### 객체 지향적 대안

객체 지향 패러다임에서는 객체를 인스턴스화하여 합성해야(컴포즈) 한다. 이것은 객체가 언제, 어떻게 객체 자신이 원하는 방식으로 데이터를 관리해야하기 때문이다. 추가적인 정적 메소드를 호출하는 대신, 요구하는 행동을 제공할 수 있는 객체를 생성해야 한다.
```Java
public class Max implements Number {
  private final int a;
  private final int b;
  public Max(int x, int y) {
    this.a = x;
    this.b = y;
  }
  @Override
  public int intValue() {
    return this.a > this.b ? this.a : this.b;
  }
}
```

다음은 절차적 메소드 호출:
```Java
int max = NumberUtils.max(10, 5);
```

다음은 객체지향적인 방법이 된다.
```Java
int max = new Max(10, 5).intValue();
```

둘 다 같은가? 아님 그렇지도 않은가? 좀 더 읽어 주었으면 한다.

#### 데이터 구조 대신 객체

저라면 위와 같은 파일 변환 기능을 객체 지향 방식으로 다음과 같이 설계한다.
```Java
void transform(File in, File out) {
  Collection src = new Trimmed(
    new FileLines(new UnicodeFile(in))
  );
  Collection dest = new FileLines(
    new UnicodeFile(out)
  );
  dest.addAll(src);
}
```

FileLines는 Collection을 구현하고, 파일의 읽기및 쓰기 함수를 내포하고 있다. FileLines 인스턴스는 문자열의 컬렉션으로 정확하게 작동하고 모든 I/O 처리를 은폐하고 있다. 이 인스턴스를 반복하면 파일이 읽혀진다. 이 인스턴스에 addAll()하면 파일에 기록된다.

Trimmed도 Collection을 구현하고, 문자열 컬렉션을 내포하고 있다([Decorator 패턴](https://en.wikipedia.org/wiki/Decorator_pattern)). 한행이 검색될 때마다 트림된다.

Trimmed이나, FileLines, UnicodeFile은 파일 변환에 기능에 참여하는 모든 클래스는 작지만, 각각 자신의 하나의 기능을 담당하는, 즉 [단일 책임 원칙](https://en.wikipedia.org/wiki/Single_responsibility_principle)에 완벽하게 따르고 있다.

우리 측, 즉 라이브러리의 사용자에서 보면 이것은 그렇게 중요하지 않을지도 모르지만, 라이브러리 개발자에서 보면 중요하다. 80개 이상의 메소드를 가진 3000라인의 유틸리티 클래스인 FileUtils의 readLines()보다 FileLines의 클래스가 개발과 유지 보수, 단위 테스트가 더 쉽다. 심각하게, [그 소스 코드](https://github.com/apache/commons-io/blob/commons-io-2.5/src/main/java/org/apache/commons/io/FileUtils.java)를 봐라.

객체 지향 접근 방식은 지연 실행을 가능하게 한다. in 파일은 데이터가 필요할 때까지 읽지 않는다. I/O 오류로 out을 여는데 실패했다면 파일은 터치조차 되지 않는다. 모든 것은 addAll()을를 호출한 다음에 시작된다.

두번째 조각의 마지막 줄을 제외한 모든 라인은 작은 객체를 인스턴스화하고 큰 객체를 합성하고 있다. 이 객체 합성은 데이터 변환을 일으키지 않기 때문에 CPU 비용은 오히려 낮다.

또한 첫번째 스크립트가 O(n)으로 움직이는 반면, 두번째 스크립트는 분명히 O(1)의 계산량으로 움직인다. 이런 이유는 첫번째 스크립트에서는 데이터에 대한 절차적 접근을 했기 때문이다.

객체 지향의 세계에서는 데이터라는 것은 없다. 객체와 그 행위만이 있다!
