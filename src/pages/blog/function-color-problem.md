---
templateKey: "blog-post"
title: "Function color problem, 프로그래밍 언어들의 개선 활동들"
description: "Function color problem가 어떤 것이며, 프로그래밍 언어들은 어떻게 대응했는지에 대해 정리함."
author: "미물"
authorURL: "https://mimul.com"
date: "2015-07-02T23:45:44.000Z"
lastModificationTime: "2015-07-02T23:45:44.000Z"
image: "/img/topics/programming-icon.png"
commentId: "function-color-problem-2015-07-02"
tags:
  - BloomFilter
---
프로그래밍 언어를 선택하거나 사용할 때 그 언어의 설계 사상이나 포인트 등을 알면(고려하면) 더 좋은 코드를 작성할 수 있다고 생각한다. 이번 글에는 Function color problem에 대해 정리하고자 한다.

함수 컬러 논제의 시발점이 된 글은 Google의 Dart team에 있는 Bob Nystrom이 쓴 [What Color is Your Function?](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/)이란 글이 나오면서이다.

함수에는 컬러가 있다. 함수를 호출하는 방법에서 색깔은 달라지고, 함수를 호출할 때는 해당 색상에 해당하는 호출을 사용해야 한다. 빨간색 함수(비동기)가 파란색 함수(동기)를 호출하면(그 반대도 포함) 나쁜일(전염성)이 발생한다.

Javascript를 예로 들어 동기 함수는 결과를 반환 값으로 제공하고 비동기 함수는 전달한 콜백을 호출하여 반환힌다. 동기 함수에서 비동기 함수를 호출할 수 없다. 비동기 함수가 나중에 완료될 때까지 결과를 확인할 수 없기 때문이다. 비동기 함수는 콜백 때문에 표현식에서 구성되지 않고, 오류 처리가 다르며, try/catch와 함께 사용할 수 없고, 다른 많은 제어문 내부에서 사용할 수 없다. 즉, 제어 흐름, 콘텍스트를 잃을 수 있고 전염성(함수를 비동기/동기 구분으로 소스에 많은 영향을 줌)이 발생한다. 

프로그래밍 언어에서 비동기 함수와 동기 함수의 상호 호출의 문제를 야기한다. 동기 함수가 비동기 함수의 패러다임에 의해 점점 변경되기 때문에, 이것을 전염성을 가지고 있다고 표현된다. 즉, 비동기 코드를 사용하기 위해 많은 함수들이 변경되어야 한다. 

근본적인 문제는 작업이 완료되면 중단한 곳에서 어떻게 다시 시작할 것인가이다. 작업이 완료되면 수행 중이던 작업을 다시 시작해야 한다. 언어가 위치를 기억하는 일반적인 방법은 콜스택이다. 현재 호출중인 모든 함수와 각 함수에서 명령 포인터가 있는 위치를 추적해야 한다는 것이다.


### Function color problem이 있는 언어들

C#, JS, Dart, Rust, Python, Kotlin, Rust 등은 컬러 문제가 존재하지만, 개선 노력과 해결 방안들이 존재한다. 많은 언어들은 이 컬러 문제를 해결하려고 노력하고 있다.

**1. C#**

async/await를 사용하여 비동기 코드를 동기적으로 작성하게 함으로써 제어 흐름을 잃는 문제를 해결하는 등 컬러 문제를 완화하는 솔루션을 처음 개척했다.

**2. Dart, JavaScript**

C#의 async/await에 힌트를 얻어 Dart를 포함한 JavaScript에도 채택되기 시작했다.

**3. Kotlin**

Coroutines suspend 함수를 지원하지만, 동기 함수에서 suspend 함수를 호출 할 수 없고 필요시 suspend 키워드를 붙여줘야하기 때문에 컬러 문제에 자유롭지 못하다. 주된 이유는 컴파일 레벨에서 suspend가 붙은 함수에 Continuation을 주입하기 때문이다. 또한, stacktrace를 recovery할 수 있는 방법이 있지만, 제대로 복구가 안되어 켄텍스트를 읽어버린다. 앞의 다른 언어보다 컬러 문제에서 나은 이유는 async/wait를 명시적으로 하지 않아도 되고, Future, Proimise처럼 Wrapper 타입으로 리턴하지 않아도 되어 동기 함수처럼 작성할 수 있다.

![kotlin coroutines](/img/blog/kotlin_coroutine.gif)

**4. Rust**

async/await, unsafe code, Result로 결과 값과 오류를 같이 리턴, 병렬 비동기에는 join이나 try_join 등으로 보완하고 있다. 그렇지만, 동기함수를 비동기 함수로 바꾸면 수정해 줘야할 것들이 많이 생겨 전염성에 자유로울 수 없다.

**5. Python**

Python도 async/await 를 붙여야 해 컬러문제에 자유로울 수 없다.

### Function color problem에 자유로운 언어들

Function color problem을 회피하려는 노력을 많이 한 언어들도 있다.

**1. Lua**

Lua는 Coroutine이 아직 성숙되지 않을때인 초기에 이 기술을 지원해서 공격을 받아 Lua를 만든 Roberto Ierusalimschy 교수가 [Revisiting Coroutines](http://www.inf.puc-rio.br/~roberto/docs/MCC15-04.pdf)라는 페이퍼를 통해 대응을 했다. 당시에는 1) 제어권 전달 방식(symmetric/asymmetric), 2) 코루틴의 일급 객체인지(first-class), 3) 콜스택이 쌓인 경우도 지원하는지(stackful) 세가지 기준으로 평가를 했는데 Roberto Ierusalimschy 교수가 Lua 코루틴은 비대칭(Asymmetric) 완전 코루틴이라고 주장을 했던일이 있었다.

Lua 개선을 거듭해 Coroutines이라는 경량 쓰레드 모델을 기반으로 coroutine 예약어를 통해 함수안에 비동기/동기 구분없이 사용이 가능해 코드에 영향을 주지않아 컬러 문제(전염성)가 없다.

**2. Ruby**

비선점적인 경량 Thread인 Fiber를 제공함으로써 함수의 컬러 문제를 해결했다. Fiber 명시적으로 지정하지 않는 한 Fiber의 문맥은 Context Switching은 일어나지 않는다. 또 Fiber는 부모-자식 관계를 가진다. 부모-자식 관계를 깨는 것과 같은 전환은 불가능하다. 사용자가 제어를 할 수 있어 제어 흐름을 잃지도 않고 컨텍스트도 잃지 않으며 함수 코드에 어떤 영향을 주지 않고 비동기/동기 처리가 가능하여 컬러 문제도 해결하였다.

![Threads vs Fibers](/img/blog/threads-vs-fibers.png)

**3. Go**

Goroutines이라는 이러한 경량 쓰레드 모델을 활용하여 처리하기 때문에, go 예약어를 통해 함수안에 비동기/동기 구분없이 사용이 가능해 코드에 영향을 주지않아 컬러 문제(전염성)가 없다. Goroutines의 특징으로는 OS 스레드가 아니라 사용자 공간 스레드, 메모리 사용량이 OS 스레드에 대해 500배 정도 유리하다고 하고, 컨텍스트 스위치에 소요되는 시간은 OS 스레드에 비해 저렴하고, 생성과 파기에 걸리는 시간이 OS 스레드보다 유리하다.

**4. Java**

[Why Continuations are Coming to Java](https://www.infoq.com/presentations/continuations-java/)에서 [Project Loom(Fiber)](https://cr.openjdk.org/~rpressler/loom/Loom-Proposal.html)의 기술리더인 Ron Pressler가 비동기 프래그래밍의 단점을 제어의 흐름을 잃고, 컨텍스트를 잃고, 전염성을 야기한다고 3가지 단점을 이야기했다. 이를 극복하기 위해서 프로그래밍 방식을 바꾸는 것이 아니라 Thread 내부 구현 방식을 바꾸는 방식인 OS Thread가 아닌 Fiber(JVM native 레벨에서 지원)라는 경량 스레드를 제공하고 이를 사용한 블로킹 코드가 내부적으로 논블로킹으로 동작하게 하는 방식을 사용한다. 이 기능은 [java19](https://www.infoq.com/news/2022/09/java19-released/)에서 릴리즈 되었다.


### 결론

프로그래밍 언어는 문제를 개선하고 새로운 패러다임은 수용되고 목적에 맞는 언어가 다시 탄생하면서 진화한다. 여기에 정리된 함수의 전염성 문제가 있다고 해서 나쁜 언어라고 생각하는 것이 아니라, 그 언어의 목적에 맞게, 알맞는 곳, 잘 알고 프로그래밍하면 그 뿐이다.


### 참조 사이트

- [What Color is Your Function?](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/)
- [How do you color your functions?](https://elizarov.medium.com/how-do-you-color-your-functions-a6bb423d936d)
- [Ruby methods are colorless](https://jpcamara.com/2024/07/15/ruby-methods-are.html)
- [How Goroutines Work](https://nindalf.com/posts/how-goroutines-work/)