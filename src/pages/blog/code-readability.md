---
templateKey: "blog-post"
title: "가독성 있는 좋은 코드 작성하기"
description: "코드의 가독성을 올릴 수 있는 방법들에 대해 고민한 내용들 정리"
author: "미물"
authorURL: "https://mimul.com"
date: "2023-07-14T23:49:21.000Z"
lastModificationTime: "2024-01-14T06:40:58.000Z"
image: "/img/coding-style.jpg"
commentId: "code-readability-2023-07-14"
tags:
  - code
  - readability
---

개발 멤버, 특히 신규 참가자가 코드를 이해하기 쉽게 짜는 것이 중요하고, 복잡성이 줄어들어 버그를 줄이는 효과도 있어 생산성으로 직결된다. 이해하기 쉬운 코드는 장기적으로 보고 유지하기 쉬워 기술적 부채를 줄여 준다. 그래서 개발자는 가독성 있는 코드를 짜는 것이 매우 중요한 일이라고 생각해야 한다.

### 프로그래밍 관점

##### 1. 불필요한 코드는 만들지 않는다.

코드를 읽는 양을 줄이는 게 제일 좋다. The XP 2002 Conference에서 Standish Group의 회장인 Jim Johnson의 기조 강연 ["ROI, It's Your Job"](https://www.mountaingoatsoftware.com/blog/are-64-of-features-really-rarely-or-never-used)에서 소개처럼 제품을 위한 만들어진 기능의 64%가 거의 사용되지 않는다고 한다. Feature를 필요한 것만 설계하는 것도 코드양을 줄이는 일이고, 코드도 마찬가지로 미래에 필요하다고 미리 만들 필요는 없다. 기능, 코드는 필요하게 되었을 때에 구현되어야 하고, 장래 필요하게 되는 이유로 구현되어서는 안된다. 

> 좋은 프로그래머는 좋은 코드를 작성합니다. 훌륭한 프로그래머는 코드를 작성하지 않습니다.

##### 2. 어설픈 최적화는 하지 않는게 낫다.

Knuth가 작성한 ["Computer programming as an art" 논문](https://dl.acm.org/doi/10.1145/361604.361612)에 보면 "Premature optimization is the root of all evil"이란 말이 나오는데, 효과가 적은 최적화는 해서는 안된다고 주장하고 있다. 올바르게 동작하고 있는 효과가 적은 코드의 최적화를 할 경우, 시스템의 동작은 전혀 변하지 않지만, 개발 비용이 들어가는 문제에 대해서는 고민을 해봐야 한다. 그리고 같은 동작에 또 다른 코드를 만들어 다른 사람들이 그 코드를 참조한다면 또 읽는 비용을 발생시킨다.

##### 3. SOLID(단일 책임의 원칙)

클래스는 단일 책임을 가져야 한다. 아래 그림 왼쪽처럼 클래스에 많은 책임이 있으면 버그 발생률은 올라가고 가독성은 떨어뜨리는 결과를 초래한다. 하나의 변경이 다른 기능에 영향이 없다는 것을 보증할 수 없게 되므로 한 클래스의 책임·관심 범위는 하나로 좁혀야 한다. 그래야 모든 영향범위를 파악하기보다 하나의 영향범위만 파악하면 되기 때문에 버그도 줄고 가독성도 올라간다. 코드 복잡도도 줄어든다.

![SOLID](/img/blog/solid.png)

### 가독성 있는 코드 작성

구현해야 할 기능을 먼저 이해한 다음 코딩을 하게 되는데 코딩시 다른 코드들을 참조하게 되면 그 코드를 읽기 편해야 빨리 파악해 코딩 속도를 느리게 하지 않게 되고, 코드 리뷰에서 자신의 코드를 남들에게 설명하거나 남들이 내 코드를 이해하는데 드는 비용도 고려해야 한다. 자신의 코드를 쓰는 시간과 코드 리뷰에 드는 시간을 줄일 필요가 있다는 점이다. 물론 새로운 사람이 왔을때 그 사람이 맡은 부분의 코드도 읽기가 쉬워야 분석하는데 시간을 줄일 수 있다.

##### 1. 네이밍

우선 Type(클래스, 인터페이스 등), Value(변수, 필드, 매개 변수 등) 및 절차(함수, 메소드, 서브 루틴 등)등은 "What"을 표현하는게 중요하다. 무엇을 나타내는지를 네이밍을 통해 알려줘야 한다. 예를 들어서 flag를 나타내는 경우는 is, was, should, can, may, will 등으로 시작하고 check의 의미인 경우 is, query, verify, mesaure, filter, notify, update, valid, complated로 시작하는게 좋고 과거를 나타낼 경우 previous, stored, expired, invalidated, deprecated 등으로 시작하는게 좋다. 그리고 단어의 선택은 모호성이 적은, 혼란을 야기하지 않는 단어를 선택한다. processData, cleanData, normalizeData, sortData, mergeData 등처럼 모호한 네이밍을 쓰지 말고 구체적인 이름으로 바꿔야 한다.

##### 2. 코멘트

복잡한 코드나 큰 코드, 직관적으로 이해하기 어려운 코드에는 코멘트를 쓰는 것으로 독자의 이해를 도울 수 있다. 상단 요약부분은 "What, Why not"을 관점으로 무엇을 하고 있고 부작용은 무엇인지 내용에 들어가면 좋다. 인라인 코멘트는 될 수있으면 안쓰는게 좋은데 써야할 경우는 코드 블록이 크거나 직관적이지 않는 코드, 주의를 요하는 경우에 한해 인라인 코멘트를 다는게 좋다.

##### 3. 로직의 복잡성 줄이기

**3.1 Type(클래스, 인터페이스, 모듈 등)**

SOLID(단일 책임의 원칙) 관점에서 설계를 하고 긴 매개변수는 객체화해서 공통화하고 필요에 따라 특성이 있는 파라미터는 상속 형태로 다른 객체로 분리한다. 의존성을 줄이기 위한 노력을 해야한다. 의존성 줄이는데에는 주로 결합도(coupling) 관점에서 볼 필요가 있다. 특히 피해야 할 결합도는 Content coupling, Common coupling, Control Coupling 정도이다. External Coupling은 Content와 Common coupling이 되지 않는 이상 외부 모듈을 많이 사용하는 추세여서 제외한다.

![Coupling](/img/blog/coupling.png)

- Content coupling은 대상의 내부 구현(상태, 제어 흐름)에 직접 의존하는 것이다. 아래 코드는 전처리, 후처리 등 순서 상태가 있어서 순서를 잘못 호출하거나 빼먹으면 문제를 만들 수 있다. Content coupling은 내부 상태를 은폐하거나, 값의 전달에 인수나 반환값을 사용하는 것으로 해결할 수 있다. 

```
public class TabakoCalculator {
    public calculatorTotal() {
        calculator.parameter = 5000;
 
        calculator.prepareProcess();
        calculator.calculate();
        calculator.postProcess();
 
        Bigdecimal totalAmount = calculator.result;
      
    }
}
```

개선된 코드는 아래와 같다.

```
public class TabakoCalculator {
    public calculatorTotal() {
		Bigdecimal totalAmount = calculator.calculatorTotal(5000);
    }
}
```

- Common coupling은 전역 상태를 사용하는 종속성이다. 대표적인 게 가변적 글로벌 변수를 사용할 경우에 해당된다. 이를 해결하려면 전역 변수를 사용하지 않고, 생성자 인수로서 대상의 객체를 전달하면 해결할 수 있다. 요즘은 대부분 멀티 쓰레드 환경에서 운뎡되어 바로 문제가 되기 때믄에 대부분 사용을 안한다.

```
public class MessageUserCase {
	public MessageRepository messasgeRepository;

	public MessageUserCase() {
	}

	public List<Message> getMessage() {
		List<Message> messages = messasgeRepository.getMessages();
		return messages;
	}
}

```

개선된 코드는 아래와 같다.

```
public class MessageUserCase {
	private final MessageRepository messasgeRepository;

	@Autowired
	public MessageUserCase(MessageRepository messasgeRepository) {
		this.messasgeRepository = messasgeRepository;
	}

	public List<Message> getMessage() {
		List<Message> messages = messasgeRepository.getMessages();
		return messages;
	}
}
```

- Control coupling은 인자에 따라 동작을 분기시키는 종속성을 말한다. 이런 경우 절차 자체를 분리하고 조건 분기를 삭제하거나 로직을 조건으로 나누지 않고 대상으로 나누는 방법, 전략 패턴을 활용하면 문제를 해결할 수 있다.

```
public class ReportGenerator {
    public void generateReport(boolean isDetailed) {
        if (isDetailed) {
            generateDetailedReport();  // Generate a detailed report
        } else {
            generateSummaryReport();  // Generate a summary report
        }
    }

    private void generateDetailedReport() {
        System.out.println("Generating detailed report...");
        // Detailed report logic
    }

    private void generateSummaryReport() {
        System.out.println("Generating summary report...");
        // Summary report logic
    }
}
```
개선된 코드는 아래와 같다.
```
interface Reportable {
    public void generate();
}

// Detailed report class
class DetailedReport implements Reportable {
    @Override
    public void generate() {
        System.out.println("Generating detailed report...");
        // Detailed report logic
    }
}

// Summary report class
class SummaryReport implements Reportable {
    @Override
    public void generate() {
        System.out.println("Generating summary report...");
        // Summary report logic
    }
}

public class ReportGenerator {
    private Reportable report;

    public ReportGenerator(Reportable report) {
        this.report = report;
    }

    public void generateReport() {
        report.generate();  // The specific report type handles the logic
    }
}
```


**3.2 Value(변수, 필드, 매개 변수 등)**

주로 매직 넘버 사용을 하지 말고 클래스와 마찬가지로 긴 매개변수는 객체화해서 공통화하고 필요에 따라 특성이 있는 파라미터는 상속 형태로 다른 객체로 분리한다. 

- 매직 넘버 사용을 하지 말자.

```
public double calculateTotalFee(long price) {
    return price * 1.10;
}
```

개선된 코드는 아래와 같다.

```
public static final double TAX_RATE = 0.10;

public double calculateTotalFee(long price) {
    return price * (1 + TAX_RATE);
}
```

- 변수명에 구체성을 부여한다,

```
a = 10;
b = 20;
c = a + b;
```

개선된 코드는 아래와 같다.

```
int applePrice = 10;
int bananPrice = 20;
int totalPrice = applePrice + bananPrice;
```

**3.3 절차(함수, 메소드, 서브 루틴 등)**

_3.3.1 함수는 될수 있으면 순수 함수로 작성한다._

순수한 함수란 인자가 같으면 매번 같은 값을 반환해 함수 밖의 세계에 영향을 미치지 않는 함수를 말한다.

```
private int fee = 10;

public int calculateTotalPrice(int tabacoPrice) {
  return fee * tabacoPrice;
}
```
아래는 순수함수라 할 수 있다. 이렇게 함으로써 호출하는 쪽에서 영향을 받지 않는다. DB값, 시간, 난수 등은 내부에서 처리하면 순수함수가 되지 않는다. 이런 경우에는 인자로 벋아서 순수함수로 처리를 해준다.

```
public int calculateTotalPrice(int tabacoPrice, int fee) {
  return fee * tabacoPrice;
}
```

_3.3.2 if의 조건식에 이름을 붙이자_

```
if(aaa == bbb && aaa == 1 && bbb == 2) {

}

```
위 조건식은 사람이 알기 어렵다. 그래서 아래처럼 조건에 대한 네이밍을 해주면 가독성이 올라간다. 반복되는 수식이면 함수화한다.

```

boolean available = (aaa == bbb);
if (available && company.isOwner(aaa, bbb)) {
	...	
}

```

_3.3.3 처리 순서를 고려한다._

코드의 가독성을 높이려면 논리적이고 자연스러운 흐름으로 처리 순서를 배치하는 것이 중요하다.

```
public String sendMailForSignUpUser(User user) {
    // 1. 입력 데이터 검증
    if !validateignUpUser(user) {
        return "Invalid user";
    }

    // 2. 메일 발송 정보 DB 저장
    insertSignupUserMail(user);

    // 3. 사용자에게 가입 환영 메일 보내기
    sendWelcomeMail(user);

    return "Mail sent successfully";
}

```

_3.3.4 코드의 중첩은 얕게 유지한다._

얼리 리턴 방식이 유용하다.

```
public String getGrade(int score) {
    if (90 < score) {
        return "A";
    } else {
        if (60 < score) {
            return "B";
        } else {
            return "C";
        }
    }
}
```

개선된 코드는 아래와 같다.

```
public String getGrade(int score) {
    if (90 < score) {
        return "A";
    }
    if (60 < score) {
        return "B";
    }
    return "C";
}
```

_3.3.5 익명 함수나 실인수, 리시버, 콜 백 체인 등을 이름이 있는 로컬 변수나 프라이빗 함수로 옮겨놓은 프로그래밍 스타일을 지향한다._

아래 코드는 이미지를 원형으로 자르고 PNG로 변환하고 표시하는 코드인데, 이 코드는 두가지 문제가 있다. 한줄로 코드는 깔끔할지 모르나 전체 내용을 자세히 들여다봐야하고 함수별로 특정 값을 검사하거나 변경할 때 전체를 파악해야 한다.

```
showImage(convertImage(cropImage(loadImage(imageUri), Shape.CIRCLE), ImageFormat.PNG));
```

개선된 코드는 아래와 같다.

```
File originalBitmap = loadImage(imageUri);
File croppedBitmap = cropImage(originalBitmap, Shape.CIRCLE);
File croppedPng = convertImage(croppedBitmap, ImageFormat.PNG);
showImage(croppedPng);
```

**3.4 내부 구조 개선**

알고리즘은 코드의 성능과 코드의 지적 호기심 충족 등 두가지를 만족할 수 있다. 성능 병목 현상이 되는 알고리즘을 보다 효율적인 알고리즘으로 대체하고, 계산 결과 캐시와 같은 최적화를 통해 불필요한 재계산을 줄여 성능을 향상시키고 리소스를 절약할 수 있다.

_3.4.1 효율적인 알고리즘 개선_

정렬되지 않은 목록에서 특정 값을 선형 검색한다고 가정했을때 아래 코드는 일반적인 코드이다. 계산량은 O(n)이다.
```
def find_number(numbers, target):
    for number in numbers:
        if number == target:
            return True
    return False

numbers = [5, 3, 8, 4, 2, 7, 1, 6]
print(find_number(numbers, 4))
```
목록을 미리 정렬하고 이진 검색 알고리즘을 사용하여 검색 효율성을 높였다. 계산량은 O(n)에서 O(log n)으로 개선되었다.
```
def find_number(numbers, target):
    # 정렬
    numbers.sort()
    
    # 이진 탐색
    left = 0
    right = len(numbers) - 1
    while left <= right:
        mid = (left + right) // 2
        if numbers[mid] == target:
            return True
        elif numbers[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return False

numbers = [5, 3, 8, 4, 2, 7, 1, 6]
print(find_number(numbers, 4))
```

_3.4.2 불필요한 계산 감소_

피보나치 수열의 값을 재귀적으로 계산하지만 동일한 계산을 여러 번 반복한다. 계산량은 O(2^n)아다.
```
def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(35))
```
메모화(캐시)를 사용하여 이미 계산된 값을 재사용하면 계산량을 O(n)으로 개선할 수 있다.
```
def fibonacci(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        memo[n] = n
    else:
        memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo)
    return memo[n]

print(fibonacci(35))
```

_3.4.3 적절한 데이터 구조 사용_

목록에서 중복여부를 확인하는 함수를 만든다면 아래는 계산량이 O(n^2)이 된다.
```
def has_duplicate(elements):
    for i in range(len(elements)):
        for j in range(i + 1, len(elements)):
            if elements[i] == elements[j]:
                return True
    return False

elements = [1, 2, 3, 4, 5, 2]
print(has_duplicate(elements))
```
set를 사용하여 중복을 효율적으로 감지할 수 있다. 계산량은 O(n)으로 개선되었다.
```
def has_duplicate(elements):
    return len(elements) != len(set(elements))

elements = [1, 2, 3, 4, 5, 2]
print(has_duplicate(elements))
```

##### 4. 코드의 최적화

상태(state), 결합(coupling), 복잡성(complexity), 코드량(code) 순으로 줄임으로써 코드를 최적화하면 좋다. 상태를 관리하지 않는 로직은 코드 실행, 병렬 처리 또는 분산 처리에서 동일하게 작동해 확장성이 좋고, 상태 재현 코드가 필요없어 테스트가 편하고 코드의 복잡성이 줄어든다.

##### 5. 의존 방향

- 의존 관계는 단방향이어야 하고 순환 의존성이 발생하면 안된다
- 바람직한 의존 관계는 호출하는 측이 호출되는 측에 의존하는 것이 좋다
- 구현(상세) 클래스는 추상 클래스에 의존한다
- 복잡한 것이 단순한 것에 의존하는 것이 좋다

### 툴과 가이드 활용

##### 1. Code Style Guide

- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide)
- [PEP 8 – Python Style Guide](https://peps.python.org/pep-0008/)
- [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html)
- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)
- [Google Go Style Guide](https://google.github.io/styleguide/go/)
- [Effective Go](https://go.dev/doc/effective_go)
- [Google Swift Style Guide](https://google.github.io/swift/)
- [Airbnb Swift Style Guide](https://github.com/airbnb/swift)
- [Ruby Style Guide](https://rubystyle.guide/)
- [Airbnb Ruby Style Guide](https://github.com/airbnb/ruby)
- [Rust Style Guide](https://github.com/rust-lang/rust/tree/HEAD/src/doc/style-guide/src)
- [Kotlin Style Guide](https://kotlinlang.org/docs/coding-conventions.html)

##### 2. Code Formatter

- [Google Java formatter](https://github.com/google/google-java-format)
- [Facebook Kotlin formatter](https://github.com/facebook/ktfmt)
- [Python code formatter](https://github.com/psf/black)
- [Google Python formatter](https://github.com/google/pyink)
- [Go Format](https://pkg.go.dev/cmd/gofmt)
- [Ruby Code formatter](https://github.com/rubocop/rubocop)
- [Rust Code formatter](https://github.com/rust-lang/rustfmt)

### 코드 가독성 향상을 위한 추천 도서

- [The Art of Readable Code: Simple and Practical Techniques for Writing Better Code(by Dustin Boswell)](https://www.amazon.com/Art-Readable-Code-Practical-Techniques/dp/0596802293)
- [Code Complete: A Practical Handbook of Software Construction(by Steve McConnell)](https://www.amazon.com/Code-Complete-Practical-Handbook-Construction/dp/0735619670)
- [Clean Code: A Handbook of Agile Software Craftsmanship(by Robert C. Martin)](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Refactoring: Improving the Design of Existing Code](https://www.amazon.com/Refactoring-Improving-Existing-Addison-Wesley-Signature/dp/0134757599)