---
templateKey: "blog-post"
title: "HTTPS에 대해 알아야 할 것들"
description: "HTTPS의 현재, 장점, 프로토콜, 취약점, SSL Cipher Suites, 변화, 과제, 설정 모범 사례 등 전반적인 내용을 정리함."
author: "미물"
authorURL: "https://mimul.com"
date: "2020-01-11T18:30:18.000Z"
lastModificationTime: "2020-01-11T18:30:18.000Z"
image: "/img/topics/ssl.jpg"
commentId: "about-https-2020-01-11"
tags:
  - HTTPS
  - SSL
  - TLS
---
인터넷 사이트의 안전을 위해 HTTPS를 적용하는 사이트들이 많아지고 관심이 늘어가고 있습니다. SSL 인증서를 구매해서 서버에 설치하면 끝나는것이 아니라, 좀 더 HTTPS 프로토콜과 작동방식으로 이해하면 어떻게 우리 사이트에 신뢰성을 주는지, 그리고 제대로 알고 적절한 설정을 하여야만 문제 발생을 없애고 신뢰성을 높일 수 있어 리서치하고 조사한 내용을 공유합니다.

#### HTTPS 현황

좀 지난 자료지만, [Measuring HTTPS Adoption on the Web](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/46197.pdf) 논문을 통해 Google과 Mozilla가 Chrome과 Firefox의 HTTPS 이용 상황을 공개하고 있는데, 2017년 1월 기간 HTTPS 채용 비율 40%이고 Alaxa 100 도메인에서는 88%가 되며 전반적으로 HTTPS화가 진행되고 있다.

최근에는 [Let's Encrypt](https://letsencrypt.org/)로 인해 HTTPS를 적용하는 사이트가 많이 증가하는 추세이다. [Let's Encrypt Stats](https://letsencrypt.org/stats/)(2020년 1월 기준)에 의하면 사용중인 도메인이 1억 8천 100만 정도이다. 어느 인증서가 많이 사용되는지 [통계](https://www.leebutterman.com/2019/08/05/analyzing-hundreds-of-millions-of-ssl-connections.html)(2019년 8월 기준)를 보면 Let's Encrypt가 4,720만건으로 1위다.

| 순위 | 인증서 발급사|
| :----: | :---- |
|1위  | Let's Encrypt(4,720만건)|
|2위  | DigiCert(2,890만건)|
|3위  | Comodo(1,380만건)|
|4위  | Google(1,010만건)|
|5위  | GoDaddy(720만건)|
|6위  | Sectigo(710만건)|
|7위  | cPanel(700만건)|
|8위  | GlobalSign(610만건)|
|9위  | CloudFlare0(340만건)|
|10위 | Amazon(250만건)|
|11위 | 익명의 개인 인증서(210만건)|
|12위 | Plesk(110만건)|

그리고 [2017년 10월 중순에 출시된 Chrome 62](https://www.chromium.org/Home/chromium-security/marking-http-as-non-secure)부터 HTTP 연결 페이지에 양식 등 사용자가 데이터를 입력하면 다음과 같이 주소창에 "보호되지 않은 통신(Not Secure)"라는 경고가 표시되기 시작했고, Mozilla에서도 [Secure Contexts Everywhere](https://blog.mozilla.org/security/2018/01/15/secure-contexts-everywhere/)라는 글에서 Firefox의 새로운 기능 구현은 기본적으로 HTTPS를 필요로한다고 결정했다.

#### HTTPS로 가야 하는 이유

**1. Identity(인증)**

https://a.com을 접속하면 브라우저는 a.com에서 인증서를 수신하기 때문에 접속한 a.com이 진짜 a.com임을 증명해 준다.

**2. Integrity(무결성)**

웹 사이트와 사용자의 브라우저 간의 통신을 침입자가 변조(광고 삽입, 악성코드 설치 등)되는 것을 방지한다.

**3. Confidentiality(기밀성)**

침입자가 웹 사이트와 사용자의 브라우저간 간의 통신을 감청(사용자의 브라우저 활동 모니터링, identity 노출, 개인 정보 등)할 수 없도록 보호한다.

**4. 신기술(새로운 프로토콜 및 브라우저 API)에 대한 대응**

새로운 프로토콜 HTTP/2, QUIC에서, 그리고 최신 API 경우 getUserMedia(video, audio), WebRTC, ServiceWorker, Geolocation, Push notification, Progressive Web App 등에서 실행 허가가 필요한데 HTTPS가 실헹 허가에 중요한 요소이다.

**5. 기타**

Google은 HTTPS 페이지를 [우선적으로 색인을 생성](https://webmasters.googleblog.com/2015/12/indexing-https-pages-by-default.html), SEO 헤택 등.

#### HTTP와 HTTPS의 차이

HTTP의 경우는 TCP 핸드셰이크 후에 HTTP 요청/응답으로 서로 어플리케이션 데이터를 주고 받습니다. 이때 통신은 평문으로 이루어지고, 중간자 HTTP 데이터를 보거나 변조가 가능하다. 반면, HTTPS는 HTTP over TLS를 말하며, TCP 핸드세이크 후에 TLS 핸드셰이크를 진행하고 그후부터는 암호화 통신이 시작되며 HTTP 요청/응답을 통해 어플리케이션 데이터를 주고 받는다.

![HTTP vs HTTPS](/img/blog/ssl_http_https.png)

#### TLS 핸드셰이크 프로토콜

HTTPS는 HTTP over TLS를 말한다. 그래서 TLS의 핸드셰이크 프로토콜을 이해하는게 필요하다.

![TLS 핸드 셰이크 프로토콜](/img/blog/ssl_tls.png)

**1. 매개변수 교환/동의**

TLS 통신을 실현하는 데 필요한 매개 변수를 클라이언트와 서버간에 합의를 한다. 합의하는 매개 변수는 암호화/키교환 알고리즘, 각종 확장 기능의 사용 여부 등을 클라이언트가 가능한 후보를 서버에 전달하고(ClientHello) 서버는 클라이언트에서 제시 한 후보 중에서 가장 적합한 것을 하나 선택하고 그 값을 클라이언트에 반환한다.(ServerHello)

**2. 서버인증(Identity)**

사용자가 접속한 도메인이 신뢰할 만한 HTTPS 서버인지를 보장하는 기능이다. 서버에서 클라이언트로 서버 인증서를 전송한다.(Certificate) 서버 인증서를 클라이언트가 확인하여 서버의 신뢰성을 확보하자는 것이 TLS에서 서버 인증의 1단계 인증이다. 이 때 서버 인증서의 유효성 검사는 신뢰할 수 있는 인증 기관에서 발급한 공식 인증서임을 확인하기 위해 트러스트 앵커라는 인증 기관의 루트 인증서를 사용한다. 인증서를 받은 클라이언트는 인증서에 기재되어 있는 유효 기간과 용도 · 이름 등의 항목을 체크하고 루트 인증서까지 서버 인증서와 중간 인증서의 서명을 검증해 인증한다.

서버는 키교환에서 사용하는 데이터를 개인키로 서명해 클라이언트에 보낸다.(ServerKeyExchange) 클라이언트는 인증서에서 공개키를 사용하여 서명 검증을 실시한다, 이것이 2단계 인증이다.

이 서명 검증에 성공하면 액세스하는 서버가 정당한 인증서와 개인키를 가진 것이라고 입증된 것이 된다. 서버 인증서의 확인과 서명 검증이 성공하면 클라이언트의 서버 인증이 완료된다.

**3. 키교환**

이 단계는 앞서 합의된 키 교환 방식에 따라 서버와 클라이언트는 암호화 및 메시지 인증에 사용할 임시 공개키를 생성하기 위한 키 교환이다. 임시 공개키는 TLS 핸드 셰이킹이 끝나면 폐기되기 때문에 기밀성이 보장된다. 클라이언트와 서버는 TLS 핸드 셰이크마다 임시 공개키와 개인키 쌍을 생성해야 하는데, 생성된 임시 공개키를 서로 교환하고 각자가 가진 개인키와 조합해 공유키를 도출하면 키교환이 완료된다.

**4. 암호화 통신 시작 알림과 변조여부 체크**

키 교환이 끝나면 생성된 공개키를 이용하여 암호화 통신을 시작할 수 있다. 서버와 클라이언트는 암호화 통신을 시작 신호를 보낸다.(ChangeCipherSpec) TLS 핸드 셰이크 데이터가 손상되지 않았는지 확인하기 위해 지금까지 주고 받은 TLS 핸드 셰이크 데이터의 해시 값을 상대에게 보낸다.(Finished) 클라이언트와 서버 각각의 관점에서 TLS 핸드 셰이크 데이터의 해시값이 일치하는 경우, 경로의 중간에 교환이 변조되지 않았음을 확인하게 된다.

이 후에는 HTTP 요청과 HTTP 응답을 통해 애플리케이션의 데이터를 지속적으로 암호화하여 송수신한다.

#### TLS 핸드 셰이크 resumption

TLS는 끊어진 session을 재연결하는 TLS Session resumption이라는 기능이 있다. 이 기능은 일단 연결이 완료된 TLS Session 정보의 ID에 대해 캐시 연결시 캐시된 정보를 이용하여 세션을 다시 연결이 아닌 마지막 연결을 복구하는 기능이다. TLS Session resumption를 이용했을 때의 프로토콜의 동작은 TLS1.2 RFC인 [RFC5246의 Section 7.3](https://tools.ietf.org/html/rfc5246)에 기술되어 있다.

![TLS 핸드 셰이크 resumption](/img/blog/ssl_tls_resumption.png)

#### SSL 프로토콜 종류

|  버전  |  안전  |  개요  |
| :---: | :---: | :--- |
| SSL1.0 | 안전 ✕ | 첫 번째 SSL로 설계했지만, 설계 검토의 시점에서 프로토콜의 취약점이 발견 되었기 때문에 파기됨.|
| [SSL2.0](https://tools.ietf.org/html/rfc6176) | 안전 ✕ | SSL1.0 문제를 해결하고 설계후 1994년에 SSL2.0로 넷스케이프가 공개. [DROWN 공격](https://drownattack.com/) 문제로 사용 중지됨. |
| [SSL3.0](https://tools.ietf.org/html/rfc7568) | 안전 ✕ | SSL2.0 문제를 해결하고 1995년 SSL3.0로 공개. POODLE 공격 문제로 사용 중지됨.  |
| [TLS1.0](https://tools.ietf.org/html/rfc2246) | △ | SSL3.0과 TLS1.0의 양자 사이에는 정확한 호환성은 아니지만 거의 같음. 1999년에 공개. [BEAST 공격](https://bug665814.bmoattachments.org/attachment.cgi?id=540839) 문제가 있음. |
| [TLS1.1](https://tools.ietf.org/html/rfc4346) | ◯ | TLS 1.0에서의발견된 새로운 공격기법(BEAST 공격 및 CBC 모드의 오류를 사용한 공격)에 대한 대응. 2006년에 공개. [PCIDSSv3.2](https://blog.pcisecuritystandards.org/are-you-ready-for-30-june-2018-sayin-goodbye-to-ssl-early-tls) |
| [TLS1.2](https://tools.ietf.org/html/rfc5246) | ◎ | 해시 알고리즘 SHA-256이 추가되었고, 블록 암호에 대한 기존의 CBC 모드뿐만 아니라, GCM CCM을 같은 인증된 암호화가 가능해 짐. 2008년에 공개. 현재 가장 많이 사용되는 버전임.|
| [TLS1.3](https://tlswg.github.io/tls13-spec/) | 개발중 | 인터넷 환경의 변화와 TLS1.2까지의 암호화 강도 부족을 개선하기 위해 만들들기 시작했고 2018년 8월에 [RFC8446](https://datatracker.ietf.org/doc/rfc8446/)으로 스펙이 결정됨.|

[SSL and TLS Deployment Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)의 2.2 Use Secure Protocols과, SSL 취약점, 브라우저 벤더들의 TLS 지원 버전 상향 등 고려하면 TLS 1.2 이상을 사용해야 하는 시기가 도래했다.

#### SSL의 취약점들

**1. BEAST - [CVE-2011-3389](https://nvd.nist.gov/vuln/detail/CVE-2011-3389)**

> BEAST는 AES, Camellia, 그리고 CBC 모드를 사용하는 다른 프로토콜의 CBC 모드의 Initialization Vector(IV)의 취약점이다. 이 공격은 MITM(Man in The Middle) 공격자는 동일한 메시지를 여러 번 암호화하여 일반 텍스트값을 복원할 수 있다.

- 발생일 : 2011.09.06.
- 대책 : TLS 1.1이상 활성화.
- 상세 정보 : [Tor and the BEAST SSL attack](https://blog.torproject.org/tor-and-beast-ssl-attack)와 [The BEAST summary - TLS, CBC, Countermeasures(Update 4)](https://blog.zoller.lu/2011/09/beast-summary-tls-cbc-countermeasures.html).

**2. CRIME - [CVE-2012-4929](https://nvd.nist.gov/vuln/detail/CVE-2012-4929)**

> 데이터를 암호화하기 전에 압축되었을 때 발생하는 정보의 유출이다. 만약 민감한 정보와 비교적 예측 가능한 데이터  컨텐츠에 주입되어 섞여 있었을 때, 암호화 된 스트림을 관찰 할 수 있다면 공격자는 그 때 알 수없는 데이터를 추출할 수 있다.

- 발생일 : 2012.09.15.
- 대책 : TLS/SSL-level 압축을 비활성화.
- 상세 정보 : [CRIME: Information Leakage Attack against SSL/TLS](https://blog.qualys.com/ssllabs/2012/09/14/crime-information-leakage-attack-against-ssltls).

**3. LUCKY13 - [CVE-2013-0169](https://nvd.nist.gov/vuln/detail/CVE-2013-0169)**

> CBC 모드에 대한 또 하나의 공격에서 암호문을 해독하기 위한 패딩 검사를 수행하여 해독하는 공격이다.

- 발생일 : 2013.02.04.
- 대책 : TLSv1.1이하 비활성화.
- 상세 정보 : [Lucky Thirteen attack on TLS CBC](https://www.imperialviolet.org/2013/02/04/luckythirteen.html).

**4. BREACH - [CVE-2013-3587](https://bugzilla.redhat.com/show_bug.cgi?id=995168)**

> 이것은 CRIME에 비해 더 복잡한 공격이며, TLS 수준의 압축을 필요로하지 않는다(HTTP-level의 압축은 필요함).
> 이 공격이 성공하려면 다음의 요건이 필요하다:
> - HTTP 수준의 압축을 사용함.
> - 사용자의 입력이 HTTP 응답 본문에 있어야 함.
> - 비밀 정보(CSRF 토큰)가 HTTP 응답 본문에 포함

- 발생일 : 2013.08.08.
- 대책 : HTTP-level 압축을 비활성화.
- 상세 정보 : [BREACH](http://breachattack.com/).

**5. TLS heartbleed - [CVE-2014-0160](https://nvd.nist.gov/vuln/detail/CVE-2014-0160)**

> SSL을 사용한 통신 과정에는 클라이언트와 서버의 연결 지속성을 유지하기 위해 Heartbeat을 사용하는데, 이 과정에서 경계값을 제대로 검증하지 않아 서버의 메모리가 그대로 노출되는 취약점이 존재한다. 이 취약점을 통해 개인키, 비밀키, 세션정보를 획득이 가능하고 클라이언트와 서버간의 암호화 통신 내용을 해독할 수 있다.

- 발생일 : 2014.04.07.
- 대책 : openssl update
- 상세 정보 : [The Heartbleed Bug](http://heartbleed.com/).

**6. CCS injection - [CVE-2014-0224](https://nvd.nist.gov/vuln/detail/CVE-2014-0224)**

> ChangeCipherSpec 메시지의 처리에 결함이 발견이 되었다. 이 취약점을 통해 암호화된 통신 정보가 유출될 가능성이 있다.

- 발생일 : 2014.06.05.
- 대책 : openssl update
- 상세 정보 : [CCS Injection Vulnerability](http://ccsinjection.lepidum.co.jp/).

**7. POODLE - [CVE-2014-3566](https://nvd.nist.gov/vuln/detail/CVE-2014-3566)**

> Google에 의해 SSL3.0의 심각한 보안 취약점을 발견, 그것은 Cookie와 같은 일부 기밀 정보를 훔칠 수가 있다. 이 취약점은 "POODLE"로 알려진 BEAST공격과 비슷하다. 이 취약점을 이용하여 공격자는 암호 및 Cookie 정보를 액세스 할 수 있다.

- 발생일 : 2014.10.14.
- 대책 : SSLv3를 비활성화.
- 상세 정보 : [The POODLE Attack and the End of SSL 3.0](https://blog.mozilla.org/security/2014/10/14/the-poodle-attack-and-the-end-of-ssl-3-0/)와 [This POODLE bites: exploiting the SSL 3.0 fallback](https://security.googleblog.com/2014/10/this-poodle-bites-exploiting-ssl-30.html).

**8. Bar Mitzvah - [CVE-2015-2808](https://nvd.nist.gov/vuln/detail/CVE-2015-2808)**

> RC4 알고리즘은 초기화 단계 상태의 데이터와 키 데이터를 적절하게 결합하지 않기 때문에 스트림의 첫번째 바이트에 일반 텍스트 복구 공격(plaintext-recovery attack)을 실행 취약점이 존재한다.

- 발생일 : 2015.03.31.
- 대책 : RC4 알고리즘 사용 제외.
- 상세 정보 : [Bar Mitzvah Attack](https://www.blackhat.com/docs/asia-15/materials/asia-15-Mantin-Bar-Mitzvah-Attack-Breaking-SSL-With-13-Year-Old-RC4-Weakness-wp.pdf).

**9. SLOTH - [CVE-2015-7575](https://nvd.nist.gov/vuln/detail/CVE-2015-7575)**

>  TLS 구현이 RSA-MD5 등 이미 안전하지 않은 서명 방식이 활성화되어 있는 경우에 한 핸드쉐이크 데이터와 동일한 해시값을 갖는 다른 데이터를 계산하고 그것을 통해 데이터를 변조하는 중간자 공격을 통해 TLS의 안전성을 깬다.

- 발생일 : 2016.01.08.
- 대책 : MD5 및 SHA-1 알고리즘 사용 제외.
- 상세 정보 : [SLOTH](https://www.mitls.org/pages/attacks/SLOTH).

**10. DROWN(Decrypting RSA with Obsolete and Weakened eNcryption) - [CVE-2016-0800](https://nvd.nist.gov/vuln/detail/CVE-2016-0800)**

> HTTPS 서버가 SSLv2에 연결 가능하거나, SSLv2에 연결할 수 있는 다른 서버에서 동일한 비밀 키를 사용해서 돌고 있는 경우 교차 프로토콜 공격을 통해 TLS의 복호화된 통신 정보를 도청할 가능성이 있다는 것.

- 발생일 : 2016.03.01.
- 대책 : SSLv2 비활성화.
- 상세 정보 : [DROWN](https://drownattack.com/).

**11. SWEET32 - [CVE-2016-2183](https://nvd.nist.gov/vuln/detail/CVE-2016-2183)**

> 3DES 암호 알고리즘에는 약 40억의 블록 birthday bound를 가지고 있기 때문에, 장시간 계속되는 암호화된 세션에 대해서 생일 공격 "Sweet32" 공격을 함으로써, 원격의 공격자가 평문 데이터를 취득하기 쉽게 되는 취약성이 있다.

- 발생일 : 2016.08.24
- 대책 : 3DES 등 64bits 블록 암호 사용 제외.
- 상세 정보 : [Sweet32: Birthday attacks on 64-bit block ciphers in TLS and OpenVPN](https://sweet32.info/).

#### SSL Cipher Suites

Cipher Suites에 사용할 암호화 방법 확인은 아래의 커맨드로 확인이 가능하다. 현재 설정하고 있는 정보가 문제가 있는지 확인하기 위해 이 커맨드 확인이 필요하다. 그리고 그 결과값을 해석하는 방법도 이해할 필요가 있다.

```bash
❯ openssl ciphers -v 'HIGH:!aNULL:!eNULL:!EXPORT:!ADH:!DES:!MD5:!PSK:!RC4;'

ECDHE-RSA-AES256-GCM-SHA384 TLSv1.2 Kx=ECDH     Au=RSA  Enc=AESGCM(256) Mac=AEAD
ECDHE-ECDSA-AES256-GCM-SHA384 TLSv1.2 Kx=ECDH     Au=ECDSA Enc=AESGCM(256) Mac=AEAD
ECDHE-RSA-AES256-SHA384 TLSv1.2 Kx=ECDH     Au=RSA  Enc=AES(256)  Mac=SHA384
ECDHE-ECDSA-AES256-SHA384 TLSv1.2 Kx=ECDH     Au=ECDSA Enc=AES(256)  Mac=SHA384
ECDHE-RSA-AES256-SHA    SSLv3 Kx=ECDH     Au=RSA  Enc=AES(256)  Mac=SHA1
ECDHE-ECDSA-AES256-SHA  SSLv3 Kx=ECDH     Au=ECDSA Enc=AES(256)  Mac=SHA1
DHE-RSA-AES256-GCM-SHA384 TLSv1.2 Kx=DH       Au=RSA  Enc=AESGCM(256) Mac=AEAD
DHE-RSA-AES256-SHA256   TLSv1.2 Kx=DH       Au=RSA  Enc=AES(256)  Mac=SHA256
DHE-RSA-AES256-SHA      SSLv3 Kx=DH       Au=RSA  Enc=AES(256)  Mac=SHA1
ECDHE-ECDSA-CHACHA20-POLY1305 TLSv1.2 Kx=ECDH     Au=ECDSA Enc=ChaCha20-Poly1305 Mac=AEAD
ECDHE-RSA-CHACHA20-POLY1305 TLSv1.2 Kx=ECDH     Au=RSA  Enc=ChaCha20-Poly1305 Mac=AEAD
DHE-RSA-CHACHA20-POLY1305 TLSv1.2 Kx=DH       Au=RSA  Enc=ChaCha20-Poly1305 Mac=AEAD
GOST2012256-GOST89-GOST89 SSLv3 Kx=GOST     Au=GOST01 Enc=GOST-28178-89-CNT Mac=GOST89IMIT
DHE-RSA-CAMELLIA256-SHA256 TLSv1.2 Kx=DH       Au=RSA  Enc=Camellia(256) Mac=SHA256
DHE-RSA-CAMELLIA256-SHA SSLv3 Kx=DH       Au=RSA  Enc=Camellia(256) Mac=SHA1
GOST2001-GOST89-GOST89  SSLv3 Kx=GOST     Au=GOST01 Enc=GOST-28178-89-CNT Mac=GOST89IMIT
AECDH-AES256-SHA        SSLv3 Kx=ECDH     Au=None Enc=AES(256)  Mac=SHA1
AES256-GCM-SHA384       TLSv1.2 Kx=RSA      Au=RSA  Enc=AESGCM(256) Mac=AEAD
AES256-SHA256           TLSv1.2 Kx=RSA      Au=RSA  Enc=AES(256)  Mac=SHA256
AES256-SHA              SSLv3 Kx=RSA      Au=RSA  Enc=AES(256)  Mac=SHA1
CAMELLIA256-SHA256      TLSv1.2 Kx=RSA      Au=RSA  Enc=Camellia(256) Mac=SHA256
CAMELLIA256-SHA         SSLv3 Kx=RSA      Au=RSA  Enc=Camellia(256) Mac=SHA1
ECDHE-RSA-AES128-GCM-SHA256 TLSv1.2 Kx=ECDH     Au=RSA  Enc=AESGCM(128) Mac=AEAD
ECDHE-ECDSA-AES128-GCM-SHA256 TLSv1.2 Kx=ECDH     Au=ECDSA Enc=AESGCM(128) Mac=AEAD
ECDHE-RSA-AES128-SHA256 TLSv1.2 Kx=ECDH     Au=RSA  Enc=AES(128)  Mac=SHA256
ECDHE-ECDSA-AES128-SHA256 TLSv1.2 Kx=ECDH     Au=ECDSA Enc=AES(128)  Mac=SHA256
ECDHE-RSA-AES128-SHA    SSLv3 Kx=ECDH     Au=RSA  Enc=AES(128)  Mac=SHA1
ECDHE-ECDSA-AES128-SHA  SSLv3 Kx=ECDH     Au=ECDSA Enc=AES(128)  Mac=SHA1
DHE-RSA-AES128-GCM-SHA256 TLSv1.2 Kx=DH       Au=RSA  Enc=AESGCM(128) Mac=AEAD
DHE-RSA-AES128-SHA256   TLSv1.2 Kx=DH       Au=RSA  Enc=AES(128)  Mac=SHA256
DHE-RSA-AES128-SHA      SSLv3 Kx=DH       Au=RSA  Enc=AES(128)  Mac=SHA1
DHE-RSA-CAMELLIA128-SHA256 TLSv1.2 Kx=DH       Au=RSA  Enc=Camellia(128) Mac=SHA256
DHE-RSA-CAMELLIA128-SHA SSLv3 Kx=DH       Au=RSA  Enc=Camellia(128) Mac=SHA1
AECDH-AES128-SHA        SSLv3 Kx=ECDH     Au=None Enc=AES(128)  Mac=SHA1
AES128-GCM-SHA256       TLSv1.2 Kx=RSA      Au=RSA  Enc=AESGCM(128) Mac=AEAD
AES128-SHA256           TLSv1.2 Kx=RSA      Au=RSA  Enc=AES(128)  Mac=SHA256
AES128-SHA              SSLv3 Kx=RSA      Au=RSA  Enc=AES(128)  Mac=SHA1
CAMELLIA128-SHA256      TLSv1.2 Kx=RSA      Au=RSA  Enc=Camellia(128) Mac=SHA256
CAMELLIA128-SHA         SSLv3 Kx=RSA      Au=RSA  Enc=Camellia(128) Mac=SHA1
```

위의 결과값 해석은 [NZBGet : Choosing Cipher](https://nzbget.net/choosing-cipher)를 참고하여 정리를 하면 아래와 같다.

| 구분 | 내용 | 암호화 알고리즘 |
| --- | --- | --- |
| DHE-RSA-AES256-SHA | 암호화 제품군 | cipher suites |
| kx | 키 교환 알고리즘 | DH, ECDH, ECDSA, ECDHE |
| Au | 키 인증 알고리즘 | RSA, DSA, ECC |
| Enc | 암호화 통신에 사용되는 암호화 알고리즘 | DES, AES, RC4 |
| Mac | 메시지 인증 코드 | MD5, SHA-1, SHA-2, SHA-3 |

[SSL and TLS Deployment Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)의 2.3 Use Secure Cipher Suites와 SSL 취약점을 참고하여 ADH, NULL, MD5, SHA1, RC4, 3DES는 보안 취약점이 있어서 될 수 있으면 제외(비활성화)하는게 바람직하다.

#### TLS의 변화 - 버전 1.1이하 지원 중단

**1. 브라우저별 지원 중단 일정 및 정보**

|브라우저| 일정 | 관련 근거|
| :----: | ---- | :---- |
|Chrome | 2020년 3월(Chrome 81) | [Chrome UI for Deprecating Legacy TLS Versions](https://security.googleblog.com/2019/10/chrome-ui-for-deprecating-legacy-tls.html)|
|Safari | 2020년 3월 | [Deprecation of Legacy TLS 1.0 and 1.1 Versions](https://webkit.org/blog/8462/deprecation-of-legacy-tls-1-0-and-1-1-versions/)|
|Firefox | 2020년 3월 | [Removing Old Versions of TLS](https://blog.mozilla.org/security/2018/10/15/removing-old-versions-of-tls/)|
|IE | 2020년 상반기 | [Modernizing TLS connections in Microsoft Edge and Internet Explorer 11](https://blogs.windows.com/msedgedev/2018/10/15/modernizing-tls-edge-ie11/)|

**2. SSL 체커로 현재 내 사이트의 지원 프로토콜 확인**

아래의 사이트에서 인증서 발급자, 일련번호, 만료일, 지원 Protocol등 인증서 관련 많은 정보를 확인할 수 있다.

|테스트 사이트명 | 테스트 주소|
| ---- | ---- |
|Qualys SSL LABS | [ssllabs.com](https://www.ssllabs.com/ssltest/analyze.html)|
|digicert | [digicert.com](https://www.digicert.com/help/)|

![SSL Test](/img/blog/ssl_test.png)

**3. 웹 서버의 TLS 1.2 최소 요구 사양**

|구분 | 웹 서비스 제공자 | 필요 버전 |
| :----: | :---- | ---- |
|OpenSSL기반 | Apache, Webtob, Nginx, Lighttpd 등 | OpenSSL 1.0.1 이상 |
|JAVA기반 | Tomcat, Resin, WebLogic 등 | JAVA 1.6(6u121) 이상 |
|윈도우서버 | IIS(Internet Information Services) | WinServer 2008 R2, IIS 7.5 이상 |

**4. SSL 프로토콜 설정**

- Apache
```
SSLProtocol all -SSLv2 -SSLv3 -TLSv1
```

- Nginx
```
ssl_protocols TLSv1.1 TLSv1.2;
```

#### HTTPS와 관련된 과제들

**HTTP/2 사양이 HTTPS 및 HTTP 모두 지원**

HTTP/2는 요청과 응답을 병렬로 수행 파이프 라인을 통해 하나의 요구에 대한 응답을 기다리지 않고 요청을 보낼 수 있고, 서버 푸시를 하면 브라우저가 HTML을 해석하고 추가 자원인 스타일 시트(CSS)나 JavaScript, 이미지 등을 요청하는 것을 기다리지 않고 서버 측에서 필요한 자원을 밀어넣을 수 있다. 그래서 HTTPS 늦다는 고정관념을 깨줄 수 있는 대응책으로 표현되곤 한다.

그런데, 2015년 2월에 [RFC7540](https://tools.ietf.org/html/rfc7540)로 표준화된 HTTP/2는 2011년에 Google에서 개발한 SPDY는 실험적인 프로토콜을 기반으로 하고 있는바 SPDY는 HTTPS에서만 동작시키고 있어 다른 사이트가 SPDY를 도입하기 위해 HTTPS화는 피할 수 없다. 2012년에 IETF에서 HTTP/2의 논의가 시작된 SPDY는 HTTP/2 기반이 되는 기술의 후보로 선정되면서 HTTP/2를 기존의 SPDY처럼 HTTPS만 사용할 수 있는 사양으로 할 지, 평문 통신 HTTP를 지원하도록 변경 해야할지, IETF 워킹 그룹에서 큰 논란이 되었다. 당시는 아직 HTTPS만 사용이 제한되는 새로운 프로토콜에 대해 부정적인 의견이 많아 결국 HTTP와 HTTPS를 모두 지원하도록 사양을 작성하여 HTTP/2의 표준화 작업이 시작되었다. 그래서 아직도 HTTP를 다 떼어내지 못하고 있다.

**트러스트 앵커를 둘러싼 인증 기관과 브라우저 벤더의 복잡한 관계**

현재 각각의 OS나 브라우저 벤더가 각자의 정책에 따라 신중하게 인증 기관을 심사하고 루트 인증서 등록을 허용하고 있다. 트러스트 앵커에 등록된 인증 기관이 외부로부터 침입을 받거나 업무상의 실수로 잘못된 서버 인증서를 발급하거나 하면 문제가 심각하게 발생한다. 실제로 다양하게 발생하고 있고, 모든 인증 기간을 동일한 수준으로 신뢰 수준으로 보장하는데 한계가 있다.

| 구분  |Windows | macOS | Linux | Android |
| :---: | :---: | :---: | :---: | :---: |
|IE/Edge | OS의 rootCA | - | - | - |
|Safari | - | OS의 rootCA | - | - |
|Chrome | OS의 rootCA | OS의 rootCA | Mozilla의 rootCA 또는 ca-bundle | Mozilla의 rootCA |
|Firefox | Mozilla의 rootCA | Mozilla의 rootCA | Mozilla의 rootCA | Mozilla의 rootCA |
|Node.js | Mozilla의 rootCA | Mozilla의 rootCA | Mozilla의 rootCA | - |

#### SSL 관련 설정 모범 사례 요약

- 최신 버전의 openssl [CVE-2014-0160/CVE-2014-0224]
- 암호화할 때에는 적어도 128bit 이상의 cipher를 사용하는 것이 좋음. 3DES 비활성화.
- SSL 프로토콜 1.1이상 사용. 브라우저들의 정책(보안 이슈 대응) 변화에 따라 버전 1.1이하 지원이 중단되므로 1.2 이상 사용해야 함.
- 그외 안전하지 않은 cipher는 비활성화. ADH(Anonymous Diffie-Hellman), NULL, MD5, SHA1, RC4 등을 비활성화.
- PFS(perfect forward secrecy)에 해당하는 cipher를 먼저 정의. 비밀 키(private key)가 누출에서도 PFS를 통해 암호화된 패킷 복호화 할 수 없도록하는 특징이 있음.
- Block cipher mode는 GCM 사용을 권장.

위 내용을 참고하여 [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)와 [NGINX Config](https://www.digitalocean.com/community/tools/nginx)에서 웹 서버별로 설정값을 생성할 수도 있다.

유명 사이트의 브라우저별로 지원하는 정보를 살펴보는 것도 도움이 된다. 아래 내용은 [Netcraft toolbar site report](https://toolbar.netcraft.com/site_report)에서 참고했다.

| 사이트 | Chrome | FireFox | Safari | Opera |
| :----: | :----: |:----:| :----: | :----: |
|google.com| ECDHE-ECDSA-AES128-GCM-SHA256 | ECDHE-ECDSA-AES128-GCM-SHA256 | ECDHE-ECDSA-AES128-GCM-SHA256 |ECDHE-ECDSA-AES128-GCM-SHA256|
|facebook.com| ECDHE-ECDSA-AES128-GCM-SHA256 | ECDHE-ECDSA-AES128-GCM-SHA256 | ECDHE-ECDSA-AES128-GCM-SHA256 | ECDHE-ECDSA-AES128-GCM-SHA256 |
|apple.com|ECDHE-RSA-AES128-GCM-SHA256|ECDHE-RSA-AES128-GCM-SHA256|ECDHE-RSA-AES128-GCM-SHA256|ECDHE-RSA-AES128-GCM-SHA256|
|amazon.com|ECDHE-RSA-AES128-GCM-SHA256|ECDHE-RSA-AES128-GCM-SHA256|ECDHE-RSA-AES128-GCM-SHA256|ECDHE-RSA-AES128-GCM-SHA256|
|naver.com|ECDHE-RSA-AES128-GCM-SHA256|ECDHE-RSA-AES128-GCM-SHA256|ECDHE-RSA-AES128-GCM-SHA256|ECDHE-RSA-AES128-GCM-SHA256|

- 브라우저별로 대부분 Cipher Suites는 ECDHE-ECDSA-AES128-GCM-SHA256나 ECDHE-RSA-AES128-GCM-SHA256를 지원하고 있는 경우가 많음.
- SSL 프로토콜은 TLSv1.2
