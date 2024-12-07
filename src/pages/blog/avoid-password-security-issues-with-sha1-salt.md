---
templateKey: "blog-post"
title: "SHA1 + salt로 패스워드 보안 이슈 회피가 가능한가?"
description: "SHA1 + salt로 패스워드 보안 문제점을 짚고 더 강화하기 위한 방법들에 대해서 정리함"
author: "미물"
authorURL: "https://mimul.com"
date: "2011-06-09T23:03:31.000Z"
lastModificationTime: "2011-06-09T23:03:31.000Z"
image: "/img/blog/password.jpg"
commentId: "avoid-password-security-issuesd-2011-06-09"
tags:
  - Security
  - Password
  - Salt
---

최근 들어서 개인 정보 유출 등으로 인해 개인 정보 암호화 방법에 대해서 많이들 고민할 것입니다. 그 중에서 가장 중요하게 생각하는 것 중에 하나가 사용자의 패스워드인데, 과거에는 대부분 해시 MD5, SHA1 또는 SHA-256을 사용하고 있고, 좀 더 안다는 고급 개발자들이 있는 기업들만이 패스워드에 salt를 넣어 사용하고 있는 것으로 파악됩니다.(제가 잘못 알고 있을수도 있습니다.)
그러나 SHA1 + salt도 이젠 안전하다고 볼 수 없습니다. 그 근거는 아래에 기술하도록 하겠습니다.

#### SHA1 + salt로 패스워드 보안 이슈 회피가 가능한가?

MD5, SHA1 또는 SHA-256 알고리즘은 보안이 우수하지 않다는 것은 다음 사이트에서 테스트해 보면 알 수 있습니다. "http://google.com"을 MD5 인코딩한 값(c7b920f57e553df2bb68272f61570210)을 [md5.rednoize.com 사이트](http://md5.rednoize.com/)에 넣고 검색 버튼을 클릭하면 바로 복호화되어 나옵니다.

이 [md5.rednoize.com](http://md5.rednoize.com/)은 원본 데이터와 해시값의 데이터베이스를 참조해, 등록된 것은 즉시 해시값에서 데이터로 변환되어 출력하게 되는 구조입니다. 딕셔너리가 많이 확보되면 쉽게 패스워드를 풀 수 있게 된다는 소리도 됩니다.

이처럼 Rainbow Table("해시값이 이것이면, 암호는 이것"라는 테이블)을 사용해 일방향 암호화 기술을 무력화하게 됩니다. 이것만으로 보아도 일방향 암호화 알고리즘으로 MD5, SHA1 또는 SHA-256은 이제 한물간 일방향 암호화 알고리즘이라는 것을 쉽게 알 수 있죠.

그래서 보완책으로 나온 것이 SHA1 + salt입니다. salt를 붙이는 것으로, Rainbow Table 사용 접근 방식을 실질적으로 사용할 수 없게 하는 것으로 생각해 왔습니다.
SHA1 + salt의 처리방식은 아래와 같습니다.

```php
$salt = "this is a salt";
$password = 'this is an password';
$hash = sha1($salt.$password);
```

자! 이 방법 또한 [여기](http://www.golubev.com/hashgpu.htm)를 보듯이 GPU가 장착된 디바이스로 병렬처리하면 초당 수억건의 처리가 가능해 무력화 기술에 의해 무너질 수 있습니다. 이렇게 되면 딕셔너리 공격과 무력의 기술을 결합하여 많은 계정을 가진 대형 사이트에서도 상당한 양의 암호를 해독하는데, 그리 오랜 시간이 걸리지 않을 것입니다.

#### 현재까지의 좀 더 강화된 방법으로는 뭐가 있을까요?

- 각 사용자에게 고유 salt 값과 반복 횟수를 마련하는 것이고.
- 좀 더 강력한 PBKDF2(http://en.wikipedia.org/wiki/PBKDF2), Bcrypt(http://www.openwall.com/crypt/), HMAC(http://en.wikipedia.org/wiki/HMAC)를 사용하는 것.
- 불편하더라도 사용자에게 강한 강도의 패스워드를 받도록 유도하는 것.

정도가 될 것으로 보입니다.

#### PBKDF2 사용 샘플(Java)
```java
public class PBKDF2 {

	//임의 salt를 생성
    private static byte[] createSalt() throws NoSuchAlgorithmException {
        SecureRandom random = SecureRandom.getInstance("SHA1PRNG");
        byte[] salt = new byte[32];
        random.nextBytes(salt);
        return salt;
    }

    private static byte[] pbkdf2(char[] password, byte[] salt)
     throws InvalidKeySpecException, NoSuchAlgorithmException {
        SecretKeyFactory sf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1");
        // 반복 횟수 : 10000 번 결과 길이 : 256bit
        KeySpec ks = new PBEKeySpec(password, salt, 10000, 256);
        SecretKey sk = sf.generateSecret(ks);
        return sk.getEncoded();
    }

    private static void logging(String format, Object ... args) {
        System.out.printf(format + "%n", args);
    }

    public static void main(String[] args)
     throws NoSuchAlgorithmException, InvalidKeySpecException {
        String p1 = args[0];
        String p2 = args[1];
        logging("password 1= %s", p1);
        logging("password 2= %s", p2);

        byte[] salt = createSalt();
        logging("salt: %s", Arrays.toString(salt));

        byte[] d1 = pbkdf2(p1.toCharArray(), salt);
        byte[] d2 = pbkdf2(p2.toCharArray(), salt);
        logging("derived 1= %s", Arrays.toString(d1));
        logging("derived 2= %s", Arrays.toString(d2));
    }
}
```

위의 10000이라는 숫자가 반복횟수이므로 이를 증가시켜 안전성을 높일 수 있습니다. 이 수를 사용자별로 데이터베이스에 저장하여 두면 중간에 반복 횟수를 높이고 안전성을 향상시킬 수도 있습니다.

#### 참조사이트

- [PBKDF2](http://en.wikipedia.org/wiki/PBKDF2)
- [Bcrypt](http://www.openwall.com/crypt/)
- [HMAC](http://en.wikipedia.org/wiki/HMAC)
- [Are you sure SHA-1+salt is enough for passwords?](http://www.f-secure.com/weblog/archives/00002095.html)
