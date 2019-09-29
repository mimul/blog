---
templateKey: "blog-post"
title: "예외에 대한 고민"
description: "개인적으로 생각하고 있는 예외에 대한 것을 정리함."
author: "미물"
authorURL: "https://mimul.com"
date: "2010-06-18T19:44:54.000Z"
lastModificationTime: "2010-06-18T19:44:54.000Z"
image: "/img/topics/programming-icon.png"
commentId: "thinks-exception-2010-06-18"
tags:
  - Exception
  - Programming
---

#### 생각거리들

- 예외는 코드에서 보이지 않기 때문에 예외가 던져질지, 안던져질지 모르는 상황에서 catch로 습관화해 자신의 좋은 코딩 의무를 회피하는 경향이 있다. 그래서 개발자는 자신의 코드를 깊게, 면밀하게 코드를 탐독해서 예외 상황을 발생 시키지 않도록 잠재적인 버그를 줄일려는 노력을 해야하는데, 이런 두리뭉실한 예외를 catch하는 것으로 자신의 코드와 타협을 하고 있는건 아닌지 고민해야 한다.
- 예외가 코드에서 오히려 버그를 양산할 수 있다. 예외는 함수내에서 많은 탈출구를 만든다. goto처럼. 그래서 자신의 코드가 함수에서 어디로 튈지 모르게 될 뿐더러, 일관되지 않는 데이터로 인해 예외를 놓지게 되는 경우 자신의 의도하지 않는 결과로 인해 호출한 함수에서 예상되지 않는 실행 경로를 만들게 되는 것도 고민해야 한다.
- 예상되는 예외는 에러값으로 반환해서 명시적으로 처리하게 하는 것이 좋다. 그렇게 하면 예외에 대한 비용을 줄 일 수 있다. 예로, 에러로 리턴할 경우에는 하나의 조건으로 처리가 가능하지만, 예외에 편승하다보면 필요한 코드의 수도 증가하고 가독성도 떨어질 수 있다. 그리고 오류 리턴값의 종류를 명확히 기술해서 남이 보거나 호출한 함수의 재귀적으로 찾아서 어떤 함수가 예외를 발생시켰는지 식별이 가능하면 좋다.
- 코드에 대한 생각없이(기계적으로 하다보면) 예외를 놓지게 되는 것도 위험하지만, 예외를 게을리해 은폐하는 것은 더 위험하다.

#### 예외에 대한 모범 사례는 뭐가 있을까?

**1. Checked Exceptions과 Unchecked Exceptions의 선택.**

클라이언트 코드에서 아무것도 할 수 없는 경우에는 Unchecked Exception. 예외에서의 정보를 통해 클라이언트에서 의미있는 복구 작업을 할 경우에는 Checked Exception을 활용하자. 여기서 복구 작업에서 로그 등은 의미있는 작업이 아니다.
만약 예외의 결과로 효과적인 복구 작업을 처리 할 수 없는 경우에도 Checked Exception이 throw되어 왔다면 처리를 위한 코드는 낭비라는 것이라고 생각하는 것이다.

**2. 예외는 예외적인 조건에만 사용한다.**

예를 들어 Iterator.next()를 부를 때 가장 먼저 Iterator.hasNext()을 체크하는 대신 NoSuchElementException을 사용한다는 등의 제어 흐름에는 예외를 사용하지 않는다. 위의 사례처럼 클라이언트에게 예외 발생을 기다리게 하는 것이 아니라, 상태 검사 메소드 hasNext()를 제공한다.
이렇게 함으로써 가독성이 나빠지는 것을, 관계없는 예외를 제어하는 노력때문에 다른 버그를 놓칠 위험에서 방지시킬 수 있다. 그래서 정상적인 흐름에서 예외를 강요하지 않게 한다. 그리고 예측 가능한 예외일 경우 리턴의 오류값 등으로 표현해서 호출하는 클라이언트에 예외 관리비용을 줄여 준다.

**3. 예외도 캡슐화를 하자.**

예로 SQLException은 데이터 레이어에서 발생하는 예외인데 이것을 비지니스 레이어까지 전파시킬 필요가 없다는 이야기다.(비지니스 레이어는 알 필요가 없다) 즉, SQL을 사용하고 있다는 구현의 자세한 내용은 데이터 레이어 내부에 은폐되어야 한다.
```java
public void dataAccessCode(){
    try{
        ..some code that throws SQLException
    }catch(SQLException ex){
        throw new RuntimeException(ex);
    }
}
```

SQLException을 RuntimeException으로 변환하는 예이다. 물론 RuntimeException을 상속받아서 사용자 정의 Exception으로 지정해서 throw를 해도 된다. 이렇게 되면 데이터 레이어에서 오류가 발생했을 경우 비지니스 레이어에서 특별히 복구할 액션이 없다는 가정하에서 Checked Exception에서 Unchecked Exception으로 변환되어 이 API를 사용하는 클라이언트 코드에 불필요한 예외 처리를 위한 코드를 작성 안해도 되고, 많은 catch문을 사용 안해도 된다. 물론 외부 레거시 API에서도 예외 캡슐화 정책을 적용할 수 있을 수 있다.

**4. 만약 클라이언트 코드에 유용한 정보가 있지 않다면 새로운 사용자 정의 Exception을 만들지 말자.**

```java
class UsersException extends Exception {
	public UsersException(String str) {
		super(str);
	}
}
class UidOutOfBoundException extends UsersException {
	// UID 제한값
	private int hid;

	public UidOutOfBoundException(int i) {
		super("UID의 범위는" + 0 + "에서" + i + "까지 입니다.");
		hid = i;
	}
	public int getHid() {
		return hid;
	}
}
```

사용할 경우에는
```java
UidOutOfBoundException uobe = new UidOutOfBoundException(users.length - 1);
throw uobe;
```

위와 같이 특정한 Information이 있을 경우에만 사용자 정의 예외를 만들고 그외에는 안만드는 것이 좋다는 취지이다.

**5. 예외 먹지 말자.**

catch 블록 안에 아무것도 없는(로그만 찍는 등) 코드를 없애 버리자. 테스트라 하더라도 습관화도 안될 일이다.

**6. 예외 정보를 문서화하자.**

Javadoc에는 Checked Exception, Unchecked Exception 양쪽 모두 ```java @throws```를 사용하여 적자. 단위 테스트에서도 문서화하는 것을 잊지 말자.

**7. 클라이언트 코드 측면에서는 자신이 한 것은 자신이 정리를 하자.**
```java
public void dataAccessCode(){
    Connection conn = null;
    try{
        conn = getConnection();
        ..some code that throws SQLException
    }catch(SQLException ex){
        ex.printStacktrace();
    } finally{
       try  {
           con.close ();
       } catch(SQLException e)  {
           throw new RuntimeException(e);
       }
    }
}
```

위의 예의 경우에는 getConnection()에서 연결이 안되었을 경우 finally절에서 con.close()에서는 NullPointerException이 발생하면 some code에서 발생한 SQLException 예외를 덮어 벌릴 수 있다. 즉, finally 블록 내에서 예외를 발생시키지 말자. 여기에서 발생한 예외는 의도하지 않고, try catch 블록에서 단계적으로 전달된 예외를 덮어버릴 수 있다. 예제의 참신성이 떨어지지만, Legacy API연동시에 데이터를 읽은뒤에 Stream.close()나 커넥션 클로즈에서 발생하기 쉬운 부분도 있으니 참고했으면 좋겠다.

참고로 Java7에서 try-with-resources를 사용하면 회피가 가능하다.
```java
try (Connection conn = dataSource.getConnection ()) {
   ..some code that throws SQLException
   conn.commit();
} catch (SQLException ex) {
   conn.rollback();
   ex.printStacktrace();
}
```

그리고 위에서 언급한 외부 API 연동이 많을 경우에도, 물론 오픈 소스들도 많지만, 필요한 기능만 슬림하게 자신의 프로젝에 맞게 client wrapper 클래스를 만들 경우 stream의 close(널 체크 포함)와 connection의 close(널 체크 포함)해 주는 함수를 제공할 필요가 있다.
```java
EntityUtils.toString(response.getEntity(), "UTF-8");
```

위 함수는 응답 정보를 읽어오는 경우 내부적으로 stream.close()를 자동으로 해주며,
```java
httpClient.getConnectionManager().shutdown();
```

위의 함수는 클라이언트와의 커넥션을 자동으로 끝어 주는 함수이다. 이런 함수를 내부에서 제공해서 클라이언트에서 사용할 때 Exception을 발생시킬 수 있는 개연성을 줄여주는 것이 필요하다.
