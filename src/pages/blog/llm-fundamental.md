---
templateKey: "blog-post"
title: "LLM 어플리케이션의 개발 기초"
description: "LangGraph, 대화 이력을 유지하는 방법, Tool Calling을 이용한 AI 에이전트를 구현하는 방법 등을 기술함" 
author: "미물"
authorURL: "https://mimul.com"
date: "2024-10-01T16:22:34.000Z"
lastModificationTime: "2024-10-02T21:07:06.000Z"
image: "/img/blog/llm.png"
commentId: "langchain-2024-10-01"
tags:
  - LangChain
  - LangGraph
  - LLM
  - AI
---
LangChain과 LangGraph를 이용하여 Deep Research와 같은 LLM 애플리케이션을 만드는 방법에 대한 세번째 글로 "LLM 어플리케이션의 개발 기초"에 대한 내용을 기술합니다. 첫번째, 두번째 글을 안읽으신 분들은 아래 링크로 가셔서 순서대로 한번 읽기를 권장합니다.

- [LangChain 기반 LLM 어플리케이션 개발 기초](https://www.mimul.com/blog/langchain-fundamental/)
- [LCEL(LangChain Expression Language) 기반 LLM 어플리케이션 개발 기초](https://www.mimul.com/blog/langchain-lcel/)
- [LLM 어플리케이션의 개발 기초](https://www.mimul.com/blog/llm-fundamental/)

이 포스트에서는 지금까지의 기초를 근거로 한층 더 진보되고 복잡하며 인터랙티브한 LLM 어플리케이션의 구현을 향한 기초 기술들에 대해 기술합니다.

### LangGraph란?

LangGraph는 상태를 가진 순환 그래프를 구축하기 위한 라이브러리다. LangGraph를 도입함으로써, 지금까지 LCEL만으로는 구현이 어려웠던, 상태 관리나 루프 처리를 포함한 고수준의 어플리케이션 개발이 가능하게 된다. LCEL로 구축된 Chain은 기본적으로 데이터가 한방향으로 흐르는 파이프라인이었다.

- 처리의 도중에 유저로부터의 입력을 받고, 그 내용을 바탕으로 중간부터 처리를 재개한다
- 대화 이력과 상태를 메모리에 저장하고 그 상태에 따라 멀티 턴의 동작을 제어한다.
- LLM의 응답 내용이나 외부 도구의 실행 결과에 따라 다음에 수행되는 처리를 동적으로 변경한다.
- 특정 조건을 충족할 때까지 정보 수집이나 추론 과정을 반복한다.

LangGraph 특징을 정리하면 다음과 같다.

| 특징            | 설명                                                                                                                           |
| :------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| 상태 관리        | 그래프 전체에서 공유되는 상태를 정의하여 각 노드(처리 단계)가 해당 상태를 읽고 쓸 수 있음                                                          |
| 노드(Nodes)     | 그래프의 각 처리 단계를 나타냄                                                                                                       |
| 가장자리(Edges)  | 노드 간의 전이를 정의함(단순한 전이 뿐만 아니라 조건부 에지(Conditional Edges)를 정의하여 상태에 따라 다음 노드를 실행할지 분기 가능)                    |
| 사이클(Cycles)  | 조건부 가장자리(Edges)를 사용하면 그래프에 루프(사이클)를 만들수 있음(이를 통해 에이전트가 반복적으로 생각하거나 도구를 사용하는 동작을 자연스럽게 표현할 수 있음)  |

LCEL이 데이터 처리의 흐름을 정의하는데 능숙한 반면, LangGraph는 거기에 더해 처리의 제어와 상태를 관리하는 가능을 제공한다.

### 대화 이력을 유지하는 방법 

LangGraph의 기본적인 사용법으로 상태관리 기능을 이용하여 사용자와의 여러번의 대화를 기억하고 문맥에 맞는 응답을 할 수 있는 챗봇을 구축한다. 

**1.체인 구축 (프롬프트, 모델)**

여기서 사용하는 코드는 [langgraph_conversation.ipynb](https://github.com/mimul/colab-ai/blob/main/langgraph_conversation.ipynb)의 2 ~ 3셀에 해당한다.

```
import os

#환경 변수와 패키지 준비
from google.colab import userdata
os.environ["GOOGLE_API_KEY"] = userdata.get("GOOGLE_API_KEY")
#os.environ["GOOGLE_API_KEY"] = "***" 

import operator
import uuid

from typing import TypedDict, Annotated

from langchain_google_genai import ChatGoogleGenerativeAI

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, SystemMessage, AnyMessage


from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, END, StateGraph

# gemini 모델 정의
model = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0
)

# message 작성
message = [
    SystemMessage(content= "당신은 한국어를 말하는 우수한 어시스턴트입니다. 회답에는 반드시 한국어로 대답해 주세요. 또 생각하는 과정도 출력해 주세요."),
    MessagesPlaceholder("messages"),
]

# message 프롬프트 작성
prompt = ChatPromptTemplate.from_messages(message)

#chain 정의
chain = prompt | model
```

이 셀에서는 LangGraph의 그래프 내에서 사용할 기본적인 LLM Chain을 준비하고 있다. 여기서, message를 정의할 때에 Messages Placeholder("messages")를 추가하고 있다. 이것은 LangChain의 프롬프트 템플릿 내에서 메시지 목록(대화 이력)을 동적으로 삽입하기 위한 플레이스홀더다. 나중에 정의할 LangGraph 상태(State)에 포함된 messages키 값(Human Message나 AI Message 리스트)이 실행시에 이 위치에 삽입된다. 이렇게함으로써 과거 대화 내역을 모두 System Message 뒤에 추가된 상태에서 LLM을 실행할 수 있다.

**2.LangGraph에서 그래프 정의(대화 기록 유지)**

여기서 사용하는 코드는 [langgraph_conversation.ipynb](https://github.com/mimul/colab-ai/blob/main/langgraph_conversation.ipynb)의 4셀에 해당한다.

```
class GraphState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]

def create_langgraph(chain):

    def call_llm(state: GraphState):
        response = chain.invoke({"messages":state["messages"]})
        return {"messages": [response]}

    workflow = StateGraph(state_schema=GraphState)
    workflow.add_node("model", call_llm)

    workflow.add_edge(START, "model")
    workflow.add_edge("model", END)

    memory = MemorySaver()
    graph = workflow.compile(checkpointer=memory)
    return graph

graph = create_langgraph(chain)

from IPython.display import Image, display
display(Image(graph.get_graph().draw_mermaid_png()))
```

- `messages: Annotated[list[AnyMessage], operator.add]`에서 Typed Dict를 사용하여 그래프 전체에서 관리하고자 하는 상태(State)의 구조를 정의한다. 여기에서는 messages키만 가지는 상태를 정의하고 있다. `list[AnyMessage]`는 messages키에는 Human Message나 AI Message 등 임의의 메시지 객체의 리스트가 저장되며 이것이 대화 이력의 실체가 된다. `Annotated[..., operator.add]`는 messages키에 새로운 값(메시지 리스트)이 전달된 경우 기존 리스트에 그 값을 추가(add)한다는 의미이다.
- `workflow = StateGraph(state_schema=GraphState)`는 정의한 Graph State를 스키마로 State Graph 객체를 만든다. 
- `workflow.add_node("model", call_llm)`에서 `add_node` 메소드는 그래프의 노드 역할을 정의한다. 노드는 상태 state가 전달되고 그 상태안의 값을 참조하여 수행되는 처리를 기술한 함수이다. 여기서는 `call_llm` 함수를 model이라는 노드를 그래프에 추가한다.

```
workflow.add_edge(START, "model")
workflow.add_edge("model", END)
```

그래프의 처리 흐름을 정의한다. `add_edge` 메소드는 그래프의 노드와 노드 사이를 연결하는 edge의 역할을 정의한다. 여기서는 매우 심플하고 그래프가 시작(START)되면 model 노드를 실행하고 그것이 끝나면 그래프를 종료(END)하는 흐름이다.

![langgraph state](/img/blog/langgraph_state.png)


```
def call_llm(state: GraphState):
    response = chain.invoke({"messages":state["messages"]})
    return {"messages": [response]}
```

그래프의 노드(Node) 즉, 처리의 스텝이 되는 함수이다. 파라미터로 현재 그래프 상태 state를 받아 chain이 출력하는 새 메시지가 state의 messages 목록 끝에 추가된다. 이처럼 사용자의 입력과 LLM의 출력 결과를 상태(state)에 점점 추가되고 있기 때문에 `state["messages"]`에는 지금까지의 대화 이력이 모두 포함되어 있다.

`memory = MemorySaver()`는 체크 포인터(Checkpointer)를 작성하고 있다. Memory Saver는 그래프의 상태를 인메모리(프로그램의 실행중의 메모리상)에 보존하기 위한 가장 심플한 체크 포인터다. 그 외에 데이터베이스 등에 상태를 영속화하는 체크 포인터도 있다. 체크 포인터는 대화의 중간 경과(상태)를 기록해 다음 호출시에 복원하는 역할을 담당한다.

`graph = workflow.compile(checkpointer=memory)`에서 .compile() 메소드에서 workflow에서 정의한 그래프 구조(노드와 에지)를 실행 가능한 형태로 컴파일한다. 이 때 checkpointer=memory를 지정하는 것이 매우 중요하다. 그러면 그래프 실행 중에 상태(Graph State)가 변화하면 그 최신 상태가 memory(Memory Saver 인스턴스)에 자동으로 저장되고 다음번에 동일한 대화(스레드)가 호출될 때 복원되게 된다. 이것이 대화 이력을 유지하는 구조의 핵심이다.

**3.멀티턴 대화 실행**

여기서 사용하는 코드는 [langgraph_conversation.ipynb](https://github.com/mimul/colab-ai/blob/main/langgraph_conversation.ipynb)의 5셀에 해당한다.

```
thread_id = uuid.uuid4()
while True:
    query = input("질문을 입력하세요: ")

    if query.lower() in ["exit", "quit"]:
        print("종료합니다.")
        break

    print("################# 질문 #################")
    print("질문:", query)

    input_query = [HumanMessage(
            [
                {
                    "type": "text",
                    "text": f"{query}"
                },
            ]
        )]

    response = graph.invoke({"messages": input_query} ,config={"configurable": {"thread_id": thread_id}})

    print("################# 응답 #################")
    print("AI 응답",response["messages"][-1].content)
```

`response = graph.invoke({"messages": input_query} ,config={"configurable": {"thread_id": thread_id}})`는 그래프를 실행하고 있는데, 기본적으로 일반적인 chain의 invoke 메소드와 동일하지만, 아래가 다르다.

- 첫 번째 인수 `{"messages": input_query}`는 그래프에 대한 입력이다. GraphState의 `Annotated[..., operator.add]` 정의에 따라 이 input_query(새로운 Human Message)가 체크 포인터에서 복원된 기존 messages 목록에 추가된다.
- `config={"configurable": {"thread_id": thread_id}}`에서 compile시에 checkpointer를 지정한 경우 invoke시에는 config 파라미터를 통해 어떤 대화 스레드의 상태를 조작할지를 `thread_id`로 지정해야 한다. 동일한 `thread_id`에서 invoke를 반복함으로써 대화 이력이 이어져 멀티턴 대화가 실현된다.

위 코드의 출력 결과는 아래와 같다.

```
질문을 입력하세요: 나는 미물입니다.
################# 질문 #################
질문: 나는 미물입니다.
################# 응답 #################
AI 응답 알겠습니다. 당신이 자신을 "미물"이라고 표현하셨군요. 이 표현에는 여러 가지 의미가 담겨 있을 수 있습니다. 

1. **겸손:** 자신을 낮추어 겸손함을 표현하는 것일 수 있습니다.
2. **자존감 저하:** 스스로를 작고 보잘것없는 존재로 여기는 자존감 저하의 표현일 수 있습니다.
3. **철학적 의미:** 거대한 우주나 자연 속에서 인간의 존재가 얼마나 작은지를 깨닫고 표현하는 것일 수 있습니다.
4. **비유적 표현:** 사회적 약자, 소외된 존재, 무력한 상황 등을 비유적으로 나타내는 것일 수 있습니다.

어떤 의미로 말씀하신 건가요? 당신의 감정을 더 자세히 알려주시면 더 적절한 답변을 드릴 수 있습니다. 예를 들어, "나는 미물처럼 느껴져요. 왜냐하면..."과 같이 구체적인 상황이나 감정을 덧붙여 주시면 이해하는 데 도움이 될 것입니다.
질문을 입력하세요: 나는 개발자인데, 개발자의 비전은 어떨까요?
################# 질문 #################
질문: 나는 개발자인데, 개발자의 비전은 어떨까요?
################# 응답 #################
AI 응답 개발자로서의 비전에 대해 질문 주셨군요. 개발자의 비전은 개인의 가치관, 흥미, 그리고 사회적 책임감에 따라 매우 다양할 수 있습니다. 하지만 몇가지 공통적인 핵심 키워드를 중심으로 생각해 볼 수 있습니다.

**1. 기술적 숙련과 혁신:**

*   **끊임없는 학습:** 빠르게 변화하는 기술 트렌드를 따라잡고 새로운 기술을 습득하여 전문성을 향상시키는 것은 필수적입니다. 단순히 코드를 짜는 것을 넘어, 기술의 원리를 이해하고 응용하는 능력을 키워야 합니다.
*   **창의적 문제 해결:** 기존의 틀을 벗어나 새로운 아이디어를 제시하고, 기술적인 난제를 창의적으로 해결하는 능력이 중요합니다. 단순히 주어진 문제를 해결하는 것을 넘어, 문제를 정의하고 해결 방법을 설계하는 능력을 키워야 합니다.
*   **기술 혁신 주도:** 새로운 기술을 개발하고 적용하여 사회에 긍정적인 영향을 미치는 혁신을 주도하는 것을 목표로 할 수 있습니다. 인공지능, 블록체인, 클라우드 컴퓨팅 등 미래 기술을 선도하며 새로운 가치를 창출할 수 있습니다.

**2. 사용자 중심의 가치 창출:**

*   **사용자 경험 최적화:** 사용자의 요구를 정확히 파악하고, 편리하고 직관적인 사용자 경험을 제공하는 데 집중해야 합니다. 사용성 테스트, 사용자 인터뷰 등을 통해 사용자 피드백을 적극적으로 반영해야 합니다.
*   **접근성 향상:** 모든 사용자가 기술에 쉽게 접근하고 사용할 수 있도록 접근성을 고려한 개발을 해야 합니다. 장애인, 노인 등 사회적 약자를 위한 기술 개발에 관심을 가질 수 있습니다.
*   **사회적 문제 해결:** 기술을 활용하여 사회적 문제를 해결하고 더 나은 세상을 만드는 데 기여하는 것을 목표로 할 수 있습니다. 환경 문제, 빈곤 문제, 교육 불평등 등 다양한 사회 문제 해결에 기술을 활용할 수 있습니다.

**3. 협업과 소통:**

*   **효율적인 협업:** 다른 개발자, 디자이너, 기획자 등 다양한 분야의 사람들과 원활하게 소통하고 협력하여 시너지를 창출해야 합니다. 코드 리뷰, 페어 프로그래밍 등을 통해 협업 능력을 향상시킬 수 있습니다.
*   **지식 공유:** 자신의 지식과 경험을 다른 사람들과 공유하고 함께 성장하는 문화를 만들어야 합니다. 오픈 소스 프로젝트 참여, 기술 블로그 운영 등을 통해 지식 공유에 기여할 수 있습니다.
*   **리더십 발휘:** 팀을 이끌고 프로젝트를 성공적으로 이끌어가는 리더십을 발휘할 수 있습니다. 팀원들의 역량을 최대한 발휘할 수 있도록 동기 부여하고, 갈등을 해결하는 능력이 필요합니다.

**4. 윤리적 책임감:**

*   **데이터 보안 및 개인 정보 보호:** 사용자의 데이터를 안전하게 보호하고 개인 정보 침해를 방지하는 데 최선을 다해야 합니다. 보안 취약점을 사전에 예방하고, 개인 정보 보호 관련 법규를 준수해야 합니다.
*   **공정하고 투명한 알고리즘 개발:** 편향되지 않고 공정한 알고리즘을 개발하여 사회적 불평등을 심화시키지 않도록 주의해야 합니다. 알고리즘의 작동 원리를 투명하게 공개하고, 편향성을 검증하는 노력이 필요합니다.
*   **기술 남용 방지:** 기술이 악용되지 않도록 윤리적인 책임을 다해야 합니다. 인공지능 무기 개발 반대, 가짜 뉴스 확산 방지 등 기술 남용을 방지하기 위한 활동에 참여할 수 있습니다.

**결론적으로, 개발자의 비전은 단순히 코드를 잘 짜는 것을 넘어, 기술을 통해 사회에 긍정적인 영향을 미치고 더 나은 세상을 만드는 데 기여하는 데 있다고 할 수 있습니다.** 당신의 개인적인 가치관과 흥미를 바탕으로 자신만의 비전을 설정하고, 끊임없는 노력과 학습을 통해 그 비전을 실현해 나가시길 바랍니다. 어떤 분야에 더 관심이 있으신가요? 더 구체적인 질문을 해주시면 더욱 맞춤형 답변을 드릴 수 있습니다.
```

출력 결과를 보면 동일 쓰레드에 여러 응답을 리턴 받은 것으로 보아 멀티턴 대화가 제대로 작동하고 있음을 알 수 있다. 

LangGraph와 체크 포인터를 이용한 방법은 과거의 ConversationBufferMemory등을 사용하는 방법과 비교해 그래프의 노드나 상태 정의에 대화 이력 관리 로직이 자연스럽게 포함되기 때문에 보다 복잡한 에이전트 등을 구축할 때에 상태 관리를 일원화하기 쉬운 이점이 있다. 조건 분기나 루프를 포함한 보다 복잡한 그래프 구조를 구축할 수 있다.

### Tool Calling을 이용한 AI 에이전트를 구현하는 방법

LLM의 능력은 자신의 학습 데이터를 기반으로 하므로 최신 정보나 학습 데이터에 포함되지 않은 특정 지식, 혹은 계산이나 외부 서비스의 조작 등은 단독으로 수행할 수 없다. 그렇지만 Tool Calling을 사용하면 LLM은 마치 사람이 도구를 사용하도록 외부 API와 함수(도구)를 필요에 따라 호출할 수 있다. LLM이 자율적으로 상황을 판단하고 툴을 선택/실행하여 태스크를 달성하려고 하는 구조를 AI 에이전트 부른다.

**1. Tool Calling이란?**

Tool Calling은 대규모 언어 모델(LLM)이 사전 정의된 외부 함수와 API(도구)를 필요에 따라 자율적으로 호출할 수 있는 기능이다. LLM은 사용자의 지시와 대화의 흐름을 이해하고 "어떤 도구를", "어떤 파라미터로" 호출해야 하는지를 판단하고 그 정보를 특정한 형식으로 출력한다. 이 기능은 LLM 공급자와 컨텍스트에 따라 다양한 이름으로 불린다. OpenAI에서 시작된 Function Calling이란 이름도 있고 Anthropic (Claude) 등이 채용하고 있는 호출명으로 Tool Use가 있다. Tool Calling을 사용하면 LLM은 다음을 수행할 수 있다.

| 특징            | 설명                                                                             |
| :------------- | :------------------------------------------------------------------------------ |
| 최신 정보 접근    | Web 검색 툴을 사용해 실시간 정보를 취득할 수 있음                                          |
| 컴퓨팅 능력 확장   | 계산기 툴이나 코드 실행 툴을 사용해 복잡한 계산을 수행할 수 있음                               |
| 외부 서비스와 협력 | 캘린더 API를 조작해 예정을 등록하거나 데이터베이스 검색 툴에서 사내 정보를 검색할 수 있음            |
| 액션 실행        | 조메일 송신 툴이나 스마트 홈 제어 API를 호출할 수 있음                                      |

즉, LLM의 지식이나 능력을 외부 도구를 통해 확장하여 보다 다양하고 실용적인 작업에 대응할 수 있도록 하는 기술이 Tool Calling이다. 직접 함수로 구현해도 되고 LangChain에도 프리셋으로 쉽게 이용할 수 있는 Tool이 있다. 여기에서는 LangChain에서 쉽게 이용할 수 있는 웹검색 툴을 이용한다. 

LLM이 웹검색을 수행하도록 하는 도구로 이번에는 [Tavily](https://tavily.com/)라는 검색 API 서비스를 이용하는데 서전에 Tavily 가입해 API 키를 얻는다. 무료 플랜에서도 월 1,000회까지 API 호출이 가능하다. 그리고 Tavily에서 얻은 API 키를 `GOOGLE_API_KEY`와 마찬가지로 [Google Colaboratory](https://colab.research.google.com)의 비밀 기능을 사용하여 `TAVILY_API_KEY` 이름으로 등록한다. 

여기에서는 LangGraph와 Tool Calling을 이용하여 사용자의 질문에 대해 웹 검색 툴(Tavily)을 이용하여 정보를 수집하고 이를 바탕으로 답변할 수 있는 간단한 AI 에이전트(채팅봇)를 구축한다. 사용되는 코드는 [langgraph_tool_calling.ipynb](https://github.com/mimul/colab-ai/blob/main/langgraph_tool_calling.ipynb)이다.
 
**2. 모델 정의**

```
import os
import time
import operator
import uuid

from typing import  Annotated
from typing_extensions import TypedDict, Annotated
from pydantic import BaseModel, Field

from langchain_google_genai import ChatGoogleGenerativeAI

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, AnyMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_tavily import TavilySearch, TavilyExtract

from langgraph.types import Command
from langgraph.prebuilt import ToolNode
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

#환경 변수와 패키지 준비
from google.colab import userdata
os.environ["GOOGLE_API_KEY"] = userdata.get("GOOGLE_API_KEY")
os.environ["TAVILY_API_KEY"] = userdata.get("TAVILY_API_KEY")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-preview-04-17",
    temperature=0,
    max_retries=0,
)

print(llm.invoke("너 이름이 뭐니?"))
```

모델별로 RateLimit를 볼려면 [여기](https://ai.google.dev/gemini-api/docs/rate-limits?hl=ko)에서 보면 된다.

**3. Tool과 Chain 정의**

```
tavily_search_tool = TavilySearch(
    max_results=10,
    topic="general",
)

tavily_extract_tool = TavilyExtract()

tools = [
    tavily_search_tool,
    tavily_extract_tool
]

system_prompt = """
당신은 한국어를 말하는 우수한 어시스턴트입니다. 회답에는 반드시 한국어로 대답해 주세요. 또 생각하는 과정도 출력해 주세요.
우리는 'tavily_search_tool'과 'tavily_extract_tool'이라는 두가지 툴을 가지고 있습니다.
tavily_search_tool은 구글 검색을 하고 상위 5개 URL과 개요를 가져오는 툴입니다. 어떤 웹사이트가 있는지를 알고자 할 경우에는 이곳을 이용합니다.
tavily_extract_tool은 URL을 지정하여 페이지의 내용을 추출하는 툴입니다. 특정 Web 사이트의 URL을 알고 있어 상세하게 내용을 추출하는 경우는 이쪽을 이용합니다.
적절하게 이용하여 사용자로부터 질문에 답변해 주세요.
"""

# message 작성
message = [
    SystemMessage(content=system_prompt),
    MessagesPlaceholder("messages"),
]

# message 프롬프트 정의
prompt = ChatPromptTemplate.from_messages(message)

#chain 정의
chain = prompt | llm.bind_tools(tools)
```

TavilySearch는 웹 검색을 수행하여 상위 10개의 URL과 개요를 얻는 도구이고 TavilyExtract는 URL을 지정하여 페이지의 내용을 추출하는 도구이다. `chain = prompt | llm.bind_tools(tools)`는 정의한 tools을 Chain에 등록한다. 

chain을 실행하면 LLM은 프롬프트의 내용과 대화 이력을 바탕으로 필요하면 tools 목록내의 툴(`tavily_search_tool`과 `tavily_extract_tool`)을 호출하기 위한 정보(어떤 툴을 어느 파라미터로 부를지)를 응답 메시지(AIMessage)의 `tool_calls` 속성에 포함시켜 반환하게 된다. 만약 도구 호출이 필요 없다고 판단할 경우에는 일반 텍스트 응답만 반환한다. 이 chain이 에이전트의 사고 부분을 담당한다. 입력(대화 이력)을 받아 응답을 생성할지 도구 호출을 요구할지 결정한다.

**4. LangGraph에서 그래프 정의(Tool Calling Agent)**

```
class GraphState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]

def create_langgraph(tools):

    def should_continue(state: GraphState):
        messages = state["messages"]
        last_message = messages[-1]
        if last_message.tool_calls:
            return "tools"
        return END

    def call_llm(state: GraphState):
        response = chain.invoke({"messages":state["messages"]})
        print("====response====")
        print(response)
        return {"messages": [response]}

    tool_node = ToolNode(tools)

    workflow = StateGraph(GraphState)
    workflow.add_node("agent", call_llm)
    workflow.add_node("tools", tool_node)

    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges("agent", should_continue, ["tools", END])
    workflow.add_edge("tools", "agent")

    memory = MemorySaver()
    graph = workflow.compile(checkpointer=memory)
    return graph

graph = create_langgraph(tools)

from IPython.display import Image, display
display(Image(graph.get_graph().draw_mermaid_png()))
```

그래프를 정의하고 실행결과를 시각화해보면 아래와 같다.

![langgraph tool calling state](/img/blog/langgraph_tool_calling_state.png)

Tool Calling 에이전트의 동작 흐름을 정의하는 LangGraph 그래프를 구축한다.

- `should_continue` 함수는 에이전트의 의사 결정의 열쇠이다. 그래프 상태(state)를 받는다. `last_message = state["messages"][-1]`에서 직전의 메시지(즉, call_llm 노드가 생성한 AIMessage)를 취득하고 `iflast_message.tool_calls:`에서 해당 메시지에 tool_calls 속성이 존재하는지(즉, LLM이 툴 호출을 요구했는지)를 체크하고 존재하면 "tools"라는 문자열을 반환한다. 이는 다음에 tools 노드(도구 실행 노드)를 실행해야 함을 나타낸다. 맨 마지막 messages가 AIMessage이고 `tool_calls` 속성을 가지고 있을 때 툴 노드로 라우팅을 한다.
- `tool_node = ToolNode(tools)`에서 ToolNode는 LangGraph에서 제공하는 편리한 임베디드 노드이고 이 노드에서 실제로 LLM이 선택한 툴을 LLM이 생성한 파라미터로 실행한다. 이 노드는 그래프 상태(state)에서 `tool_calls`를 가진 AI Message를 받으면 해당 지시에 따라 해당 툴을 실제로 실행하고 그 결과를 Tool Message 객체로 생성한다. 생성된 ToolMessage가 messages키로 반환되어 상태에 추가된다. 이 노드에는 제약이 있는데, 이용하는 state에는 반드시 messages 키 필요하고 가장 마지막 메시지가 AIMessage이며 `tool_calls` 속성을 가진다.
- `workflow.add_conditional_edges(...)`는 조건 분기의 설정인데, 먼저 "agent" 노드 실행 후에 `should_continue` 함수를 호출하고 `{"tools": "tools", END: END}`라는 매핑에 의해 `should_continue`가 "tools"를 반환하면 "tools" 노드로, END를 반환하면 그래프가 종료(END)된다.
- `workflow.add_edge("tools", "agent")`에서 마지막으로 tools 노드가 불려지고 나면 반드시 agent 노드가 불려지고 있다. 그러면 tools 노드의 결과를 반드시 LLM이 처리를 하고 다시 Tool을 이용할 필요가 있는지 판단할 수 있다. 충분히 Tool에 의해 정보 수집이 되었다고 판단되면 agent 노드에서 사용자의 질문에 답변하고 그래프 실행을 종료한다.

```
thread_id = uuid.uuid4()
while True:
    query = input("질문을 입력해주세요: ")
    if query.lower() in ["exit", "quit"]:
        print("종료하겠습니다.")
        break

    print("################# 질문 #################")
    print("질문:", query)

    input_query = [HumanMessage(
            [
                {
                    "type": "text",
                    "text": f"{query}"
                },
            ]
        )]

    response = graph.invoke({"messages": input_query} ,config={"configurable": {"thread_id": thread_id}})

    print("response: ", response)
    print("################# 응답 #################")
    print("AI 응답",response["messages"][-1].content)
```

그래프를 실행하고 있고 출력 결과는 아래와 같다.

**5. 검색 기능이 있는 LLM 실행**

```
질문을 입력해주세요: 최신 동영상 생성 AI(오픈 모델) 중에 애니메이션풍의 동영상을 품질 높게 생성할 수 있는 모델을 조사해 주세요. 출력 시에는 정밀도에 대해 조사한 후 현시점에서 가장 고성능인 모델을 알려주세요. 또한 그 모델의 이용 방법 등에 대해서도 알고 싶습니다. 또 상용 이용이 가능한 라이선스로 좁혀 주세요.
################# 질문 #################
질문: 최신 동영상 생성 AI(오픈 모델) 중에 애니메이션풍의 동영상을 품질 높게 생성할 수 있는 모델을 조사해 주세요. 출력 시에는 정밀도에 대해 조사한 후 현시점에서 가장 고성능인 모델을 알려주세요. 또한 그 모델의 이용 방법 등에 대해서도 알고 싶습니다. 또 상용 이용이 가능한 라이선스로 좁혀주세요.
====response====
content="네, 최신 오픈 소스 동영상 생성 AI 모델 중 애니메이션풍의 고품질 동영상을 생성할 수 있고 상용 이용이 가능한 모델에 대해 조사해 보겠습니다.\n\n이 분야는 매우 빠르게 발전하고 있으며, '최고 성능'은 기준이나 사용 방법에 따라 달라질 수 있습니다. 현재 시점에서 애니메이션 스타일에 특히 강점을 보이거나 해당 스타일 구현에 널리 사용되는 오픈 소스 기술을 중심으로 찾아보겠습니다.\n\n`tavily_search_tool`을 사용하여 관련 정보를 검색하겠습니다." additional_kwargs={'function_call': {'name': 'tavily_search', 'arguments': '{"search_depth": "advanced", "time_range": "year", "query": "latest open source video generation AI anime high quality commercial use"}'}} response_metadata={'prompt_feedback': {'block_reason': 0, 'safety_ratings': []}, 'finish_reason': 'STOP', 'model_name': 'models/gemini-2.5-flash-preview-04-17', 'safety_ratings': []} id='run-098c0b76-5f20-4bde-9319-62c0166ae187-0' tool_calls=[{'name': 'tavily_search', 'args': {'search_depth': 'advanced', 'time_range': 'year', 'query': 'latest open source video generation AI anime high quality commercial use'}, 'id': '404458b1-e5ba-4c21-a460-036efed071b2', 'type': 'tool_call'}] usage_metadata={'input_tokens': 1145, 'output_tokens': 155, 'total_tokens': 4422, 'input_token_details': {'cache_read': 0}}
====response====
content='생각하는 과정:\n\n1.  **사용자 요청 분석:** 사용자는 최신 오픈 소스 동영상 생성 AI 모델 중 애니메이션 스타일의 고품질 동영상을 상업적으로 이용 가능한 라이선스로 생성할 수 있는 모델을 찾고 있습니다. 모델의 정밀도(품질, 프롬프트 준수 등)와 이용 방법도 알고 싶어 합니다.\n\n2.  **필요한 정보 식별:**\n    *   최신 오픈 소스 동영상 생성 AI 모델 목록.\n    *   각 모델의 애니메이션 스타일 생성 능력 및 품질.\n    *   각 모델의 라이선스 (상업적 이용 가능 여부).\n    *   각 모델의 정밀도 (품질, 프롬프트 준수, 해상도, 프레임 속도 등).\n    *   가장 고성능인 모델 식별 (위 기준 종합).\n    *   선택된 모델의 이용 방법.\n\n3.  **검색 전략 수립:** 사용자의 요청에 맞춰 키워드를 조합하여 검색합니다.\n    *   키워드: "latest open source video generation AI anime high quality commercial use"\n    *   검색 깊이: 상세한 정보를 위해 "advanced"\n    *   시간 범위: "최신" 정보를 위해 "year"\n\n4.  **검색 실행:** `tavily_search` 툴을 사용하여 검색을 수행합니다.\n    *   `print(default_api.tavily_search(query = "latest open source video generation AI anime high quality commercial use", search_depth = "advanced", time_range = "year"))`\n\n5.  **검색 결과 분석:** 검색 결과를 검토하여 각 모델에 대한 정보를 추출합니다.\n    *   **Hunyuan Video (Tencent):** 오픈 소스, 13B 파라미터, 고품질 시네마틱 (실사/가상 스타일), 720p 해상도, 텍스트-비디오 정렬 및 모션 다양성 우수. 강력한 오픈 소스 중 하나로 언급됨. 상업적 이용 라이선스는 명확히 언급되지 않음.\n    *   **Mochi-1 (Genmo AI):** 오픈 소스, 10B 파라미터, 30fps 부드러운 모션, 강력한 프롬프트 준수. Apache 2.0 라이선스 (상업적 이용 가능). 연구, 제품 개발, 창의적 표현 등에 적합하다고 언급됨.\n    *   **Hailuo AI:** 카툰 스타일 템플릿, Director Mode. 플랫폼 형태. 오픈 소스 모델 자체인지는 불분명. 상업적 이용 가능성 언급 (무료/유료).\n    *   **PixVerse AI, Vidu AI:** 상업적 이용 가능성 언급. 플랫폼 형태일 가능성 높음. 오픈 소스 모델인지는 불분명.\n    *   **Sora, Runway Gen-2, Pika Labs, Stable Video Diffusion:** 언급은 되지만, 오픈 소스 여부, 애니메이션 특화, 상업적 이용 라이선스가 명확히 연결되어 설명되지 않음.\n    *   **GPT-4o, DALL-E 3:** 이미지 생성 모델. 동영상 생성 요청과는 다름.\n\n6.  **최적 모델 선정:** 사용자의 요구사항 (오픈 소스, 애니메이션 스타일, 고품질, 상업적 이용 가능 라이선스, 정밀도)을 모두 만족하는 모델을 찾습니다.\n    *   Hunyuan과 Mochi-1이 주요 오픈 소스 후보입니다.\n    *   Hunyuan은 강력하고 고품질이지만, 상업적 이용 라이선스가 검색 결과에서 명확히 확인되지 않았습니다.\n    *   Mochi-1은 오픈 소스이며, Apache 2.0 라이선스로 상업적 이용이 명시적으로 가능합니다. 30fps 모션과 강력한 프롬프트 준수는 정밀도 측면에서 긍정적입니다. 애니메이션 스타일에 특화되었다는 명시는 없지만, "창의적 표현"에 적합하다는 설명과 텍스트 프롬프트 기반이라는 점에서 다양한 스타일 시도가 가능할 것으로 보입니다.\n    *   따라서 상업적 이용 가능 라이선스가 명확한 Mochi-1이 현재 검색 결과만으로는 가장 적합한 모델로 판단됩니다.\n\n7.  **선택된 모델 정보 정리:** Mochi-1에 대한 정보를 종합합니다.\n    *   모델명: Mochi-1 (Genmo AI 개발)\n    *   특징: 오픈 소스, 100억(10B) 파라미터, 30fps 부드러운 모션, 강력한 프롬프트 준수.\n    *   라이선스: Apache 2.0 (상업적 이용 가능).\n    *   정밀도: 30fps 모션, 강력한 프롬프트 준수, 고품질 동영상 생성 가능.\n    *   이용 방법: 텍스트 프롬프트 기반으로 동영상 생성. 공식 웹사이트(mochi1ai.com) 또는 관련 GitHub/문서 참고 필요. 로컬 설치 가능성도 언급됨.\n\n8.  **응답 구성:** 사용자에게 조사 결과를 바탕으로 답변을 작성합니다.\n    *   조사 결과, 현재 시점에서 사용자의 요구사항(오픈 소스, 고품질, 상업적 이용 가능)에 가장 부합하는 모델은 Mochi-1임을 알립니다.\n    *   Mochi-1의 특징과 장점(오픈 소스, Apache 2.0 라이선스, 30fps, 프롬프트 준수)을 설명합니다.\n    *   정밀도 측면에서 Mochi-1의 강점을 언급합니다.\n    *   이용 방법은 텍스트 프롬프트 기반이며, 자세한 내용은 공식 웹사이트나 관련 문서를 참고해야 함을 안내합니다.\n    *   Hunyuan Video도 강력한 오픈 소스 모델이지만, 상업적 이용 라이선스 정보가 Mochi-1만큼 명확하지 않음을 덧붙여 비교 정보를 제공합니다.\n    *   애니메이션 스타일에 특화된 모델은 아니지만, 텍스트 프롬프트와 창의적 표현 기능을 통해 애니메이션 스타일 구현이 가능할 수 있음을 시사합니다.\n\n9.  **한국어 번역 및 다듬기:** 작성된 내용을 자연스러운 한국어로 번역하고 사용자 친화적으로 다듬습니다.최신 오픈 소스 동영상 생성 AI 모델 중 애니메이션풍의 고품질 동영상을 상업적으로 이용 가능한 라이선스로 생성할 수 있는 모델을 조사한 결과, 현재 시점에서 가장 주목할 만한 모델은 **Mochi-1**입니다.\n\n**Mochi-1 (Genmo AI 개발)**\n\n*   **특징:** Mochi-1은 100억(10B) 개의 파라미터를 가진 오픈 소스 텍스트-투-비디오 모델입니다. 특히 30 프레임/초(fps)의 부드러운 모션과 텍스트 프롬프트에 대한 강력한 준수 능력이 강점입니다.\n*   **정밀도:** 고품질 동영상 생성을 목표로 하며, 특히 모션의 자연스러움과 사용자의 입력(프롬프트)을 정확하게 반영하는 데 중점을 둡니다. 애니메이션 스타일에 특화되었다고 명시되어 있지는 않지만, 강력한 프롬프트 준수와 창의적 표현 기능을 통해 다양한 스타일의 동영상 생성이 가능할 것으로 보입니다.\n*   **라이선스:** Mochi-1은 Apache 2.0 라이선스로 제공됩니다. 이 라이선스는 상업적 이용을 포함하여 매우 자유로운 사용을 허용합니다. 따라서 상업적 목적으로 생성된 동영상을 활용하는 데 문제가 없습니다.\n*   **이용 방법:** 기본적으로 텍스트 프롬프트를 입력하여 원하는 동영상을 생성하는 방식입니다. 모델 자체를 다운로드하여 로컬 환경에 설치하거나, Genmo AI 등 관련 플랫폼을 통해 접근할 수 있습니다. 자세한 이용 방법이나 설치 가이드는 Mochi-1의 공식 웹사이트(mochi1ai.com)나 관련 GitHub 저장소를 참고하시는 것이 가장 정확합니다.\n\n**다른 모델과의 비교:**\n\nHunyuan Video (Tencent 개발) 역시 130억(13B) 파라미터의 강력한 오픈 소스 모델로 언급되며, 고품질 시네마틱 동영상 생성에 뛰어나고 720p 해상도를 지원합니다. 하지만 검색 결과만으로는 Hunyuan Video의 상업적 이용 라이선스가 Mochi-1의 Apache 2.0처럼 명확하게 확인되지는 않았습니다. 사용자의 요구사항 중 \'상업적 이용 가능한 라이선스\'가 중요한 기준이므로, 이 점에서는 Mochi-1이 더 확실한 선택일 수 있습니다.\n\n결론적으로, 오픈 소스이며 상업적 이용이 명확히 허용되는 라이선스를 가진 고품질 동영상 생성 모델로는 현재 Mochi-1이 가장 적합한 것으로 판단됩니다. 이용을 원하시면 Mochi-1의 공식 채널을 통해 상세한 사용법과 기술 문서를 확인하시기 바랍니다.' additional_kwargs={} response_metadata={'prompt_feedback': {'block_reason': 0, 'safety_ratings': []}, 'finish_reason': 'STOP', 'model_name': 'models/gemini-2.5-flash-preview-04-17', 'safety_ratings': []} id='run-f63f1ba7-24bc-4e3e-88e1-153f0d2af536-0' usage_metadata={'input_tokens': 3957, 'output_tokens': 2033, 'total_tokens': 7105, 'input_token_details': {'cache_read': 0}}
################# 응답 #################
AI 응답 생각하는 과정:

1.  **사용자 요청 분석:** 사용자는 최신 오픈 소스 동영상 생성 AI 모델 중 애니메이션 스타일의 고품질 동영상을 상업적으로 이용 가능한 라이선스로 생성할 수 있는 모델을 찾고 있습니다. 모델의 정밀도(품질, 프롬프트 준수 등)와 이용 방법도 알고 싶어 합니다.

2.  **필요한 정보 식별:**
    *   최신 오픈 소스 동영상 생성 AI 모델 목록.
    *   각 모델의 애니메이션 스타일 생성 능력 및 품질.
    *   각 모델의 라이선스 (상업적 이용 가능 여부).
    *   각 모델의 정밀도 (품질, 프롬프트 준수, 해상도, 프레임 속도 등).
    *   가장 고성능인 모델 식별 (위 기준 종합).
    *   선택된 모델의 이용 방법.

3.  **검색 전략 수립:** 사용자의 요청에 맞춰 키워드를 조합하여 검색합니다.
    *   키워드: "latest open source video generation AI anime high quality commercial use"
    *   검색 깊이: 상세한 정보를 위해 "advanced"
    *   시간 범위: "최신" 정보를 위해 "year"

4.  **검색 실행:** `tavily_search` 툴을 사용하여 검색을 수행합니다.
    *   `print(default_api.tavily_search(query = "latest open source video generation AI anime high quality commercial use", search_depth = "advanced", time_range = "year"))`

5.  **검색 결과 분석:** 검색 결과를 검토하여 각 모델에 대한 정보를 추출합니다.
    *   **Hunyuan Video (Tencent):** 오픈 소스, 13B 파라미터, 고품질 시네마틱 (실사/가상 스타일), 720p 해상도, 텍스트-비디오 정렬 및 모션 다양성 우수. 강력한 오픈 소스 중 하나로 언급됨. 상업적 이용 라이선스는 명확히 언급되지 않음.
    *   **Mochi-1 (Genmo AI):** 오픈 소스, 10B 파라미터, 30fps 부드러운 모션, 강력한 프롬프트 준수. Apache 2.0 라이선스 (상업적 이용 가능). 연구, 제품 개발, 창의적 표현 등에 적합하다고 언급됨.
    *   **Hailuo AI:** 카툰 스타일 템플릿, Director Mode. 플랫폼 형태. 오픈 소스 모델 자체인지는 불분명. 상업적 이용 가능성 언급 (무료/유료).
    *   **PixVerse AI, Vidu AI:** 상업적 이용 가능성 언급. 플랫폼 형태일 가능성 높음. 오픈 소스 모델인지는 불분명.
    *   **Sora, Runway Gen-2, Pika Labs, Stable Video Diffusion:** 언급은 되지만, 오픈 소스 여부, 애니메이션 특화, 상업적 이용 라이선스가 명확히 연결되어 설명되지 않음.
    *   **GPT-4o, DALL-E 3:** 이미지 생성 모델. 동영상 생성 요청과는 다름.

6.  **최적 모델 선정:** 사용자의 요구사항 (오픈 소스, 애니메이션 스타일, 고품질, 상업적 이용 가능 라이선스, 정밀도)을 모두 만족하는 모델을 찾습니다.
    *   Hunyuan과 Mochi-1이 주요 오픈 소스 후보입니다.
    *   Hunyuan은 강력하고 고품질이지만, 상업적 이용 라이선스가 검색 결과에서 명확히 확인되지 않았습니다.
    *   Mochi-1은 오픈 소스이며, Apache 2.0 라이선스로 상업적 이용이 명시적으로 가능합니다. 30fps 모션과 강력한 프롬프트 준수는 정밀도 측면에서 긍정적입니다. 애니메이션 스타일에 특화되었다는 명시는 없지만, "창의적 표현"에 적합하다는 설명과 텍스트 프롬프트 기반이라는 점에서 다양한 스타일 시도가 가능할 것으로 보입니다.
    *   따라서 상업적 이용 가능 라이선스가 명확한 Mochi-1이 현재 검색 결과만으로는 가장 적합한 모델로 판단됩니다.

7.  **선택된 모델 정보 정리:** Mochi-1에 대한 정보를 종합합니다.
    *   모델명: Mochi-1 (Genmo AI 개발)
    *   특징: 오픈 소스, 100억(10B) 파라미터, 30fps 부드러운 모션, 강력한 프롬프트 준수.
    *   라이선스: Apache 2.0 (상업적 이용 가능).
    *   정밀도: 30fps 모션, 강력한 프롬프트 준수, 고품질 동영상 생성 가능.
    *   이용 방법: 텍스트 프롬프트 기반으로 동영상 생성. 공식 웹사이트(mochi1ai.com) 또는 관련 GitHub/문서 참고 필요. 로컬 설치 가능성도 언급됨.

8.  **응답 구성:** 사용자에게 조사 결과를 바탕으로 답변을 작성합니다.
    *   조사 결과, 현재 시점에서 사용자의 요구사항(오픈 소스, 고품질, 상업적 이용 가능)에 가장 부합하는 모델은 Mochi-1임을 알립니다.
    *   Mochi-1의 특징과 장점(오픈 소스, Apache 2.0 라이선스, 30fps, 프롬프트 준수)을 설명합니다.
    *   정밀도 측면에서 Mochi-1의 강점을 언급합니다.
    *   이용 방법은 텍스트 프롬프트 기반이며, 자세한 내용은 공식 웹사이트나 관련 문서를 참고해야 함을 안내합니다.
    *   Hunyuan Video도 강력한 오픈 소스 모델이지만, 상업적 이용 라이선스 정보가 Mochi-1만큼 명확하지 않음을 덧붙여 비교 정보를 제공합니다.
    *   애니메이션 스타일에 특화된 모델은 아니지만, 텍스트 프롬프트와 창의적 표현 기능을 통해 애니메이션 스타일 구현이 가능할 수 있음을 시사합니다.

9.  **한국어 번역 및 다듬기:** 작성된 내용을 자연스러운 한국어로 번역하고 사용자 친화적으로 다듬습니다.최신 오픈 소스 동영상 생성 AI 모델 중 애니메이션풍의 고품질 동영상을 상업적으로 이용 가능한 라이선스로 생성할 수 있는 모델을 조사한 결과, 현재 시점에서 가장 주목할 만한 모델은 **Mochi-1**입니다.

**Mochi-1 (Genmo AI 개발)**

*   **특징:** Mochi-1은 100억(10B) 개의 파라미터를 가진 오픈 소스 텍스트-투-비디오 모델입니다. 특히 30 프레임/초(fps)의 부드러운 모션과 텍스트 프롬프트에 대한 강력한 준수 능력이 강점입니다.
*   **정밀도:** 고품질 동영상 생성을 목표로 하며, 특히 모션의 자연스러움과 사용자의 입력(프롬프트)을 정확하게 반영하는 데 중점을 둡니다. 애니메이션 스타일에 특화되었다고 명시되어 있지는 않지만, 강력한 프롬프트 준수와 창의적 표현 기능을 통해 다양한 스타일의 동영상 생성이 가능할 것으로 보입니다.
*   **라이선스:** Mochi-1은 Apache 2.0 라이선스로 제공됩니다. 이 라이선스는 상업적 이용을 포함하여 매우 자유로운 사용을 허용합니다. 따라서 상업적 목적으로 생성된 동영상을 활용하는 데 문제가 없습니다.
*   **이용 방법:** 기본적으로 텍스트 프롬프트를 입력하여 원하는 동영상을 생성하는 방식입니다. 모델 자체를 다운로드하여 로컬 환경에 설치하거나, Genmo AI 등 관련 플랫폼을 통해 접근할 수 있습니다. 자세한 이용 방법이나 설치 가이드는 Mochi-1의 공식 웹사이트(mochi1ai.com)나 관련 GitHub 저장소를 참고하시는 것이 가장 정확합니다.

**다른 모델과의 비교:**

Hunyuan Video (Tencent 개발) 역시 130억(13B) 파라미터의 강력한 오픈 소스 모델로 언급되며, 고품질 시네마틱 동영상 생성에 뛰어나고 720p 해상도를 지원합니다. 하지만 검색 결과만으로는 Hunyuan Video의 상업적 이용 라이선스가 Mochi-1의 Apache 2.0처럼 명확하게 확인되지는 않았습니다. 사용자의 요구사항 중 '상업적 이용 가능한 라이선스'가 중요한 기준이므로, 이 점에서는 Mochi-1이 더 확실한 선택일 수 있습니다.

결론적으로, 오픈 소스이며 상업적 이용이 명확히 허용되는 라이선스를 가진 고품질 동영상 생성 모델로는 현재 Mochi-1이 가장 적합한 것으로 판단됩니다. 이용을 원하시면 Mochi-1의 공식 채널을 통해 상세한 사용법과 기술 문서를 확인하시기 바랍니다.
```

출력 결과를 보면 제대로 사용자의 질문에 맞추어, 적절하게 Web 검색을 실시해 그 결과를 출력할 수 있는 것을 알 수 있다. 보다 복잡한 조사 작업에서는 여러번의 검색과 검색 결과에서 얻은 정보를 바탕으로 더 심층적인 검색이 필요할 수 있다.
