---
templateKey: "blog-post"
title: "Javascript Promise"
description: "Javascript를 사용하다보면 비동기 call 요소들이 많아서 로직의 가독성과 오류 디버깅 문제등이 복잡하게 얽히게 되(이를 헬이라고도 표현하는데), 이를 회피하기 위한 방법중에 하나가 Promise를 사용하는 것입니다. 대부분 경우 라이브러리로 제공하고 있어, 그 내용을 잘 모르고 사용하는 경우가 많아 오용되는 사례를 경험하게 됩니다. 그래서 내부를 좀 더 이해하는데 도움이 되는 좋은 아티클이 있어서 번역ㅎ함."
author: "미물"
authorURL: "https://mimul.com"
date: "2014-12-17T23:50:09.000Z"
lastModificationTime: "2014-12-17T23:50:09.000Z"
image: "/img/topics/typescript.png"
commentId: "javascript-promises-2014-12-17"
tags:
  - Javascript
  - Promise
---

Javascript를 사용하다보면 비동기 call 요소들이 많아서 로직의 가독성과 오류 디버깅 문제등이 복잡하게 얽히게 되(이를 헬이라고도 표현하는데), 이를 회피하기 위한 방법중에 하나가 Promise를 사용하는 것입니다. 대부분 경우 라이브러리로 제공하고 있어, 그 내용을 잘 모르고 사용하는 경우가 많아 오용되는 사례를 경험하게 됩니다. 그래서 내부를 좀 더 이해하는데 도움이 되는 좋은 아티클이 있어서 번역을 해보았습니다.

소개 아티클은 [JavaScript Promises ... In Wicked Detail](http://www.mattgreer.org/articles/promises-in-wicked-detail/) 입니다. 상세한 내용은 아래를 따라가 보시면 될 거 같네요.

#### 왜 Promise가 필요한가?

왜 Promise에 대해서 디테일하게 이해하는데 신경을 써야할까? 실제 Promise가 어떻게 동작하는지를 안다는 것은 그것을 활용하는 능력이 향상되고 문제가 발생했을 때에도 더 성공적으로 디버깅을 할 수 있기 때문이다. 이 아티클을 쓰게된 계기는 동료와 내가 Promise의 까다로운 경우를 접해서 고생한 적이 있었다. 지금 Promise에 대해 알았던 것을 그 때도 알았더라면 고생을 덜 했을 수 있었을 것이다.

#### 심플한 사용 사례

먼저 가장 간단한 Promise에 대한 구현을 살펴보자. 다음 함수가 있다고 가정한다.
```javascript
doSomething(function(value) {
  console.log('Got a value:' + value);
});
```

이 함수를 다음과 같이 사용하려 한다.
```javascript
doSomething().then(function(value) {
  console.log('Got a value:' + value);
});
```

위처럼 하기 위해 doSomething()에서 다음과 같은 부분을 변경해야 한다.
```javascript
function doSomething(callback) {
  var value = 42;
  callback(value);
}
```

다음과 같이 Promise 기반으로 변경한다.
```javascript
function doSomething() {
  return {
    then: function(callback) {
      var value = 42;
      callback(value);
    }
  };
}
```

[실행 화면 : Fiddle](http://jsfiddle.net/city41/zdgrC/1/)

이 구현은 Callback 패턴의 단순한 대체이며, 이것만으로는 큰 의미가 되지 않는다. 그러나 아주 간단한 구현이었지만, Promise의 핵심적인 아이디어를 이미 이해했다고 볼 수 있다.

Promise는 객체안에 궁극적으로 처리 결과값를 수집한다.

이점에서 Promise가 매우 흥미롭다고 생각하는 큰 이유이다. 일단 Promise 내에 처리 결과가 수집되면, 그 다음은 매우 강력하게 일을 진행할 수 있다. 이 점에 대해서는 좀 더 나중에 설명한다.

**Promise 타입 정의**

위의 간단한 객체 리터럴 구현은 잘 돌아가지 않을 것이다. 우리는 앞으로 잘 설명하기 위해, Promise 클래스를 정의한다.
```javascript
function Promise(fn) {
  var callback = null;
  this.then = function(cb) {
    callback = cb;
  };

  function resolve(value) {
    callback(value);
  }

  fn(resolve);
}
```

이를 사용하여 doSomething()을 재구현하면 다음과 같이 된다.
```javascript
function doSomething() {
  return new Promise(function(resolve) {
    var value = 42;
    resolve(value);
  });
}
```

그런데, 여기에는 문제가 있다. 실행해서 추적하면 resolve()가 then()보다 먼저 호출되고 그 결과 callback은 null이 된다. 이 문제에 대응하기 위해 setTimeout을 사용(해킹 위협이 있지만)한다.
```javascript
function Promise(fn) {
  var callback = null;
  this.then = function(cb) {
    callback = cb;
  };

  function resolve(value) {
    // force callback to be called in the next
    // iteration of the event loop, giving
    // callback a chance to be set by then()
    setTimeout(function() {
      callback(value);
    }, 1);
  }

  fn(resolve);
}
```

[실행 화면 : Fiddle](http://jsfiddle.net/city41/uQrza/1/)

**이 코드는 문제가 될 소지가 많은 좋지 않은 코드이다.**

이 Promise의 취약성이 많은 코드를 제대로 동작시키기 위해서는 비동기 처리를 해야한다. 이 구현에서 오류를 유발시키는 것은 간단해서 then()을 비동기적으로 호출하라. 그런 후 다시 callback은 null이 된다. 왜 이렇게 취약한 코드를 설정했을까? 위의 구현은 아주 이해하기 쉽다는 잇점이 있기 때문이다. 위와 같은 간단한 구현을 통해 Promise에서 중요한 then()과 resolve()를 명확하게 알 수 있다. then()과 resolve()는 Promise에서 중요한 개념이다.

#### Promise가 상태를 가진다.

우리의 어설픈 코드는 예상치 못한 것들을 발생시킬 수 있다. 그래서 Promise는 상태를 갖는다는 것이다. 우리는 프로세스를 진행하기 전에 Promise가 어떤 상태인지를 알 필요가 있고, 그리고 그 상태가 어떻게 이동하고 있는지를 정확히 알아야 한다. 이제 코드의 취약성 부분을 없애자.

- Promise는 값이 확정될 때까지 pending 상태에로 유지되었다가 값이 결정되면 resolved상태가 된다.
- 일단 값이 resolved되면 항상 그 값을 유지하고 다시 확인을 하지 않는다.

(Promise에는 rejected라는 상태도 있지만, 나중에 오류 처리 때 다시 설명한다.)

해킹의 가능성이 있는 setTimeout을 없애고 구현체 내부의 상태 변화를 추적할 수 있도록 해보자.
```javascript
function Promise(fn) {
  var state = 'pending';
  var value;
  var deferred;

  function resolve(newValue) {
    value = newValue;
    state = 'resolved';

    if(deferred) {
      handle(deferred);
    }
  }

  function handle(onResolved) {
    if(state === 'pending') {
      deferred = onResolved;
      return;
    }

    onResolved(value);
  }

  this.then = function(onResolved) {
    handle(onResolved);
  };

  fn(resolve);
}
```

[실행 화면 : Fiddle](http://jsfiddle.net/city41/QX85J/1/)

조금 복잡하지만 호출자(호출하는 측)는 원하는 시간에 then()을 호출할 수 있게 되었다. 그리고 피호출자(호출되는 쪽)는 언제든지 resolve()를 부를 수 있게 되었다. 동기나 비동기 상황에서도 완벽하게 동작하고 있다.

이렇게 된 이유는 state 플래그를 사용하기 때문이다. then()과 resolve() 둘 다 새로운 함수인 handle()에 처리를 위임한다. handle()은 상황에 따라 두가지 작업을 구분한다.

- 피호출자 resolve()를 실행하기 전에 호출자가 then()을 실행하면 값을 돌려줄 준비가 되지 않은 상태이다. 이러한 경우 state는 pending 상태가 될 것이고 호출자가 지정한 callack이 나중에 사용될때까지 유지된다. 그런 후 resolve()가 호출되면 callback이 실행되고 호출자에게 값을 전달한다.
- 호출자가 then()을 호출하기 전에 피호출자가 resolve()를 호출하면 값은 확정된 상태가 된다. 이 경우 then()이 호출되면 값을 반환할 준비를 한다.

주목할 것은 setTimeout의 구현체는 없어졌지만, 그것은 일시적이고 나중에 다시 나타난다. 자세한 내용은 그 때 설명한다.

Promise를 사용하면 then()과 resolve()의 호출 순서를 고려하지 않아도 된다. then()과 resolve()는 우리의 이용 목적에 따라 언제라도 호출할 수 있다. 이것은 Promise 처리 결과값를 객체에 저장하는 데 아주 큰 장점 중에 하나다.

우리가 구현해야 할 스펙안에는 아주 많은 일이 있지만, 우리의 Promise 이미 파워풀하다. 이 구현체를 사용하면 then()를 원하는 만큼 여러 번 호출해도 항상 같은 값을 돌려받을 수 있다.
```javascript
var promise = doSomething();

promise.then(function(value) {
  console.log('Got a value:', value);
});

promise.then(function(value) {
  console.log('Got the same value again:', value);
});
```

이 아티클에서 구현한 Promise는 완벽하지는 않다. 예를 들어, 만약 resolve()가 호출되기 전에 여러 번 then()을에 호출하면 마지막에 호출한 then()만 사용된다. 이 문제를 해결하기 위한 한가지 방법은 callback을 배열로 유지(deferreds)하는 것이다. 그러나 여기에서는 구현은 않고 Promise의 개념을 소개하는데 코드를 가능한 한 단순하게 하려는 목적이 있다. 지금까지 구현으로도 Promise를 설명하기 위해 충분하다.

#### Promise 메소드 체인

Promise는 객체에 비동기적으로 값을 유지하고 있기 때문에, 메소드를 체인하거나, map처리를 하거나, 병렬 혹은 순차적으로 여러종류의 일을 수행할 수 있다. 다음 코드는 Promise의 대표적인 사용 사례이다.
```javascript
getSomeData()
.then(filterTheData)
.then(processTheData)
.then(displayTheData);
```

getSomeData()는 즉시 then() 호출이 되었는지 알 수 있어서 해당 Promise를 반환한다. 그러나, 첫번째 then()의 호출 결과도 Promise며, 그 반환값을 사용해 다음 then()을 호출한다.(그 다음도 마찬가지다). then()에서 Promise를 반환하여 무슨일이 일어나는지 알수 있어 더 많은 정보를 얻을 수 있다. 그것이 메소드 체인을 사용하고 있다는 것이다.

then()은 반드시 Promise를 반환한다.

여기서 우리 Promise 클래스와 함께 메소드 체인을 추가하자.
```javascript
function Promise(fn) {
  var state = 'pending';
  var value;
  var deferred = null;

  function resolve(newValue) {
    value = newValue;
    state = 'resolved';

    if(deferred) {
      handle(deferred);
    }
  }

  function handle(handler) {
    if(state === 'pending') {
      deferred = handler;
      return;
    }

    if(!handler.onResolved) {
      handler.resolve(value);
      return;
    }

    var ret = handler.onResolved(value);
    handler.resolve(ret);
  }

  this.then = function(onResolved) {
    return new Promise(function(resolve) {
      handle({
        onResolved: onResolved,
        resolve: resolve
      });
    });
  };

  fn(resolve);
}
```

[실행 화면 : Fiddle](http://jsfiddle.net/city41/HdzLv/2/)

휴. 약간 코드가 조금 복잡해졌다. 우리가 천천히 구축하는 것이 기쁘지 아니한가? 여기서 중요한 키는 then()이 새로운 Promise를 반환했다는 것이다.

then()은 항상 새로운 Promise객체를 반환하기 때문에 하나 이상의 여러 Promise객체(created, resolved, ignored 되는)가 있을 수 있다. 이것은 객체의 낭비처럼 보일수 있다. Callback 기법에서는 이것은 문제가 되지 않는다. 다른 한편으로 Promise가 비판을 받을 수 있는 중요한 요소가 된다. 그러나 몇몇 JavaScript 커뮤니티에서는 이런 점으로 인해 Promise를 꺼리는 형태를 취하지 않고, 제대로 접근하기 시작했다.

두번째 Promise가 해결해야하는 것은 무엇인가? 그것은 첫번째 Promise가 반환하는 값을 받는 것이다. 즉,두번째 Promise는 첫번째 반환 값을 인수로 받는다. 이것은 handle() 후반 부분에 구현되어 있으며, handler 객체는 resolve()에 대한 참조와 onResolved의 callback에 대한 참조를 가지고 있다. 거기에는 resolve()의 복사본을 가지고 있고 각 Promise들은 자신의 resolve()를 복사하거나 내부에서 실행 클로저를 갖는다. 이것이 첫번째 Promise와 두번째 Promise의 다리다. 첫번째 Promise를 다음 코드에서 해결한다.
```javascript
var ret = handler.onResolved(value);
```

이 예제에서는 handler.onResolved는 다음과 같다.
```javascript
function(value) {
  console.log("Got a value:", value);
}
```

다르게 말하면, 어찌하면 이것이 첫번째 호출로 then()에 전달되는 프로세스다. 첫번째 handler 반환 값이 두번째 Promise를 해결하기 위해 사용된다. 이제 메소드 체인 구현이 완성되었다.
```javascript
doSomething().then(function(result) {
  console.log('first result', result);
  return 88;
}).then(function(secondResult) {
  console.log('second result', secondResult);
});
// the output is
//
// first result 42
// second result 88

doSomething().then(function(result) {
  console.log('first result', result);
  // not explicitly returning anything
}).then(function(secondResult) {
  console.log('second result', secondResult);
});
// now the output is
//
// first result 42
// second result undefined
```

then()은 항상 새로운 Promise객체를 반환하기 때문에 원하는만큼 메소드 체인을 연결할 수 있다.
```javascript
doSomething().then(function(result) {
  console.log('first result', result);
  return 88;
}).then(function(secondResult) {
  console.log('second result', secondResult);
  return 99;
}).then(function(thirdResult) {
  console.log('third result', thirdResult);
  return 200;
}).then(function(fourthResult) {
  // on and on...
});
```

만약 위의 코드에서 마지막에서 모든 처리의 결과를 받고 싶은 경우에는 어떻게하면 될까? 메소드 체인을 사용하여 필요에 따라 우리 스스로가 결과를 매뉴얼하게 전달할 필요가 있다.

```
doSomething().then(function(result) {
  var results = [result];
  results.push(88);
  return results;
}).then(function(results) {
  results.push(99);
  return results;
}).then(function(results) {
  console.log(results.join(', ');
});
```

Promise는 항상 하나의 값을 해결한다. 만약 두 개 이상의 값을 전달하려면 여러 값을 처리할 수 있는 것들(배열, 객체, 결합된 문자열 등)을 이용해야 한다.

Promise를 더 잘 사용하는 방법으로는 Promise 라이브러리의 all() 메소드나, 많은 다른 Utility 메소드를 사용하면 Promise의 유용성을 더 좋아진다. 무엇을 사용 하는가는 독자 여러분의 취향에 맞게 선택하면 된다.

**Callback은 선택사항이다.**

then()에 지정된 callback은 엄밀히 필수 사항은 아니다. 만약 callback을 없앴을 경우 Promise는 이전 Promise과 같은 값을 처리해 준다.
```javascript
doSomething().then().then(function(result) {
  console.log('got a result', result);
});

// the output is
//
// got a result 42
```

이미 구현된 handle()의 내용을 보면 callack이 없는 경우에는 Promise를 resolve하고 처리를 종료하도록 되어있는 것을 볼 수 있다.
```javascript
if(!handler.onResolved) {
  handler.resolve(value);
  return;
}
```

**메소드 체인 내에서 Promise 반환**

우리의 체인 구현 방법은 약간 정교하지 못한 부분이 있다. 우리의 resolve된 값에 대해 아무것도 확인하지 않고 다음 작업에 그대로 전달한다. 만약 resolve된 값 하나가 Promise 객체이라면 어떻게 될까요? 예를 들어 다음과 같은 경우이다.
```javascript
doSomething().then(result) {
  // doSomethingElse returns a promise
  return doSomethingElse(result)
}.then(function(finalResult) {
  console.log("the final result is", finalResult);
});
```

이 코드는 우리가 원하는 대로 움직이지 않는다. finalResult에는 resolve된 값이 아니라 Promise 객체가 전달된다. 의도된 결과값을 얻기위해 다음과 같이 구현을 수정해야 한다.
```javascript
doSomething().then(result) {
  // doSomethingElse returns a promise
  return doSomethingElse(result)
}.then(function(anotherPromise) {
  anotherPromise.then(function(finalResult) {
    console.log("the final result is", finalResult);
  });
});
```

코드가 꽤 복잡하게 되었다. 이 솔루션은 Promise의 구현을 변경하여 resolve된 값이 Promise 객체인지 호출자가 의식하지 않고 처리할 수 있도록 한다. 이것은 쉽게 구현할 수 있는데 resolve()에 전달 된 값이 Promise객체인 경우에 특별한 처리가 추가되었을 뿐이다.
```javascript
function resolve(newValue) {
  if(newValue && typeof newValue.then === 'function') {
    newValue.then(resolve);
    return;
  }
  state = 'resolved';
  value = newValue;

  if(deferred) {
    handle(deferred);
  }
}
```

[실행 화면 : Fiddle](http://jsfiddle.net/city41/38CCb/2/)

Promise를 수신했을 경우 resolve()를 재귀적으로 계속 호출하게 된다. 타입이 Promise가 아니면 그 시점에서 처리를 다음으로 진행한다.

이런 경우에는 무한 루프가 될 가능성이 있다. Promise/A+ 스펙은 필수 사항은 아니지만 무한 루프를 해결할 수 있는 형태로 구현하는 것을 추천하고 있다.

또한 여기에서 소개하는 구현체는 스펙을 충족하지는 않았다. 마찬가지로 이 아티클에서 소개한 구현체도 스펙을 충족하는 것은 아니다. 여기에 더해 좀 더 호기심을 가지고 있다면 [Promise resolution procedure](https://promisesaplus.com/#the_promise_resolution_procedure)를 읽는 것을 추천한다.

주목할만한 건, newValue가 Promise객체인지 여부의 판정이 느슨하게 체크를 하는 건 아닐까? 여기선 then() 함수가 있는지만 확인한다. 이 덕 타이핑(동적 타이핑의 한 종류로, 객체의 변수 및 메소드의 집합이 객체의 타입을 결정하는 것)은 의도적인 것이다. 의도적으로 모호하게 한 것으로, Promise의 구현체가 서로 조금 다른 3rd Party 라이브러리간에 상호간의 조합도 서로 Promise이라고 해석할 수 있게 된다.

스펙을 적절하게 따른다면 여러 Promise 라이브러리들을 서로 조합할 수 있다.

여기서 메소드 체이닝과 함께 Promise 구현체는 아주 완벽하다. 하지만 에러 핸들링 부분은 무시되어 있는 것은 알아 두었으면 한다.

#### Promise 거부하기

Promise가 처리되는 동안 문제가 발생한다면 사유와 함께 거부(reject)해야 한다. 거부된 경우에 호출자는 어떻게 알 수 있을까? 그것은 then()의 두번째 콜백 인자에 오류 발생시에 처리를 전달하여 오류 알림을 알아차릴 수 있다.
```javascript
doSomething().then(function(value) {
  console.log('Success!', value);
}, function(error) {
  console.log('Uh oh', error);
});
```

앞에서 언급한 바와 같이, Promise 상태는 pending에서 resolved, 또는 rejected 중 하나의 상태로 전환한다. 결코 두 상태가 될 순 없다. 다른말로 한다면, 위의 2개의 콜백 중 하나만 호출하는 것이다.

Promise가 reject()을 실행하여 rejected를 활성화할 수 있어, reject()라는 함수는 resolve()처럼 중요한 기능을 한다. 그리고 아래에 doSomething()에서 오류 처리를 추가 되었다.
```javascript
function doSomething() {
  return new Promise(function(resolve, reject) {
    var result = somehowGetTheValue();
    if(result.error) {
      reject(result.error);
    } else {
      resolve(result.value);
    }
  });
}
```

Promise 구현체 내부에는 거부 기능이 필요하다. Promise가 reject되면 그 이후의 모든 Promise도 거부될 필요가 있다.

그럼 다시 Promise 전체에 대한 구현체를 보자. 이번에는 reject 기능이 추가 되었다.
```javascript
function Promise(fn) {
  var state = 'pending';
  var value;
  var deferred = null;

  function resolve(newValue) {
    if(newValue && typeof newValue.then === 'function') {
      newValue.then(resolve, reject);
      return;
    }
    state = 'resolved';
    value = newValue;

    if(deferred) {
      handle(deferred);
    }
  }

  function reject(reason) {
    state = 'rejected';
    value = reason;

    if(deferred) {
      handle(deferred);
    }
  }

  function handle(handler) {
    if(state === 'pending') {
      deferred = handler;
      return;
    }

    var handlerCallback;

    if(state === 'resolved') {
      handlerCallback = handler.onResolved;
    } else {
      handlerCallback = handler.onRejected;
    }

    if(!handlerCallback) {
      if(state === 'resolved') {
        handler.resolve(value);
      } else {
        handler.reject(value);
      }

      return;
    }

    var ret = handlerCallback(value);
    handler.resolve(ret);
  }

  this.then = function(onResolved, onRejected) {
    return new Promise(function(resolve, reject) {
      handle({
        onResolved: onResolved,
        onRejected: onRejected,
        resolve: resolve,
        reject: reject
      });
    });
  };

  fn(resolve, reject);
}
```

[실행 화면 : Fiddle](http://jsfiddle.net/city41/rLXsL/2/)

reject()을 추가하는 것 외에도, handle() 에서도 reject를 처리할 수 있다. handle()내에서 reject 패스와 resolve 패스는 state 값에 의해 결정된다. 이 state 값은 다음 Promise에 전달되고 다음 Promise에서 받은 state의 값을 바탕으로, reject()와 resolve()를 호출하며 자신의 state 값으로 받은 state 값을 설정한다.

Promise를 사용할 때 오류 콜백을 생략하기 쉽다. 그러나 오류 콜백을 생략한 경우에는 문제가 발생했을 때 그것을 찾아갈 수 없다. 적어도 체인된 마지막 Promise에 에러 콜백을 가지고 있어야 한다. 나중에 좀 더 자세한 내용을 다룰 것이다.

**예기치 않은 오류도 reject와 연결되어야 한다.**

지금까지 에러 핸들링은 알려진 오류만을 대상으로하고 있었다. 그래서 예상되지 않는 오류가 발생할 경우에는 모든게 파멸될 것이다.Promise의 구현체는 예기치 않은 예외를 캐치하고 적절하게 reject하는 것이 필수적이다.

이것이 resolve() 메소드는 try/cach 블록으로 에워싸야 한다는 것을 의미한다.
```javascript
function resolve(newValue) {
  try {
    // ... as before
  } catch(e) {
    reject(e);
  }
}
```

또한 마찬가지로 중요한 점은 호출자가 지정한 콜백이 예상치 못한 예외를 던지지 않을 수도 있다. 이 콜백은 handle()에서 호출되는데 다음과 같이 해결한다.
```javascript
function handle(deferred) {
  // ... as before

  var ret;
  try {
    ret = handlerCallback(value);
  } catch(e) {
    handler.reject(e);
    return;
  }

  handler.resolve(ret);
}
```

**Promise는 오류를 먹어버릴 수 있다.**

Promise 대한 이해가 잘 못하면 에러를 완전히 묵살해 버리는 구현을 할 가능성이 있다. 많은 사람들이 겪을 수 있는 것이다.

다음 예를 생각해 보자.
```javascript
function getSomeJson() {
  return new Promise(function(resolve, reject) {
    var badJson = "uh oh, this is not JSON at all!";
    resolve(badJson);
  });
}

getSomeJson().then(function(json) {
  var obj = JSON.parse(json);
  console.log(obj);
}, function(error) {
  console.log('uh oh', error);
});
```

[실행 화면 : Fiddle](http://jsfiddle.net/city41/M7SRM/3/)

무슨 일이 일어날까? then()의 콜백 인자는 올바른 형식의 JSON을 받을 것을 예상한다. 콜백에서 받은 값을 확인하지 않고 JSON 파싱하면 예외가 발생하게 된다. 그러나 우리가 오류가있을 경우에 대비하여 then()의 두번째 파라미터에 오류 콜백을 지정한다. 이렇게 구현하면 의도대로 에러 콜백이 호출되는 것일까?

아니다. 오류 콜백은 호출되지 않는다. 위의 fiddle 예제를 실행해 보면 아무것도 출력하지 않는다는 것을 알 수 있다. 등골이 서늘해진다.

왜 그렇게 될까? 이것은 예기치 않은 오류(JSON 파싱에 실패한 예외)는 handle()내에서 캐치되지만, JSON 파싱 처리가 호출될 때에는 대상 Promise는 이미 resolved 상태이기 때문에 reject가 호출되지 않는다. 예외가 발생한 경우에는 다음 Promise가 reject된다.

항상 기억하라. then()콜백 안에, Promise는 이미 resolved 상태하는 것이다. 콜백의 결과가 무엇이든 Promise에 영향을 주지 않는다.

만약 위의 오류를 케치하려면 오류 콜백을 다음 then()에서 지정해야 한다.
```javascript
getSomeJson().then(function(json) {
  var obj = JSON.parse(json);
  console.log(obj);
}).then(null, function(error) {
  console.log("an error occured: ", error);
});
```

이제 오류 로그를 제대로 기록 할 수 있다.

내 경험상,이 점이 Promise의 가장 큰 함정이다. 더 나은 해결책을 위해서는 다음 섹션을 읽어라.

**done()을 구제용으로 사용하자**

(전부는 아니지만) 대부분의 Promise 라이브러리들은 done() 메소드를 가지고 있다. 이것은 then()과 매우 비슷하지만, done()을 사용하는 것으로 위에서 말한것처럼 then()의 함정을 피할 수 있다. done()은 then()이 호출되는 곳에서는 언제라도 호출 할 수 있다. 가장 큰 차이는 done()은 Promise를 반환하지 않는다는 것이다. 또한 done()내에서 발생한 어떠한 예외도 Promise 구현체에서 캐치되지 않는다. 다른한편으로, done()은 Promise 체인이 모두 resolved되었을 때 호출하는 것이다. getSomeJson() 예제는 done()을 사용해 좀 더 완전한 구현체가 될 수 있다.
```javascript
getSomeJson().done(function(json) {
  // when this throws, it won't be swallowed
  var obj = JSON.parse(json);
  console.log(obj);
});
```

done()에 오류 콜백을 지정할 수 있으며, then()과 마찬가지로 done(callback, errback)라는 상태로 지정할 수도 있다. 오류 콜백(errback)이 Promise 작업이 완전히 종료하고 호출되므로 Promise를 이용한 일련의 처리에서 발생한 어떠한 오류도 캐치할 수 있다.

done()은 (적어도 당분간은) Promise/A+의 스펙이 아니므로, Promise 라이브러리에 의해 구현되지 않을 수도 있다.

#### Promise의 종료는 비동기가 필요하다.

이 아티클의 초기에 setTimeout을 사용해 약간의 속임수를 썼다. 그런 다음 해킹 위협으로 이를 수정하여 setTimeout을 사용하지 않았다. 그러나 실제로 Promise/A+의 스펙은 Promise 종료는 비동기적으로 이루어진다. 이 스펙의 요구사항을 충족하기 위해 handle() 함수 구현의 대부분을 setTimeout 호출로 감쌀 필요가 있다.
```javascript
function handle(handler) {
  if(state === 'pending') {
    deferred = handler;
    return;
  }
  setTimeout(function() {
    // ... as before
  }, 1);
}
```

Promise/A+ 필요한 구현은 이상이 전부다. 사실, 많은 Promise 라이브러리에서 비동기를 지원하기 위해 setTimeout을 사용하지 않는다. 만약 라이브러리가 NodeJS에서 작동하는 경우라면 process.nextTick을 사용할 것이고, 만약 브라우저에서 작동하는 경우면 setImmediate나 setImmediate shim(지금 IE에서만 작동합니다)와 Kris Kowal의 asap(Kris Kowal은 Q라는 인기있는 Promise 라이브러리) 같은 라이브러리를 사용할지도 모른다.

**왜 이러한 비동기 요구 사항이 스펙에 있는가?**

비동기를 지원함으로써 일관성과 신뢰할 수 있는 흐름을 제공할 수 있다. 다음의 억지로 꾸민 예를 살펴 보자.
```javascript
var promise = doAnOperation();
invokeSomething();
promise.then(wrapItAllUp);
invokeSomethingElse();
```

이 구현에서 처리 순서는 어떻게 될까? 이름을 기반으로 추측해 보면, invokeSomething() -> invokeSomethingElse() -> wrapItAllUp() 순으로 호출 할 수 있게 설계되어 있다. 그러나 이런 실행 순서는 Promise의 resolve 처리가 동기적인지 비동기적으로 수행되는지에 따라 달라진다. 만약, doAnOperation() 함수가 비동기적으로 처리된다면 위의 예상대로 실행 순서가 될 것이다. 그러나 doAnOperation()이 동기적으로 처리될 경우 invokeSomething() -> wrapItAllUp() -> invokeSomethingElse() 순으로 되어 가정한 것과 다른 결과가되어 버린다. 이 문제를 해결하기 위해 Promise는 항상 비동기적으로 resolved 되어야 한다. 심지어 비동기가 아닐때도. Promise가 비동기적으로 resolved 됨으로써(합리적인 코드에 비유) Promise 이용자는 Promise가 비동기 처리에 대응하고 있는지 여부를 생각하지 않아도 된다.

Promise는 resolved되기 위해서 한번 이상의 이벤트 루프(작업의 주 스레드에서 루프)가 필요하다. 이것은 표준 콜백 접근 방식의 필수는 아니다.

#### then/promise 이야기를 끝내기 전에

세상에는 Promise 스펙을 모두 충족 라이브러리는 많이 있다. 그 중에서도 then 팀의 promise 라이브러리는 상당히 심플하다. 그 라이브러리는 간단한 구현 스펙을 충족하고 있고 스펙 이외의 것은 구현하지 않았다. 만약 그 [구현](https://github.com/then/promise/blob/master/core.js)을 볼 기회가 있으면, 그 구현이 여기와 매우 비슷하다는 것을 알 수 있다. then팀의 promise 라이브러리는 이 아티클을 쓰기 위한 기반이 되었고, 우리는 거의 비슷한 구현체를 여기 아티클에 구축했다. 개발자인 Nathan Zadoks와 Forbes Lindsay의 위대한 라이브러리 덕분에 JavaScript Promise를 작동시킬 수 있었다. 또한 Forbes Lindsay는 [promisejs.org 사이트](http://promisejs.org/)를 시작했다고 언급했다.

이 아티클에서 구현한 내용과 실제 구현에는 몇 가지 차이점이 있다. 그것은 Promise/A+는 여기서 다루지 않는 다른 자세한 스펙들이 정의되어 있기 때문이다. 꼭 [Promise/A+ 스펙](https://promisesaplus.com/) 읽어 보길 권한다. 명세서는 비교적 짧고 읽기 쉽다.

#### 결론

끝까지 읽어 주셔서 감사하다. 지금까지 Promise의 핵심 부분을 다뤄왔다. 그리고 많은 Promise 구현 라이브러리는 all() , race() , denodeify() 등 그 밖에도 다양한 기능들이 제공되고 있다. Promise의 가능성을 알기위해서는 [API docs for Bluebird](http://bluebirdjs.com/docs/api-reference.html)를 읽는 것이 좋다. 나는 Promise가 어떻게 작동하는지, 그리고 무엇을 해결하려고 하고 있는지를 이해하고부터는, Promise 정말 좋아하게 되었다. Promise는 내 프로젝트 코드를 매우 간결하게 그리고 우아하게 해준다. 더욱 더하고 싶은 말은 이 문서는 서문에 지나지 않는다는 것이다.
