---
templateKey: "blog-post"
title: "LangChain을 활용한 LLM 어플리케이션의 기본적인 개발 흐름"
description: "LangChain을 활용하기 위한 기본적인 내용인 Prompt를 만드는 방법, 모델을 정의하는 방법, 프롬프트와 모델을 실행하는 방법에 대해서 기술함" 
author: "미물"
authorURL: "https://mimul.com"
date: "2024-05-21T20:44:25.000Z"
lastModificationTime: "2024-05-21T23:11:01.000Z"
image: "/img/blog/llm.png"
commentId: "langchain-2024-05-21"
tags:
  - LangChain
  - LLM
  - AI
---
LangChain과 LangGraph를 이용하여 Deep Research와 같은 LLM 애플리케이션을 만드는 방법에 대해서 앞으로 기술할 예정인데, 이 글에서는 그중에서 가장 기초 단계이면서 먼저 알아야할 기본적인 내용들을 다룬다. LangChain이나 LLM에 대한 이해도가 초보인 사람들을 대상으로 기술하니 중급 이상의 분들은 그냥 패스하기 바랍니다.

LangChain을 활용한 LLM 어플리케이션의 개발을 위해 기본적으로  알아야할 것들이 Prompt를 만드는 방법, 모델을 정의하는 방법, 프롬프트와 모델을 실행하는 방법이다. 

### 사전 준비

**1. Google Colab에서 노트북 열기**

[Google Colab](https://colab.research.google.com/)에서 진행할 예정인데, 브라우저에서 Python 코드를 실행할 수 있으며 GPU와 TPU도 무료로 사용할 수 있다. [Google 드라이브](https://drive.google.com/)에 LangChain 예제 파일을 업로드 한 다음 [langchain_fundamental.ipynb](https://github.com/mimul/colab-ai/blob/master/langchain_fundamental.ipynb) 파일을 더블 클릭하면 Google Colab으로 열리게 된다.

**2. Google AI Studio에서 Gemini의 API 키 가져오기**

[Google AI Studio](https://aistudio.google.com/)의 gemini를 사용하는데, 이유는 API 이용에 요금이 부과되지 않기 때문이다. 먼저 API Key를 획득해야 하는데 [Google AI Studio](https://aistudio.google.com/) 이동해 로그인 후 API키 만들기를 한 다음 키 문자열을 복사한다. Gemini API키는 Google Colab의 노트북 내에서 안전하게 이용하기 위해, Colab의 시크릿 기능을 사용한다. 시크릿 메뉴에서 Gemini Key를 불러오게 되면 코드에서 API 키를 식별하기 위한 이름을 입력하면 되는데 API Key 입력란에 ```GOOGLE_API_KEY``` 문자열을 입력하면 된다.

**3. 패키지 설치**

Colab에서 아래 명령어를 실행한다. 다음 단계를 진행하기 위한 사전 패키지 설치 단계인 셈이다.

```
!pip uninstall -y google-generativeai

!pip install langchain==0.3.20 langchain_core==0.3.49 langchain_google_genai==2.1.1 httpx==0.28.1 requests==2.32.3
```

### Prompt를 만드는 방법

대규모 언어 모델(LLM)과 효과적으로 상호작용하기 위해서는 프롬프트 설계가 매우 중요하다. 여기에서는 LangChain에서 기본 프롬프트를 만드는 방법과 그 메커니즘을 설명한다. 프롬프트는 간단히 말하면 대규모 언어 모델(LLM)에 대한 지시 또는 질문이다. LLM은 이 프롬프트의 내용을 기반으로 응답을 생성한다. 채팅 형식의 LLM(ChatGPT나 Gemini 등)에서는 많은 경우, 복수의 역할을 가지는 메세지를 조합해 프롬프트를 구축한다. 

대표적인 것이 "시스템 프롬프트"와 "사용자 프롬프트"이다. 시스템 프롬프트는 LLM에게 전체 상호 작용에서 역할, 행동 규칙, 어조, 제약 등을 지시하는 메시지이다. 기본적으로 이 프롬프트는 사용자에게 공개하지 않는다. 사용자 프롬프트는 사용자가 LLM에 대해 구체적으로 묻고 싶은 것 또는 실행하고 싶은 지시를 전하는 메시지이다. 브라우저에서 chatGPT 등을 이용할 때에 여러분이 입력하고 있는 텍스트가 해당된다.

여기서 사용하는 코드는 [langchain_fundamental.ipynb](https://github.com/mimul/colab-ai/blob/master/langchain_fundamental.ipynb) 파일의 1 ~ 3셀에 해당한다.

```
# prompt 1
message1 = [
        SystemMessage(content= "당신은 한국어를 말하는 우수한 어시스턴트입니다. 회답에는 반드시 한국어로 대답해 주세요. 또 생각하는 과정도 출력해 주세요."),
        HumanMessagePromptTemplate.from_template(
            [
                {
                    "type": "text",
                    "text": "{user_input}"
                },
            ]
        )
    ]

prompt1 = ChatPromptTemplate.from_messages(message1)

# prompt 2
message2 = [
        ("system", "당신은 한국어를 말하는 우수한 어시스턴트입니다. 회답에는 반드시 한국어로 대답해 주세요. 또 생각하는 과정도 출력해 주세요."),
        ("human", "{user_input}"),
    ]

prompt2 = ChatPromptTemplate.from_messages(message2)
```

여기에서는 같은 내용의 프롬프트를 두가지 패턴을 쓰고 있다. 먼저 첫번째 패턴은 아래와 같다.

- ```SystemMessage(content=...)```은 시스템 프롬프트의 내용을 정의하는 LangChain 클래스이고 content라는 파라미터에 시스템 메시지로 LLM에 알리고 싶은 지시의 텍스트 문자열을 전달한다. 
- ```HumanMessagePromptTemplate.from_template(...)```은 사용자 프롬프트의 "템플릿"을 정의하기 위한 클래스이다. 파라미터는 메시지의 내용과 구조를 지정하는 목록을 전달한다. ```{"type": "text", "text": "{user_input}"}```은 입력의 종류가 "텍스트"이며, 내용의 템플릿 ```{user_input}```은 변수인데 나중에 실제 사용자 ```{user_input}``` 입력으로 대체되는 부분이다.
- ```ChatPromptTemplate.from_messages(message1)```은 ChatPromptTemplate는 여러 메시지(시스템 프롬프트, 사용자 프롬프트, AI 응답)를 결합하여 채팅 모델에 대한 완전한 프롬프트 템플릿을 만드는 from_messages 클래스이다.

두번째 패턴을 설명하면 아래와 같다.

- ```("system", "...")```은 튜플의 첫번째 요소```("system")```는 메시지의 역할(유형)을 나타내고 두번째 요소```("...")```는 내용을 나타낸다.
- ```("human", "{user_input}")```은 첫번째 프롬프트의 ```HumanMessagePromptTemplate.from_template(...)```과 비슷한 역할을 한다. 튜플의 첫번째 요소```("human")```는 메시지 역할(사용자의 메시지)을 나타내고 두번째 요소```("{user_input}")```은 내용(템플릿 문자열)을 나타낸다. ```{user_input}```은 템플릿 변수다.
- ```ChatPromptTemplate.from_messages(message2)```는 첫번째 프롬프트와 역할이 동일하고 내부적으로는 튜플의 리스트도 SystemMessage, HumanMessagePromptTemplate 등으로 변환되어 처리된다.

Prompt를 만드는 방법은 두가지 방법이 있는데 이미지나 PDF등을 모델에 입력하는 경우에는 주로 첫번째 프롬프트 방식을 더 많이 쓰일 것이다.

### 모델을 정의하는 방법

앞에서 작성한 프롬프트를 사용하여 LLM을 호출하는 실제 모델을 LangChain에서 정의하는 방법을 설명한다. 여기서는 Google의 LLM인 Gemini 모델을 예로 ChatGoogleGenerativeAI클래스를 이용한 기본적인 설정 방법을 살펴본다.

여기서 사용하는 코드는 [langchain_fundamental.ipynb](https://github.com/mimul/colab-ai/blob/master/langchain_fundamental.ipynb) 파일의 4 ~ 5셀에 해당한다.

```
model = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0
)
```

- ChatGoogleGenerativeAI는 LangChain이 Google에서 제공하는 생성 AI 모델(Gemini)과 상호 작용하기 위한 인터페이스가 되는 클래스다. 이 클래스의 인스턴스를 만들어 특정 Google AI 모델을 설정하고 LangChain의 다른 기능(프롬프트 등)과 함께 작업할 수 있다.
- ```model="gemini-2.0-flash"```은 실제로 사용할 Google AI 모델의 이름을 지정한다.
- ```temperature=0```은 모델 출력의 '랜덤성'과 '창의성'을 조정하기 위한 파라미터다. 값은 보통 0~2 정도의 범위에서 설정한다. 0에 가까울수록 모델은 매번 거의 같고, 가장 확률이 높다고 생각되는 단어를 선택하기 쉬워져, 결정적이고 일관성 있는 출력이 된다. 사실에 근거한 회답이나, 재현성이 요구되는 경우에 적합하다. 값이 클수록 모델은 보다 다양한 단어를 선택하게 되어 창조적이고 매번 다른 가능성이 있는 출력이 된다.

이 코드 블록을 실행하면 지정된 설정(gemini-2.0-flash 모델을 사용하고 출력의 무작위성을 최대한 억제)을 가진 ChatGoogleGenerativeAI 인스턴스가 만들어지고 변수 model에 저장된다. 아래 코드는 OpenAI, Microsoft Azure, Anthropic, OpenRouter, xAI, Olama와 같은 다른 LLM 플랫폼 모델을 LangChain으로 초기화하는 방법을 나타낸다.

```
# openai 모델
from langchain_openai import ChatOpenAI
os.environ["OPENAI_API_KEY"] = "****"
model = ChatOpenAI(
    model="gpt-4o", #모델
    temperature=0.001, #o1, o3계는 temperature를 지정하지 않는다
    top_p=0.001, #o1, o3 버전은 top_p를 미기입
)

# Azure 모델
from langchain_openai import AzureChatOpenAI
os.environ["AZURE_OPENAI_API_KEY"] = "****"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://xxxxx.openai.azure.com"
os.environ["OPENAI_API_VERSION"] = "2024-12-01-preview"
model = AzureChatOpenAI(
    azure_deployment="gpt-4o", #모델
    temperature=0.001, #o1, o3 버전은 temperature를 미기입
    top_p=0.001, #o1, o3 버전은 top_p를 미기입
)

# Anthropic 모델
from langchain_anthropic import ChatAnthropic
os.environ["ANTHROPIC_API_KEY"] = "****"
model = ChatAnthropic(
    model="claude-3-5-sonnet-20240620", #모델
    temperature=0.001,
    top_p=0.001,
)

# OpenRouter 모델
from langchain_openai import ChatOpenAI
OPENROUTER_API_KEY = "****"
OPENROUTER_API_ENDPOINT = "https://openrouter.ai/api/v1"
model = ChatOpenAI(
    model="deepseek/deepseek-chat-v3-0324:free", #모델
    openai_api_key=OPENROUTER_API_KEY
    openai_api_base=OPENROUTER_API_ENDPOINT,
    temperature=0.001, #o1, o3 버전은 temperature를 미기입
    top_p=0.001, #o1, o3 버전은 top_p를 미기입
)

#xAI 모델
from langchain_xai import ChatXAI
os.environ["XAI_API_KEY"] = "****"
os.environ["XAI_API_ENDPOINT"] = "https://api.x.ai/v1"
model = ChatXAI(
    model="grok-3-beta", #모델
    temperature=0.001, #o1, o3 버전은 temperature를 미기입
    top_p=0.001, #o1, o3 버전은 top_p를 미기입
)

#ollama 모델
from langchain_ollama import ChatOllama
model = ChatOllama(
    model="gemma3:27b-it-fp16", #모델
    temperature=0.001, #o1, o3 버전은 temperature를 미기입
    top_p=0.001, #o1, o3 버전은 top_p를 미기입
)
```

LangChain을 이용함으로써 이러한 다양한 LLM을 비교적 통일된 인터페이스로 다룰 수 있다는 장점이 있다. 이제 프롬프트 템플릿을 만드는 방법과 모델을 정의하는 방법을 결합해 LangChain을 사용하여 LLM과 본격적인 대화를 할 준비가 되었다고 볼 수 있다.

### 프롬프트와 모델을 실행하는 방법

여기에서는 프롬프트 템플릿과 정의한 모델을 결합하여 실제로 LLM을 호출하고 응답을 얻는 절차에 대해 기술한다. run, apply, generate, predict 등 다양한 방법의 메소드들이 존재하나, 최근에 권장 사항은 invoke 메소드에 의한 실행을 추천한다.

| 실행 메소드      | 설명                                 |
| :------------ | :---------------------------------- |
| invoke        | 모델의 동기식 실행                       |
| ainvoke       | 모델의 비동기식 실행                      |
| stream        | 모델의 동기식 실행, 스트림 출력 가능         |
| astream       | 모델의 비동기식 실행, 스트림 출력 가능        |
| batch         | 모델의 동기식 실행, 여러 입력을 동시에 처리    |
| abatch        | 모델의 비동기식 실행, 여러 입력을 동시에 처리  |

여기서 사용하는 코드는 [langchain_fundamental.ipynb](https://github.com/mimul/colab-ai/blob/master/langchain_fundamental.ipynb) 파일의 7 ~ 8셀에 해당한다.

다음으로 프롬프트와 모델을 실행하는 방법을 코드를 통해 알아본다. 먼저 프롬프트 실행 방법은 아래와 같다.

**1, 프롬프트 실행**

```
llm_prompt1 = prompt1.invoke({"user_input": "한국에서 가장 높은 산에 대해 자세히 알려주세요"})
llm_prompt2 = prompt2.invoke({"user_input": "한국에서 가장 높은 산에 대해 자세히 알려주세요"})

print(llm_prompt1)
print(llm_prompt2)
```
프롬프트 템플릿(prompt1, prompt2)을 사용하여 LLM에 입력하기 위한 구체적인 프롬프트 문자열을 생성한다.

- ```prompt1.invoke({"user_input": "한국에서 가장 높은 산에 대해 자세히 알려주세요"})```는 파라미터로 주어진 사전(```{"user_input": "한국에서 가장 높은 산에 대해 자세히 알려주세요"}```)의 내용을 사용해, 템플릿 내의 변수(```user_input```)에 실제의 값("한국에서 가장 높은 산에 대해 자세히 알려주세요")을 전달한다. 시스템 프롬프트와 사용자 입력이 결합된 LLM에 전달하기 위한 최종 프롬프트를 생성하고 ```llm_prompt```에 할당한다.
- ```prompt2.invoke({"user_input": "한국에서 가장 높은 산에 대해 자세히 알려주세요"})```는 prompt1과 동일하게 사용자 입력을 전달한다.

위의 실행에 대한 출력 결과는 아래와 같다.

```
messages=[SystemMessage(content='당신은 한국어를 말하는 우수한 어시스턴트입니다. 회답에는 반드시 한국어로 대답해 주세요. 또 생각하는 과정도 출력해 주세요.', additional_kwargs={}, response_metadata={}), HumanMessage(content=[{'type': 'text', 'text': '한국에서 가장 높은 산에 대해 자세히 알려주세요'}], additional_kwargs={}, response_metadata={})]
messages=[SystemMessage(content='당신은 한국어를 말하는 우수한 어시스턴트입니다. 회답에는 반드시 한국어로 대답해 주세요. 또 생각하는 과정도 출력해 주세요.', additional_kwargs={}, response_metadata={}), HumanMessage(content='한국에서 가장 높은 산에 대해 자세히 알려주세요', additional_kwargs={}, response_metadata={})]
```

실행 직전에 입력한 ```{"user_input": "한국에서 가장 높은 산에 대해 자세히 알려주세요"}``` 내용이 반영된 프롬프트가 되어 있는 것을 알 수 있다. HumanMessage 부분만 약간 다르지만 prompt1, prompt2 비슷하게 출력된다.

**2.모델 실행**

다음으로 모델 실행 방법에 대해 코드로 알아보겠다.

```
response1 = model.invoke(llm_prompt1)
response2 = model.invoke(llm_prompt2)

# 반환값 확인
print("################### model output ###################")
print(response1)
print(response2)
print("################ model output text #################")
print(response1.content)
# stream 출력
print("############### model output stream ################")
for chunk in model.stream(llm_prompt2):
    print(chunk.content, end="", flush=True)
```

이전 단계에서 생성한 프롬프트(```llm_prompt1```, ```llm_prompt2```)를 미리 정의된 LLM 모델(model)에 입력하여 응답을 얻는다. 

- ```model.invoke(llm_prompt1)```에서 model은 ChatGoogleGenerativeAI를 사용하여 정의한 모델 객체이며 .invoke()메서드는 파라미터로 입력된 프롬프트(```llm_prompt1```)를 실제로 LLM에 보내고 받은 응답을 response1 변수에 저장한다.
- ```model.invoke(llm_prompt2)```도 마찬가지로 다른 프롬프트(```llm_prompt2```)를 모델에 입력하고 응답을 response2에 저장한다.

위의 실행에 대한 출력 결과는 아래와 같다.

```
################### model output ###################
content='알겠습니다. 한국에서 가장 높은 산에 대해 자세히 알려드리겠습니다.\n\n**1. 산 이름 및 위치:**\n\n*   **산 이름:** 한라산 (Hallasan)\n* .....' additional_kwargs={} response_metadata={'prompt_feedback': {'block_reason': 0, 'safety_ratings': []}, 'finish_reason': 'STOP', 'safety_ratings': []} id='run-d9984069-b51c-48a4-908f-c8d27c84250d-0' usage_metadata={'input_tokens': 59, 'output_tokens': 1099, 'total_tokens': 1158, 'input_token_details': {'cache_read': 0}}
content="알겠습니다. 한국에서 가장 높은 산에 대해 자세히 알려드리겠습니다.\n\n**1. 산 이름 및 위치:**\n\n*   **산 이름:** 한라산 (Hallasan)\n* ....." additional_kwargs={} response_metadata={'prompt_feedback': {'block_reason': 0, 'safety_ratings': []}, 'finish_reason': 'STOP', 'safety_ratings': []} id='run-13b44f2d-96a9-4cca-a277-a51e1b7b655a-0' usage_metadata={'input_tokens': 59, 'output_tokens': 1092, 'total_tokens': 1151, 'input_token_details': {'cache_read': 0}}
################ model output text #################
알겠습니다. 한국에서 가장 높은 산에 대해 자세히 알려드리겠습니다.

**1. 산 이름 및 위치:**

*   **산 이름:** 한라산 (Hallasan)
*   **위치:** 대한민국 제주특별자치도 제주도 중앙부

**2. 높이:**

*   **해발:** 1,950m (대한민국에서 가장 높은 산)

.....

**생각 과정:**

1.  **질문 이해:** 질문은 "한국에서 가장 높은 산에 대해 자세히 알려주세요"입니다.
2.  **정보 수집:** 한국에서 가장 높은 산은 한라산이라는 것을 알고 있습니다. 한라산에 대한 다양한 정보를 떠올립니다 (위치, 높이, 지질, 생태, 역사, 등반 정보 등).
3.  **정보 구성:** 수집된 정보를 바탕으로 답변을 구성합니다. 답변은 다음과 같은 구조로 작성합니다.
    *   산 이름 및 위치
    *   높이
    *   지질학적 특징
    *   생태학적 특징
    *   역사 및 문화
    *   등반 정보
    *   기타
4.  **답변 작성:** 구성된 구조에 따라 정보를 채워 답변을 작성합니다.
5.  **검토 및 수정:** 답변을 검토하여 오류나 부족한 부분을 수정합니다.

이 정보가 도움이 되었기를 바랍니다. 더 궁금한 점이 있으시면 언제든지 질문해주세요.
############### model output stream ################
알겠습니다. 한국에서 가장 높은 산에 대해 자세히 알려드리겠습니다.**1. 산 이름 및 위치:**

*   **산 이름:** 한라산 (Hallasan)
*   **위치:** 대한민국 제주특별자치도 제주도 중앙부

**2. 높이:**

*   **해발:** 1,950m (대한민국에서 가장 높은 산)

.....

**생각 과정:**

1.  **질문 이해:** 한국에서 가장 높은 산에 대한 자세한 정보를 요청하는 질문임을 파악했습니다.
2.  **정보 수집:** 한라산의 이름, 위치, 높이, 지질학적 특징, 생태학적 특징, 역사 및 문화, 등반 정보 등 다양한 측면에서 정보를 수집했습니다.
3.  **정보 구성:** 수집한 정보를 체계적으로 정리하여 답변을 구성했습니다.
4.  **한국어 표현:** 한국어 어휘와 문법을 사용하여 자연스럽고 정확하게 답변을 작성했습니다.
5.  **추가 정보:** 한라산의 사계절 경관과 제주도 방문 시 추천하는 이유를 추가하여 답변의 완성도를 높였습니다.

이 정보가 도움이 되었기를 바랍니다. 더 궁금한 점이 있으시면 언제든지 질문해주세요.
```

LLM에서 얻은 결과를 그대로 표시하면 텍스트 출력뿐만 아니라 메타 데이터도 포함한 형태로 표시된다. response1.content를 지정하면 LLM이 생성한 텍스트 정보만 얻을 수 있고 ```model.stream(llm_prompt2)```를 사용하면 for문을 통해 LLM이 Next Token Prediction에서 출력한 token을 얻을 때마다 하나씩 꺼내져 print 문으로 출력할 수 있다.

LangChain에서 Steam 출력을 만들기 위해 Callback 함수를 구현하는 경우도 있지만, stream과 astream을 이용해 Stream 출력을 구현하는 것이 추천되고 있다.

프롬프트 템플릿으로 지시의 형태를 작성한 다음, invoke로 구체적인 지시를 생성하고, 모델  invoke를 통해 LLM을 실행해 응답을 얻는 과정을 기술함으로써 LangChain를 사용한 LLM 어플리케이션의 기본적인 일련의 흐름이 완성되었다.