---
templateKey: "blog-post"
title: "왜 Null이 나쁜가? "
description: "Null의 나쁜점에 대해 기술함."
author: "미물"
authorURL: "https://mimul.com"
date: "2014-05-20T05:21:03.000Z"
lastModificationTime: "2014-05-20T05:21:03.000Z"
image: "/img/blog/null.png"
commentId: "why-null-is-bad-2014-05-20"
tags:
  - Programming
---

우리가 개발을 하면서 항상 마주하는게 NULL 체크인데(잊고 있을수도 있지만), NULL 체크를 해야하는지 말아야하는지 등의 부담을
개발자에게 전가시키는 것은 안좋은 방법이라고 알고 있다. 그래서 왜 Null의 반환이 안좋은지를 잘 이해시킨 포스트가 있어 소개한다.
[Why NULL is Bad?](https://www.yegor256.com/2014/05/13/why-null-is-bad.html).

Java에서 NULL을 사용하는 아주 단순한 예이다.
```java
public Employee getByName(String name) {
  int id = database.find(name);
  if (id == 0) {
    return null;
  }
  return new Employee(id);
}
```

이 메서드 무엇이 잘못되었는가? 객체 대신 NULL을 반환할 수 있다는 것이 잘못된 것이다.
NULL은 객체 지향 패러다임의 끔찍한 관습이며, 온 힘을 다해 피해야할 것 중에 하나이다. 이에 대해서는 많은 의견이 이미 발표되어 있다.
예를 들어, Tony Hoare의 Null References, The Billion Dollar Mistake와 David West의 저서 Object Thinking에서 전반적으로 언급되고 있다.

여기에서 모든 논거를 정리해 NULL의 사용을 피하고 적절한 객체 지향 구조로 바꾸는 방법의 예를 소개하고 싶다.

기본적으로 NULL을 대신할 수 있는 것은 두가지가 있다.

하나는 Null Object 디자인 패턴이다. (가장 좋은 방법은 하나의 불변 객체로 만드는 것이다.)
```java
public Employee getByName(String name) {
  int id = database.find(name);
  if (id == 0) {
    return Employee.NOBODY;
  }
  return Employee(id);
}
```

또 하나는 객체를 돌려줄 수 없는 경우에 예외를 던지고 fail-fast하는 방법이다.
```java
public Employee getByName(String name) {
  int id = database.find(name);
  if (id == 0) {
    throw new EmployeeNotFoundException(name);
  }
  return Employee(id);
}
```

자 그럼, NULL을 반대하는 논거를 살펴 보자.

위 Tony Hoare의 발표와 David West의 저서 이외에, 나는 이 포스트를 쓰기 전에 다음의 책이나 글들을 읽었다.
- Robert Martin의 [Clean Code](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882/)
- Steve McConnell의 [Code Complete](https://www.amazon.com/Code-Complete-Practical-Handbook-Construction/dp/0735619670/)
- John Sonmez의 [Say "No" to "Null"](https://elegantcode.com/2010/05/01/say-no-to-null/)
- StackOverflow의 [Is returning null bad design?](https://stackoverflow.com/questions/1274792/is-returning-null-bad-design)

#### Ad-hoc(임기응변적인) 오류 처리

입력으로 객체를 받은 경우는 항상 그것이 NULL 아닌지, 또한 유효한 객체 참조 여부를 확인하지 않으면 안된다.
그것을 확인하는 것을 잊어버리면 NullPointerException(NPE)으로 인해 런타임때 실행을 중지시켜 버릴 우려가 있다.
따라서 여러분의 로직은 복수의 확인 처리나 if/then/else 분기에 코드가 오염되어 버린다.
```java
// this is a terrible design, don't reuse
Employee employee = dept.getByName("Jeffrey");
if (employee == null) {
  System.out.println("can't find an employee");
  System.exit(-1);
} else {
  employee.transferTo(dept2);
}
```

이것은 C나 다른 명령문을 늘어 놓는 절차형 언어에 있어서 예외적인 상황에 대응하는 방법이다.
OOP는 주로 이런 임시 오류 처리의 블록을 없앨 목적으로 예외 처리를 도입했다. OOP에서는 예외 처리를 어플리케이션 레벨에서
에러 핸들러에 맡기는 것으로, 코드를 매우 깨끗하고 간결하게 해준다.
```java
dept.getByName("Jeffrey").transferTo(dept2);
```

NULL 참조는 절차적 언어에서 계승된 것이라고 인식하고 Null 객체 또는 예외를 대신에 사용한다.


#### Ambiguous Semantic(모호한 의도)

위 메소드의 목적을 분명하게 전달하기 위해서 getByName()은 getByNameOrNullIfNotFound()라고 명명되어져야 한다.
이와 같은 이름을 가진 객체 또는 NULL을 반환하는 모든 함수가 있어야 된다. 그렇지 않다면 누군가가 모호한 코드를 읽게 된다.
그래서 코드의 의도를 명확하게 하기 위해 함수에 긴 이름을 붙이게 한다.

이 모호성을 제거하기 위해 함수는 실제 객체를 반환하거나 혹은 Null 객체를 반환하거나 예외를 반환한다.

성능을 고려하면 NULL을 반환해야하는 경우도 있다라고 주장하는 사람이 있을지도 모른다.
예를 들어, Java의 Map 인터페이스의 get() 메서드는 지정된 요소가 없는 경우 NULL을 반환한다.
```java
Employee employee = employees.get("Jeffrey");
if (employee == null) {
  throw new EmployeeNotFoundException();
}
return employee;
```

이 코드는 Map이 NULL을 사용하고 있는 덕분에 map을 한번밖에 검색하지 않는다.
만약 Map의 get()이 요소가 발견되지 않을 때에 예외를 던지도록 하면 다음과 같은 코드가 된다.
```java
if (!employees.containsKey("Jeffrey")) { // first search
  throw new EmployeeNotFoundException();
}
return employees.get("Jeffrey"); // second search
```

분명히, 이 방법은 처음보다 2배 느리다. 그런데, 어떻게 하라고?

Map 인터페이스는 (저자을 공격하는 것은 아니지만) 설계에 문제가 있다.
그 get() 메소드는 Iterator를 반환해야 한다. 그러한 경우는 다음과 같은 코드가 된다.
```java
Iterator found = Map.search("Jeffrey");
if (!found.hasNext()) {
  throw new EmployeeNotFoundException();
}
return found.next();
```

참고로 C++ 표준 라이브러리의 map::find() 함수는 이렇게 설계되어 있다.


#### 컴퓨터 사고 vs. 객체 사고

Java의 객체는 데이터 구조를 가리키는 포인터로 NULL은 아무것도 가리키지 않는 포인터(Intel x86 프로세서에서는 0x00000000)임을 아는 사람에게는
if (employee == null)이라는 문장은 이해할 수 있다.

그러나 만약 우리가 객체가 되었다고 생각하면 이 문장은 상당히 의미가 없는 것이 된다. 객체 관점에서 위 코드는 다음과 같다.
>. 여보세요, 소프트웨어 부서입니까?
. 예.
. Jeffrey랑 이야기하고 싶습니다.
. 잠시만 기다려주십시오...
. 여보세요?
. 당신은 NULL입니까?

대화의 마지막 질문이 이상하지 않은가?

대신에 만약 Jeffrey와 연결을 요청한 후 전화가 끊어지면 우리에게 문제(예외)가 발생했다는 것을 안다.
이 시점에서 다시 한번 전화해보거나 Jeffrey에게로 연결되지 않아서 큰 일을 못하게 되면 상사에게 보고한다.

또는, Jeffrey는 아니지만 소프트웨어 부서의 사람에게 대략적인 질문에 대답할 수 있는 사람에게 전화를 할 수도 있고,
Jeffrey 밖에 모르는 내용이라면 거부할지도 모른다(Null Object).


#### 지연 실패(Slow Failing)

빠른 실패 대신에 위의 코드는 천천히 죽이려 한다. 중간에 다른 객체를 죽이면서. 문제가 발생했기 때문에
예외 처리를 빨리 시작해야 한다고 주위에 알리는 대신, 클라이언트부터 오류를 숨기고 있다.

이 논의는 앞에 기술한 "임시 오류 처리(Ad-hoc Error Handling)"에 가깝다.

코드는 가능한 한 허술한 것이 좋다. 필요할 때 멈춰야 한다.

메소드는 다루는 데이터에 대해서 가능한 한 엄격하게 만들어져야 한다.
주어진 데이터가 불충분하거나 메소드의 사용 방법에 위배되면 예외를 던지도록 해야한다.

그렇지 않으면, 공통적인 행위를 하거나 모든 호출에서 항상 예외를 던지는 Null Object를 반환한다.
```java
public Employee getByName(String name) {
  int id = database.find(name);
  Employee employee;
  if (id == 0) {
    employee = new Employee() {
      @Override
      public String name() {
        return "anonymous";
      }
      @Override
      public void transferTo(Department dept) {
        throw new AnonymousEmployeeException(
          "I can't be transferred, I'm anonymous"
        );
      }
    };
  } else {
    employee = Employee(id);
  }
  return employee;
}
```

#### 가변적이면서 불완전한 객체

일반적으로 객체는 불변으로 설계하는 것이 바람직하다.
이것은 객체룰 인스턴스화할 때 필요한 모든 정보를 받고 그 수명 주기 전반에 걸쳐 상태를 바꾸지 않는다는 것을 의미한다.

NULL은 지연 로딩을 할 때 종종 사용되는 객체를 불완전, 가변객체를 만든다. 다음이 그 예다.
```java
public class Department {
  private Employee found = null;
  public synchronized Employee manager() {
    if (this.found == null) {
      this.found = new Employee("Jeffrey");
    }
    return this.found;
  }
}
```

이 기술은 널리 사용되고는 있지만, OOP의 안티 패턴이다. 주된 이유는 실행 환경의 성능 문제 책임을 객체에 전가했기 때문이다.
본래 그것은 Employee 객체가 걱정해야 할 부분은 아니다.

객체가 자신의 상태를 관리하고 자신의 역할에 대한 행동을 공개하는 대신 반환 캐시를 신경써야 한다. 이것이 지연로드의 의미이다.

캐시는 employee(직원)이 사무실에서 하는 일이 아니지 않나?

해결책? 지연로드는 위의 예 같은 원시적인 방법으로는 사용하지 마라. 대신 캐시 문제를 어플리케이션의 다른 레이어에 옮겨라.

예를 들어, Java라면, AOP를 사용할 수 있다. 예를 들어, jcabi-aspects는 ```@Cacheable``` 어노테이션이 메소드의 반환 값을 캐쉬하고 있다.
```java
import com.jcabi.aspects.Cacheable;           q
public class Department {
  @Cacheable(forever = true)
  public Employee manager() {
    return new Employee("Jacky Brown");
  }
}
```

나의 이 분석에 납득하고 더이상 NULL을 쓰기를 끝내길 바란다.
