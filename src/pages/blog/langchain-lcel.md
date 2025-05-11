---
templateKey: "blog-post"
title: "LCEL(LangChain Expression Language) 기반 LLM 어플리케이션 개발 기초"
description: "LCEL(LangChain Expression Language), Chain 연결, 복수의 Chain 연결, LLM의 아웃풋 품질 향상 방법 등을 기술함" 
author: "미물"
authorURL: "https://mimul.com"
date: "2024-06-01T19:18:01.000Z"
lastModificationTime: "2024-06-01T21:22:13.000Z"
image: "/img/blog/llm.png"
commentId: "langchain-2024-06-01"
tags:
  - LangChain
  - LLM
  - AI
---
LangChain과 LangGraph를 이용하여 Deep Research와 같은 LLM 애플리케이션을 만드는 방법에 대한 두째 글로 LCEL(LangChain Expression Language) 기반 LLM 어플리케이션 개발 기초에 대한 내용을 기술합니다. 이 글을 완독하신 분은 아래 링크에서 세번째 글을 한번 읽기를 권장합니다.

- [LangChain 기반 LLM 어플리케이션 개발 기초](https://www.mimul.com/blog/langchain-fundamental/)
- [LCEL(LangChain Expression Language) 기반 LLM 어플리케이션 개발 기초](https://www.mimul.com/blog/langchain-lcel/)
- [LLM 어플리케이션의 개발 기초](https://www.mimul.com/blog/llm-fundamental/)

LangChain이나 LCEL, LLM에 대한 이해도가 초보인 사람들을 대상으로 기술하니 중급 이상의 분들은 그냥 패스하기 바랍니다.

단일의 Chain 뿐만이 아니라, **복수의 Chain을 연계시켜 보다 복잡한 처리 플로우를 실현하는 방법**으로서, LangChain Expression Language (LCEL)이 가지고 있는 강력한 기능이다. LCEL의 다양한 요소 기술(`Chain`, `RunnableParallel`, `RunnableLambda`, `RunnableBranch`, `with_structured_output`등)의 기본적인 내용과 조합 방법들을 알아보고 LCEL을 기반으로 LLM 애플리케이션 개발에 필요한 사항들을 다룬다. 파이프("|")와 Sequential Chain은 유연성이 부족하기 때문에 좀 더 유연한 RunnableParallel, RunnableLambda, RunnableBranch 등을 활용해 유연하고 가독성있게 대처하는 방법들도 기억하면서 이 글을 보면 도움이 될 것이다.

### LCEL(LangChain Expression Language)에 대해

**1. Runnable**

프롬프트 템플릿에 구체적인 값을 포함할 때도 (```prompt.invoke(...)```), LLM 모델에 그 프롬프트를 입력하여 응답을 얻을 때도 (```model.invoke(...)```), 같은 invoke 메소드를 사용했다. LangChain에서는 프롬프트와 모델과 같은 다양한 구성 요소가 공통 방식(Runnable)으로 처리 할 수 있도록 설계되어 있다. 

Runnable은 LangChain의 다양한 구성 요소(예 : ChatPromptTemplate, ChatGoogleGenerativeAI 등)가 상속하는 추상 기본 클래스이다. LangChain에서는 다양한 클래스가 이 Runnable클래스를 상속하여 구현된다. Runnable 클래스를 상속한 오브젝트는 이전 글에서 [LangChain 기반 LLM 어플리케이션 개발 기초](https://www.mimul.com/blog/langchain-fundamental/)에서 설명한 invoke, ainvoke, stream, astream, batch, abatch와 같은 공통의 메소드를 가진다.

Runnable 클래스를 상속해 구현되고 있는 LangChain의 주요 컴퍼넌트를 보면 아래와 같다.

| 분류           | 메소드                                |
| :------------ | :---------------------------------- |
| 프롬프트 템플릿   | ChatPromptTemplate, PromptTemplate  |
| 모델           | ChatGoogleGenerativeAI, ChatOpenAI  |
| 외부 데이터 수신  | Retriever                           |
| 아웃풋 파서      | OutputParser                        |

다양한 종류의 컴포넌트가 공통의 룰을 지키고 있기 때문에 Runnable이라는 통일적인 방법으로 그들을 실행하거나 조합할 수 있다.

**2. LCEL(LangChain Expression Language)**

LCEL(LangChain Expression Language)은 객체 Runnable 끼리 연결하기 위한 간단하고 강력한 구문(Language)이다. 파이썬의 파이프 연산자("|")를 사용하면 Runnable 컴포넌트를 여러번 연결하여 데이터 처리 파이프 라인(LangChain에서는 이것을 체인 이라고 함)을 선언적으로 작성할 수 있다. 

여기서 선언적이라는 말은 How(세세하게 어떻게 처리하는)가 아니라 What(무엇을 하고 싶은지)에 해당하는 처리의 흐름을 정의하는 것을 말한다. 예를 들어 "사용자 입력을 프롬프트에 포함하고 그 프롬프트를 LLM에 전달하고 결과를 얻는다"라는 일련의 흐름을 LCEL을 사용하면 아래와 같이 "|"를 연결하여 표현할 수 있다.

```
chain = prompt | model
chain.invoke({"user_input": "한국에서 가장 높은 산에 대해 자세히 알려주세요."})
```

일일이 프롬프트에 대해 invoke 메소드를 실행거나, LLM에 대해서도 invoke 메소드를 실행했던 방식을 chain을 연결함으로써 한번에 실행할 수가 있다.

### Chain 연결

이전 글 [LangChain 기반 LLM 어플리케이션 개발 기초](https://www.mimul.com/blog/langchain-fundamental/)에서 LangChain의 기본 구성 요소인 프롬프트 템플릿과 모델 객체를 각각 정의하고 invoke 메소드를 사용하여 개별적으로 실행하는 방법을 기술했는데, 실제 LLM 애플리케이션에서는 프롬프트 준비, 모델 호출 및 모델 출력 후처리와 같은 여러 단계를 연속적으로 실행하는 것이 일반적이다. 그래서 이 단락에서는 이러한 복수의 처리 스텝을 하나로 정리해 보다 세련된 형태로 실행하기 위한 Chain이라고 하는 개념을 소개한다.

여기서 사용하는 코드는 [langchain_chain.ipynb](https://github.com/mimul/colab-ai/blob/main/langchain_chain.ipynb)의 2 ~ 5셀에 해당한다.

```
# prompt 템플릿 정의
message1 = [
        SystemMessage(content= "당신은 한국어를 말하는 우수한 어시스턴트입니다. 회답에는 반드시 한국어로 대답해 주세요. 또 생각하는 과정도 출력해 주세요."),
        HumanMessagePromptTemplate.from_template(
            [
                {
                    "type": "text",
                    "text": "{question}"
                },
            ]
        )
    ]

prompt1 = ChatPromptTemplate.from_messages(message1)

# gemini 모델 정의
model = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0,
)
```

- SystemMessage에서 LLM의 역할과 행동을 지시한다.
- HumanMessagePromptTemplate.from_template에서 사용자로부터 입력을 받는 부분(변수 {question})을 정의한다.
- 이것들을 배열 message1에 정의하고 ChatPromptTemplate.from_messages를 사용하여 최종 프롬프트 템플릿 prompt1을 만든다.
- ChatGoogleGenerativeAI클래스를 사용하여 Google의 Gemini 모델을 활용하는 모델 객체 model을 정의한다.
- temperature을 낮게 설정하여 출력의 랜덤성을 제한하고 있다.

```
#아웃풋 parser 정의
from langchain_core.output_parsers import StrOutputParser

# 체인 정의
chain1 = prompt1 | model | StrOutputParser()
```

- LangChain Expression Language(LCEL)를 이용해 복수의 컴퍼넌트를 연결한 Chain을 구축하고 있다.
- 사용자 입력을 받는 prompt1(프롬프트 템플릿)이 특정 프롬프트를 생성하고 생성된 프롬프트가 model에 전달되고 모델이 응답을 생성하며 모델의 응답이 StrOutputParser()로 전달되고 응답 메시지 본문이 문자열로 파싱된다.

StrOutputParser는 LangChain의 "출력 파서"의 일종이고 LLM(모델)의 아웃풋은 일반적으로 단순한 텍스트 문자열이 아니라 메타데이터 등을 포함하는 특정 객체 형식으로 되어 있다. 그 필요성은 후속 처리에서 순수한 텍스트 데이터로 취급하고 싶은 경우나 어플리케이션의 최종적인 아웃풋으로서 사용자에게 제시하고 싶은 경우에 편리하게 사용할 수 있다.

```
# 사용자로부터 입력
user_input = "일에 대한 열정을 되찾기 위한 5가지 아이디어를 제시해 주세요."

# 체인 실행
output = chain1.invoke({"question": user_input})
print("사용자 입력:", user_input)
print("결과:", output)
```

- invoke 메소드는 프롬프트 템플릿(prompt1)이 예상하는 입력 변수 이름(question)을 키로 사용하고 `user_input`의 값으로 사용하는 `{"question": user_input}`을 전달한다.
- invoke가 호출되면 chain1에 정의된 처리 흐름(프롬프트 생성 > 모델 실행 > 아웃풋 파싱)이 자동으로 순차적으로 실행되고
- chain의 마지막 컴퍼넌트(StrOutputParser)로부터 출력된 결과(문자열)가 output 변수에 할당된다.

위의 코드 실행 결과는 아래와 같다.

```
사용자 입력: 일의 열정을 되찾기 위한 5가지 아이디어를 제시한다.
결과: 알겠습니다. 일에 대한 열정을 되찾기 위한 5가지 아이디어를 제시해 드리겠습니다. 먼저, 열정을 잃은 원인을 분석하고, 그에 맞는 해결책을 찾는 것이 중요합니다. 다음은 제가 생각하는 5가지 아이디어입니다.

**1. 작은 성공 경험 만들기:**

*   **생각 과정:** 거창한 목표보다는 작고 달성 가능한 목표를 설정하여 성공 경험을 쌓는 것이 중요합니다. 작은 성공은 성취감을 주고, 이는 다시 동기 부여로 이어져 열정을 되찾는 데 도움이 될 수 있습니다.
*   **아이디어:** 현재 업무에서 즉시 개선할 수 있는 작은 부분을 찾아 집중합니다. 예를 들어, 이메일 정리, 문서 서식 개선, 간단한 자동화 스크립트 작성 등이 있습니다. 완료 후에는 스스로에게 작은 보상을 해 주세요.

**2. 새로운 기술 또는 지식 습득:**

*   **생각 과정:** 지루함은 열정을 잃게 만드는 주요 원인 중 하나입니다. 새로운 것을 배우는 것은 지루함을 해소하고, 업무에 대한 새로운 시각을 제공하여 다시 흥미를 느끼게 할 수 있습니다.
*   **아이디어:** 현재 업무와 관련된 새로운 기술이나 지식을 습득합니다. 온라인 강의, 워크숍, 컨퍼런스 참석 등을 통해 새로운 것을 배우고, 이를 실제 업무에 적용해 봅니다.

**3. 업무 환경 변화 시도:**

*   **생각 과정:** 획일적인 업무 환경은 창의성을 저해하고, 열정을 잃게 만들 수 있습니다. 업무 공간을 재정비하거나, 근무 방식을 변경하는 것은 신선한 자극을 주어 열정을 되찾는 데 도움이 될 수 있습니다.
*   **아이디어:** 책상 정리, 식물 배치, 배경 음악 변경 등 간단한 변화부터 시작하여, 필요하다면 재택근무, 유연근무제 활용 등 근무 방식의 변화를 시도해 봅니다.

**4. 의미 있는 목표 설정:**

*   **생각 과정:** 단순히 돈을 벌기 위한 수단으로서의 업무는 열정을 유지하기 어렵습니다. 자신의 가치관과 연결된 의미 있는 목표를 설정하고, 업무를 통해 그 목표를 달성해 나가는 과정에서 열정을 되찾을 수 있습니다.
*   **아이디어:** 자신의 업무가 사회에 어떤 긍정적인 영향을 미치는지 생각해 봅니다. 회사의 사회적 책임 활동에 참여하거나, 업무를 통해 얻은 지식과 경험을 다른 사람과 공유하는 것도 좋은 방법입니다.

**5. 긍정적인 관계 형성:**

*   **생각 과정:** 직장 동료와의 긍정적인 관계는 업무 만족도를 높이고, 스트레스를 줄여줍니다. 서로 지지하고 격려하는 관계 속에서 열정을 유지하고 발전시켜 나갈 수 있습니다.
*   **아이디어:** 동료들과 점심 식사를 함께 하거나, 커피를 마시며 편안하게 대화하는 시간을 갖습니다. 업무 외적인 관심사를 공유하고, 서로의 어려움을 들어주는 등 긍정적인 관계를 형성하기 위해 노력합니다.

이 5가지 아이디어를 바탕으로, 자신에게 맞는 방법을 찾아 실천해 보세요. 꾸준히 노력하면 분명히 일에 대한 열정을 되찾을 수 있을 것입니다. 응원합니다!
```

프롬프트 SystemMessage에서 지시한 대로, 응답이 한국어이며, 생각의 과정이 포함되어 있는 것을 알 수 있다. chain의 마지막에 StrOutputParser를 넣은 것으로 최종적인 output변수에는 정형화된(pretty print) 라인 단위로 결과가 출력되어 있다.

### 복수의 Chain 연결

LLM 애플리케이션을 개발하다보면 하나의 Chain의 아웃풋을 다음 Chain의 입력의 일부로 이용하는 등 여러 Chain을 연계시키고 싶은 경우가 생긴다. 그래서 이 단락에서는 LCEL과 RunnableParallel, RunnableLambda라고 하는 Runnable 클래스를 조합해 보다 유연하고 강력하게 복수의 Chain을 연결하는 방법에 대해 알아보고자 한다. 

여기서 사용되는 코드는 [langchain_chain.ipynb](https://github.com/mimul/colab-ai/blob/main/langchain_chain.ipynb)의 6 ~ 8셀에 해당한다.

```
user_prompt_template = """
문제, 정답, 채점 기준, 언어 모델이 생성한 답변이 주어집니다.

# 지시
'채점 기준'과 '정답 예'를 참고해, 응답을 1,2,3,4,5의 5단계로 채점합니다. 단, 먼저 한번, 스텝 바이 스텝으로 사고를 하고 나서 결론으로서 점수를 숫자로 채점해 주세요.
사고 과정도 출력하십시오.

# 문제
{question}

# 정답 예
{correct_text}

# 채점 기준
기본 채점 기준
- 1점: 잘못됨, 지시에 따르지 않음
- 2점: 잘못되어 있지만 방향성은 맞다
- 3점: 부분적으로 잘못됨, 부분적으로 적합함
- 4점: 맞다
- 5점: 유용하다

기본 감점 항목
- 부자연스러운 한국어: -1점
- 부분적으로 사실과 다른 내용을 말하고 있다: -1점
- '윤리적으로 대답할 수 없습니다'와 같이 과도하게 안전성을 신경 쓰고 있다 : 2점으로 한다

문제별 채점 기준
{eval_aspect}

# 언어 모델의 응답
{llm_output}

# 여기까지가 '언어 모델의 응답'입니다.

# 지시
'채점 기준'과 '정답 예'를 참고로 해, 응답을 1, 2, 3, 4, 5의 5단계로 채점합니다.
사고 과정도 출력해 주세요.

"""

# 질문의 정답 예
correct_text = """
1. 자신의 직업에 대한 관심을 재발견하기 위해 새로운 기술과 지식을 배우는 것.
2. 대학이나 세미나 등에서 강연을 듣는 것으로, 일에 대한 새로운 아이디어나 동기를 얻는 것.
3. 일에 스트레스를 느끼는 경우 스트레스 관리 기술을 배우세요.
4. 일 이외의 즐거운 활동을 함으로써 스트레스를 발산하는 것.
5. 일에 대해 자기 평가를 함으로써, 자신이 어떻게 진화하고 있는지를 아는 것.
"""

# 질문의 평가 기준
eval_aspect = """
- 열의를 되찾는 것이 아니라, 일의 효율화/스킬업과 같은 문맥으로 되어 있으면 1점 감점
- 제시한 아이디어가 5개보다 많아야 하고 적으면 1점 감점
- 5개의 아이디어 중 내용이 중복되어 있는 것이 있으면 1점 감점
"""
```

이 셀은 두번째 Chain(평가 Chain)에서 사용할 프롬프트 템플릿과 해당 구성 요소를 정의한다.

- `user_prompt_template`은 두번째 Chain(chain2)에서 사용할 프롬프트 템플릿 문자열이다. LLM에 대해 주어진 정보(문제, 정답, 채점 기준, LLM의 대답)를 바탕으로 LLM의 대답을 5단계 평가하도록 지시하고 있고 템플릿에는 `{question}`, `{correct_text}`, `{eval_aspect}`, `{llm_output}` 네개의 변수가 포함되어 있다. 나중에 실제값으로 대체된다.
- `correct_text`는 평가시에 참고로 하는 "정답의 예"의 텍스트 정보이고 `user_prompt_template` 내부에 `{correct_text}`가 포함되어 있다.
- `eval_aspect`는 구체적인 "채점 기준"에 대한 텍스트 정보이다. `user_prompt_template` 내부에 `{eval_aspect}`가 포함되어 있다.

```
# prompt 템플릿 정의
message2 = [
        HumanMessagePromptTemplate.from_template(
            [
                {
                    "type": "text",
                    "text": user_prompt_template
                },
            ]
        )
    ]

prompt2 = ChatPromptTemplate.from_messages(message2)

# 체인 정의
chain2 = prompt2 | model | StrOutputParser()
```

chain2는 `question`, `{correct_text}`, `{eval_aspect}`, `{llm_output}` 등 4개의 키를 입력받아, 평가 결과의 캐릭터 라인을 출력하도록 설계되어 있다.

```
from langchain_core.runnables import (
    RunnableLambda,
    RunnableParallel,
    RunnablePassthrough,
)

# chain 연결
chain = (
    RunnableParallel(
        {
            "question": RunnableLambda(lambda x: x["question"]) | RunnablePassthrough(),
            "correct_text": RunnableLambda(lambda x: x["correct_text"]) | RunnablePassthrough(),
            "eval_aspect": RunnableLambda(lambda x: x["eval_aspect"]) | RunnablePassthrough(),
            "llm_output":RunnableLambda(lambda x: x["question"]) | chain1,
        }
    ).assign(evaluation=chain2)
)

response = chain.invoke({"question": user_input, "correct_text": correct_text, "eval_aspect": eval_aspect})

print("########## 재처리 후 결과 ##########")
print("사용자 입력:", user_input)
print("첫번째 결과:", response["llm_output"])
print("\n########## 평가 ##########")
print(response["evaluation"])

print("\n########## 복수 체인 연결 결과 ##########")
print(response)
```

여기에서는 chain1(응답 생성)과 chain2(평가)를 연계시키기 위한 복수의 Chain을 연결하고 실행하고 있다. 그러나 `chain = chain1 | chain2` 방식으로 연결하면 예상대로 작동하지 않는다. 그 이유는 데이터 흐름이 일치하지 않기 때문이다. chain1의 출력 문자열이 chain2의 입력 문자열로 들어가는데 실제 chain2는 4개의 키가 필요해 의도치 않은 오류가 발생한다. 그래서 RunnableParallel에 RunnableLambda를 활용해서 구현했다.

- RunnableParallel : 여러 Runnable 개체(Chain 및 함수 등)를 병렬로 실행하고 각 결과를 키-값 쌍으로 결합하는 기능을 제공한다. chain2의 4개의 키를 위한 입력값을 준비하는데 활용된다.
- RunnableLambda : Chain 중간에 데이터 형식을 변환하거나 특정 키의 값을 검색하는 데 사용된다.
- RunnablePassthrough : 입력을 그대로 출력으로서 건네주는 역할로 아무것도 하지 않는다.
- ```"question": RunnableLambda(lambda x: x["question"]) | RunnablePassthrough()```는 입력 사전 x에서 `question` 키 값(`user_input`)을 검색하고 그대로 `question`이라는 키로 결과 사전에 저장한다.
- ```"correct_text": RunnableLambda(lambda x: x["correct_text"]) | RunnablePassthrough()```는 입력 사전 x으로부터 `correct_text`키의 값을 꺼내 그대로 `correct_text`라고 하는 키로 결과 사전에 저장한다.
- ```"eval_aspect": RunnableLambda(lambda x: x["eval_aspect"]) | RunnablePassthrough()```는 입력 사전 x으로부터 `eval_aspect`키의 값을 꺼내 그대로 `eval_aspect`라고 하는 키로 결과 사전에 저장한다.
- ```"llm_output":RunnableLambda(lambda x: x["question"]) | chain1```에서는 입력 사전 x에서 `question`키 값(`user_input`)을 검색하고 꺼낸 것을 `question` 입력 chain1으로 전달한다. chain1아 실행되고 출력(LLM 응답 문자열)이라는 `llm_output` 키로 결과 사전에 저장된다.

그래서 RunnableParalle이 실행되면 아래와 같은 값으로 구성된 4개의 키가 생성되어 chain2 입력값으로 활용된다.

```
{
    "question": "일에 대한 열정을 되찾기 위한 5가지 아이디어를 제시해 주세요.",
    "correct_text": "...",
    "eval_aspect": "...",
    "llm_output": "..."
}
```

그리고 ```.assign(evaluation=chain2)```는 RunnableParallel에서 chain2 입력을 준비한 후 .assign() 메소드를 사용하여 chain2에 연결한다. chain2의 출력(평가 결과의 문자열)은 `evaluation`키로 RunnableParallel에서 생성된 사전에 추가된다. 최종적으로 `question`, `correct_text`, `eval_aspect`, `llm_output`(chain1의 결과), `evaluation`(chain2의 결과)의 키를 가지는 사전을 출력하는 일련의 처리 플로우가 완료된다.

아웃풋 결과는 아래와 같다.

```
########## 재처리 후 출력 ##########
사용자 입력: 일에 대한 열정을 되찾기 위한 5가지 아이디어를 제시해 주세요.
첫번째 결과: 알겠습니다. 일에 대한 열정을 되찾기 위한 5가지 아이디어를 제시해 드리겠습니다. 먼저, 열정을 잃은 원인을 파악하고, 그에 맞는 해결책을 찾는 것이 중요합니다. 다음은 제가 생각하는 5가지 아이디어입니다.

**1. 새로운 목표 설정 및 작은 성공 경험:**

*   **생각 과정:** 현재 업무에 매몰되어 있다면, 장기적인 목표를 잊기 쉽습니다. 새로운 목표를 설정함으로써 다시 동기 부여를 얻을 수 있습니다. 또한, 큰 목표보다는 작은 목표를 설정하고 달성해 나가는 과정에서 성취감을 느끼는 것이 중요합니다.
*   **구체적인 방법:**
    *   자신의 커리어 목표를 재검토하고, 현재 업무와 연결될 수 있는 새로운 목표를 설정합니다.
    *   목표를 세분화하여 작은 단계로 나누고, 각 단계를 완료할 때마다 자신에게 보상을 제공합니다.
    *   업무 관련 새로운 기술을 배우거나 자격증을 취득하는 것을 목표로 설정할 수도 있습니다.

**2. 업무 환경 변화 시도:**

*   **생각 과정:** 단조로운 업무 환경은 지루함을 유발하고 열정을 잃게 만들 수 있습니다. 환경 변화는 새로운 자극을 제공하고, 업무에 대한 신선한 시각을 갖게 해줍니다.
*   **구체적인 방법:**
    *   사무실 내 자리 배치를 바꾸거나, 재택근무를 활용하여 업무 공간에 변화를 줍니다.
    *   업무 시간 중 짧은 휴식 시간을 활용하여 산책을 하거나, 새로운 장소에서 커피를 마시는 등 기분 전환을 시도합니다.
    *   업무 관련 컨퍼런스나 세미나에 참석하여 새로운 아이디어를 얻고, 다른 사람들과 교류합니다.

**3. 새로운 프로젝트 참여 또는 업무 범위 확장:**

*   **생각 과정:** 기존 업무에 익숙해져 있다면, 새로운 프로젝트에 참여하거나 업무 범위를 확장함으로써 새로운 도전 과제를 찾고, 자신의 역량을 개발할 수 있습니다.
*   **구체적인 방법:**
    *   현재 회사 내에서 새로운 프로젝트에 참여할 기회를 찾아봅니다.
    *   자신의 전문성을 활용하여 새로운 업무를 제안하거나, 다른 부서와 협업할 기회를 모색합니다.
    *   온라인 강의나 워크숍을 통해 새로운 기술을 배우고, 이를 업무에 적용해 봅니다.

**4. 긍정적인 마인드 유지 및 자기 격려:**

*   **생각 과정:** 부정적인 생각은 열정을 잃게 만드는 주된 요인 중 하나입니다. 긍정적인 마인드를 유지하고, 자신을 격려하는 것은 어려움을 극복하고 다시 열정을 되찾는 데 도움이 됩니다.
*   **구체적인 방법:**
    *   매일 아침 긍정적인 자기 암시를 통해 하루를 시작합니다.
    *   업무 중 어려움에 직면했을 때, 긍정적인 측면을 찾고, 과거의 성공 경험을 떠올립니다.
    *   자신의 강점을 파악하고, 이를 활용하여 업무 성과를 높입니다.

**5. 워라밸(Work-Life Balance) 추구:**

*   **생각 과정:** 과도한 업무는 번아웃을 유발하고, 일에 대한 열정을 잃게 만듭니다. 워라밸을 추구하여 개인적인 시간을 확보하고, 스트레스를 해소하는 것은 매우 중요합니다.
*   **구체적인 방법:**
    *   정해진 시간에 퇴근하고, 퇴근 후에는 업무 관련 연락을 자제합니다.
    *   취미 활동이나 운동을 통해 스트레스를 해소하고, 에너지를 충전합니다.
    *   주말이나 휴가를 활용하여 여행을 가거나, 가족 및 친구들과 시간을 보내며 재충전합니다.

이 5가지 아이디어를 바탕으로 자신에게 맞는 방법을 찾아 실천해 보세요. 꾸준히 노력하면 분명히 일에 대한 열정을 되찾을 수 있을 것입니다. 응원합니다!

########## 평가 ##########
## 사고 과정

먼저 제시된 답변이 5가지 아이디어를 제시했는지 확인합니다. 답변은 명확하게 5가지 아이디어를 제시하고 있습니다.

각 아이디어가 일에 대한 열정을 되찾는 데 적합한지 평가합니다.

1.  **새로운 목표 설정 및 작은 성공 경험:** 목표 설정은 동기 부여에 도움이 되므로 적절합니다. 작은 성공 경험을 통해 성취감을 느끼게 하는 것도 좋은 아이디어입니다.
2.  **업무 환경 변화 시도:** 단조로운 환경에서 벗어나 새로운 자극을 주는 것은 열정 회복에 도움이 될 수 있습니다.
3.  **새로운 프로젝트 참여 또는 업무 범위 확장:** 새로운 도전은 흥미를 유발하고 역량 개발을 통해 자신감을 높여 열정을 되찾는 데 기여할 수 있습니다.
4.  **긍정적인 마인드 유지 및 자기 격려:** 긍정적인 태도는 어려움을 극복하고 동기를 유지하는 데 중요합니다.
5.  **워라밸(Work-Life Balance) 추구:** 번아웃을 예방하고 삶의 만족도를 높여 일에 대한 긍정적인 태도를 유지하는 데 필수적입니다.

아이디어들이 서로 중복되는지 확인합니다. 각 아이디어는 서로 다른 측면을 강조하고 있어 중복으로 판단하기 어렵습니다.

전반적으로 답변은 명확하고 구체적인 방법까지 제시하여 유용합니다. 한국어 표현도 자연스럽습니다.

## 채점 결과
5

########## 복수 체인 연결 결과 ##########
{'question': '일에 대한 열정을 되찾기 위한 5가지 아이디어를 제시해 주세요.', 'correct_text': '\n1. 자신의 직업에 대한 관심을 재발견하기 위해 새로운 기술과 지식을 배우는 것.\n2. 대학이나 세미나 등에서 강연을 듣는 것으로, 일에 대한 새로운 아이디어나 동기를 얻는 것.\n3. 일에 스트레스를 느끼는 경우 스트레스 관리 기술을 배우세요.\n4. 일 이외의 즐거운 활동을 함으로써 스트레스를 발산하는 것.\n5. 일에 대해 자기 평가를 함으로써, 자신이 어떻게 진화하고 있는지를 아는 것.\n', 'eval_aspect': '\n- 열의를 되찾는 것이 아니라, 일의 효율화/스킬업과 같은 문맥으로 되어 있으면 1점 감점\n- 제시한 아이디어가 5개보다 많아야 하고 적으면 1점 감점\n- 5개의 아이디어 중 내용이 중복되어 있는 것이 있으면 1점 감점\n', 'llm_output': '알겠습니다. 일에 대한 열정을 되찾기 위한 5가지 아이디어를 제시해 드리겠습니다. 먼저, 열정을 잃은 원인을 파악하고, 그에 맞는 해결책을 찾는 것이 중요합니다. 다음은 제가 생각하는 5가지 아이디어입니다.\n\n**1. 새로운 목표 설정 및 작은 성공 경험:**\n\n*   **생각 과정:** 현재 업무에 매몰되어 있다면, 장기적인 목표를 잊기 쉽습니다. 새로운 목표를 설정함으로써 다시 동기 부여를 얻을 수 있습니다. 또한, 큰 목표보다는 작은 목표를 설정하고 달성해 나가는 과정에서 성취감을 느끼는 것이 중요합니다.\n*   **구체적인 방법:**\n    *   자신의 커리어 목표를 재검토하고, 현재 업무와 연결될 수 있는 새로운 목표를 설정합니다.\n    *   목표를 세분화하여 작은 단계로 나누고, 각 단계를 완료할 때마다 자신에게 보상을 제공합니다.\n    *   업무 관련 새로운 기술을 배우거나 자격증을 취득하는 것을 목표로 설정할 수도 있습니다.\n\n**2. 업무 환경 변화 시도:**\n\n*   **생각 과정:** 단조로운 업무 환경은 지루함을 유발하고 열정을 잃게 만들 수 있습니다. 환경 변화는 새로운 자극을 제공하고, 업무에 대한 신선한 시각을 갖게 해줍니다.\n*   **구체적인 방법:**\n    *   사무실 내 자리 배치를 바꾸거나, 재택근무를 활용하여 업무 공간에 변화를 줍니다.\n    *   업무 시간 중 짧은 휴식 시간을 활용하여 산책을 하거나, 새로운 장소에서 커피를 마시는 등 기분 전환을 시도합니다.\n    *   업무 관련 컨퍼런스나 세미나에 참석하여 새로운 아이디어를 얻고, 다른 사람들과 교류합니다.\n\n**3. 새로운 프로젝트 참여 또는 업무 범위 확장:**\n\n*   **생각 과정:** 기존 업무에 익숙해져 있다면, 새로운 프로젝트에 참여하거나 업무 범위를 확장함으로써 새로운 도전 과제를 찾고, 자신의 역량을 개발할 수 있습니다.\n*   **구체적인 방법:**\n    *   현재 회사 내에서 새로운 프로젝트에 참여할 기회를 찾아봅니다.\n    *   자신의 전문성을 활용하여 새로운 업무를 제안하거나, 다른 부서와 협업할 기회를 모색합니다.\n    *   온라인 강의나 워크숍을 통해 새로운 기술을 배우고, 이를 업무에 적용해 봅니다.\n\n**4. 긍정적인 마인드 유지 및 자기 격려:**\n\n*   **생각 과정:** 부정적인 생각은 열정을 잃게 만드는 주된 요인 중 하나입니다. 긍정적인 마인드를 유지하고, 자신을 격려하는 것은 어려움을 극복하고 다시 열정을 되찾는 데 도움이 됩니다.\n*   **구체적인 방법:**\n    *   매일 아침 긍정적인 자기 암시를 통해 하루를 시작합니다.\n    *   업무 중 어려움에 직면했을 때, 긍정적인 측면을 찾고, 과거의 성공 경험을 떠올립니다.\n    *   자신의 강점을 파악하고, 이를 활용하여 업무 성과를 높입니다.\n\n**5. 워라밸(Work-Life Balance) 추구:**\n\n*   **생각 과정:** 과도한 업무는 번아웃을 유발하고, 일에 대한 열정을 잃게 만듭니다. 워라밸을 추구하여 개인적인 시간을 확보하고, 스트레스를 해소하는 것은 매우 중요합니다.\n*   **구체적인 방법:**\n    *   정해진 시간에 퇴근하고, 퇴근 후에는 업무 관련 연락을 자제합니다.\n    *   취미 활동이나 운동을 통해 스트레스를 해소하고, 에너지를 충전합니다.\n    *   주말이나 휴가를 활용하여 여행을 가거나, 가족 및 친구들과 시간을 보내며 재충전합니다.\n\n이 5가지 아이디어를 바탕으로 자신에게 맞는 방법을 찾아 실천해 보세요. 꾸준히 노력하면 분명히 일에 대한 열정을 되찾을 수 있을 것입니다. 응원합니다!', 'evaluation': '## 사고 과정\n\n먼저 제시된 답변이 5가지 아이디어를 제시했는지 확인합니다. 답변은 명확하게 5가지 아이디어를 제시하고 있습니다.\n\n각 아이디어가 일에 대한 열정을 되찾는 데 적합한지 평가합니다.\n\n1.  **새로운 목표 설정 및 작은 성공 경험:** 목표 설정은 동기 부여에 도움이 되므로 적절합니다. 작은 성공 경험을 통해 성취감을 느끼게 하는 것도 좋은 아이디어입니다.\n2.  **업무 환경 변화 시도:** 단조로운 환경에서 벗어나 새로운 자극을 주는 것은 열정 회복에 도움이 될 수 있습니다.\n3.  **새로운 프로젝트 참여 또는 업무 범위 확장:** 새로운 도전은 흥미를 유발하고 역량 개발을 통해 자신감을 높여 열정을 되찾는 데 기여할 수 있습니다.\n4.  **긍정적인 마인드 유지 및 자기 격려:** 긍정적인 태도는 어려움을 극복하고 동기를 유지하는 데 중요합니다.\n5.  **워라밸(Work-Life Balance) 추구:** 번아웃을 예방하고 삶의 만족도를 높여 일에 대한 긍정적인 태도를 유지하는 데 필수적입니다.\n\n아이디어들이 서로 중복되는지 확인합니다. 각 아이디어는 서로 다른 측면을 강조하고 있어 중복으로 판단하기 어렵습니다.\n\n전반적으로 답변은 명확하고 구체적인 방법까지 제시하여 유용합니다. 한국어 표현도 자연스럽습니다.\n\n## 채점 결과\n\n5'}
```

요약을 하면, 단순한 파이프 연산자("|") 만으로는 후속 Chain에 필요한 복수의 정보(앞의 Chain의 출력, 초기 입력 등)를 전달하기 어렵고 Sequential Chain도 유연성이 부족하다. 그래서 RunnableParallel을 이용하여 후속 Chain이 필요로 하는 복수의 입력을 병행하여 준비하고 RunnableLambda를 이용하여 입력사전에서 특정 값을 꺼내거나 기존 Chain(예: chain1)을 실행하여 그 결과를 가져오거나 할 수 있다. .assign() 메소드를 이용하여 준비된 입력을 후속 Chain(예: chain 2)에 전달하고, 그 실행 결과를 최종적인 출력 사전에 새로운 키로 추가가 가능해진다. 즉, Sequential Chain을 사용하지 않고 각 Chain이 필요로 하는 입력을 유연하게 핸들링하여 복잡한 데이터 흐름을 가진 Chain의 연결을 직관적이고 효율적으로 구축할 수 있다.

### LLM의 아웃풋 품질 향상 방법

규모 언어 모델(LLM)은 매우 유연한 텍스트 생성 능력을 가지고 있지만 자유도가 높기 때문에 특정 형식이나 구조로 정보를 출력하고 싶은 경우에는 고민이 필요하다. 프롬프트 엔지니어링에 출력 형식을 지시하는 것도 가능하지만 LLM의 응답은 확률적인 성질을 가지기 때문에 항상 의도한 형식으로 출력되는 것은 아니다. 특히 후속의 프로그램으로 출력을 기계적으로 처리하고 싶은 경우에 형식이 무너지면 에러의 원인이 된다. 이런 특성을 헤결해 주는 것이 LangChain이 제공하는 메소드 `with_structured_output`이다.

`with_structured_output`을 이용하면 얻을 수 있는 장점은 아래와 같다.

| 장점                        | 설명                                                                                                 |
| :------------------------- | :-------------------------------------------------------------------------------------------------- |
| 아웃풋 형식 정형화/안정화        | 정의한 구조에 따른 출력을 쉽게 얻을 수 있으며 후속 처리에서 오류를 줄일 수 있음                                        |
| 후속 처리의 용이성              | 아웃풋이 구조화되어 있어 특정 정보를 추출하거나 프로그램에서 사용하기가 쉬워잠                                           |
| 사고 과정의 분리로 품질 향상      | LLM이 복잡한 문제를 해결할 때 사고 과정과 최종 결론을 나누어 출력시켜 LLM 자신의 추론 능력을 높여 보다 정확한 결과를 얻기 쉬워짐 |


여기에서 사용되는 코드는 [`langchain_structured_output.ipynb`](https://github.com/mimul/colab-ai/blob/main/langchain_structured_output.ipynb)파일이고 2 ~ 4셀에 해당한다.

```
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate,  HumanMessagePromptTemplate
from langchain_core.messages import  SystemMessage

system_prompt="""
대답할 때 다음과 같이 구조화하고 출력하세요.
- reasoning: 사용자의 질문을 단계별로 고려하고, 최종 답변을 추론하고, 이 분야의 모든 생각을 출력하세요.
- conclusion: 최종 답변만 출력하세요.
"""

# prompt 템플릿 정의
message = [
        SystemMessage(content= system_prompt),
        HumanMessagePromptTemplate.from_template(
            [
                {
                    "type": "text",
                    "text": "{question}"
                },
            ]
        )
    ]


prompt = ChatPromptTemplate.from_messages(message)


# gemini 모델 정의
model = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0,
)
```

모델의 출력을 사고 과정과 결론으로 나누어 출력시키도록 한다. 어떤 형식으로 출력시키고 싶은지는 프롬프트의 어딘가에 지정하는 것이 바람직하다.

```
from pydantic import BaseModel, Field

# 아웃풋 구조를 모델 클래스로 정의
class OutputModel(BaseModel):
    reasoning: str = Field(..., description='문제를 해결하는데 필요한 모든 생각과 최종 결과를 출력하세요')
    conclusion: str = Field(..., description='지금까지의 사고 결과로부터 최종 결론만 출력합니다')

chain = prompt | model.with_structured_output(OutputModel)


question = """
공원과 학교 사이의 거리는 1200m입니다.
A군이 공원에서, B군은 학교에서 마주보고 동시에 출발하여 8분만에 만났습니다.
B군이 학교에서 나온지 5분 뒤에 A군이 쫓아거가 시작해 A군이 출발한지 10분만에 따라잡혔다.
A군의 속도는 얼마나 빨리 갔나요?
"""

result = chain.invoke({"question": question})

print("########## 사고 과정 ##########")
print(result.reasoning)
print("########## 결론 ##########")
print(result.conclusion)
```

이 셀에서는 `with_structured_output`을 사용하여 모델의 아웃풋을 구조화했다. 아웃풋 구조를 정의(OutputModel) 할 때는 pydantic 라이브러리를 BaseModel 상속하여 OutputModel 클래스를 정의한다.

- ```reasoning: str = Field(..., description='문제를 해결하는데 필요한 모든 생각과 최종 결과를 출력하세요')```에서 ```Field(...)```는 이 필드가 필수임을 나타낸다. 구체적인 값이 들어 있으면, 그 값이 디폴트가 되지만 '''...'''으로 되어 있다는 것은 "디폴트치 없음=필수"라는 것을 의미한다. description은 이 필드가 무엇을 나타내는지 설명한다. 이 설명은 LLM이 각 필드에 어떤 내용을 출력해야 하는지를 이해하는 중요한 힌트이다.
- ```conclusion: str = Field(..., description='이전 사고 결과의 최종 결론만 출력합니다')```도 conclusion라는 필드를 문자열 형식으로 정의하고 필수 항목으로 설명을 추가한다.
- ```chain = prompt | model.with_structured_output(OutputModel)```은 모델 오브젝트(model)에 대해서 이 메소드를 호출해, 파라미터에 방금 정의한 pydantic 모델(OutputModel)을 건네준다. LangChain는 모델(model)에 prompt로부터의 입력을 처리한 후 그 출력을 OutputModel로 정의된 구조(reasoning과 conclusion을 가지는 형식)에 정형화해 리턴하도록 지시한다. LangChain 내부에서는 모델이 생성한 텍스트를 구문 분석하고 OutputModel의 각 필드에 적절하게 매핑하려고 시도한다.

```
########## 사고 과정 ##########
1. A와 B가 8분 동안 이동한 거리의 합은 1200m입니다. 즉, 8A + 8B = 1200입니다.
2. A가 B를 따라잡는 데 걸린 시간은 10분이고, B는 A가 출발하기 전 5분 동안 먼저 이동했으므로, A가 이동한 거리는 10A이고 B가 이동한 거리는 15B입니다. 즉, 10A = 15B입니다.
3. 위의 두 식을 연립하여 풀면 A = 100, B = 50입니다.
따라서 A의 속도는 분속 100m, B의 속도는 분속 50m 입니다.

########## 결론 ##########
A의 속도는 분속 100m, B의 속도는 분속 50m 입니다.
```

출력 결과는 사고 과정(생각하는)에서 문제를 단계별로 정의하고 마지막 결론에는 문제의 해답만을 기록한다. 결과만 출력할 경우는 아래와 같이 `with_structured_output`을 사용하지 않고 시스템 프롬프트에서 대답만 출력하도록 강제하고 있다.

```
message = [
        SystemMessage(content= "간결한 방식으로 답을 출력하십시오. 답변을 제외하고 출력은 금지됩니다."),
        HumanMessagePromptTemplate.from_template(
            [
                {
                    "type": "text",
                    "text": "{question}"
                },
            ]
        )
    ]

prompt = ChatPromptTemplate.from_messages(message)


# gemini 모델 정의
model = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0,
)

chain = prompt | model

question = """
공원과 학교 사이의 거리는 1200m입니다.
A군이 공원에서, B군은 학교에서 마주보고 동시에 출발하자 8분만에 만났습니다.
B군이 학교에서 나온 5분 뒤 A군이 쫓아가지 시작해 A군이 출발한지 10분만에 따라잡혔다.
A군의 속도는 얼마나 빨리 갔나요?
"""

print("########## model 결과 ##########")
print(chain.invoke({"question": question}).content)
```

사고의 과정 없이 해답만을 강제한 경우에 문제의 해답을 도출하는데는 성공했지만 것에 이 문제의 해답은 "분당 80m"이므로 오답에 해당한다. LLM은 사고 과정의 출력을 막아서 논리적으로 생각하지 않으면 풀 수 없는 문제의 정답률은 극단적으로 내려갈 수 있다. 

그래서 `with_structured_output`을 사용하여 사고 과정과 결론을 분리하는 것은 단순히 아웃풋 형식을 정돈할 뿐만 아니라 LLM의 추론 능력을 끌어내는데 있어서도 유효한 테크닉이라고 할 수 있다. 결국 품질을 향상시키기 위해  필요하다고 볼 수 있다.
