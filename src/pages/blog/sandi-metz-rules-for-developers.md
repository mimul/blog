---
templateKey: "blog-post"
title: "개발자들을 위한 Sandi Metz 룰(코딩 가이드 5가지)"
description: "Sandi Metz가 Ruby Rogues 팟 캐스트에서 소개한 루비 개발자들을 위한 룰(5가지)에 대해 재밌는 내용을 소개"
author: "미물"
authorURL: "https://mimul.com"
date: "2013-05-18T17:33:39.000Z"
lastModificationTime: "2013-05-18T17:33:39.000Z"
image: "/img/topics/ruby.png"
commentId: "sandi-metz-rules-for-developers-2013-05-18"
tags:
  - ruby
  - Programming
---

Sandi Metz가 Ruby Rogues 팟 캐스트에서 소개한 [루비 개발자들을 위한 룰](https://thoughtbot.com/blog/sandi-metz-rules-for-developers)에 대해 재밌는 내용을 소개한다. 참고로 객체 지향 개발자들에게도 응용해 보면 좋은 코딩 가이드가 되지 않을까 생각해 보게 된다.

주요 룰은 아래와 같다.

**1. 클래스의 코드 라인은 100라인 이상이 되면 안된다.**

**2. 메소드는 5라인을 넘어설 수 없다.**

**3. 메소드의 인자는 4개보다 많으면 안된다.(해시 옵션도 매개변수로 간주)**

**4. 콘트롤러는 단 하나의 객체만 인스턴스화 할 수 있다.**

- 뷰는 하나의 인스턴스 변수를 참조하고 해당 객체에 대해 메세지 전송만 할 수 있다```ruby @object.collaborator.value```는 허용되지 않음)

**5. 마지막으로 위 4가지 룰을 깰 수 있는 경우를 정의해 두었는데, 이것이 0번 룰이다.**

- 합리적인 이유가 존재하는 경우
- 페어 프로그래밍 파트너가 허용하는 경우

이렇게 했더니 다음과 같은 결과를 얻을 수 있었다고 하네요.

**1. 클래스의 코드 라인은 100라인 이상이 되면 안된다.**

Single Responsibility Principle (단일 책임 원칙)을 철저하게 지키게 되었고,

테스트의 경우에도 하나의 소스 파일에 너무나 많은 기능들을 테스트했을 때보다 가눙울 쪼개고, 특징화된 것들을 집중화함으로써 git diff를 더이상 하지 않아도 된다.

**2. 메소드는 5라인을 넘어설 수 없다.**

if ~ else ~ end와 if ~ elsif ~ end는 기본 5라인을 차지하므로 될 수 있으면 사용을 안하게 되었다. 즉, 조건 분기 대신에 적절한 이름의 private 메소드를 사용했다.

```ruby
def validate_actor
  if actor_type == 'Group'
    user_must_belong_to_group
  elsif actor_type == 'User'
    user_must_be_the_same_as_actor
  end
end
```

private 메소드로 세분화하니, 함수 이름에 맞는 정확한 기능을 구현하는 버릇이 생겨 문서화 및 가독성이 좋아졌다.

**3. 메소드의 인자는 4개보다 많으면 안된다.**

link_to나 form_for같은 View helpers는 정확하게 동작하게 하기 위해서는 많은 인자들이 필요한데, 좋은 해결책을 찾을 수 없는 경우 룰 0을 적용해 그대로 사용하기도 한다.

**4. 콘트롤러는 단 하나의 객체만 인스턴스화할 수 있다.**

보통은 하나의 컨트롤러가 하나의 객체 뷰를 전달하도록 설계를 하지만, 실제는 그렇지 않은 경우도 있다. 예를 들어 초기페이지에 피드 정보와 알림 수를 표시하는 경우가 있을 것이다. thoughtbot에서는 이러한 경우에 Facade 패턴을 적용해 활동 피드와 알림 수를 결합한 대시 보드 클래스를 정의하여 컨트롤러와 뷰 간의 상호 연동을 단순화 시켰다.

아래는 4번 룰의 예제를 보여주고 있다.

- app/facades/dashboard.rb

```ruby
class Dashboard
  def initialize(user)
    @user = user
  end

  def new_status
    @new_status ||= Status.new
  end

  def statuses
    Status.for(user)
  end

  def notifications
    @notifications ||= user.notifications
  end

  private

  attr_reader :user
end
```

- app/controllers/dashboards_controller.rb

```ruby
class DashboardsController < ApplicationController
  before_filter :authorize

  def show
    @dashboard = Dashboard.new(current_user)
  end
end
```

- app/views/dashboards/show.html.erb

```
<%= render 'profile' %>
<%= render 'groups', groups: @dashboard.group %>

<%= render 'statuses/form', status: @dashboard.new_status %>
<%= render 'statuses', statuses: @dashboard.statuses %>
```
