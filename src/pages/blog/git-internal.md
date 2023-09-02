---
templateKey: "blog-post"
title: "Git의 내부 구조"
description: "Git을 잘 사용할 목적으로 Git의 내부 동작 구조에 대해 학습한 내용을 공유."
author: "미물"
authorURL: "https://mimul.com"
date: "2018-08-11T19:39:18.000Z"
lastModificationTime: "2018-08-12T10:40:53.000Z"
image: "/img/blog/git_tree.png"
commentId: "git-internal-2018-08-11"
tags:
  - Git
---

Git에 대해 좀 더 알기 위해 Git의 내부 구조와 커밋 정보들이 어떤 식으로 관리되는지 알아보았고 Git의 내부 동작 방식과 용어들을 정리해 봤다.

## Git 객체 종류

Git은 버전 관리에 필요한 데이터를 주로 "객체"라는 개념으로 표현하고 .git/objects 디렉토리에서 관리한다. 객체에는 다음의 4종류가 있다.

| 객체명  | 설명                           |
| :----  | :---------------------------- |
|blob    | 파일 정보가 들어 있는 객체(백업)     |
|tree    | 디렉토리 정보가 들어 있는 객체       |
|commit  | 커밋 정보가 들어 있는 객체          |
|tag     | annotated tag 정보가 들어 있는 객체|

Git은 일종의 Key-Value Store 로 이러한 객체들을 관리한다. Git에서 Key는 객체의 내용에 대한 SHA-1 해시 값으로 만들어지고 Value는 객체의 내용이다. Value 객체 만들기의 흐름은 다음과 같다.

- 객체의 내용을 SHA-1 해시화한 값을 Key로 한다.
- 객체를 zlib 압축 한 후 .git/objects/아래에 Key 이름으로 파일로 저장한다.
- 검색 효율성을 위해 Key의 처음 2자로 서브디렉토리를 자른다.

다음은 .git/objects/의 예이다. Key를 사용하면 언제든지 객체의 내용(Value)에 액세스할 수 있게 되어 있다.

```
❯ tree .git/
.git/
├── objects
│   ├── 29
│   │   └── 8081dc5a03ae16630d97b4d423c0809071063a
│   ├── 2a
│   │   └── b32a210b3f09052e80e5113e4be2482bee87c0
│   ├── 30
│   │   └── d1b6685b445e01849a96630bd9c956056af041
│   ├── 36
│   │   └── 3cb224f29afec235f182ca49b3baac7a55168b
│   ├── 52
│   │   └── efbb6655fd1de324e0a3812214e25767148a97
│   ├── 53
│   │   └── 02c75713d8654667df124a248f22c3f30eca7b
│   ├── 6d
│   │   └── e6602381366163479a696aa3e2b0003901268a
│   ├── 89
│   │   └── aeb7a425b7a77ccf77c1c4e089e2750d4bfd47
│   ├── 8b
│   │   └── ddc2f28bff2083e9cfdd3cde4cca0bebffab67
│   ├── 8d
│   │   └── 6b5963bf41574db2f6a2d7ef0259c835631c04
│   ├── 98
│   │   └── cbb861cff52704d48c1fdc51248ca611892282
│   ├── a1
│   │   └── 5cd10c25a390c257213a35d89acc1102611230
│   ├── b0
│   │   └── da5ab945eb4b38ffad0ec1ebbee0f5db01ba97
│   ├── cc
│   │   └── 14f0cbaf8e95d0cd922645f97d295eae450738
│   ├── cf
│   │   └── 123dceca076853a3d5ba3ae73035c0073ae241
│   ├── de
│   │   └── f6ef16b268548bce74c909559e891000f68d65
│   ├── e2
│   │   └── 574cba2448d8f9b1e1a687d233665671206bd0
│   ├── e6
│   │   ├── 5940cccf4aa6b5da4974d0105cb45aeaade255
│   │   └── 9de29bb2d1d6434b8b29ae775ad8c2e48c5391
│   ├── e9
│   │   └── d7edf51e3158b7b2d015c6d7d5968628251872
│   ├── ec
│   │   └── 5a9bbaade2a8060fb74cc1d389a6d6b0fdaac9
│   ├── fe
│   │   └── 1724d596d5a569b7ec44fa9b5412e019fee168
│   ├── info
│   └── pack
│       ├── pack-fb5e8e57e7985f813ad990160834476f1e1e9069.idx
│       └── pack-fb5e8e57e7985f813ad990160834476f1e1e9069.pack
```

위 트리의 각 객체에 대해 설명할 것이다. 따라해 보실분은 해당 git 리포지토리를 clone해 따라하면 된다. git clone을 하면 Git의 객체 파일은 압축된 상태로 전송된다(packfile). 그러므로 clone 뿐만 아니라 다음의 순서로 언팩할 필요가 있다.

```
$ git clone git@github.com:mimul/git-intro.git

# 빈 리포지토리 준비
$ mkdir git-temp && cd git-temp
$ git init
# clone 한 리포지토리의 packfile을 unpack하고 object 파일을 확장
$ git unpack-objects < ../git-intro/.git/objects/pack/pack-fb5e8e57e7985f813ad990160834476f1e1e9069.pack

# 원본 리포지토리로 개체 파일 전송
$ find .git/objects -not -name 'pack' -a -not -name 'info' -type d -mindepth 1 | xargs -I {} mv {} ../git-intro/.git/objects/
$ cd ../git-intro
```

이렇게하면 보고 싶은 objects를 모두 꺼낼 수 있는 상태가 된다.

## Git 객체의 기본 구성

객체는 먼저 객체의 종류나 크기 등의 메타 데이터가 기록되고 그 뒤에 컨텐츠가 계속된다.
| 구분 | 설명|
| :---- | :--------------------------- |
|개체 유형 | blob/tree/commit/tag        |
|객체 크기 | 숫자(단위는 byte)               |
|객체 내용 | 객체 유형에 따라 다름            |

**1. blob 객체**

blob 객체는 파일의 실제 백업에 해당하는 객체이다. 사실, Key=fe1724d596d5a569b7ec44fa9b5412e019fee168의 객체에 대해 살펴 보겠다. 이것은 intro.txt에 해당하는 blob 객체이다.

```
❯ cat .git/objects/fe/1724d596d5a569b7ec44fa9b5412e019fee168 | pigz -d
blob 22git intro page
hello!
```

기본 구성에서 설명한 것처럼 파일의 시작 부분에 객체 유형과 파일 크기가 붙은 파일이 기록되어 있음을 알 수 있다. 다음으로 Key=363cb224f29afec235f182ca49b3baac7a55168b 객체에 대해서도 조회해 본다.

```
❯ cat .git/objects/36/3cb224f29afec235f182ca49b3baac7a55168b | pigz -d
blob 29git intro page
hello!
world!
```

이 두 가지는 모두 intro.txt에 대한 blob 객체이다. 여기서 blob 객체는 파일의 차이가 아니라 어느 시점에서 파일의 내용 그 자체를 기록하고 있는 것을 알 수 있다. 많이들 오해하고 있는 부분이다.

```
# t 옵션은 객체의 종류
❯ git cat-file -t 363cb224f29afec235f182ca49b3baac7a55168b
blob
# s 옵션은 객체의 크기
❯ git cat-file -s 363cb224f29afec235f182ca49b3baac7a55168b
29
# p 옵션은 객체의 내용
❯ git cat-file -p 363cb224f29afec235f182ca49b3baac7a55168b
git intro page
hello!
world!
```

**2. tree 객체**

트리 객체 Key=298081dc5a03ae16630d97b4d423c0809071063a 살펴보면

```
❯ git cat-file -t 298081dc5a03ae16630d97b4d423c0809071063a
tree
❯ git cat-file -s 298081dc5a03ae16630d97b4d423c0809071063a
76
❯ git cat-file -p 298081dc5a03ae16630d97b4d423c0809071063a
100644 blob b0da5ab945eb4b38ffad0ec1ebbee0f5db01ba97    intro1.txt
100644 blob e65940cccf4aa6b5da4974d0105cb45aeaade255    intro2.txt
```

tree 객체는 디렉토리의 정보를 보관 유지하고 있다. 여기는 desc 디렉토리의 어느 시점의 tree 객체이다. 이 tree 객체가 만들어지면 그 디렉토리에 존재하는 파일과 그 버전의 blob 해시값(Key)이 기록된다. 이 Key에서 해당 blob 객체에 액세스할 수 있다. 덧붙여서 리포지토리의 루트 디렉토리에 대응하는 tree 객체는 아래와 같다.

```
❯ git cat-file -p 6de6602381366163479a696aa3e2b0003901268a
100644 blob 30d1b6685b445e01849a96630bd9c956056af041  README.md
040000 tree 298081dc5a03ae16630d97b4d423c0809071063a  desc
100644 blob 363cb224f29afec235f182ca49b3baac7a55168b  intro.txt
```

이것을 보면, 방금 전의 desc 디렉토리에 관한 tree 객체의 참조(Key=298081dc5a03ae16630d97b4d423c0809071063a)도 보관 유지하고 있는 것을 알 수 있다. 루트 디렉토리의 트리 객체가 있으면 거기에서 추적하여 리포지토리의 모든 파일에 액세스 할 수 있다. 이렇게보면 Git은 하나의 파일 시스템이다.

![Git Tree](/img/blog/git_tree.png)

**3. commit 객체**

다음으로 commit 객체(Key=8bddc2f28bff2083e9cfdd3cde4cca0bebffab67)를 살펴보자.

```
❯ git cat-file -p 8bddc2f28bff2083e9cfdd3cde4cca0bebffab67
tree 89aeb7a425b7a77ccf77c1c4e089e2750d4bfd47
parent 98cbb861cff52704d48c1fdc51248ca611892282
author mimul <mimul@fittobe.com> 1678184776 +0900
committer mimul <mimul@fittobe.com> 1678184776 +0900

add intro2.txt
```

위에서 출력된 정보를 정리하면 commit 객체에 포함된 정보는 다음과 같다.

- 리포지토리의 루트 디렉터리에서 tree 객체의 해시 값(Key)
- 상위 commit 해시 값
- committer와 author 타임 스탬프, 이름, 이메일 주소
- 커밋 메시지

이 중 하나라도 변경하면(SHA-1이 충돌하지 않는 한) 다른 commit 해시가 되므로 커밋은 고유하게 관리가 된다. 또한 부모 커밋의 해시도 포함하고 있기 때문에 변조에 강하다는 특징도 있다.

커밋의 메커니즘은 여기까지 설명한 3개의 객체를 사용하면 커밋의 구조를 실현할 수 있다. 커밋에는 크게 세가지 단계가 있다.

1. 코드 편집
2. 편집한 코드를 추가
3. commit

2단계에서 편집한 코드가 add 된다. 이때 Git 내부에서는 무슨 일이 이루어지나 보면 커밋에 포함할 파일을 index에 등록하게 된다. 인덱스의 정보는 .git/index에 기록되어 있고 객체와 같이 봐야 한다.

```
❯ cat .git/index
?�5*��������@0Ѷh[D^���c
?�52������6<�$���5��I���zU���Udeintro.txtTREE64 1
m�`#�6acG�ij��9&�desc2 0
���#���q:��
           �d�(8���Gc~.F@
```

바이너리 파일이므로, 그대로 cat하면 깨져서 보인다. index의 내용을 보기 위한 또 다른 방법은 아래와 같다.

```
❯ git ls-files --stage
100644 30d1b6685b445e01849a96630bd9c956056af041 0   README.md
100644 b0da5ab945eb4b38ffad0ec1ebbee0f5db01ba97 0   desc/intro1.txt
100644 e65940cccf4aa6b5da4974d0105cb45aeaade255 0   desc/intro2.txt
100644 363cb224f29afec235f182ca49b3baac7a55168b 0   intro.txt
```

왼쪽에서 파일 종류 + 권한, blob 해시, 충돌 플래그, 파일 이름이 출력된다. 인덱스에는 현재 참조하는 버전의 모든 파일에 대한 참조가 있다.

add 했을 때에 일어나는 내부 동작 방식은 기본적으로 아래와 같다.

- 색인 업데이트
- blob 객체 생성

예를 들어, 적절한 파일을 만들고 add 하면 인덱스는 다음과 같이 업데이트가 된다.

```
❯ mkdir temp
❯ echo "intro3 page" > temp/intro3.txt
❯ git add temp/intro3.txt
❯ git ls-files --stage
100644 30d1b6685b445e01849a96630bd9c956056af041 0   README.md
100644 b0da5ab945eb4b38ffad0ec1ebbee0f5db01ba97 0   desc/intro1.txt
100644 e65940cccf4aa6b5da4974d0105cb45aeaade255 0   desc/intro2.txt
100644 363cb224f29afec235f182ca49b3baac7a55168b 0   intro.txt
100644 dc55948e5ffe88ef3709161b06fa029bef4843af 0   temp/intro3.txt
```

temp/intro3.txt가 index에 추가 되었음을 알 수 있다. 또, blob 해시도 기록되고 있어 해당 Key를 보면 blob 객체도 생성되어 있는 것을 알 수 있다. 이미 있는 파일을 편집한 경우에도 새 blob 객체가 생성되고 해시값으로 다시 변경된다. 지금 새롭게 디렉토리가 추가되었지만, add 단계에서는 아직 tree 객체는 생성되지 않았다.

commit을 했을때 일어나는 내부 동작은 다음과 같다.

- index에서 트리 객체 생성
- commit 객체 생성
- HEAD를 새로운 커밋 해시로 다시 작성

첫째, tree 객체의 생성. commit하면 차이 뿐만 아니라 리포지토리의 루트 디렉토리를 포함한 모든 디렉토리의 tree 객체를 구축한다. 다만 이 때, 인덱스에 변경이 있던 부분만이 새로운 blob 및 tree 객체에 재기록 되어 그 이외의 참조가 변하지 않는 부분은 그대로 이용한다.

새 루트 디렉토리까지의 tree 객체를 생성할 수 있으면, 다음은 Commit 객체를 작성한다. 앞에서 언급했듯이 commit 객체는 리포지토리의 루트에 해당하는 트리 객체를 참조하므로 거기에서 전체 리포지토리를 따라갈 수 있으며 commit 시점의 리포지토리 상태를 재현할 수 있다. 또, 참조하고 있는 blob 객체(파일)도 차이 백업이 아니고, 변경이 있던 파일의 풀 백업이 관리된다. 즉, 커밋이란 특정 시점의 스냅샷이 관리된다고 보면 맞을 것이다. 차이을 기록하고 있는 것이 아니기에, 어떤 커밋(버전)으로 이동할 때에, 하나하나 커밋을 거슬러 차이를 적용하는 것이 아니다. Git이 checkout 등에서 다른 커밋으로 넘어갔을 때 순식간에 그 상태를 복원할 수 있는 것이 이 때문이다. Git에서는 버전 전환할 때 걸리는 시간은 이력의 갯수에 의존하는 것이 아니라 변경된 파일 수에 의존하는 것이다.

마지막으로, 현재 참조하는 커밋을 가리키기 위해 .git/HEAD에 필요에 따라 다시 쓴다.

```
❯ cat .git/HEAD
ref: refs/heads/master
```

HEAD가 특정 커밋의 해시가 아니라 위와 같이 브랜치를 참조하고 있으므로 .git/refs/heads/master가 참조하고 있는 커밋 해시를 다시 쓴다. 여기까지가 commit의 일련의 처리과정이다.

**4. 태그 객체**

마지막으로, 다른 3개의 객체에 비해 그다지 중요하지는 않지만, tag 객체에 대해서도 알아본다. 이와 관련하여 먼저 Git의 refs에 대해 설명한다.

refs는 특정 커밋을 가리키는 포인터와 같다. 커밋 해시의 별칭이라고도 할 수 있다. 구체적으로는 다음이 refs에 해당된다.

- 태그
  - light-weight tag
  - annotated tag
- branch
  - HEAD(이미 commit의 구조로 등장)

순서대로 해보면. light-weight tag을 만들고 확인해 본다. 태그를 만들면 .git/refs/tags/ 아래에 저장된다.

```
❯ git tag version-1.0
❯ git log -n 1 --oneline
26ae21e (HEAD -> master, tag: version-1.0) intro3.txt 추가
❯ cat .git/refs/tags/version-1.0
26ae21e37d1be79866c36648a3040801663f2fee
```

다음은 branch. 기본적으로 light-weight tag와 같다. 차이점은 저장 위치가 .git/refs/heads 이고 branch의 경우 그 branch에서 커밋을 실행하면 가리키는 커밋 해시가 자동으로 다시 쓰여진다.

```
❯ cat .git/refs/heads/master
26ae21e37d1be79866c36648a3040801663f2fee
```

다음은 HEAD. HEAD는 앞서 말했듯이 현재 커밋을 가리키는 refs이다.

.git/HEAD에 저장되어 있으며, commit등 checkout으로 변경된다. 또한 branch 이름 checkout 이었을 때는 커밋 해시 branch가 아닌 장소가 쓰여진다.

마지막으로 annotated tag. 다른 refs와 달리 여기는 tag 객체로 저장된다. 단순히 코멘트가 붙는 태그라고 생각하면 된다.

```
❯ git tag -a version1.0-annotated -m "message"
$ git log -n 1 --oneline
26ae21e (HEAD -> master, tag: version1.0-annotated, tag: version-1.0) intro3.txt 추가
❯ cat .git/refs/tags/version1.0-annotated
4b43180764c926dc2cfdcf5c4bccd6bc947d61ec
```

다른 refs와 달리 커밋 해시가 아닌 객체의 tag 해시가 저장된다. 객체이므로 cat-file 명령을 사용하여 내용을 살펴 보면

```
❯ git cat-file -t 4b43180764c926dc2cfdcf5c4bccd6bc947d61ec
tag
❯ git cat-file -p 4b43180764c926dc2cfdcf5c4bccd6bc947d61ec
object 26ae21e37d1be79866c36648a3040801663f2fee
type commit
tag version1.0-annotated
tagger mimul <mimul@fittobe.com> 1678785096 +0900

message
```

commit 객체와 비슷한 구조로 되어있으며 메세지 등의 정보를 기록하고 싶은 경우에는 annotated tag의 사용을 검토해보자.

다시 한번 commit의 프로세스를 정리해보면 코드를 편집하고 편집한 코드를 추가하면 add 된 파일의 blob 객체가 생성되고 색인이 업데이트 된다. 그런 후 commit을 하게되면 전체 리포지토리에 대한 tree 객체 생성하게 되고 commit 객체 생성 그리고 HEAD가 재작성 된다.
