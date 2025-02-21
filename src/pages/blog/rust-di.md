---
templateKey: "blog-post"
title: "Rust에서 Dependency Injection"
description: "Rust에서 Dependency Injection의 4가지(동적 디스패치, 정적 디스패치, Shaku, Cake Pattern) 구현 방법에 대해 정리"
author: "미물"
authorURL: "https://mimul.com"
date: "2022-07-12T23:21:50.000Z"
lastModificationTime: "2022-07-12T09:11:12.000Z"
image: "/img/topics/di.png"
commentId: "rust-di-2022-07-12"
tags:
  - Rust
  - Dependency Injection
---

일정 규모의 프로젝트를 구현하다보면 공통적으로 들어가는 기능중에 하나가 Dependency Injection이다. Rust 프로젝트에서 Dependency Injection을 적용하기 위해 여러가지 방법들을 리서치하고, 이해하는 과정을 거쳐 코드를 구현해 보고, 직접 테스트해 본 내용을 정리한다. 이 포스트의 구현 코드는 [GitHub](https://github.com/mimul/sandbox-rust)에 공유되어 있으니 필요하신 분은 테스트 해보세요.

### DI의 필요성

Dependency Injection은 Martin Fowler의 [Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html)에서 처음 언급되었다. DI를 적용하면 모듈을 외부로부터 주입시켜 느슨하게 결합시키고 종속성 관리를 쉽게 해준다. 이렇게 함으로써 책임이 명확해져서 코드의 재사용성, 확장이 쉬워지고 단위 테스트도 쉬워지고 순환 참조를 예방하게 해준다.


**1. DI 없는 순수 구현체**

Router, Service, Repository, Database 레이어가 있다고 가정하고 Router -> Service -> Repository -> Database 순으로 요청이 되고 Database -> Repository -> Service -> Router 순으로 각 레이어의 응답(결과)이 반환된다. 이것을 단순한 레이어 아키텍처인데 아래 그림과 같다.

![단순한 레이어](/img/blog/pure_layer.png)

이 레이어를 Rust에서 DI 로직을 적용하지 않은 퓨어하게 구현을 하면 아래와 같을 것이다.

```
pub trait Userpository {
  fn find_user(&self, id: String) -> Result<Option<User>>;
}

struct UserPgRepository(PgConnection);

impl UserRepository for UserPgRepository {
    fn find_user(&self, id: String) -> Result<Option<User>> {
        Ok(Some(User {
            id: "id_1".to_string(),
            status: true,
        }))
    }
}

struct UserService<U: Userpository>(T);

impl<T:Userpository> UserService<T> {
  pub fn find_user(&self, id: String) -> Result<Option<User>> {
    self.0.find_user(id)
  }
}

```

**2. DI 없는 순수 구현체의 문제점**

위의 그림처럼 단순한 레이어에서는 발생하지 않지만, 아래 그림처럼 종속성이 복잡해 질 때 발생하게 된다. UserRepository가 UserService, CompanyService 등 여러 종속성으로 확장되면 Rust의 소유권 기능이 있어서 코드를 구현하는데 난이도와 복잡성이 증가하게 된다. 해결책으로 DI를 적용하면 쉽게 종속성 관리를 해준다. 

![복잡한 레이어](/img/blog/complicated_layer.png)

DI의 구현 방법에는 여러가지 방법이 있을 수 있지만 여기에서는 4가지 방법을 다룬다.


### DI 구현 방법들


**1. 생성자 주입**

Rust언어는 생성자 기능이 없기 때문에 구조체에 직접 DI하거나, new 함수를 만들어 DI 기능을 만들 수 있다. Rust의 생성자 주입 구현 패턴에는 구조체의 필드에 어떻게 값을 갖게 하는가에 따라 정적 디스패치와 동적 디스패치가 있다.

| 방법           | 장점                                                                      | 단점                                                     |
| :-----------  | :----------------------------------------------------------------------- | :------------------------------------------------------ | 
|정적 디스패치     | 속도가 빠름                                                                 | 바이너리 사이즈의 비대화,  Function color problem 생김          | 
|동적 디스패치     | 바이너리 사이즈 비대화 안되고 파라미터에 형 인수가 불필요해 Function color problem이 적음 | 컴파일러의 최적화가 무효화 됨, 속도가 정적 디스패치에 비해 느려질 수 있음 | 


**1.1 정적 디스패치**

정적 디스패치의 특징은 제네릭의 사용이다. 아래 코드를 보면 UserService가 UserRepository 트레이트가 파라미터 형태로 건네준다.

```
pub trait UserRepository: Send + Sync + 'static {
    fn find_user(&self, id: String) -> Result<Option<User>>;
}

pub struct UserRepositoryImpl {
}

impl UserRepositoryImpl {
    pub fn new() -> Self {
        Self {  }
    }
}

impl UserRepository for UserRepositoryImpl {
    fn find_user(&self, id: String) -> Result<Option<User>> {
        Ok(Some(User {
            id: "static_id_1".to_string(),
            status: true,
        }))
    }
}

pub struct UserService<T: UserRepository> {
    user_repository: T,
}

impl<T: UserRepository> UserService<T> {
    pub fn new(user_repository: T) -> UserService<T> {
        UserService { user_repository }
    }

    pub fn find_user(&self, id: String) -> Result<Option<User>> {
        self.user_repository.find_user(id)
    }
}

#[cfg(test)]
mod tests {
    use log::info;
    use crate::static_user_repository::{UserRepository, UserRepositoryImpl};
    use crate::static_user_service::UserService;

    #[test]
    fn test_static_find_user() {
        let user_service = UserService::new(UserRepositoryImpl::new());
        let user = user_service.user_repository.find_user(String::from("static_id_1")).unwrap().unwrap();
        info!("user.id={:?}", user.id);
        assert_eq!(user.id, "static_id_1".to_string());
    }
}
```

**1.2 동적 디스패치**

동적 디스패치는 dyn 트레이트 객체를 사용한다. 정적 디스패치와 비교하면 제네릭이 UserService에서는 더 이상 필요하지 않다.


```
pub trait UserRepository: Send + Sync + 'static {
    fn find_user(&self, id: String) -> Result<Option<User>>;
}

pub struct UserRepositoryImpl {
}

impl UserRepositoryImpl {
    pub fn new() -> Self {
        Self {  }
    }
}

impl UserRepository for UserRepositoryImpl {
    fn find_user(&self, id: String) -> Result<Option<User>> {
        Ok(Some(User {
            id: "dynamic_id_1".to_string(),
            status: true,
        }))
    }
}

pub struct UserService {
    user_repository: Arc<dyn UserRepository>,
}

impl UserService {
    pub fn new(user_repository: Arc<dyn UserRepository>) -> Self {
        Self { user_repository }
    }

    pub fn find_user(&self, id: String) -> Result<Option<User>> {
        self.user_repository.find_user(id)
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;
    use log::info;
    use crate::dynamic_user_repository::UserRepositoryImpl;
    use crate::dynamic_user_service::UserService;

    #[test]
    fn test_dynamic_find_user() {
        let user_service = UserService::new(Arc::new(UserRepositoryImpl::new()));
        let user = user_service.user_repository.find_user(String::from("dynamic_id_1")).unwrap().unwrap();
        info!("user.id={:?}", user.id);
        assert_eq!(user.id, "dynamic_id_1".to_string());
    }
}
```

**1.3 정적 디스패치 vs 동적 디스패치 벤치마크 테스트**

정적 디스패치와 동적 디스패치 벤치마크 결과는 아래와 같다. 100건 처리에서 static은 79.318 ns, dynamic은 83.646 ns으로 정적 디스패치가 성능이 더 좋다.

```
Running ../benchmark/src/static_vs_dynamic_di.rs (target/release/deps/static_vs_dynamic_di-29a44d59302c13e0)

static_dispatch         time:   [79.732 ns 80.029 ns 80.330 ns]
Found 4 outliers among 100 measurements (4.00%)
  2 (2.00%) high mild
  2 (2.00%) high severe

dynamic_dispatch        time:   [81.295 ns 83.646 ns 86.867 ns]
Found 13 outliers among 100 measurements (13.00%)
  7 (7.00%) low mild
  6 (6.00%) high severe
```

**3. Shaku(DI 컨테이너)를 이용한 주입**

[Shaku](https://github.com/AzureMarker/shaku)는 Java의 Google Guice와 바슷한 DI 컨테이너 기반인데 Compile Time에 Dependency Injection을 지원해 주는 라이브러리이다.

| 방법           | 장점                                        | 단점                                                     |
| :-----------  | :----------------------------------------- | :------------------------------------------------------ | 
|Shaku          | 설정이 간단해 복잡한 시스템에도 적합함               | 구조체 DI는 지원하지 않음                                   | 

```
pub trait UserRepository: Interface {
    fn find_user(&self, id: String) -> Result<Option<User>>;
}

#[derive(Component)]
#[shaku(interface = UserRepository)]
pub struct UserRepositoryImpl {
}

impl UserRepository for UserRepositoryImpl {
    fn find_user(&self, id: String) -> Result<Option<User>> {
        Ok(Some(User {
            id: "shaku_id_1".to_string(),
            status: true,
        }))
    }
}

pub trait UserService: Interface {
    fn find_user(&self, id: String) -> Result<Option<User>>;
}

#[derive(Component)]
#[shaku(interface = UserService)]
pub struct UserServiceImpl {
    #[shaku(inject)]
    user_repository: Arc<dyn UserRepository>,
}

impl UserService for UserServiceImpl {
    fn find_user(&self, id: String) -> Result<Option<User>> {
        self.user_repository.find_user(id)
    }
}

module! {
    pub AppModule {
        components = [UserServiceImpl, UserRepositoryImpl],
        providers = []
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;
    use shaku::HasComponent;
    use crate::shaku_user_service::{AppModule, UserService};

    #[test]
    fn test_shaku_find_user() {
        let module = AppModule::builder().build();
        let user_service: Arc<dyn UserService> = module.resolve();
        let user = user_service.find_user(String::from("shaku_id_1")).unwrap().unwrap();
        assert_eq!(user.id, "shaku_id_1".to_string());
    }
}

```

**4. Cake 패턴을 이용한 주입**

Cake 패턴은 [Scala의 DI 패턴](https://jonasboner.com/real-world-scala-dependency-injection-di/)에서 유래했다. Cake Pattern에는 다음 세가지 트레이트가 필요하다.

- UsesXXX: 트레이트의 구현을 정의하는 트레이트.
- XXX: 트레이트 경계를 명시하기 위한 트레이트.
- ProvidesXXX: 의존성을 제공.

| 방법           | 장점                                        | 단점                                                     |
| :-----------  | :----------------------------------------- | :------------------------------------------------------ | 
| Cake Pattern  | 복잡하지 않고 컴파일 타임에 오류 체크 가능           | 보일러 플레이트 코드가 많음                                    | 


```
pub trait UsesRepository: Send + Sync + 'static {
    fn find_user(&self, id: String) -> Result<Option<User>>;
}
pub trait Repository {}

impl<Repository: Sync + Send + 'static> UsesRepository for Repository {
    fn find_user(&self, id: String) -> Result<Option<User>> {
        Ok(Some(User {
            id: "cake_id_1".to_string(),
            status: true,
        }))
    }
}

pub trait ProvidesRepository: Send + Sync + 'static {
    type T: UsesRepository;
    fn user_repository(&self) -> &Self::T;
}

pub trait UsesService: Send + Sync + 'static {
    fn find_user(&self, id: String) -> Result<Option<User>>;
}

pub trait Service: ProvidesRepository {}

impl<T: Service> UsesService for T {
    fn find_user(&self, id: String) -> Result<Option<User>> {
        self.user_repository().find_user(id)
    }
}

pub trait ProvidesService: Send + Sync + 'static {
    type T: UsesService;
    fn user_service(&self) -> &Self::T;
}
```

### 참조 사이트

- [Function color problem](https://www.mimul.com/blog/function-color-problem/)
- [Shaku](https://github.com/AzureMarker/shaku)
- [Real-World Scala: Dependency Injection (DI)](https://jonasboner.com/real-world-scala-dependency-injection-di/)
- [Rust Dynamic Dispatching deep-dive](https://medium.com/digitalfrontiers/rust-dynamic-dispatching-deep-dive-236a5896e49b)
