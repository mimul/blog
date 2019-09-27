---
templateKey: "blog-post"
title: "Web API Design : 개발자에게 사랑받는 API 만들기"
description: "기업 및 개발자들에게 API 제품 및 기술을 공급하는 Apigee는 Web API 설계에 관한 무료 책 [Web API Design : Crafting Interfaces that Developers Love]를 정리."
author: "미물"
authorURL: "https://mimul.com"
date: "2012-09-08T11:39:26.000Z"
lastModificationTime: "2012-09-08T11:39:26.000Z"
image: "/img/api.png"
commentId: "web-api-design-from-apigee-2012-09-08"
tags:
  - API
  - Apigee
---

업 및 개발자들에게 API 제품 및 기술을 공급하는 Apigee는 Web API 설계에 관한 무료 책 [Web API Design : Crafting Interfaces that Developers Love](https://pages.apigee.com/rs/apigee/images/api-design-ebook-2012-03.pdf)를 발표했습니다.

여기에는 좋은 API를 설계하기 위한 Best practices가 정리되어 있어, API를 도입하는 분들에게는 좋은 노하우를 제공하고 있어, 본 포스트에서는 "Web API Design"이라는 책을 참고하여 좋은 API 설계란 무엇인지에 대해서 정리해 봤습니다.

**1. 기본 URL에는 동사가 아닌 명사를 사용하며, 리소스마다 2개의 기본 URL을 유지하자.**

- 심플한 것이 가장 보기 좋다.
```
예) /dogs(Collection), /dogs/1234(Element)
```

**2. HTTP 동사(POST, GET, PUT, DELETE)를 사용해 집합(컬렉션)이나 개별 요소를 오퍼레이션 하자.**

- POST(create), GET(read), PUT(update), DELETE(delete)를 명심하자.

**3. 복수형 명사와 구체적인 이름을 사용하라.**

- 단수보다 복수 형태를 사용하는 편이, 그리고 추상적인 이름보다 구체적인 이름을 사용하는 편이, 직관적인 API다.
```
예)Foursquare : /checkins, GroupOn : /deals, Zappos : /Product
```

**4. 자원 간의 관계를 간단하게 하여 URL 계층이 깊어지는 것을 피하자.**

- 자원간의 관계, 매개 변수 및 속성과 같은 복잡한 것은 HTTP 물음표 뒤에 가지고 가자.
```
예) GET /owners/5678/dogs, GET /dogs?color=red&state=running&location=park
```

**5. 오류 처리를 명확하게 해라.**

- HTTP 상태코드를 정하고(많아도 안좋음), 개발자들을 위한 오류 메세지 정의, 상세 정보 링크 등을 넣어주면 좋다.
```
200 - OK
400 - Bad Request
500 - Internal Server Error
201 - Created
304 - Not Modified
404 - Not Found
401 - Unauthorized
403 - Forbidden
```

- code, message, more_info 필드를 두어서 결과값을 먼저 파악할 수 있도록 한다.
```
예) {"status" : "401", "message":"Authenticate","code": 20003,
 "more info": "http://www.twilio.com/docs/errors/20003"}
```

**6. 버전 관리를 해라.**

- 접두사 "v"로 버전을 지정하고 1계층에 두자.
- 인터페이스로서 구현이 아님을 강조하기 위해 간단한 정수를 사용하자. 버전 일렬번호는 소수점 쓰지 마라.
- 필요시 헤더에 버전을 디자인할 수도 있다.(단점은 개발자들이 잊을 수 있다.)
```
예) GET /v1/dogs
```

**7. 부분적 응답과 페이징 처리를 하라.**

- 리턴해 달라는 필드를 지정하려면(부분 응답) 쉼표로 구분된 목록을 사용하자.
  예) /dogs?fields=name,color,location
- 페이징을 할 경우 상대 위치(offset)와 범위(limit)를 사용, 기본 값은 limit=10&offset=0을 사용한다.
```
예) /dogs?limit=25&offset=50
```

**8. 데이터 베이스에 없는 자원에 대한 응답일 경우 동사를 사용하라.**

- 리소스가 아닌 응답을 전송하는 경우 명사가 아니라 동사를 사용하는 것이 알기 쉽다.
- 계산(Calculate), 번역(Translate), 변환(Convert) 등의 경우처럼 알고리즘 계산이나 번역, 환율 변환 등에 요청이 올경우 명사가 아니라 동사를 사용하라.
```
예) /convert?from=EUR&to=CNY&amount=100
```

**9. 다양한 형식(컨텐트 타입)을 지원하는 경우 도트 형식의 서식으로 하라.**

- JSON과 XML과 같이 API 다른 응답 형식을 지원하는 것을 추천한다.
- 기본 형식은 json이다.
- Accept 헤더에 타입을 지정하거나, URL속에 type 매개변수를 사용할 수 있다. 권장 방식은 명사.type(도트 형식의 서식)으로 하는게 낫다.
```
예) dogs.json, /dogs/1234.json
```

**10. 속성(attribute)의 네이밍은 Javascript의 관습을 따르고 카멜 케이스 (CamelCase)를 사용하자.**

- 기본값으로 JSON을 사용하고, 속성의 이름은 Javascript의 관습을 따른다. 중간 부분에 대문자를 사용(카멜 케이스)
```
예) "createdAt": 1320296464
```

**11. 검색 팁**

- 전체 검색은 동사 "search"와 쿼리 매개 변수 "q"를 사용하자.
```
예) /search?q=fluffy+fur
```

- 범위 한정 검색은 /리소스/리소스 ID/리소스?q=XXX(리소스 ID가 5678 인 주인의 개를 검색) 형태로 한다.
```
예) /owners/5678/dogs?q=fluffy+fur
```

- 도트 형식의 서식을 사용하여 검색 결과 형식을 지정하자.
```
예) /search.xml?q=fluffy+fur
```

**12. 하위 도메인의 독립적인 API 요청 처리는 여러 개를 만들지 말고 통일하라.**

- 여러 기능적으로 독립된 url을 여러개 만들지 말고 모든 API 요청을 하나의 API 하위 도메인에 정리하자. api.company.com 같은 것을 사용하는 것이다.
- developers.company.com 같은 개발자 전용 포털을 만들자.
- 사용자가 브라우저에서 API 하위 도메인을 여는 등 요청에 대한 원하는 정보가 없다면 개발자 포털로 리다이렉트 해라.

**13. 예외 처리를 위한 팁**

- 클라이언트가 HTTP 오류 코드를 차단하는 경우(Adobe Flash 경우), 응답을 클라이언트에서 먹어버림으로 응용 프로그램 개발자가 오류 코드를 차단하는 기회가 없어진다. 그래서 트위터처럼 suppress_response_codes가 있으면 무조건 200으로 리턴하게 한다.
- 클라이언트가 지원하는 HTTP 메소드가 제한되는 경우 URL에서 method형태로 호출하게 한다.
```
예) Create : /dogs?method=post, Read : /dogs,
Update : /dogs/1234?method=put&location=park,
Delete : /dogs/1234?method=delete
```

**14. 권한 관리(OAuth)는 2.0을 사용하라.**

- OAuth 1.0a보다 2.0을 사용하라. 더 안전하고 웹과 모바일 모두 사용자에게 더 나은 경험을 제공한다.

**15. API상에서 요청을 구성해보면 아래와 같다.**

- Al라는 갈색 개를 생성.
```
POST /dogs
name=Al&furColor=brown
응답
200 OK
{
  "dog": {
  "id": "1234"
  "name": "Al"
  "furColor": "brown"
  }
}
```

- Al의 이름을 Rover로 수정
```
PUT /dogs/1234
name=Rover
응답
200 OK
{
  "dog": {
  "id": "1234"
  "name": "Rover"
  "furColor": "brown"
  }
}
```

- 특정 개에 관하여 조회
```
GET /dogs/1234
응답
200 OK
{
  "dog": {
  "id": "1234"
  "name": "Rover"
  "furColor": "brown"
  }
}
```

- 모든 개에 관해 조회
```
GET /dogs
응답
200 OK
{
  "dogs":
  {
    "dog": {
      "id": "1233"
      "name": "Fido"
      "furColor": "white"
    }
  }
  {
    "dog":
    {
      "id": "1234"
      "name": "Rover"
      "furColor": "brown"
    }
  }
  "_metadata":
  [{
    "totalCount": 327 "limit"25 "offset": 100
  }]
}
```

- Rover개 삭제
```
DELETE / dogs/1234
응답
200 OK
```

**16. 수다 API 지양하자.**

- 간단한 응용 프로그램을 구축하는데, 여러번의 서버 API 호출을 해야 하는 수다스러운 API는 지양해라.
- 완전한 RESTful API를 만들고, 필요에 따라 단축키 및 합성 응답을 제공하는 것을 추천한다.

**17. SDK로 API를 보완하라.**

- 자기 모순없이 표준에 기초하고 있고, 충분히 문서화 되어 있고, 예제도 충분히 있다면 SDK가 필요 없을 수도 있다. 하지만, API 프로 바이더는 샘플 코드 라이브러리, 소프트웨어 개발 키트 API를 보충하는 것을 추천한다.
- 도메인 지식에 의해 API가 변경되어서는 안된다. SDK를 통해 API를 보완해라.
- SDK는 낮음 품질, 비효율적인 코드를 줄여준다.

**18. API Facade Pattern을 API 설계에 고려해라.**

- 인터페이스와 API구현체 사이의 가상 레이어가 존재한다.
- 구현은 세 가지 기본적인 단계로 구성된다.
  * 이상적인 API를 디자인하라 - URL, 요청 파라미터, 응답, 페이로드, 헤더, 쿼리 파라미터 등. API 디자인은 일관되어야 한다.
  * 데이터 스텁을 사용하여 디자인을 구현하라. 이제 API가 내부 시스템에 연결되기 전에 응용 프로그램 개발자는 API를 사용할 수 있으며, 피드백을 줄 수 있다.
  * 퍼사드와 내부 시스템 사이에서 중개자 역할 또는 통합을 한다.
