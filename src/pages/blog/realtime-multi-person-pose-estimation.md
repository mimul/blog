---
templateKey: "blog-post"
title: "Realtime Multi-Person Pose Estimation 논문 리뷰 및 구현"
description: "Human Detection 관련 논문(Realtime Multi-Person Pose Estimation) 리뷰 및 샘플 구현."
author: "미물"
authorURL: "https://mimul.com"
date: "2020-02-16T22:22:09.000Z"
lastModificationTime: "2020-02-16T20:11:11.000Z"
image: "/img/topics/pose_estimation.png"
commentId: "realtime-multi-person-pose-estimation-2020-02-08"
tags:
  - Pose Estimation
  - Deep Learning
  - Open Pose
  - FMS
  - AI
  - 헬스
---

피트니스에서 운동하고자 하는 회원의 FMS(Deep Squat, Hurdle Step, In-line Lunge, Active Straight-leg Raise, Trunk Stability Push-up, Rotary Stability, Shoulder Mobility 등 7가지 운동 동작의 움직임을 테스트 후 총 점수가 14점 이하인 경우, 신체의 문제점이 있다고 판단하여 교정 운동을 통해서 신체의 문제점을 개선해 가는) 7가지 운동 동작을 보고 코치가 평가한 FMS 점수와 Deep Learning 알고리즘 중에 하나를 선택해서 자동 측정한 점수의 유사도를 평가하는 목표를 가지고 있습니다. 그래서 이를 수행하려면 먼저 Human Pose Estimation에 대한 이해가 먼저라고 생각해 필요한 논문들을 살펴보다가 [Realtime Multi-Person 2D Pose Estimation using Part Affinity Fields 논문](https://arxiv.org/abs/1611.08050)이 도움이 될 것 같아서 논문을 먼저 이해하려고 노력했고, 그 다음으로 FMS 동작을 촬영한 동영상을 가지고 해당 논문의 오픈 소스들을 참고해 동작을 인식하고 자세를 측정하는 모델을 구현/테스트를 하게 되었습니다. 몇가지 논문을 더 살펴본 다음 현실적인 아이디어를 정리해 학습과 개선을 통해 자동 측정하는 알고리즘을 개발해 보려고 합니다.

##  Realtime Multi-Person 2D Pose Estimation using Part Affinity Fields 논문 리뷰

- 제목 : Realtime Multi-Person 2D Pose Estimation using Part Affinity
- 저자 : Zhe Cao, Tomas Simon, Shih-En Wei, Yaser Sheikh(Carnegie Mellon University)
- 공개 : 2016년 11월 24일
- 논문 위치 : https://arxiv.org/abs/1611.08050

##### 1. Human Pose Estimation 접근 방식

Human Pose Estimation방식은 Top-Down 방식과 Bottom-Up 방식으로 나눌 수 있다.

**① Top-Down 방식 : 사람을 먼저 감지를 한 다음 각 사람의 자세 추정함.**

![Top-Down 방식](/img/blog/pose_top_down.png)

문제점은 사람을 인식하지 못하면 측정할 수 없고 사람수가 많아지면 계산량도 많아진다.
관련 논문으로는 [Mask R-CNN](https://arxiv.org/abs/1703.06870)과 [Multi-Person Pose Estimation with Local Joint-to-Person Associations](https://arxiv.org/abs/1608.08526), [Convolutional Pose Machines](https://arxiv.org/abs/1602.00134)이 있다.

**② Bottom-Up 방식 : 관절 부위(키 포인트)를 먼저 감지하여 서로 연결해 모든 사람의 자세를 추정함.**

![Bottom-Up 방식](/img/blog/pose_botton_up.png)

문제점은 찾은 관절을 매칭할 수 있는 조합이 매우 많고 이를 적절하게 매칭하는데 시간이 많이 걸리고 정확도를 높이는 것도 힘들다.
관련 논문으로는 [DeepCut: Joint Subset Partition and Labeling for Multi Person Pose Estimation](https://arxiv.org/abs/1511.06645)이라는 논문이 있는데, Deepcut의 구조를 변경하여 계산을 보다 효율적으로 수행하는 방법을 고안했지만, 그래도 한장의 사진이 몇초에서 이미지에 따라 수백초 걸린다는 결과도 있다. DeeprCut 논문이 나온 이후로 알고리즘이 개선되어, [ArtTrack: Articulated Multi-person Tracking in the Wild](https://arxiv.org/abs/1612.01465) 논문과 [본 논문](https://arxiv.org/abs/1611.08050)에서는 사진 1장에 대한 속도는 거의 동일하며, 특정 조건하에서는 0.005초에서 처리가 가능하다. 그래서 본 논문을 먼저 리뷰하고 구현해 본다.

##### 2. 논문에서 제안된 방식

기존 상향식에서 감지한 신체 부위 사이의 연결해서 맞추기가 어렵고, 정확도가 떨어지거나 조합 증가에 따른 계산량의 증가 등의 문제가 존재하고 신체 부위 사이의 중간점을 따내는 등 위치 정보를 추가하는 기법들이 제안되어 있었지만, 방향 정보 없이는 표현에 한계가 있다.

- 신체 부위의 위치뿐 아니라 신체 부위간의 관계(연결)도 인코딩 하고.
- 위치 정보, 방향 정보를 포함하는 표현(Part Affinity Fields)을 아래 그림처럼 limb(신체 부위의 이음 맞춤 부분)를 2D 벡터로 인코딩할 수 있는 필터를 학습함.

이렇게 함으로써 사람을 감지하고 각 사람에 각각 pose estimation을 수행하는 Top-Down 방식 대신 관절을 먼저 찾아 여러 사람의 pose estimation을 수행하는 Bottom-Up 접근으로도 pose estimation의 정확성과 속도를 개선할 수 있다. 아래 그림은 채널마다 각 신체 부위 사이의 흐름을 인코딩(그림은 2명의 왼쪽 팔의 흐름)을 나타낸다.

![제안된 방식](/img/blog/pose_proposal.png)

##### 3. 논문에서 제안된 아키텍처

**① 제안된 아키텍처 흐름**

![제안 아키텍처 흐름](/img/blog/pose_architecture1.png)

- (a) 이미지 입력
- (b) 각 채널에서 각 신체 부위(키 포인트) 감지(confidence map) : 각 신체 부위(ex. 오른쪽 어깨, 오른쪽 팔꿈치 등)가 있을 것 같은 정도(confidence)를 px 위치마다 인코딩.
- (c) 신체 부위의 관계(연결)성 인코딩(affinity fields) : 각 신체 부위 간(ex. 오른쪽 팔, 오른쪽 허벅지 등)의 흐름(2d vector)을 px 위치마다 인코딩.
- (d) 매칭 : b에서 얻은 키 포인트와, c에서 얻은 관계성을 바탕으로 하나의 장표로 일치시키는 작업.(ex. 어떤 오른쪽 팔꿈치와 어떤 오른쪽 어깨를 연결)
- (e) 결과 도출 :  각 신체 부위에 대한 (d) 결과물을 합계하여 출력.

**② Part Confidence Maps & Part Affinity Fields**

![Part Confidence Maps & Part Affinity Fields](/img/blog/pose_architecture2.png)

- F는 입력 이미지를 VGG-19(관련 논문 : [Very Deep Convolutional Networks for Large-Scale Image Recognition](https://arxiv.org/abs/1409.1556))에 입력하고 중간층을 특징량으로 사용하여 변환.
- Branch1에서 confidence map을 예측, Branch2에서 part affinity fields을 예측.
- 동일한 Branch1, Branch2을 가진 유닛을 반복.(Stage 1 ~ Stage 6)
- 각 Stage에서 입력은 바로 앞 Stage에서 Branch1, Branch2, 원래 Stage1의 입력 F를 concatenate한 것.(신체 부위 탐지와 연결엔 코드를 공통으로 사용함)
- Stage마다 오차(Loss Functions) 계산.
- Stage를 반복할수록 정확도 향상.

![Part Confidence Maps & Part Affinity Fields 2](/img/blog/pose_architecture3.png)

- 위는 confidence map 우측 손목을 감지하는 채널. Stage를 거듭할수록 오른쪽 손목의 confidence가 올라가고 그렇지 않은 부분의 confidence가 떨어지는 것을 알 수 있다.
- 아래는 part affinity field 우측 팔의 흐름을 encode하는 채널. Stage를 거듭할수록 오른쪽 팔의 확실성이 상승하고 그렇지 않은 부분이 얇아지는 것을 알 수 있다.(주황색원: False negative, 빨간원: False positive)

**③ Bipartite Matching**

![Bipartite Matching](/img/blog/pose_architecture4.png)

- (a) 원본 이미지, (b) 가능한 모든 신체 부위(관절) 연결, (c) 사람의 관절 구조(spanning tree 형태), (d) 이웃한 부위(관절)끼리 두개씩의 매칭.
- 감지된 신체 부위들(part confidence map)끼리 연결, 인코딩(part affinity fields)의 확실성을 극대화하도록 매칭.
- 연결 맞춤 문제는 포괄적으로 돌리면 NP-Hard 문제 때문에 다음 2개의 완화법을 도입.
  - (1) 각 부위(관절)에 인접할 부위의 사전 정보를 제공.(ex. 오른쪽 어깨와 연결되는 것은, 목과 오른쪽 팔꿈치 뿐)
  - (2) 이웃하는 부위(관절)만을 보고 part affinity fields적인 확실성을 최대화하도록 매칭.(실제로 이것으로 정밀도가 나온다. Part affinity fields의 global 정보의 인코딩이 잘되어 있을 것이라고 판단함)

##### 4. 모델 수식

**① Loss Function(오차 함수)**

![Loss function 1](/img/blog/pose_arithmetic11.png)

- 네트워크 구조는 아래 그림과 같이 1 × 1, 3 × 3, 7 × 7 Convolution 및 Pooling Layer로 구성.
- 입력 이미지를 우선 VGG-19(관련 논문 : [Very Deep Convolutional Networks for Large-Scale Image Recognition](https://arxiv.org/abs/1409.1556))와 거의 같은 구조의 CNN를 통해서 해상도를 8분의 1로 압축한 특징 맵을 추출하고, 그 후단은 두 Branch로 분기하고 하나는 Confidence Maps라는 몸의 각 키 포인트를 heatmap 형식으로 예측하는 네트워크와 PAFs(Part Affinity Fields)라는 각 키 포인트 사이의 연결할 수 있는 가능성을 나타내는 벡터 지도를 예측하는 네트워크. 연결이 정의되어 있는 키 포인트를 연결하는 선(정확하게는 일정한 폭을 가지는 영역)의 모든 픽셀에 일정한 길이의 방향 벡터가 정의되고 이 벡터는 x와 y의 2개 채널의 heatmap에 의해 표현됨.

![Loss function 2](/img/blog/pose_arithmetic12.png)

- Stage t의 오차 함수(loss functions).
- Stage마다 loss를 계산하여 Vanishing gradient를 해결.

![Loss function 3](/img/blog/pose_arithmetic13.png)

- 전체 목적 함수(overall objective): 전체 단계 추가.

**② Part Confidence Map 정답치 데이터 생성**

![Part Confidence Map 정답 값 1](/img/blog/pose_arithmetic21.png)

- Part Confidence Map의 정답치를 생성하는 S*, 부위(관절) 위치에 어노테이션된 2D 이미지 작성.
- 어노테이션된 점을 정점으로 갖는 분포로 표현함.

![Part Confidence Map 정답 값 2](/img/blog/pose_arithmetic22.png)

- 하나의 채널이 모든 사람의 한 부위(관절)를 담당하고 예측하기 때문에 그것에 형식를 맞추기 위해 모든 사람에 대해 map을 합체. 즉, 사람마다의 Map에서 키 포인트 당 Map 형식을 맞추기 위해 Max 연산을 사용하고 피크를 명확하게 유지함.
- 학습시는 non-maxmum suppression 하여 각 부위(관절)의 예측 위치를 얻음.(non-maximum suppression : 좌표 중심은 Confidence 최대 값을 취하고, 그 이외의 좌표는 완만한 값이 감소하는 곡선을 그림)

**③ Part Affinity Fields 정답치 데이터 생성**

![Part Affinity Fields 정답치 데이터 생성 1](/img/blog/pose_arithmetic31.png)

- Part Confidence Map의 정답치를 생성하는 L*, 부위(관절) 위치에 어노테이션된 2D 이미지 작성.
- 파랑 점 xj1, 붉은 점을 xj2로 맺은선, 그리고 xj1과 xj2을 맺은선에서 거리가 σ(임계값)이하일 경우에만 관계 선분으로 처리하는 단위 벡터 v를 학습 데이터로, 그 외의 점들은 모두 제로 벡터로 함.

![Part Affinity Fields 정답치 데이터 생성 2](/img/blog/pose_arithmetic32.png)

- 예측되는 모양에 맞게, 모든 사람에 관해서 fields를 합체하여, limb(키 포인트) 마다 field를 작성하고, Average 연산자를 사용함.

**④ Bipartite Matching**

![Bipartite Matching 1](/img/blog/pose_arithmetic41.png)

- 감지된 부위(키 포인트)와 다른 키 포인트로 연결되는 선에서 점 p와 키 포인트와 키 포인트 사이에서 계산되는 방향을 선적분함으로서 부위간의 확실함을 산출.

![Bipartite Matching 2](/img/blog/pose_arithmetic42.png)

- 각 키 포인트(부위) c의 연결 방법 z에 대해, E를 극대화하는 연결 방법을 선택함

## Chainer 기반 자세 추정 기능 구현

Chainer를 기반으로 동작하는 환경 구성 및 실행 방법 등을 기술한다. 구현 소스는 [GitHub](https://github.com/mimul/chainer-pose-estimation)에 올려놨으니 참조 바랍니다.

##### 1. Requirements

- Python 3.0+
- Chainer 2.0+
- NumPy
- Matplotlib
- OpenCV

##### 2. Convert Caffe model to Chainer model

[참조한 프로젝트](https://github.com/ZheC/Realtime_Multi-Person_Pose_Estimation)에서 caffe model을 참고하여 변환하면 된다.

```
> cd models
> wget http://posefs1.perception.cs.cmu.edu/OpenPose/models/pose/coco/pose_iter_440000.caffemodel
> wget http://posefs1.perception.cs.cmu.edu/OpenPose/models/face/pose_iter_116000.caffemodel
> wget http://posefs1.perception.cs.cmu.edu/OpenPose/models/hand/pose_iter_102000.caffemodel

> python convert_model.py posenet pose_iter_440000.caffemodel coco_posenet.npz
> python convert_model.py facenet pose_iter_116000.caffemodel facenet.npz
> python convert_model.py handnet pose_iter_102000.caffemodel handnet.npz
```

##### 3. trained model을 가지고 테스트

우선 이미지 파일로 기존 trained model을 사용하여 동작이 제대로 인식되는지 평가해 본다.

```
> python pose_detector.py posenet models/coco_posenet.npz --images data/image/deep_squat.jpg data/image/hurdle_step.jpg data/image/in_line_lunge.jpg data/image/rotary_stability.jpg
```

실행 결과는 아래와 같다.

![deep_squat](pose_detector1.png)
![hurdle_step](pose_detector2.png)
![in_line_lunge](pose_detector3.png)
![rotary_stability](pose_detector4.png)

동영상 파일로 기존 trained model로 제대로 인식되는지 평가해 보려면.

```
python video_pose_detector.py --video data/video/hurdle_step_video.mp4
```

##### 4. pose_detector.py 소스 설명

```python
pose_detector = PoseDetector(args.arch, args.weights, device=args.gpu, precise=args.precise)
```
첫째, Chainer 버전의 OpenPose 모델을 가져온다.

```python
poses, _ = pose_detector(img)
```
두번째, 추론을 한다.

```python
img = draw_person_pose(img, poses)
```
세번째, 시각화 코드를 제공하고 있어서 이미지에 인식한 결과를 겹쳐 보이게 한다.

```python
print("type: {}".format(type(poses)))
print("shape: {}".format(poses.shape))
print(poses)

결과 로그
type: <class 'numpy.ndarray'>
shape: (1, 18, 3)
[[[730.640625   465.01875      2.        ]
  [726.95052083 524.06875      2.        ]
  [642.078125   524.06875      2.        ]
  [527.68489583 417.040625     2.        ]
  [446.50260417 273.10625      2.        ]
  [819.203125   527.759375     2.        ]
  [907.765625   394.896875     2.        ]
  [974.1875     258.34375      2.        ]
  [667.90885417 804.55625      2.        ]
  [583.03645833 749.196875     2.        ]
  [590.41666667 963.253125     2.        ]
  [771.23177083 804.55625      2.        ]
  [859.79427083 745.50625      2.        ]
  [867.17447917 966.94375      2.        ]
  [715.88020833 442.875        2.        ]
  [749.09114583 442.875        2.        ]
  [682.66927083 446.565625     2.        ]
  [774.921875   450.25625      2.        ]]]
```
인식 결과를 확인하기 위해 로그도 추가해 본다. 결과로그를 해석해보면 shape의 첫번째 값 1은 감지된 사람수, 두번째 값 18은 관절의 숫자로 고정되어 있으며 순서대로 코, 목, ...과 같이 entity.py의 JointType 클래스를 보면 된다. 세번째 값 3은 X 좌표, Y 좌표 플래그가 되고 관절이 없으면 플래그에 0 값이 채워진다.
관절의 정의에 대한 원본은 [여기](https://github.com/CMU-Perceptual-Computing-Lab/openpose/blob/master/doc/output.md#pose-output-format)에 보면 정의되어 있다.

##### 5. FMS에 대해

Cook에 의해 창안된 안정성과 가동성을 평가하기 위해 고안된 움직임 패턴 평가로 불균형(Imbalances)과 약점(Weaknesses)이 나타나는 극단적 자세를 사용하여 7가지의 움직임 패턴을 통해 관절의 제한사항, 불균형, 비대칭, 보상작용 등을 평가할 수 있는 검사 방법이다.

프로세스는 아래와 같다.

- 7가지의 움직임 동작(Deep Squat, Hurdle Step, In-line Lunge, Active Straight-leg Raise, Trunk Stability Push-up, Rotary Stability, Shoulder Mobility)을 통해서 신체의 움직임의 기능적인 문제를 파악하고 점수를 채점하고,
- 각 항목의 만점 기준은 3점이며,
- 7가지 움직임 테스트 후 총 점수가 14점 이하인 경우, 신체의 문제점이 노출되어 있다고 판단할수 있으며 교정운동을 통해서 신체의 문제점을 개선한다.

FMS에서는 가동성과 안정성, 움직임 패턴을 확인할수 있다.

- 가동성 운동(ASLR, SM)은 관절의 움직임 범위, 조직의 길이와 근육의 유연성을 확인한다.
- 안정성 운동(TSPU,RS)은 각각의 움직임 패턴에서 시작과 끝 위치의 자세 통제를 목표로 한다.
- 움직임 패턴(DS,HS,IL)은 협응력과 타이밍을 강화시키기 위하여 근본적 가동성과 안정성의 사용을 구체적인 움직임 패턴으로 통합하는 것이다.

## 참조 사이트

- [Realtime Multi-Person 2D Pose Estimation using Part Affinity Fields](https://arxiv.org/abs/1611.08050)
- [Very Deep Convolutional Networks for Large-Scale Image Recognition](https://arxiv.org/abs/1409.1556)
- [ArtTrack: Articulated Multi-person Tracking in the Wild](https://arxiv.org/abs/1612.01465)
- [CVPR'16, Convolutional Pose Machines](https://github.com/shihenw/convolutional-pose-machines-release)
- [CVPR'17, Realtime Multi-Person Pose Estimation](https://github.com/ZheC/Realtime_Multi-Person_Pose_Estimation)
- [Chainer version of Realtime Multi-Person Pose Estiamtion](https://github.com/DeNA/Chainer_Realtime_Multi-Person_Pose_Estimation)
