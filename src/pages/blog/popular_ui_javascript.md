---
templateKey: "blog-post"
title: "스타트업 서비스 개발에 도움을 줄 수 있는 Javascript 오픈 소스들"
description: "서비스 개발에 도움을 줄 수 있는 Javascript 오픈 소스들 소개 : Cleave, Alert, Datepicker, Data Visualization, Cropper, autoComplete, Infinite Scroll, Fingerprint, Echart, WYSIWYG, OCR 등 소개."
author: "미물"
authorURL: "https://mimul.com"
date: "2019-12-25T23:15:24.000Z"
lastModificationTime: "2019-12-25T23:15:24.000Z"
image: "/img/blog/js_popular.png"
commentId: "popular_ui_javascript-2019-12-25"
tags:
  - Javascript
---

스타트업에 종사하는 분들이라면 다들 비슷할 것이라고 생각됩니다만, 서비스 기획물을 직접 디자인을 구현하는 것도 좋지만 인적 자원이 한정되다 보니 모든 것을 디자인화할 수는 없습니다. 그래서 일부는 오픈 소스로 대체하거나 디자인을 변형하는 등의 커스터마이징을 통해 동일한 디자인 Identity를 유지하기도 합니다. 그동안 제가 리서치하거나 사용해본 것들중에 괜찮은 (UI기반의) Javascript 라이브러리들을 공유하면 어떨까 고민하다가 이 글을 쓰게 되었습니다.

#### 숫자 형식 정의 - Cleave

- 폼의 input 요소에 입력하는 숫자 형식을 쉽게 정의 할 수 있음. 지원 형식은 신용 카드, 전화 번호, 날짜 시간, 숫자(금액), 구분 문자 접두사 블록 패턴. React, AngularJS 지원.
- License : Apache License Version 2.0.
- 브라우저 지원 : IE9+, Edge, Chrome, Firefox, Safari, Opera.
- Star 수 : 15,123
- [cleave.js 링크](https://nosir.github.io/cleave.js/)

![Cleave](/img/blog/js_cleave.png)

#### 팝업(Alert)

**1. Sweet Alert**

- 예쁜 브라우저 기반 팝업 박스 JavaScript 라이브러리.
- License : MIT 라이센스.
- 브라우저 : IE 11+, Edge, Chrome, Firefox, Safari, Opera.
- Star 수 : 10,431
- [Sweet Alert 링크](https://sweetalert2.github.io/)

![Sweet Alert](/img/blog/js_sweet_alert.png)

**2. Modaal**

- 브라우저 기반 팝업 JavaScript 라이브러리.
- License : MIT 라이센스.
- 브라우저 : IE 9+, Edge, Chrome, Firefox, Safari, Opera.
- Star 수 : 2,629
- [Modaal 링크](https://github.com/humaan/Modaal)

#### 날짜 Datepicker - flatpickr

- 날짜 표현을 예쁘게 해주는  JavaScript 라이브러리.
- License : MIT 라이센스.
- 브라우저 지원: IE9+, Edge, iOS Safari 6+, Chrome 8+, Firefox 6+
- Star 수 : 12,562
- [flatpickr 링크](https://flatpickr.js.org/)

![flatpickr](/img/blog/js_flatpickr.png)

#### 이미지 Cropper

**1. Cropper.js**

- 사용자 업로드 이미지(프로필 등)를 업로드해서 crop해 주는 Javascript 라이브러리.
- License : MIT 라이센스.
- 브라우저 지원 : IE 9+, Edge, Firefox, Chrome, Safari, Opera
- Star 수 : 6,667
- [Cropper 링크](https://github.com/fengyuanchen/cropperjs)

![Cropper.js](/img/blog/js_cropperjs.png)

**2. Croppie**

- 이미지 Crop 시 확대 축소가 가능한 특징이 있음.
- License : MIT 라이센스.
- 브라우저 지원 : Firefox 10+, Chrome 12+, IE 10+, Edge, Safari 4+, Opera 15+, iOS, Android
- Star 수 : 1,894
- [Croppie 링크](https://github.com/Foliotek/Croppie)

![Croppie](/img/blog/js_croppie.png)

#### input box 자동 완성 처리

**1. typeahead.js**

- Twitter에서 만든 자동 완성 Javascript 라이브러리.
- License : MIT 라이센스.
- 브라우저 지원 : Chrome, Firefox 3.5+, Safari 4+, IE 8+, Opera 11+
- Star 수 : 15,928
- [typeahead.js 링크](https://github.com/twitter/typeahead.js)

**2. autoComplete.js**

- 자동 완성 Javascript 라이브러리.
- License : Apache License 2.0 라이센스.
- 브라우저 지원 : Firefox 10+, Chrome 12+, IE 10+, Edge, Safari 4+, Opera 15+, iOS, Android
- Star 수 : 2,524
- [autoComplete.js 링크](https://github.com/TarekRaafat/autoComplete.js)

![autoComplete.js](/img/blog/js_autoComplete.png)

#### 셀렉트 박스

**1. Select2**

- 셀렉트 박스를 유연하게 해주는 Javascript 라이브러리.
- License : MIT 라이센스.
- 브라우저 지원 : IE 8+, Chrome 8+, Firefox 10+, Safari 3+, Opera 10.6+
- Star 수 : 24,162
- [Select2 링크](https://github.com/select2/select2)

![Select2](/img/blog/js_select2.png)

**2. chosen**

- 셀렉트 박스를 유연하게 해주는 Javascript 라이브러리.
- License : MIT 라이센스.
- 브라우저 지원 : IE 9+, Chrome, Firefox, Safari, Opera.
- Star 수 : 22,216
- [chosen 링크](https://github.com/harvesthq/chosen)

#### Infinite Scroll

- 페이지 무한 스크롤 지원 Javascript 라이브러리.
- License : GNU GPL license v3 라이센스.
- 브라우저 지원 : IE 9+, Chrome, Firefox, Safari, Opera.
- Star 수 : 6,457
- [infinite-scroll 링크](https://github.com/metafizzy/infinite-scroll)

#### 클립보드에 복사 - clipboard.js

- 웹에서 클립보드에 복사하기를 지원하는 Javascript 라이브러리.
- License : MIT 라이센스.
- 브라우저 : Chrome, Safari, Firefox, Opera, IE9+, Edge.
- Star 수 : 27,738
- [clipboard.js 링크](https://github.com/zenorocha/clipboard.js/)

![clipboard.js](/img/blog/js_clipboard.png)

#### 파일 업로드 - uppy

- 웹에서 파일 업로드용 Javascript 라이브러리.
- License : MIT 라이센스.
- 브라우저 : IE10+, Safari, Edge, Chrome, Firefox and Opera.
- Star 수 : 21,581
- [uppy 링크](https://github.com/transloadit/uppy)

![uppy](/img/blog/js_uppy.png)

#### 암호화

**1. hashids.js**

- Web 서비스에 고유 URL을 제공 할 때 ID를 숫자 그대로 보여주면 ID를 예측하거나 데이터 건수 등을 알 수 있기에 임의의 문자열을 만들어서 ID로 보낼때 활용함. YouTube에서 사용하는 방식.
- License : MIT 라이센스
- 브라우저 : Chrome, Safari, Firefox, Opera, IE, Edge.
- Star 수 : 2,680
- [hashids.js 링크](https://github.com/niieani/hashids.js)

**2. crypto-js**

- 암호화 라이브러리로 클라이언트와 서버간에 파라미터 보안 강화를 위해 암호화를 사용할 때 활용 가능.
- License : MIT 라이센스.
- 브라우저 : Chrome, Safari, Firefox, Opera, IE, Edge.
- Star 수 : 8,237
- [crypto-js 링크](https://github.com/brix/crypto-js)

#### 사용자 추적

**1. Fingerprint.js**

- 사용자가 웹에서 하는 행위를 추적하거나 서비스 특정 지점에서의 이탈 포인트를 확인하는 용도로 활용 가능.
- License : MIT 라이센스.
- 브라우저 : Chrome, Safari, Firefox, Opera, IE 9+, Edge.
- Star 수 : 9,549
- [Fingerprint.js 링크](https://github.com/Valve/fingerprintjs2)

**2. sourcebuster-js**

- 소셜 미디어와 이메일에 링크를 클릭했을 때 URL에 utm_* 같은 문자를 보게 되는데, 이것이 Urchin Tracking Module의 약자로 Google이 인수한 Urchin이 쓰던 추적 용 정보이다. UTM을 활용해서 소스를 알게 해 줌.
- License :MIT 라이센스.
- 브라우저 : Chrome, Safari, Firefox, Opera, IE 9+, Edge.
- Star 수 : 348
- [sourcebuster-js 링크](https://github.com/alexfedoseev/sourcebuster-js)

#### WYSIWYG editor

**1. Quill**

- 웹상에서 글쓰기 기능에 필요한 WYSIWYG editor Javascript 라이브러리.
- License : BSD 3-clause 라이센스.
- 브라우저 지원 : IE 10+, Chrome 8+, Firefox 8+, Safari 10.12+, Opera 10.6+
- Star 수 : 25,014
- [Quill 링크](https://github.com/quilljs/quill)

![Quill](/img/blog/js_quill.png)

**2. Summernote**

- 웹상에서 글쓰기 기능에 필요한 WYSIWYG editor Javascript 라이브러리.
- License : MIT 라이센스.
- 브라우저 지원 : Safari, Chrome, Firefox, Opera, Edge, IE 9+
- Star 수 : 9,063
- [Summernote 링크](https://github.com/summernote/summernote)

#### 웹 푸시 알람

**1. toastr**

- 푸시 알람을 보여줄 수 있는 Javascript 라이브러리.
- License : MIT 라이센스.
- 브라우저 지원 : IE 7+, Chrome, Firefox, Safari, Opera
- Star 수 : 9,920
- [toastr 링크](https://github.com/CodeSeven/toastr)

![toastr](/img/blog/js_toastr.png)

**2. Push.js**

- 데스크톱과 스마트 폰의 알림을 설정할 수 있는 Javascript 라이브러리.
- License : MIT 라이센스.
- 브라우저 : Chrome, Safari, Firefox, IE 9+.
- Star 수 : 8,114
- [Push.js 링크](https://github.com/Nickersoft/push.js)

#### 웹에서 싸인 처리 - Signature Pad

- 웹에서 싸인 처리를 해주는 Canvas 기반 싸인 캡처 Javascript 라이브러리.
- License : MIT 라이센스.
- 브라우저 지원 : IE 9+, Edge, Chrome, Firefox, Safari, Opera.
- Star 수 : 5,392
- [Signature Pad 링크](https://github.com/szimek/signature_pad)

![Signature Pad](/img/blog/js_signature.png)

#### 차트나 그래프 관련 오픈 소스들

**1. Echart**

- Baidu에서 만든 데이터 시각화(차트) JavaScript 라이브러리. 인터액션이 좋고, 빅데이터 분석에 사용할 수있는 많은 종류의 그래프를 대응함.
- License : Apache License V2.
- 브라우저 지원 : IE 8+, Edge, Chrome, Firefox, Safari, Opera.
- Star 수 : 38,704
- [Echart 링크](https://github.com/apache/incubator-echarts)

![Echart](/img/blog/js_ECHART.jpg)

**2. D3**

- 대표적인 오픈소스형 데이터 시각화 라이브러리. 그래프에 특화된 확장형 오픈소스들이 만들어지고 있어 시각화 오픈소스 생태계를 형성하고 있는 오픈 소스.
- License : BSD 3-Clause "New" or "Revised".
- 브라우저 지원: IE 9+, Edge, Chrome, Firefox, Safari, Opera.
- Star 수 : 89,238
- [D3 링크](https://d3js.org/)

**3. deck.gl**

- Uber에서 만든 WebGL기반의 지도에 특화된 데이터 시각화 JavaScript 라이브러리.
- License : MIT 라이센스.
- 브라우저 지원 : Edge, Chrome, Firefox, Safari, Opera.
- Star 수 : 7,036
- [deck.gl 링크](https://github.com/uber/deck.gl)

**4. Zircle UI**

- 서클 모양의 줌 기능을 갖춘 사용자 인터페이스 라이브러리. 대시보드용 화면에 활용도 높으며 최대 9레벨 탐색을 줌. 모바일도 지원함.
- License : MIT 라이센스.
- 브라우저 지원 : Edge, Chrome, Firefox, Safari, Opera.
- Star 수 : 779
- [Zircle UI 링크](https://zircleui.github.io/docs/)

![Zircle UI](/img/blog/js_zircleui.png)

**5. roughViz**

- 필기 스타일의 그래프와 차트를 만들수 있는 JavaScript 라이브러리. D3.js 과 rough.js 를 기반으로하고 있으며, 그래프와 차트는 막대 그래프(수직/수평), 도넛, 라인, 파이, 산포도, 수직 누적 막대 등 7 종류 지원.
- License : MIT 라이센스.
- 브라우저 지원: IE 9+, Edge, Chrome, Firefox, Safari, Opera.
- Star 수 : 4,711
- [roughViz 링크](https://github.com/jwilber/roughViz)

![roughViz](/img/blog/js_roughViz.gif)

**6. Zeu**

- 다양한 데이터를 최소한의 기술로 실시간 시각화 애니메이션으로 표시하는 고성능 JavaScript 라이브러리. 바, 디지털 시계, Heartbeat, Message Queue, Network Graph, Round Fan, Speed ​​Circle, Text Meter, Volume Meter등의 지원.
- License : MIT 라이센스.
- 브라우저 지원: IE 9+, Edge, Chrome, Firefox, Safari, Opera.
- Star 수 : 1,661
- [Zeu 링크](https://github.com/shzlw/zeu)

![Zeu](/img/blog/js_zeu.gif)

**7. odometer**

- 숫자를 다양한 형태의 모양과 효과를 주면서 디스플레이해주는 JavaScript 라이브러리. 대시보드용으로 활용 가능. 7가지 테마(Default, Minimal, Car, Plaza, Slot Machine, Train Station, Digital)를 선택할 수 있음.
- License : MIT 라이센스.
- 브라우저 : IE8+, FF4+, Safari 6+, and Chrome.
- Star 수 : 6,900
- [odometer 링크](https://github.hubspot.com/odometer/docs/welcome/)


####  OCR - tesseract.js

- C++로 작성된 Tesseract OCR 라이브러리를 자바스크립트로 포팅한 것으로 텍스트의 방향을 자동으로 탐지하며, 단락을 구분, 단어 및 문자의 경계를 탐지하는 등의 인터페이스를 제공. 한글 포함 62개 언어 지원.
- License : Apache License 2.0.
- Star 수 : 19,992
- [tesseract.js 링크](https://github.com/naptha/tesseract.js)
