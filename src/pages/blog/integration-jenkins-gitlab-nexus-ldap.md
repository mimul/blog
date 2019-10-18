---
templateKey: "blog-post"
title: "LDAP 설치 및 설정부터 Jenkins, Gitlab, Nexus 연동까지"
description: "LDAP 서버를 구축해 Gitlab, Jenkins, Nexus, 그리고 자체 B2B 기업 소프트웨어 인증 및 권한 플러그인 개발 등에 활용함."
author: "미물"
authorURL: "https://mimul.com"
date: "2010-02-05T01:00:17.000Z"
lastModificationTime: "2010-02-05T01:00:17.000Z"
image: "/img/blog/ldap_gitlab.png"
commentId: "integration-jenkins-gitlab-nexus-ldap-2010-02-05"
tags:
  - Ldap
  - Jenkins
  - Gitlab
  - Nexus
---
Google이 3rd Party용 무료 이메일을 지원하지 않은 이유로 자체 LDAP(Open LDAP)기반의 메일 서버를 운영하는 스타트업이 있을 것입니다. 저희도 내부 시스템 정비 차원에서 LDAP을 도입했습니다. 그리고 B2B 소프트웨어를 만들어서 기업에 포팅하다보면 기존 기업의 사내 LDAP 연동을 통해 인증과 권한 관리 기능을 자체 제품에 녹아내려면 LDAP 기반의 메일 및 사내 직원 인증 서버를 구축해서 테스트하기에도 용이합니다.

LDAP은 메일(Postfix + Dovecot) 발송/수신/인증 서버, Gitlab(소스 저장소), Jenkins(빌드), Nexus 등의 시스템과 인증 부분을 연동해서 사용하고 있습니다.
이후부터는 LDAP을 사용하기 위한 설치 및 설정 방법을 기술합니다.

#### OpenLDAP 설치

**1)  패키지를 설치**
```bash
$ yum install openldap-servers openldap-clients

$ cp /usr/share/openldap-servers/DB_CONFIG.example
  /var/lib/ldap/DB_CONFIG
$ cp /usr/share/openldap-servers/slapd.conf.obsolete
  /etc/openldap/slapd.conf
$ chown -R ldap:ldap /var/lib/ldap/
$ vi /etc/openldap/slapd.conf
suffix      "dc=wiseeco,dc=local"
rootdn      "cn=manager,dc=wiseeco,dc=local"
rootpw      {SSHA}XzUYgQ32mglF6HzSTnqA1Dc4Qy/Q9oFz
access to dn.subtree="dc=mail,dc=wiseeco,dc=local" attrs=userPassword
    by self write
    by anonymous auth
    by * none
access to *
    by self write
    by * read

$ chmod 600 /var/lib/ldap/DB_CONFIG
$ chown -Rv ldap:ldap /var/lib/ldap /etc/openldap/slapd.d
$ chkconfig slapd on
$ service slapd start
$ slaptest -f slapd.conf -F /etc/openldap/slapd.d/
```

**2) slapd.conf 의 rootpw에는 암호화된 문자열 생성 방법**

```bash
$ slappasswd -h {SSHA} -s password
{SSHA}XzUYgQ32mglF6HzSTnqA1Dc4Qy/Q9oFz
```

**3) index의 재구성**

```bash
$ service slapd stop
$ slapindex -v -b dc=wiseeco,dc=local -f slapd.conf
$ service slapd start
$ ldapsearch -x -b 'dc=mail,dc=wiseeco,dc=local'
```

#### 스키마 정의(mail.schema)
```bash
$ cd /etc/openldap/schema
$ vi mail.schema
attributetype (1.1.2.1.1.1 NAME 'mailForward'
    DESC 'forward address'
    EQUALITY caseExactIA5Match
    SYNTAX 1.3.6.1.4.1.1466.115.121.1.26)

attributetype (1.1.2.1.1.2 NAME 'mailAlias'
    DESC 'alias address'
    EQUALITY caseExactIA5Match
    SYNTAX 1.3.6.1.4.1.1466.115.121.1.26)

attributetype (1.1.2.1.1.3 NAME 'accountActive'
    DESC 'active or not active'
    EQUALITY booleanMatch
    SYNTAX 1.3.6.1.4.1.1466.115.121.1.7 SINGLE-VALUE)

attributetype (1.1.2.1.1.4 NAME 'domainName'
    DESC 'domain name'
    EQUALITY caseIgnoreIA5Match
    SYNTAX 1.3.6.1.4.1.1466.115.121.1.26 SINGLE-VALUE)

attributetype (1.1.2.1.1.5 NAME 'transport'
    DESC 'transport'
    EQUALITY caseIgnoreIA5Match
    SYNTAX 1.3.6.1.4.1.1466.115.121.1.26)

attributetype (1.1.2.1.1.6 NAME 'mailQuota'
    DESC 'Mail Home Directory Max byte'
    EQUALITY integerMatch    SYNTAX 1.3.6.1.4.1.1466.115.121.1.27 SINGLE-VALUE)

attributetype (1.1.2.1.1.7 NAME 'mailDrop'
    DESC 'drop address'
    EQUALITY caseExactIA5Match
    SYNTAX 1.3.6.1.4.1.1466.115.121.1.26)

objectClass (1.1.2.2.1.1 NAME 'mailUser'
    DESC 'mail user Object'
    SUP inetOrgPerson
    MUST ( transport $ homeDirectory $ accountActive
     $ domainName $ userPassword $ mailQuota )
    MAY  ( mailForward $ mailAlias ))

objectClass (1.1.2.2.1.2 NAME 'mailGroup'
   DESC 'ML Group Account Object'
   SUP inetOrgPerson
   MUST ( accountActive $ domainName $ mailDrop ))
```

#### mail.schema 설명

**1) 스키마의 데이터 속성(attributetype)**

| Attribute     | 설명                                 | 참조        |
| ------------- | ----------------------------------- | ---------- |
| transport     | SMTP의 transport 설정                 | Postfix    |
| domainName    | 도메인 이름                            | Postfix    |
| accountActive | 계정의 활성화/비활성화를 TRUE/FALSE로 지정  | Dovecot    |
| mailQuota     | 사서함 용량                            | Dovecot    |
| mailForward   | 포워딩 메일 주소                        | Postfix    |
| mailAlias     | 이메일 별칭                            | Postfix    |

**2) 객체 클래스**

| objectClass   | 설명                                 |
| ------------- | ----------------------------------- |
| mailUser      | 사용자 이메일 계정                       |

**3) OpenLDAP 설정**

OpenLDAP의 slapd.conf에서 mail.schema의 include함
```bash
$ vi slapd.conf
include  /etc/openldap/schema/mail.schema
```

#### 데이터 준비

**1) TOP 트리 데이터 작성(top.ldif)**

```bash
dn: dc=wiseeco,dc=local
dc: wiseeco
objectClass: dcObject
objectClass: organization
o: wiseeco

dn: dc=mail,dc=wiseeco,dc=local
objectClass: dcObject
objectClass: organization
dc: mail
o: mail
```

**2) 도메인의 데이터 작성(domain.ldif)**

```bash
dn: ou=wiseeco.com,dc=mail,dc=wiseeco,dc=local
ou: wiseeco.com
objectClass: organizationalUnit

dn: ou=mimul.com,dc=mail,dc=wiseeco,dc=local
ou: mimul.com
objectClass: organizationalUnit
```

**3) 사용자 데이터 작성(user.ldif)**

| Attribute     | 설명                                 | 값 예                                  |
| ------------- | ----------------------------------- | ------------------------------------- |
| cn            | 전체 이름                             | 홍길동                                  |
| sn            | 성                                  | 홍                                     |
| uid           | 사용자 ID                             | mimul                                 |
| userPasswor   | 패스워드                               | {SSHA}kb5KrdmDd0ZREoIIfz6BAe94pJvBuQeG|
| homeDirectory | 사용자 홈 디렉토리                       | /home/mailbox/wiseeco.com/mimul       |
| mail          | 사용자의 이메일 주소                      | mimul@wiseeco.com                     |
| mailForword   | 이메일 포워딩 주소                       | hahojin@gmail.com                     |
| mailAlias     | 이메일 별칭                            | webmaster@wiseeco.com                 |
| accountActiv  | 계정의 활성화/비활성화를 TRUE/FALSE로 지정	| TRUE                                  |
| domainName    | 소속 도메인 이름(dn의 dc값)              | wiseeco.com                           |
| mailQuota     | 메일 Quota 용량 설정(M단위)              | 100                                   |
| transport     | transport 기본적으로 dovecot 고정       | dovecot                               |
| mobile        | 핸드폰 번호                            | 010-222-3333                          |

```bash
$ vi user.ldif
dn: uid=mimul@wiseeco.com,ou=wiseeco.com,dc=mail,dc=wiseeco,dc=local
objectClass: mailUser
cn:하호진
sn:하
uid: mimul
userPassword: {SSHA}GO+oB9xnedb2CiOB741ZlNO6Rm/VCs+k
homeDirectory: /home/mailbox/wiseeco.com/mimul
mail: mimul@wiseeco.com
mailAlias: webmaster@wiseeco.com
accountActive: TRUE
domainName: wiseeco.com
mailQuota: 200
transport: dovecot
mobile: 010-222-3333

dn: uid=sjune@wiseeco.com,ou=wiseeco.com,dc=mail,dc=wiseeco,dc=local
objectClass: mailUser
cn:김선준
sn:김
uid: sjune
userPassword: {SSHA}zpZayqcyHJCzEUCtzbDhuSwQPOeDpbra
homeDirectory: /home/mailbox/wiseeco.com/sjune
mail: sjune@wiseeco.com
accountActive: TRUE
domainName: wiseeco.com
mailQuota: 100
transport: dovecot
mobile: 010-222-3333

dn: uid=pepsi@mimul.com,ou=mimul.com,dc=mail,dc=wiseeco,dc=local
objectClass: mailUser
cn:미물
sn:하
uid: pepsi
userPassword: {SSHA}4aHUI5Q3vCyKTOM8xxYya7/XFMVNJSv4
homeDirectory: /home/mailbox/mimul.com/pepsi
mail: pepsi@mimul.com
accountActive: TRUE
domainName: mimul.com
mailQuota: 100
transport: dovecot
mobile: 010-222-3333
```

#### 작성 데이터 등록

데이터 등록은 ldapadd 커맨드를 통해 진행한다.

```bash
$ ldapadd -x -h localhost -D "cn=manager,dc=wiseeco,dc=local"
 -w password -f top.ldif
adding new entry "dc=wiseeco,dc=local "
adding new entry "dc=mail,dc=wiseeco,dc=local"

$ ldapadd -x -h localhost -D "cn=Manager,dc=wiseeco,dc=local"
 -w password -f domain.ldif
adding new entry "ou=wiseeco.com,dc=mail,dc=wiseeco,dc=local"
adding new entry "ou=mimul.com,dc=mail,dc=wiseeco,dc=local"

$ ldapadd -x -h localhost -D "cn=Manager,dc=wiseeco,dc=local"
 -w password -f user.ldif
adding new entry "uid=mimul,ou=wiseeco.com,dc=mail,dc=wiseeco,dc=local"
adding new entry "uid=sjune,ou=wiseeco.com,dc=mail,dc=wiseeco,dc=local"
adding new entry "uid=pepsi,ou=mimul.com,dc=mail,dc=wiseeco,dc=local"
```

#### 등록 데이터 검색

**1) Ldap 커맨드에 의핸 사용자 조회**

```bash
$ ldapsearch -p 389 -h 127.0.0.1 -D "cn=manager,dc=wiseeco,dc=local"
  -w password -b "ou=mimul.com,dc=mail,dc=wiseeco,dc=local" -x "uid=pepsi"
# extended LDIF
#
# LDAPv3
# base  with scope subtree
# filter: uid=pepsi
# requesting: ALL
#

# pepsi, mimul.com, mail.wiseeco.local
dn: uid=pepsi,ou=mimul.com,dc=mail,dc=wiseeco,dc=local
objectClass: mailUser
cn:: 7ZWY7Zi47KeE
sn:: 7ZWY
userPassword:: e1NTSEF9NGFIVUk1UTN2Q3lLVE9NOHh4WXlhNy9YRk1WTkpTdjQ=
homeDirectory: /home/mailbox/mimul.com/pepsi
mail: pepsi@mimul.com
accountActive: TRUE
domainName: mimul.com
mailQuota: 100
transport: dovecot
uid: pepsi
mobile: 010-222-3333

# search result
search: 2
result: 0 Success

# numResponses: 2
# numEntries: 1
```

**2) Apache LDAP Studio 툴로 조회**

LDAP툴은 Apache Directory Studio™제일 좋아 보이니 다운받아서 사용하세요. 맥용, 윈도우용 다 있습니다.

#### 외부 시스템 연동

**1) Gitlab LDAP 연동(gitlab.yml)**

```bash
ldap:
  enabled: true
  host: 'localhost'
  base: 'ou=wiseeco.com,dc=mail,dc=wiseeco,dc=local'
  port: 389
  uid: 'uid'
  method: 'plain' # "ssl" or "plain"
  bind_dn: 'cn=manager,dc=wiseeco,dc=local'
  password: 'password'
  allow_username_or_email_login: true
```

**2) Jenkins LDAP 연동**

Configure Global Security>Access Control>Security Realm>LDAP 선택하고 설정 정보는 아래와 같다.

```bash
서버 : ldap://localhost
root DN : dc=wiseeco,dc=local
User search filter : uid={0}
Manager DN : cn=manager,dc=wiseeco,dc=local
Manager Password : password
Display Name LDAP attribute : cn
Email Address LDAP attribute : mail
```
