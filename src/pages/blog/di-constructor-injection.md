---
templateKey: "blog-post"
title: "DI(의존성 주입)가 필요한 이유와 Spring에서 Field Injection보다 Constructor Injection이 권장되는 이유"
description: "Spring에서 의존성 주입이 필요한 이유와 Constructor Injection이 권장되는 이유에 대해 상세히 기술."
author: "미물"
authorURL: "https://mimul.com"
date: "2017-11-15T18:26:51.000Z"
lastModificationTime: "2017-11-15T18:26:51.000Z"
image: "/img/topics/di.png"
commentId: "di-constructor-injection-2017-11-15"
tags:
  - Spring
  - Dependency Injection
---

#### 왜 DI(의존성 주입)가 필요한가?

왜 DI(의존성 주입)가 필요한가?에 대한 좋은 해답으로 [Google Guice Motivation](https://github.com/google/guice/wiki/Motivation)페이지에서 잘 설명해 주어서 인용해 본다.

**동기요인**

관련된 모든 객체들을 밀결합하는 것은 어플리케이션 개발 부분에서 짜증나는 일이 된다. 어플리케이션에는 서비스, ​​데이터, 그리고 프리젠테이션 클래스들을 연결하는 방법에는 여러 가지가 있다. 이러한 접근 방법을 비교하기 위해 피자 주문에 관련된 빌링 코드를 작성할 것이다.

```java
public interface BillingService {
  Receipt chargeOrder(PizzaOrder order, CreditCard creditCard);
}
```

구현과 함게 단위 테스트를 작성할 것이다. 테스트는 실제 신용 카드로 결제가 안되게 가짜 카드 결제를 구현한 FakeCreditCardProcessor클래스가 필요하다.

**생성자 함수 직접 호출**

다음 코드는 카드 결제 클래스(CreditCardProcessor)와 트랜잭션을 기록하는 클래스(TransactionLog)를 new 연산자로 인스턴스화하는 경우이다.

```java
public class RealBillingService implements BillingService {
  public Receipt chargeOrder(PizzaOrder order, CreditCard creditCard) {
    CreditCardProcessor processor = new PaypalCreditCardProcessor();
    TransactionLog transactionLog = new DatabaseTransactionLog();
    try {
      ChargeResult result = processor.charge(creditCard, order.getAmount());
      transactionLog.logChargeResult(result);

      return result.wasSuccessful()
          ? Receipt.forSuccessfulCharge(order.getAmount())
          : Receipt.forDeclinedCharge(result.getDeclineMessage());
     } catch (UnreachableException e) {
      transactionLog.logConnectException(e);
      return Receipt.forSystemFailure(e.getMessage());
    }
  }
}
```

이 코드는 모듈화와 테스트 가능성에 문제가 있다. 진짜 신용 결제를 할 클래스(CreditCardProcessor)로 컴파일 시점에 직접적으로 의존하고 있기 때문에 테스트를 하면 카드에 청구되어 버린다. 또한 결제가 실패했을 때나 서비스가 중지상태가 되면 테스트하기가 힘들어진다.

**Factory 클래스**

Factory 클래스가 클라이언트와 서비스 구현을 분리해준다. 간단한 Factory 클래스에서 인터페이스를 구현한 mock getter와 setter로 사용할 수 있다. Factory 클래스는 아래와 같이 일부 boilerplate 코드와 함께 구현되어 있다.

```java
public class CreditCardProcessorFactory {
  private static CreditCardProcessor instance;
  public static void setInstance(CreditCardProcessor processor) {
    instance = processor;
  }

  public static CreditCardProcessor getInstance() {
    if (instance == null) {
      return new SquareCreditCardProcessor();
    }

    return instance;
  }
}
```

클라이언트 코드에서는 new 호출하는 대신에 Factory 메소드로 변경하면 된다.

```java
public class RealBillingService implements BillingService {
  public Receipt chargeOrder(PizzaOrder order, CreditCard creditCard) {
    CreditCardProcessor processor = CreditCardProcessorFactory.getInstance();
    TransactionLog transactionLog = TransactionLogFactory.getInstance();

    try {
      ChargeResult result = processor.charge(creditCard, order.getAmount());
      transactionLog.logChargeResult(result);

      return result.wasSuccessful()
          ? Receipt.forSuccessfulCharge(order.getAmount())
          : Receipt.forDeclinedCharge(result.getDeclineMessage());
     } catch (UnreachableException e) {
      transactionLog.logConnectException(e);
      return Receipt.forSystemFailure(e.getMessage());
    }
  }
}
```

Factory를 사용하면, 표준 단위 테스트를 작성할 수 있게 된다.

```java
public class RealBillingServiceTest extends TestCase {
  private final PizzaOrder order = new PizzaOrder(100);
  private final CreditCard creditCard = new CreditCard("1234", 11, 2010);

  private final InMemoryTransactionLog transactionLog = new InMemoryTransactionLog();
  private final FakeCreditCardProcessor processor = new FakeCreditCardProcessor();

  @Override public void setUp() {
    TransactionLogFactory.setInstance(transactionLog);
    CreditCardProcessorFactory.setInstance(processor);
  }

  @Override public void tearDown() {
    TransactionLogFactory.setInstance(null);
    CreditCardProcessorFactory.setInstance(null);
  }

  public void testSuccessfulCharge() {
    RealBillingService billingService = new RealBillingService();
    Receipt receipt = billingService.chargeOrder(order, creditCard);

    assertTrue(receipt.hasSuccessfulCharge());
    assertEquals(100, receipt.getAmountOfCharge());
    assertEquals(creditCard, processor.getCardOfOnlyCharge());
    assertEquals(100, processor.getAmountOfOnlyCharge());
    assertTrue(transactionLog.wasSuccessLogged());
  }
}
```

이 코드도 뭔가 어설프다. 글로벌 변수가 mock 구현을 가지고 있기 때문에 setUp 및 tearDown에 세심한 주의를 필요로 한다. tearDown 메소드가 실패하면 글로벌 변수는 테스트 인스턴스를 참조하고 있다. 이렇게 되면 다른 테스트에 문제를 야기할 수 있고, 여러 테스트를 병행할 수 없게 된다.

그러나 가장 큰 문제는 의존성이 코드속에 숨겨져 있다는 것이다. 만약 CreditCardFraudTracker를 의존성을 추가했다고 하자. 테스트가 실패했을 때, 의존하는 어떤 클래스에 문제가 있었는지를 알기 위해서는 테스트를 한번 더 실행해야 한다. 만약 운영하고 있는 서비스에서 Factory를 초기화하는 것을 잊고 테스트를 수행할 때 과금이 나올때까지 문제가 있는지 알 수 없게 된다. 어플리케이션이 비대해지면 의존성의 주의가 요하는 Factory 클래스는 생산성을 떨어떨어지게 하는 원인이 된다.

품질 문제는 QA나 인수 테스트에서 발견할 수 있다. 지금으로도 충분할지도 모르지만, 확실히 더 나은 방법이 있다.

**의존성 주입(DI)**

Factory처럼 DI도 디자인 패턴이다. 핵심 원칙은 행태와 의존성 해결을 분리하는 것이다. 여기 예제에서 보면, RealBillingService는 TransactionLog와 CreditCardProcessor를 lookup하는 책임을 지지 않는다. 대신 그들은 생성자를 인수로 전달한다.

```java
public class RealBillingService implements BillingService {
  private final CreditCardProcessor processor;
  private final TransactionLog transactionLog;

  public RealBillingService(CreditCardProcessor processor,
      TransactionLog transactionLog) {
    this.processor = processor;
    this.transactionLog = transactionLog;
  }

  public Receipt chargeOrder(PizzaOrder order, CreditCard creditCard) {
    try {
      ChargeResult result = processor.charge(creditCard, order.getAmount());
      transactionLog.logChargeResult(result);

      return result.wasSuccessful()
          ? Receipt.forSuccessfulCharge(order.getAmount())
          : Receipt.forDeclinedCharge(result.getDeclineMessage());
     } catch (UnreachableException e) {
      transactionLog.logConnectException(e);
      return Receipt.forSystemFailure(e.getMessage());
    }
  }
}
```

더 이상 Factory는 필요가 없다. 게다가, boilerplate 코드인 setUp과 tearDown를 없애서 테스트 케이스가 훨씬 간결해졌다.

```java
public class RealBillingServiceTest extends TestCase {

  private final PizzaOrder order = new PizzaOrder(100);
  private final CreditCard creditCard = new CreditCard("1234", 11, 2010);

  private final InMemoryTransactionLog transactionLog = new InMemoryTransactionLog();
  private final FakeCreditCardProcessor processor = new FakeCreditCardProcessor();

  public void testSuccessfulCharge() {
    RealBillingService billingService
        = new RealBillingService(processor, transactionLog);
    Receipt receipt = billingService.chargeOrder(order, creditCard);

    assertTrue(receipt.hasSuccessfulCharge());
    assertEquals(100, receipt.getAmountOfCharge());
    assertEquals(creditCard, processor.getCardOfOnlyCharge());
    assertEquals(100, processor.getAmountOfOnlyCharge());
    assertTrue(transactionLog.wasSuccessLogged());
  }
}
```

이렇게 되면 언제 의존성을 추가하거나, 삭제하고자 하면 어떤 테스트를 수정하면 좋을지 컴파일러가 알려준다. 의존성은 API의 시그너처내에서 노출되게 된다.

그러나 불행히도, BillingService의 클라이언트는 의존성을 스스로 찾아야 한다. 이런 문제는 DI 패턴을 통해 다시 해결책을 찾을 수 있다. BillingService에 의존하고 있는 클래스는 생성자에서 BillingService를 받을 수 있다. 그러나 최상위 클래스를 위해서는 프레임 워크가 있는 편이 유리하다. 그렇지 않으면, 서비스 사용이 필요할 때 재귀적으로 의존 관계를 구축하게 될 경우도 있다.

```java
public static void main(String[] args) {
    CreditCardProcessor processor = new PaypalCreditCardProcessor();
    TransactionLog transactionLog = new DatabaseTransactionLog();
    BillingService billingService
        = new RealBillingService(processor, transactionLog)로
    ...
  }
```

결론적으로 DI는 코드의 모듈화와 테스트 가능성을 향상시켜 주기 때문에 필요하다.

다음으로 좀 묵은 주제이기도 하지만, 주변을 둘러봐도 그렇고, 일단 의존성 추가나 삭제가 간결하고 코드량도 많지 않고, 문제 발생한 경우도 없어서인지 Field Injection을 많이 사용하게 됩니다.

하지만, 왜 Spring Team에서 Constructor Injection을 추천하는지 리마인드 차원에서 정리해 봅니다.

#### Spring의 Dependency Injection

**1. Constructor Injection**

Spring 4.3에서 단일 생성자의 경우 Autowired가 필요가 없다.
```java
@Component
public class ConstructorInjection {
     private final LoginService loginService;
     private final SignupService signupService;

    @Autowired
    public ConstructorInjection(LoginService loginService,
                SignupService signupService) {
         this.loginService = loginService;
         this.signupService = signupService;
    }
}
```

**2. Field Injection**

```java
@Component
public  class FieldInjection {
    @Autowired
    private LoginService loginService;
    @Autowired
    private SignupService signupService;
}
```

**3. Setter Injection**

```java
@Component
public  class SetterInjection {
     private LoginService loginService;
     private SignupService signupService;

    @Autowired
    public  void setLoginService(LoginService loginService) {
         this.loginService = loginService;
    }

    @Autowired
    public  void setSignupService(SignupService signupService) {
         this.signupService = signupService;
    }
}
```

#### 왜 Constructor Injection을 권장하나?

**1. 단일 책임의 원칙**

생성자의 인자가 많을 경우 코드량도 많아지고, 의존관계도 많아져 단일 책임의 원칙에 위배된다. 그래서 Constructor Injection을 사용함으로써 의존관계, 복잡성을 쉽게 알수 있어 리팩토링의 단초를 제공하게 된다.

**2. 테스트 용이성**

DI 컨테이너에서 관리되는 클래스는 특정 DI 컨테이너에 의존하지 않고 POJO여야 한다. DI 컨테이너를 사용하지 않고도 인스턴스화 할 수 있고, 단위 테스트도 가능하며, 다른 DI 프레임 워크로 전환할 수도 있게 된다.

**3. Immutability**

Constructor Injection에서는 필드는 final로 선언할 수 있다. 불변 객체가 가능한데 비해 Field Injection은 final는 선언할 수 없기 때문에 객체가 변경 가능한 상태가 된다.

**4. 순환 의존성**

Constructor Injection에서는 멤버 객체가 순환 의존성을 가질 경우 BeanCurrentlyInCreationException이 발생해서 순환 의존성을 알 수 있게 된다.

**5. 의존성 명시**

의존 객체 중 필수는 Constructor Injection을 옵션인 경우는 Setter Injection을 활용할 수 있다.

#### Lombok을 활용한 Constructor Injection

참고로 개발 편이성은 좋아질 수 있으나, 의존관계의 복잡성을 명확하게 보여주진 못하게 된다.

RequiredArgsConstructor는 초기화 되지 않은 final 필드를 매개 변수로 취하는 생성자를 생성하고 NonNull이 필드는 null 체크가 실행되고 파라미터가 null인 경우는 NullPointerException을 발생시킨다.

**1. Spring 4.3 이상**

```java
@RequiredArgsConstructor
@Component
public class ConstructorInjection {
    @NonNull
    private final LoginService loginService;
    @NonNull
    private final SignupService signupService;
}
```

**2. Spring 4.3 이전**

```java
@RequiredArgsConstructor(onConstructor = @__(@Autowired))
@Component
public class ConstructorInjection {
    @NonNull
    private final LoginService loginService;
    @NonNull
    private final SignupService signupService;
}
```

#### 참고 사이트

- [Google Guice Motivation](https://github.com/google/guice/wiki/Motivation)
- [Field Dependency Injection Considered Harmful](https://www.vojtechruzicka.com/field-dependency-injection-considered-harmful/)
- [Why I Changed My Mind About Field Injection?](https://www.petrikainulainen.net/software-development/design/why-i-changed-my-mind-about-field-injection/)
