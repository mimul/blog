---
templateKey: "blog-post"
title: "README가 대문자인 이유"
description: "README가 뭐에 쓰는 물건이꼬."
author: "미물"
authorURL: "https://mimul.com"
date: "2009-07-05T03:15:29.000Z"
lastModificationTime: "2009-07-05T03:15:29.000Z"
image: "/img/blog/readme.png"
commentId: "why-readme-is-uppercase-2009-07-05"
tags:
  - Programming
---


README 파일은 해당 디렉토리나 아카입의 소프트웨어에 대한 정보를 기술하는 파일이다. 그런데 왜 대문자로 구성되어 있는지 확인해 보니...

[위키](https://en.wikipedia.org/wiki/README)에 그 사례가 실려져 있었다.

> It is traditionally written in upper case so that on case-preserving environments using an ASCIIbetical ordering, the name will appear near the beginning of a directory listing (since upper-case letters sort before lower-case letters in ASCIIbetical ordering).

ASCII 코드 순으로 정렬되는 환경을 채택한 곳에서는 README 파일이 제일 앞에 보이게 하기 위해서 전통적으로 대문자를 쓰게 된다.

그래서 맥에서 LANG=C이나 LC_COLLATE=C 환경에서 ls -l를 실행해 보니:

```bash
$ ls -l
total 7656
-rw-r--r--   1 pepsi  staff    16317 Jul 23  2013 README.md
drwxr-xr-x  11 pepsi  staff      374 Jul 27  2013 bin
-rw-r--r--   1 pepsi  staff     1316 Jul 23  2013 build.xml
```

ASCII 문자 코드 순으로 README가 맨 먼저 보여지게 된다. 결국, README의 대문자 관습이 존재 의미를 더욱 부각시켜 주는 거 같다.
