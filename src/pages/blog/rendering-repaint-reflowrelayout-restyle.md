---
templateKey: "blog-post"
title: "브라우저 동작의 이해 - 리플로우와 리페인트 및 그 최적화"
description: "브라우저 동작을 이해하기 쉽게 쓴 글(Rendering : repaint, reflow/relayout, restyle)이 있어 정리함."
author: "미물"
authorURL: "https://mimul.com"
date: "2012-03-01T17:50:16.000Z"
lastModificationTime: "2012-03-01T17:50:16.000Z"
image: "/img/blog/browser-paint-featured.jpg"
commentId: "rendering-repaint-reflowrelayout-restyle-2012-03-01"
tags:
  - Frontend
  - Browser
---

개발자들도 브라우저의 영역을 어느정도 이해하는 것이 몸에 좋을 것 같아, Stoyan Stefanov 씨가 쓴 [Rendering : repaint, reflow/relayout, restyle](http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/)을 발번역 해 봅니다.

본 문서는 전반부에 reflow와 repaint에 대한 설명과 응답시간 향상을 위한 몇가지 팁으로 구성되어 있고, 후반부에는 dynaTrace AJAX Edition과 SpeedTracer를 사용한 IE와 Chrome의 렌더링 성능 측정에 대한 설명으로 채워져 있다.
그리고 후반부의 dynaTrace AJAX Edition 도구를 가지고 성능 분석하는 부분은 최신 버전으로 테스트 한 화면으로 대체되었음을 알립니다.

#### The rendering process(렌더링 절차)

브라우저가 다르면 내부도 다르게 동작한다. 그러나 다음 그림은 페이지를 구성하는 코드들을 다운로드한 후 각 브라우저에서 그나마 공통적으로 일어나는 일반적인 개념을 나타낸다.

![Rendering Process](/img/blog/render.png)

- 브라우저는 HTML 소스 코드(tag soup)를 분석하여 DOM 트리를 구축한다. 표현된 데이터의 각각의 HTML 태그는 트리안에 관련 노드를 가지고 시작과 종료 태그 사이의 일련의 텍스트들은 텍스트 노드로 표현되어 있다. DOM 트리의 루트 노드는 documentElement(<html>태그)이다.
- 브라우저가 CSS 코드를 해석하여 -moz -webkit 등 여러 묶음의 핵을 이해하고 해석할 수 없는 다른 표현은 과감하게 무시한다. 스타일링 정보의 우선 순위에 대한 기본적인 규칙은 다음과 같다. 사용자 에이전트 스타일 시트(기본 브라우저), 사용자 정의 스타일 시트, 페이지의 작성자가 정의한 스타일 시트(link 에서 로드되는 외부 파일, import된 파일, 인라인으로 정의하고 마지막으로 우선 순위가 가장 높은 HTML 태그의 style 속성 안에 포함된 스타일) 순이다.
- 다음은 가장 흥미로운 부분인데 - 렌더링 트리의 구성이다. 렌더링 트리는 DOM 트리와 비슷한 류이지만, 정확하게 매치되는 것은 없다. 렌더링 트리는 스타일에 대한 정보를 가지고 있어, div를 display: none으로 숨겼다면 렌더링 트리내에서 그 div는 표시되지 않는다. head 와 같이 다른 보이지 않는 요소들도 마찬가지다. 반대로, 렌더링 트리내에서 하나 이상의 노드로 표현되는 DOM 요소도 있을 수 있다. 예를 들어, <p>의 각 행의 텍스트 노드는 렌더링 노드를 필요로 한다. 렌더링 트리의 한 노드가 프레임 또는 박스([박스 모델](http://www.w3.org/TR/CSS2/box.html#box-dimensions)에서 말하는 CSS 박스)라고 한다. 이들 각각의 노드는 폭, 높이, 테두리, 마진 등의 CSS 박스 특성을 가진다.
- 한번 렌더링 트리가 구성되면 브라우저는 렌더링 트리 노드를 스크린에 페인트(그리기)를 할 수 있게 된다.

#### The forest and the trees

아래 예제를 보자.
```html
<html>
  <head>
    <title>Beautiful page
    </title>
  </head>
  <body>
    <p>
      Once upon a time there was
      a looong paragraph...
    </p>
    <div style="display: none">
      Secret message
    </div>
    <div><img src="..." /></div>
    ...
  </body>
</html>
```

아래는 HTML 문서로 표현되는 DOM 트리는 기본적으로 각 태그에 1개의 노드와, 노드들 사이에 기술된 텍스트의 단일 텍스트 노드를 가지고 있다.(단순히 공백이 텍스트 노드라는 사실은 무시한다)
```
documentElement(html)
    head
        title
    body
        p
            [text node]
        div
            [text node]
        div
            img
        ...
```

렌더링 트리는 DOM 트리 시각화되는 부분이다. 그래서 head와 숨겨진 div 같은 몇가지 요소가 없어진다. 그러나 각 단락 텍스트(프레임이나 박스 등)는 추가된 노드를 가진다.
```
root (RenderView)
    body
        p
            line 1
	    line 2
	    line 3
	    ...
	div
	    img
	...
```

렌더링 트리의 루트 노드는 다른 모든 요소들을 포함하는 프레임(박스)이다. 그것은 브라우저 윈도우의 안쪽 부분에 존재하기 때문에 페이지로 표시되는 제한된 공간이다. 기술적으로 WebKit은 루트 노드인 RenderView를 호출하고 기본적으로 페이지의 TOP(0,0)에서 (window.innerWidth, window.innerHeight)까지 사각형의 표시 영역(Viewport)인 CSS의 [초기 컨테이너 블럭(initial containing block - 가장 바깥쪽 영역)](http://www.w3.org/TR/CSS21/visudet.html#containing-block-details)이 응답한다.

화면에 무엇을 어떻게 정확하게 표시할지 여부를 이해하는 것은 렌더링 트리를 재귀적으로 추적(흐름)을 통해 알 수 있다.

#### Repaints and reflows

페이지를 처음 표시할 때 레이아웃과 함께 그리기가 적어도 한 번은 수행된다.(빈 페이지를 좋아한다면 다르지만 ^^) 그 후, 렌더링 트리를 구성하는데 사용된 입력 정보의 변화는 다음중 하나 또는 두개의 결과로 나타난다.

- 렌더링 트리 일부(또는 전부)는 재평가된 노드의 폭·높이 등이 다시 계산된다. 이것은 리플로우 또는 레이아웃이라고 한다.(제목과의 말 맞추기 위해 리레이아웃 라고 썼지만). 첫 페이지의 레이아웃은 한 번 이상 리플로우가 일어난다는 것을 기억해라.
- 노드 위치 속성이 바뀌었는지, 배경색이 바뀐것과 같은 스타일에 변화가 있으면, 스크린의 일부분에 업데이트가 필요할 것이다.
리플로우와 리페인트는 부하가 높기 때문에, 사용자 경험(UX)을 안좋게 하고 UI의 반응이 느려지는 원인이 된다.

#### What triggers a reflow or a repaint

렌더링 트리를 구성하는데 사용된 입력 정보의 어떤 변경도 리플로우와 리페인트를 발생시킨다. 구체적으로는 다음과 같은 경우이다.

- DOM 노드의 추가, 삭제 및 업데이트
- display: none(리플로우와 리페인트) 또는 visibility: hidden(위치 변경은 일어나지 않기 때문에, 리페인트만) 등과 같은 DOM 노드 숨김
- 페이지상에서 DOM 노드의 위치 이동 및 애니메이션
- 스타일 속성의 약간의 변화를 위해 스타일 시트 추가
- 윈도우 크기를 변경하거나 폰트 크기 변경, 그리고 스크롤 등 사용자의 액션

다음의 예를 살펴 보자.

```javaScript
var bstyle = document.body.style; // cache
bstyle.padding = "20px"; // reflow, repaint
bstyle.border = "10px solid red"; // another reflow and a repaint
bstyle.color = "blue"; // repaint only, no dimensions changed
bstyle.backgroundColor = "#fad"; // repaint
bstyle.fontSize = "2em"; // reflow, repaint
// new DOM element - reflow, repaint
document.body.appendChild(document.createTextNode('dude!'));
```

어떤 종류의 리플로우는 다른것들보다 부하가 더 높다. 렌더링 트리를 생각해 보자. 만약 body의 직접적인 후손인 트리의 말단인 노드를 건드린다면, 아마 다른 많은 노드를 무효화하지 않을 것이다. 하지만, 애니메이션을 추가하고 페이지 상단의 div를 확대하고 페이지의 나머지 부분을 아래로 밀어내려 하는 경우에는 어떠한가? 그것은 매우 높은 비용을 지불하게 된다.

#### Browsers are smart

렌더링 트리의 수정 관련 리플로우와 리페인트는 매우 높은 부하를 주기 때문에 브라우저는 부정적인 영향을 줄일 궁리를 한다. 그 전략중 하나는 적어도, 지금 당장은 아무것도 하지 않는 것이다. 브라우저는 스크립트가 필요로 하는 변화의 큐(대기열)를 설정하고 일괄적으로 그들을 수행한다. 이 방법은 각각 한번의 리플로우를 필요로 하는 변경들이 합쳐져 단 한 번의 리플로우만 계산할 것이다. 브라우저는 변경 사항을 큐에 추가할 수도 있고 시간이 경과하거나 변경 횟수가 도달했을 때 큐를 플러시하기도 한다. 그러나 때때로 스크립트는 이러한 브라우저의 리플로우 최적화를 막기도 하고, 일괄적으로 큐를 플러시한 상태인데도 모든 변경 사항을 실행해 버리는 일도 있을 수 있다. 이런 일은 아래와 같이 스타일에 대한 정보를 요구한 경우에 발생한다.

- offsetTop, offsetLeft, offsetWidth, offsetHeight
- scrollTop, scrollLeft, scrollWidth, scrollHeight
- clientTop, clientLeft, clientWidth, clientHeight
- getComputedStyle() 또는 IE의 currentStyle

위 모든 항목은 기본적으로 노드에 대한 스타일 정보를 요구한다. 그리고 그런 경우엔 언제든지 브라우저는 최신 정보를 돌려주려 한다. 그렇게 하기 위해서는 모든 계획된 변경 사항을 적용하고, 큐를 플러시하고, 빨리, 리플로우을 실행한다.
예를 들어, 다음과 같이 루프에서 빠르게, 연달아 스타일 정보 set/get하는 것은 좋지 않다.

```javascript
// no-no!
el.style.left = el.offsetLeft + 10 + "px";
```

#### Minimizing repaints and reflows

사용자 경험(UX)에서 리플로우와 리페인트에 대한 부정적인 영향을 줄이는 전략은 단순히 리플로우와 리페인트를 줄이고, 스타일 정보에 대한 요청을 적게하는 것이다. 그렇게 하면 브라우저는 리플로우를 최적화 할 수 있다. 자 그럼 구체적으로 어떻게 하면 될까요?

- 하나 하나, 개별 스타일을 변경하지 말자. 분별성과 유지보수 측면에서 가장 좋은 방법은 스타일이 아닌 클래스 이름을 변경하는 것이다. 그러나 이 경우는 정적 스타일을 전제로 하고 있다. 만약 스타일이 동적인 경우에는 요소마다 약간의 스타일을 변경하는 것이 아니라, cssText 속성을 편집한다.
```javascript
// bad
var left = 10,
    top = 10;
el.style.left = left + "px";
el.style.top  = top  + "px";
// better
el.className += " theclassname";
// or when top and left are calculated dynamically...
// better
el.style.cssText += "; left: " + left + "px; top: " + top + "px;";
```
- DOM 변경을 일괄 배치로 오프라인에서 실행한다. 오프라인은 다음을 의미합니다.
  * documentFragment를 사용하여 임시(temp) 변화를 유지하고,
  * 업데이트 예정인 노드를 클론하고 복사본에서 작업하고 마지막으로 업데이트 클론과 원본을 교환한다.
  * 요소를 display: none(1회 리플로우와 리페인트를 함)으로 숨기고, 100의 변경, 그리고 display를 복원한다.(다시 한 번 리플로우와 리페인트를 함). 이 방법은 100의 변경동안 리플로우와 리페인트를 두번한다.
- 스타일 계산을 과도하게 요구하지 않는다. 만약 계산된 값이 필요하다면, 한번에 가져 오며, 로컬 변수에 캐시하고 로컬로 복사된 값을 사용하라. 나쁜 예를 다시 보여준다.
```javascript
// no-no!
for(big; loop; here) {
    el.style.left = el.offsetLeft + 10 + "px";
    el.style.top  = el.offsetTop  + 10 + "px";
}
// better
var left = el.offsetLeft,
    top  = el.offsetTop
    esty = el.style;
for(big; loop; here) {
    left += 10;
    top  += 10;
    esty.left = left + "px";
    esty.top  = top  + "px";
}
```
- 렌더링 트리에 대해 변경 후의 재평가가 얼마나 필요한지를 일반화하여 생각해 보자. 예를 들어 절대 위치를 사용해 렌더링 트리상에서 body의 자식 요소가 될 경우 일 예로 애니메이션을 해도 다른 여러 노드에 영향을 주지 않는다. 다른 노드의 일부는 그 상단에 요소가 배치되어 있으면, 리페인트가 필요한 영역에 있을 것이다. 하지만 리플로우는 하지 않는다.

#### Tools

과거에는 그리기 및 렌더링에 대해 브라우저에서 무엇이 어떻게 진행되고 있는지를 시각화할 수 있는 도구가 없었다. 하지만 현재는 그 상황이 바뀌어 매우 쿨한 상태가 되었다.
[dynaTrace AJAX](http://ajax.dynatrace.com/pages/download/download.aspx) Edition과 Google Chrome [SpeedTracer](http://code.google.com/webtoolkit/speedtracer/)는 리플로우와 리페인트를 깊숙히 조사하는데 뛰어난 도구이다. 전자는 IE 전용이고, 후자는 WebKit 용이다.

지난해 Douglas Crockford는 CSS에 대해 우리가 잘 몰랐던, 어리석은 일을 하고 있을 가능성을 언급했다. 사실 나도 그대로였다. 브라우저의 폰트 크기를 변경하면 브라우저(IE6)가 결국 페이지를 리폐인하고 끝나는데 10분에서 15분 동안 CPU 사용률이 100%가 된다는 문제가 있는 프로젝트에 참여하고 있었다.

현재는 도구가 있으므로, CSS에 대해 어리석은 일을 하고 변명을 할 수 없게 되었다. 단지 도구에 대해서 말한다면, Firebug와 같은 도구가 DOM 트리 이외에 렌더링 트리를 볼 수 있으면 더 쿨하지 않을까?

#### A final example

restyle(위치에 영향을주지 않는 렌더링 트리의 변경)과 reflow(레이아웃에 영향을 미치는), 그리고 repaint를 수반하는 경우의 차이를 살펴 보자.

같은 일을 하는데 있어서 두 가지 방법으로 비교해 보자. 첫째, 여러 스타일(레이아웃은 건드리지 않고)을 변경하고, 그리고 변경 후 전체적으로 전혀 관계가 없는 스타일 속성을 체크해 보자.
```javascript
bodystyle.color = 'red';
tmp = computed.backgroundColor;
bodystyle.color = 'white';
tmp = computed.backgroundImage;
bodystyle.color = 'green';
tmp = computed.backgroundAttachment;
```

둘째, 똑같은 일이지만, 이번에는 모든 스타일 변경 후 정보를 취득하기 위해 스타일 속성에 액세스를 해보자.
```javascript
bodystyle.color = 'yellow';
bodystyle.color = 'pink';
bodystyle.color = 'blue';
tmp = computed.backgroundColor;
tmp = computed.backgroundImage;
tmp = computed.backgroundAttachment;
```

두 경우 모두, 사용하고 있는 변수는 다음과 같이 정의되어 있다고 가정한다.
```javascript
var bodystyle = document.body.style;
var computed;
if (document.body.currentStyle) {
  computed = document.body.currentStyle;
} else {
  computed = document.defaultView.getComputedStyle(document.body, '');
}
```

당장, 스타일 변경에 대한 두 예제를 문서상에 클릭으로 실행해 볼 것이다. 테스트 페이지는 이쪽 restyle.html에 있다. 이것을 우리는 restyle 테스트라고 부르자.
두번째 테스트는 첫번째와 거의 비슷하지만, 이번에는 레이아웃 정보도 동시에 변경한다.
```javascript
// touch styles every time
bodystyle.color = 'red';
bodystyle.padding = '1px';
tmp = computed.backgroundColor;
bodystyle.color = 'white';
bodystyle.padding = '2px';
tmp = computed.backgroundImage;
bodystyle.color = 'green';
bodystyle.padding = '3px';
tmp = computed.backgroundAttachment;
// touch at the end
bodystyle.color = 'yellow';
bodystyle.padding = '4px';
bodystyle.color = 'pink';
bodystyle.padding = '5px';
bodystyle.color = 'blue';
bodystyle.padding = '6px';
tmp = computed.backgroundColor;
tmp = computed.backgroundImage;
tmp = computed.backgroundAttachment;
```

이 테스트는 레이아웃을 변경하기 때문에 relayout 테스트라고 부르자. 소스 코드는 이쪽 relayout.html에 있다.

먼저 dynaTrace에서 restyle 테스트가 어떻게 시각화되는지를 살펴보겠다.

![dynaTrace](/img/blog/dyna1.png)

기본적으로 페이지가 로드 된 후, 한번 클릭해 첫번째 시나리오(약 2초 시점에서 매번 스타일 정보를 요청)를 실행하고, 그 다음 다시 클릭하여 두 번째 시나리오(약 4초에 먼저 끝까지 스타일을 설정 연기시키고 그 특성에 접근)을 실행한다.

Timeline 탭은 어떻게 페이지를 로드하고 onload에 이르렀는지를 보여준다. 마우스 커서를 렌더링에 위치하고 클릭하고, 관심있는 위치를 확대하고 세부 사항을 본다.

![dynaTrace 2](/img/blog/dyna2.png)

JavaScript의 실행을 나타내는 파란색 막대와 연속적인 렌더링의 실행을 나타내는 녹색 막대를 관찰 할 수 있다. 이것은 간단한 예이지만, 바의 길이에 주목해 보자. - JavaScript의 실행에 비해 렌더링에 소요되는 시간이 얼마나 더 긴지 알겠는가? 종종 Ajax나 리치앱에서 JavaScript가 병목 현상이 아니라, DOM 액세스와 조작 그리고 렌더링이 문제가 되는 경우가 더 많다.

OK, 그러면 body의 위치를 이동하는, relayout 테스트를 진행해 보자. 이번에는 "PurePaths"를 살펴보자. 타임라인 각 항목에 추가로 더 많은 정보들이 있다. 첫번째 클릭을 한 하일라이트된 부분에 Javascript 액션에 계획된 레이아웃 태스크가 실행되었다.

![dynaTrace 3](/img/blog/dyna3.png)

다시 관심있는 부분을 확대해 보겠다. 그리기를 나타내는 녹색 막대의 앞에 새로운 작은 바가 더해져있는 것을 알 수 있다. 이 테스트에서는 레이아웃 계산 이 추가되므로 리페인트 이외에 리플로우가 발생하는 것이다.

![dynaTrace 4](/img/blog/dyna4.png)

이 테스트를 통해 우리는 어떤 브라우저에도 자신있게 말할 수 있는 중요한 내용은 스타일만 변경하는 것이 스타일과 레이아웃이 같이 변경되는 것보다 끝나는 시간은 절반으로 줄어든다는 것이다. 또한 스타일만 변경하는 경우와 레이아웃만 변경하는것과의 비교는, IE6를 제외하고 레이아웃을 변경하는 것이 스타일만 변경하는 경우에 비해 4배의 비용이 더 든다.

다음부터는 동일한 테스트를 Google Chrome SpeedTracer를 통해 재현하는 것이므로 여기서 설명은 생략하겠다.
그리고 개발자들에게는 좀 낮선 단어들이 있어 이해하는데 어려움이 있어 몇가지 용어에 대한 정의를 해 본다.

#### 용어 정의

- 렌더링 트리 - DOM 트리의 시각화 부분이다.
- 렌더링 트리의 노드를 frame 또는 box 라고 칭한다.
- Mozilla는 렌더링 트리의 재계산을 리플로우라고 하고 다른 브라우저에서는 레이아웃 이라고 한다.
- 재계산된 렌더링 트리의 결과를 바탕으로 스크린을 업데이트하는 것이 리페인트라고 한다.(IE와 DynaTrace는 redraw)
- SpeedTracer는 위치적인 변경이 없는 스타일 변경을 style recalculation과 layout(위치적 변화를 가져오는)을 구별한다.
