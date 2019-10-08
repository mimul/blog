---
templateKey: 'blog-post'
title: 'Git 커맨드라인 환경에서 GUI 부럽지 않게 사용할 수 있는 몇가지 팁'
description: 'Git을 커맨드라인 방식으로 사용하신 분들을 위한 간단한 alias를 통해 GUI 부럽지 않게 사용할 수 있는 팁 몇가지 공유.'
author: '미물'
authorURL: 'https://mimul.com'
date: '2019-04-02T23:54:39.000Z'
lastModificationTime: '2019-04-02T23:54:39.000Z'
image: /img/topics/git.png
commentId: 'gui-free-tips-git-command-2019-04-02'
tags:
  - Git
---

Git을 커맨드라인 방식으로 사용하신 분들을 위한 간단한 alias를 통해 GUI 부럽지 않게 사용할 수 있는 팁 몇가지 공유합니다. 그리고 아래의 커맨드를 git 명령을 확장하는데 있어서 의존하는 도구가 있습니다. fzf와 peco 등 대화형 필터인데 이를 설치해야 합니다.

#### 1. branch 목록에서 선택 checkout 하기

- 원격을 포함한 branch 목록에서 선택한 브랜치를 checkout 할 수 있게 함.
- 동작 방식은 인자가 없는 경우 branch 목록을 fzf에 전달해서 브랜지 목록을 나열하고 선택되면 checkout하고, 인자가 있는 경우는 특별히 처리하지 않고 바로 checkout 함.

```bash
[alias]
  co = "!f() { args=$@; if [ -z \"$args\" ]; then branch=$(git branch --all | grep -v HEAD | fzf --preview 'echo {} | cut -c 3- | xargs git log --color --graph' | cut -c 3-); git checkout $(echo $branch | sed 's#remotes/[^/]*/##'); else git checkout $args; fi }; f"
```

![branch 목록에서 선택 checkout 하기](/img/blog/git_co_resize.gif)

#### 2. 커밋 로그 목록 및 해당 커멧 선택시 상세 보기

- 커밋 로그를 트리형태로 이쁘게 보여주고 해당 커밋 로그를 선택하면 상세 정보가 보임.
- 동작 방식은 왼쪽은 로그 목록은 log 명령의 옵션을 활용하여 트리 형태의 결과를 fzf에 전달하여 나열하게 하고 윈쪽 로그를 선택하면 오른쪽 화면에서는 선택된 해시값으로 해당 커밋의 상세 정보가 보이게 함.

```bash
[alias]
  lg = log --color --graph --date=short --decorate=short --pretty=format:'%C(white)%h%Creset %C(blue)%cn%Creset %C(green)%cd%Creset %C(red reverse)%d%Creset %C(reset)%s' --all
  ls = !git lg | fzf -m --ansi --layout=reverse --preview=\"echo {} | sed 's/-.*$//' | egrep -o '[0-9a-f]+' | xargs git show --color=always\" | sed 's/-.*$//' | egrep -o '[0-9a-f]+'
```

![커밋 로그 목록 및 해당 커멧 선택시 상세 보기](/img/blog/git_ls_resize.gif)

#### 3. 소스 변경 내용 더 상세하게 보기

- 소스의 차이를 파일마다 전환하면서 확인할 수 있게 해줌.
- 동작방식은 인수가 없는 경우 git status에서 Untracked 파일도 포함 소스의 차이를 표시하고 그것을 fzf에 전달해 목록을 보여주고 git di d68ab9a..ed15cc9 와 같이 인수가 있는 경우 git diff --name-status에서 차이를 가져오고 그것을 fzf에 전달 목록을 보여주고 오른쪽은 차이 상세를 보여줌.

```bash
[alias]
  di = "!f() { args=$@; [ -z \"$args\" ] && args=HEAD; ([ \"$args\" = \"HEAD\" ] && git status --short || git diff --name-status $args | sed 's/\t/  /') | fzf --preview \"echo {} | cut -c 4- | xargs git diff --color=always $args --\" --multi --height 90% | cut -c 4-; }; f"
```

![소스 변경 내용 더 상세하게 보기](/img/blog/git_di_resize.gif)

#### 4. stash 목록 보고 apply 혹은 drop

- stash 목록에 변경 내용을 포함하여 확인할 수 있음.
- 동작 방식은 stl의 경우 stash 목록을 fzf에 주고 화면 왼쪽에 표시하고 산택된 stash 항목의 상세 정보는 오른쪽에서 보여줌. sta는 stl기능에 선택된 stash를 apply하고, std는 선택된 stash 항목을 삭제함.

```bash
[alias]
  stl = !git stash list | fzf --preview 'echo {} | cut -d: -f1 | xargs git stash show -p --color=always' --height 90% | cut -d: -f1
  sta = !git stl | xargs git stash apply
  std = !git stl | xargs git stash drop
```

![stash 목록 보고 apply 혹은 drop](/img/blog/git_stl_resize.gif)
