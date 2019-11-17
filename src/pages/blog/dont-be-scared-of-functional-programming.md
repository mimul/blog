---
templateKey: "blog-post"
title: "Javascript에서 함수형 프로그래밍 맛보기"
description: "Javascript에서 함수형 프로그래밍의 특성, 구현 사례를 통해 함수형 프로그래밍을 조금이나마 쉽게 이해하는데 도움되는 글."
author: "미물"
authorURL: "https://mimul.com"
date: "2014-07-05T15:55:06.000Z"
lastModificationTime: "2014-07-05T15:55:06.000Z"
image: "/img/blog/fp-preview.png"
commentId: "dont-be-scared-of-functional-programming-2014-07-05"
tags:
  - JavaScript
  - Functional Programming
  - Programming
---

함수형 프로그래밍을 이해하기 쉽게 설명한 아티클(Don’t Be Scared Of Functional Programming)이 있어서 소개합니다. 정리하면서 느낀점은, 일차적으로 함수형 프로그래밍을 이해하는 것이겠지만, 이차적으로는 코드의 간결성이 좋아지고 리팩토링에서 좋은 사례로 활용할 수 있을 것 같아 좋았습니다. ^^

#### 함수 프로그래밍의 기본 특성

여기서 말하고자 하는 가장 기본적인 함수형 프로그래밍의 특징을 정리하면 아래와 같다.

첫번째, 함수형 프로그래밍에서의 데이터는 Immutable해야 한다. 기존의 데이터를 변경하지 않고 새로운 자료 구조를 만든다. 예를 들어 배열내의 몇몇 데이터에 대해 조작이 필요하다면 원본 배열을 수정하기보다는 업데이트된 값을 가지고 새로운 배열을 만든다.

두번째로 함수형 프로그래밍은 Stateless(상태를 유지하지 않아야)해야 한다. 이것은 프로그램을 수행중에 어떤 일이 일어날지, 아니면 일어나지 않을지에 대해서 모르는 상태로 모든 일을 수행하는 것을 말한다. 즉, 함수 처리에서 다른 무언가에 의존하지 않는다는 것을 말한다. Immutable과 결합해 마치 진공관 속에서 작동하는 것처럼 함수들을 바라볼 것이다. 계산을 수행하면서 외부 값에 영향을 받지 않고 인자로 받은 데이터값에 대한 처리밖에는 하지 않는다.

아래에서 다시 설명하겠지만, 이런 함수형 프로그래밍의 특성을 가지고 구현할 때 모범 사례같은 룰이 있다.
모든 함수는 최소한 하나의 인자를 수용한다.
모든 함수는 데이터나 혹은 다른 함수를 반환한다.
루프는 사용하지 않는다.

#### 실제 함수형 프로그래밍 구현 사례

위의 함수형 프로그래밍의 기본적인 특성을 인지하고 아래의 코드를 보면서 실제 사례를 통해 어떻게 일반 프로그램이 함수형 프로그램으로 변환되는지 보자. 그 예로 인구(population)와 평균 기온(temperature)을 구해서 그래프 즉, 비주얼라이제이션하는 사례를 살펴보는데 여기서는 데이터를 구하는 부분만 어떻게 함수형 프로그래밍 방법이 사용되는지 살펴보자. 먼저 서버의 API에서 응답하는 데이터가 data라는 변수에 저장되고 그 형상은 아래와 같다.
```javascript
var data = [
  {
    name: "Jamestown",
    population: 2047,
    temperatures: [-34, 67, 101, 87]
  },
  {
    name: "Awesome Town",
    population: 3568,
    temperatures: [-3, 4, 9, 12]
  }
  {
    name: "Funky Town",
    population: 1000000,
    temperatures: [75, 75, 75, 75, 75]
  }
];
```

인구(population)와 평균 기온(temperature)을 비교하기 위해 그래프나 차트를 사용하기를 원한다면, 그래프를 그리기 전에 먼저 위의 데이터를 약간 변경해야 한다. 그래프 라이브러리는 다음과 같은 x, y좌표를 원할 것이다.
```javascript
[
  [x, y],
  [x, y]
  …
]
```

x는 평균 기온, y는 인구를 나타낸다. 함수형 프로그래밍이라는 관점을 의식하지 않고 구현하면 아래와 같다.
```javascript
var coords = [],
    totalTemperature = 0,
    averageTemperature = 0;

for (var i=0; i < data.length; i++) {
  totalTemperature = 0;

  for (var j=0; j < data[i].temperatures.length; j++) {
    totalTemperature += data[i].temperatures[j];
  }

  averageTemperature = totalTemperature / data[i].temperatures.length;
  coords.push([averageTemperature, data[i].population]);
}
```

함수형 프로그래밍 방식으로 전환하기 위해서는 위에 설명했듯이 다음과 같은 모범사례를 사용하면 좋다.

- 모든 함수는 최소한 하나의 인자를 수용한다.
- 모든 함수는 데이터나 혹은 다른 함수를 반환한다.
- 루프는 사용하지 않는다.

자 그러면, 위 프로그램을 함수형 언어 방식로 변경해 보자. 우선 배열(온도)의 합계를 내는 함수를 먼저 만들어보자.
```javascript
function totalForArray(arr) {
  // add everything
  return total;  
}
```

그런데 3번 룰인 루프 사용 금지에 의거해 루프를 사용하지 않기 위해서는 재귀 방식을 사용하여 구현한다.
```javascript
// 인자로는 전체 합계와 배열을 가진다.
function totalForArray(currentTotal, arr) {

  currentTotal += arr[0];

  //Array.shift를 사용하지 않고 Immutable을 보장하기 위해서 배열편집보다는 새로 만든다.
  var remainingList = arr.slice(1);

  // 재귀처리를 하고 현재 합계와 나머지 배열을 인자로 전달하고
  if(remainingList.length > 0) {
    return totalForArray(currentTotal, remainingList);
  }

  // 나머지 배열이 없으면 전체 합계을 리턴한다.
  else {
    return currentTotal;
  }
}
```

주의) 재귀는 가독성을 올려주고 함수형 프로그래밍에서는 필수다. 하지만, Javascript와 같은 싱글 오퍼레이션에서 재귀 호출이 많은 경우는 가끔 문제를 유발하는 경우도 있다.(10,000 calls in Chrome, 50,000 in Firefox and 11,000 in Node.js)

이제 온도의 합은 아래와 같이 호출하면 얻을 수 있게 되었다.
```javascript
var totalTemp = totalForArray(0, temperatures);
더 분해할 수 있는 부분이 totalForArray함수의 currentTotal을 처리하는 부분이다.
function addNumbers(a, b) {
  return a + b;
}
```

그래서 결국 아래와 같은 totalForArray 함수를 만들수 있다.
```javascript
function totalForArray(currentTotal, arr) {
  currentTotal = addNumbers(currentTotal, arr[0]);

  var remainingArr = arr.slice(1);

  if(remainingArr.length > 0) {
    return totalForArray(currentTotal, remainingArr);
  }
  else {
    return currentTotal;
  }
}
```

배열에서 단일값을 반환하는 것은 함수형 프로그래밍에서 매우 일반적인 특징이다. 그래서 Javascript에서는 reduce라는 편리한 함수가 존재한다. 그래서 온도의 합계를 계산하는 reduce 방식은 아래와 같다.
Array.prototype.reduce 사용법은 여기를 참고하자.
```javascript
var totalTemp = temperatures.reduce(function(previousValue, currentValue){
  return previousValue + currentValue;
});
```

그리고 덧셈 부분을 조금 전에 만든 덧셈의 함수(addNumbers)를 사용하면 아래와 같이 된다.
```javascript
var totalTemp = temperatures.reduce(addNumbers);
```

배열의 합계를 할 경우 재귀나 reduce 사용 판단의 혼란을 가중시키지 않고 일반적인 함수를 만든다면 아래와 같아진다.
```javascript
function totalForArray(arr) {
  return arr.reduce(addNumbers);
}

var totalTemp = totalForArray(temperatures);
```

두번째 일로 이제까지 구한 합계에서 평균을 내는 함수를 만든다.
```javascript
function average(total, count) {
  return total / count;
}
```

지금 만든 평균과 좀 전에만든 합계 로직을 결합하면 어떻게 될까?
```javascript
function averageForArray(arr) {
  return average(totalForArray(arr), arr.length);
}

var averageTemp = averageForArray(temperatures);
```

마지막으로, 객체 배열에서 하나의 속성을 빼내는 함수를 만들어 보자. 재귀함수 대시에 우리는 JavaScript가 가지고 있는 map 내장함수를 사용한다.
```javascript
var allTemperatures = data.map(function(item) {
  return item.temperatures;
});
```

이는 위의 data 객체에서 온도만 추출해내는 것으로 결과는 아래와 같이 된다.
```javascript
var allTemperatures = [-34, 67, 101, 87, -3, 4, 9, 12, 75, 75, 75, 75, 75];
```

객체 배열에서 속성을 추출하는 것도 일반적인 작업이므로 함수로 만든다.
```javascript
function getItem(propertyName) {
  return function(item) {
    return item[propertyName];
  }
}
```

주의할 점은, 이 함수는 함수를 반환한다. 실행 호출자에게 맡기고 있다는 점이다. map과 연동하면 아래와 같이 된다.
```javascript
var temperatures = data.map(getItem('temperature'));
```

좀 더 가독성과 범용성을 높이기 위해서 아래와 같은 함수를 만든다.
```javascript
function pluck(arr, propertyName) {
  return arr.map(getItem(propertyName));
}

var allTemperatures = pluck(data, 'temperatures');
```

이제 객체 배열에서 원하는 프로퍼티를 추출할 수 있게 되었다.
자 그럼 위에서 제시했던 문제의 해법을 적용하자면, x는 평균기온, y는 전체 인구를 추출해야한다.
```javascript
var populations = pluck(data, 'population');
var allTemperatures = pluck(data, 'temperatures');
var averageTemps = allTemperatures.map(averageForArray);
```

위의 처리결과 다음과 같은 두개의 배열값을 취득하게 되었다.
```javascript
// populations
[2047, 3568, 1000000]

// averageTemps
[55.25, 5.5, 75]
```

마지막으로, 2개의 배열을 하나로 통합 함수를 만든다.
```javascript
function combineArrays(arr1, arr2, finalArr) {
  // 셋째인자의 배열이 널일 경우를 대비하여 초기화해 줌
  finalArr = finalArr || [];

  // 첫번째 배열요소를 추출해 출력 배열에 삽입함
  finalArr.push([arr1[0], arr2[0]]);

  var remainingArr1 = arr1.slice(1),
      remainingArr2 = arr2.slice(1);

  // 남아있는 배열이 비어있는 경우 리턴
  if(remainingArr1.length === 0 && remainingArr2.length === 0) {
    return finalArr;
  }
  else {
    // Recursion!
    return combineArrays(remainingArr1, remainingArr2, finalArr);
  }
};

var processed = combineArrays(averageTemps, populations);
```

결국, 결합함수에 의해서 처리되는 결과값은 아래와 같아진다.
```javascript
var processed = combineArrays(pluck(data, 'temperatures')
.map(averageForArray), pluck(data, 'population'));

// [
//  [ 55.25, 2047 ],
//  [ 5.5, 3568 ],
//  [ 75, 1000000 ]
// ]
```

이것이 함수형 프로그래밍의 전부는 아니겠지만, 함수형 프로그래밍을 이해하는데 도움이 될 것입니다.
