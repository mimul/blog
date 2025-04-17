---
templateKey: "blog-post"
title: "Model Context Protocol(MCP)에 대해"
description: "Model Context Protocol의 이해를 돕는 글로 MCP에 대한 개요, 아키텍처, 기본요소, 동작순서, 설계 가이드 등의 순으로 기술됨" 
author: "미물"
authorURL: "https://mimul.com"
date: "2025-03-29T20:44:25.000Z"
lastModificationTime: "2025-03-29T23:11:01.000Z"
image: "/img/blog/llm.png"
commentId: "mcp-2025-03-29"
tags:
  - MCP
  - AI
  - LLM
---
Anthropic이 개발하고 OpenAI를 포함한 여러 AI 기반의 회사들이 채택하면서 MCP는 향후 AI 애플리케이션 연동의 표준으로 주목을 받고 있다. 그래서 MCP를 이해하기 위해서 ["Specification - Model Context Protocol"](https://modelcontextprotocol.io/introduction)을 기반으로 MCP에 대한 내용을 정리를 했다. 이 글은 [MCP2025-03-26](https://modelcontextprotocol.io/specification/2025-03-26) 기반으로 작성되어 있다는 것을 참고하기 바란다.

#### Model Context Protocol (MCP)란 무언인가?

MCP는 Anthropic이 2024년 11월에 도입한 규격으로 AI 시스템이 각각으로 고립되어 버리는 문제를 타파하고 LLM이 실시간 컨텍스트를 안전하게 취득하고 외부 시스템과 쉽게 연동할 수 있도록 하기 위해 고안 되었다. 

MCP는 AI 어시스턴트(예: 채팅봇 및 자동화 에이전트)가 다양한 외부 데이터 및 도구에 접근하기 위한 프로토콜이라고 말할 수 있다. MCP를 사용하지 않았다면 AI가 데이터베이스, 웹 서비스 및 로컬 파일을 사용하고 싶을때 서로 다른 연결 방법을 일일이 만들어야 했다. 그런데 MCP를 활용하면 AI와 데이터/툴의 연결 방식을 표준화함으로써 동일한 프로토콜로 다양한 데이터 소스 및 외부 서비스와 상호 연동할 수 있다. 이는 AI 개발자와 데이터 관리자 등에게 개발 비용을 줄여주는 장점이 있다. LLM의 변화과정을 살펴보면 MCP가 어떻게 탄생했는지 쉽게 알 수 있다.

초기 LLM 앱은 어디까지나 굉장히 현명한 채팅 도구일 뿐이었고, 결국에는 텍스트만 응답할 수 있었다. 그래서 LLM 앱의 응답에 대해 무엇을 할 것인지는 인간이 판단해야 했다.

![LLM](/img/blog/llm1.png)

이 문제를 처음 해결한 것이 [OpenAI의 Function Calling](https://platform.openai.com/docs/guides/function-calling)이다. Function Calling을 사용하면 LLM이 어떤 작업을 수행할지 결정할 수 있으며, 지정된 JSON 응답을 사용하여 LLM 앱이 직접 작업을 수행할 수 있다.

![LLM Function Call](/img/blog/llm2.png)

그러나 LLM앱이 많은 외부 서비스에 대해 일일이 연동을 구현하려면 한계가 있으며, 새로운 서비스가 나올 때마다 추가 대응이 필요하게 된다. 그래서 LLM앱과 외부 서비스를 연계하기 위한 통일된 인터페이스(프로토콜)인 MCP가 필요했던 것이다.

#### 어떤 프로토콜을 사용하는가?

프로토콜은 JSON-RPC 2.0, Stateful connections 방식을 사용한다. 통신(Transport) 방식은 stdio, Streamable HTTP가 표준이다. 클라이 언트의 Transport 지원 상태는 이래와 같다.

| 애플리케이션           | SSE(2024‑11‑05) | stdio           | Streamable HTTP  |
| :-----------------  | :-------------: | :-------------: | :-------------: |
| Roo Code            | O               | O               | X               |
| Cursor              | O               | O               | X               |
| Mastra              | O               | O               | X               |
| Claude Desktop      | X               | O               | X               |
| Cline               | X               | O               | X               |
| Windsurf            | O               | O               | X               |

#### MCP 아키텍처

![MCP Architecture](/img/blog/mcp.png)

MCP는 호스트(Host), 클라이언트(Client), 서버(Server)의 세 가지 역할로 구성된다. 

- 호스트(Host): 호스트는 채팅봇이나 IDE 어시스턴트 등 LLM을 내장한 애플리케이션이다. 호스트는 데이터 검색 및 실행 처리를 직접 관리(클라이언트 생성, 보안, 권한 등 포함)하는 대신 클라이언트에 맡긴다. 호스트는 언제 외부 리소스를 쿼리할지, 도구를 실행할지, 구조화된 프롬프트를 사용할지 결정하고 클라이언트가 얻은 정보를 결합하여 AI가 최적으로 사용할 수 있는 형태로 결합하는 역할을 한다.
- 클라이언트(Client): 호스트와 MCP가 제공하는 외부 리소스 사이에서 데이터 흐름과 도구 실행을 관리하는 중개자 역할을 한다. 하나의 클라이언트는 하나의 서버 전용하며 ```initialize```나 ```call_tool```, ```read_resource```등의 메소드를 사용해 JSON-RPC로 서버와 양방향 통신을 한다. 로그 통지 등의 통지가 서버로부터 왔을 경우 클라이언트측이 받아 필요하면 호스트에 피드백을 보낸다.
- 서버(Server): Tools(데이터베이스에 질의, 메일 송신과 같은 액션(행동)을 LLM이 실행할 수 있도록 하는 것), Resources(문서, 로그, API 응답 등의 구조화된 정보를 제공하여 모델이 응답을 생성할 때 참조할 수 있도록 함), Prompts(미리 준비된 템플릿으로 대화 흐름을 안내하고 일관성과 효율성을 유지하는 데 사용됨)에 대한 엑세스를 제공한다. 예를 들어 LLM이 로컬 파일 시스템, 클라우드의 실시간 금융 데이터 조회, 비즈니스 애플리케이션을 통한 워크플로우 자동화 등의 기능을 제공할 수 있다.

#### MCP 기본 요소(Primitive)

**1. Client Primitive**

- Roots: 어떤 파일, 데이터베이스, 서비스에 MCP 서버가 액세스할 수 있는지를 제한하고 관리하는 역할을 한다. 이를 통해 애플리케이션이 필요한 데이터 소스만 제공하고 LLM이 액세스할 수 있는 정보를 안전하고 적절하게 관리할 수 있다.
- Sampling: Sampling은 반복형 응답 생성을 가능하게 한다. 한번만 정적 응답을 생성하는 대신 MCP 클라이언트는 여러번 생성하고 매번 추가 컨텍스트와 조건으로 응답을 정교하게 만든다. 이렇게 하면 응답의 질, 유연성 및 관련성이 향상된다.

**2. Server Primitive**

- Tools: LLM이 외부 기능을 수행하기 위한 메커니즘으로, 텍스트만의 처리를 넘어서는 액션을 가능하게 한다.단순히 데이터를 제공하는 Resources와 대화를 구조화하는 Prompts와 달리 Tools을 사용하면 실시간 데이터 검색, 데이터베이스 업데이트 및 계산 처리 등을 수행 할 수 있다. LLM 기반 코딩 어시스턴트가 테스트 케이스를 실행하거나 고객 지원 채팅봇이 새 티켓을 생성하는 경우 Tools을 사용한다.
- Resources: 파일, 로그, API로부터의 응답과 같은 LLM이 응답을 생성할 때 참조할 수 있는 구조화된 데이터를 제공한다. 리소스는 도구와 달리 외부 처리는 일어나지 않는다. 대신 모델의 컨텍스트 내에서 부드럽게 통합되는 정보를 제공하여 최신의 일관된 정보에 쉽게 액세스할 수 있다. 예를 들어 재무 보고서, 시스템 로그 등을 리소스로 제공하면 모델의 응답 내용에 자연스럽게 영향을 줄 수 있다.
- Prompts: 외부 작업을 일으키지 않고 미리 결정된 템플릿으로 대화를 구조화하는 역할을 한다. '빈칸 채우기' 템플릿과 같은 메커니즘으로 특정 작업에서 일관성을 유지하는 프레임 워크를 제공한다. 예를 들어 요약의 프롬프트에는 미리 정해진 지시가 있어 그 안에 유저의 입력이 들어가는 구조이다. 또한 챗봇의 성격, 말하기, 행동을 동적으로 지정할 수 있어 외부 시스템을 변경하지 않고도 모델의 응답 방향을 조정할 수 있다.

#### MCP 동작 순서

MCP의 처리 프로세스는 아래와 같지만, MCP는 개발자가 세부 사항을 신경 쓰지 않아도 되도록 추상화하고 있다. 개발자는 단순히 MCP 사양에 따라 서버를 구현(또는 기존 서버를 사용)하고 해당 클라이언트를 갖춘 AI 앱을 준비 하기만 하면 된다. Anthropic은 개발을 단순화하기 위해 [Python](https://github.com/modelcontextprotocol/python-sdk), [TypeScript](https://github.com/modelcontextprotocol/typescript-sdk), [Java](https://github.com/modelcontextprotocol/java-sdk), [Kotlin](https://github.com/modelcontextprotocol/kotlin-sdk), [C#](https://github.com/modelcontextprotocol/csharp-sdk) 등 다국어 SDK를 제공한다.

**1. Capability discovery**

MCP 클라이언트가 먼저 서버에 "어떤 도구, 리소스, 프롬프트를 사용할 수 있는지"를 문의한다. 결과적으로 AI 모델(호스트 측 앱을 통해)은 서버가 제공할 수 있는 기능을 파악한다.

**2. Augmented prompting**

사용자의 질문과 그 주변 정보가 서버에서 얻은 툴과 리소스 설명과 함께 AI 모델로 전송된다. 이것은 모델이 "서버를 통해 어떤 일을 할 수 있는지"를 인식한다. 예를 들어, "내일의 날씨는?" 이라는 질문이 있으면 "Weather API 도구"의 설명이 프롬프트에 포함된다.

**3. Tool/resource selection**

AI 모델은 질문과 이용 가능한 툴이나 리소스를 분석하여 사용이 필요한지 여부를 판단한다. 필요하다고 판단되면 MCP 사양에 따라 어떤 도구와 리소스를 사용할지 구조화된 형태로 반환한다. 예를 들어 날씨의 경우는 "Weather API"에 대한 호출을 선택한다.

**4. Server execution**

MCP 클라이언트가 모델 요청을 받고 MCP 서버의 해당 기능을 호출한다(예: Weather API 실행). 서버가 실제로 외부 API 또는 데이터베이스를 호출하고 결과를 클라이언트에 반환한다.

**5. Response generation**

서버에서 얻은 결과(날씨 정보 등)가 클라이언트를 통해 AI 모델에 전달되고, 모델은 그 데이터를 자신의 응답에 포함한다. 최종적으로 유저에게는 "내일의 날씨는 15도, 바람이 조금부는 맑은 날씨입니다"와 같은 외부 정보를 활용한 응답이 리턴한다.

#### 설계 가이드

- Server는 간단하게 한다. 큰 오케스트레이션은 호스트가 담당하고 서버는 필요한 기능에만 특화해 구축한다.
- 보안상 각 서버는 어디까지나 자신의 권한 내에서 완결되며 서버끼리는 직접 데이터를 공유하지 않는다. 전체 파악은 호스트측에 맡긴다.
- 점진적인 기능 추가를 한다. 핵심 기능은 최소한으로 유지하고 확장 기능은 "capability negotiation(기능 협상)" 으로 합의를 취하면서 추가한다. 이렇게 하면 역호환성을 유지하면서 프로토콜을 성장시킬 수 있다.

#### MCP 활용 사례

**1. 개발 환경에서의 활용(IDE 통합)**

- 코드 어시스턴트: 파일 시스템, 버전 관리, 패키지 관리자, 문서 등과 연계하여 코드의 완성과 제안 기능을 제공.
- 디버그 어시스턴트: 오류 로그 및 디버그 정보에 액세스하여 문제 해결 지원.
- 문서 생성: 코드베이스를 분석하고 자동으로 문서 생성.

**2. 비즈니스 도구와의 협업**

- 데이터 분석 플랫폼: 여러 데이터베이스와 시각화 도구를 연동하여 자연 언어로 데이터 분석 기능 제공.
- 프로젝트 관리 도구: Slack, GitHub, Linear, Todoist 등과 연동하여 작업 관리, 진행 보고를 자동화.

**3. 데이터 분석 및 검색 강화**

- 복합 데이터 분석: 여러 데이터베이스와 분석 도구를 연동하여 보다 포괄적인 분석 제공.
- 지식 기반 검색: 사내 문서, 외부 소스 등을 횡단적으로 검색하여 보다 정확한 정보 제공.
- 시맨틱 검색: Qdrant 등의 벡터 검색 엔진과 연계하여 의미 기반의 고급 검색을 제공.

#### MCP 서버를 제공하는 기업들

- [GitHub](https://github.com/github/github-mcp-server): Pull Request 관리, 이슈 관리, 리포지토리 관리, 검색 기능 제공.
- [Cloudfare](https://github.com/cloudflare/mcp-server-cloudflare): Workers, KV, R2 및 D1을 포함한 Cloudflare 서비스와의 통합.
- [Slack](https://github.com/modelcontextprotocol/servers/tree/main/src/slack): 채널 조회, 채널 사용자 조회, 메세지 발송, 메세지 응답 등 지원.
- [Shopify](https://github.com/Shopify/dev-mcp): 개발 문서, GraphQL 스키마 검색, 전문 프롬프트로 Shopify 관리 API에 대한 효과적인 GraphQL 작업 작성을 도와줌.
- [Gitlab](https://github.com/modelcontextprotocol/servers/tree/main/src/gitlab): 이슈 관리, 리포지토리 관리, Merge Request 관리.
- [AWS S3](https://github.com/aws-samples/sample-mcp-server-s3): 버킷 리스트/버킷내 오브젝트 조회, 오브젝트 내용 검색.
- [Google Drive](https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive): 파일 목록 조회, 읽기 및 검색을 위한 Google Drive 통합.
- [Postgres](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres) : 데이터 베이스 스키마 조회, 쿼리(readOnly) 실행.
- [Notion](https://github.com/makenotion/notion-mcp-server): 컨텐츠/코멘트/작업공간/사용자 관리 기능 제공.
- [Obsidian](https://github.com/smithery-ai/mcp-obsidian): 노트/태그/디렉토리 관리, 검색 기능 제공.
- [Figma](https://github.com/GLips/Figma-Context-MCP): 정확한 디자인 정보(색상, 크기, 글꼴, 간격), 컴포넌트 데이터 추출(버튼, 카드, 네비게이션 등), 디자인에서 코드로 변환, 컬러 팔레트, 타이포그래피, 스페이싱 등의 디자인 토큰을 일괄 취득이 가능.
- [그외 MCP Server 리스트](https://github.com/modelcontextprotocol/servers) : Reference Servers는 Anthropic이 구현한 MCP 서버, Third-Party Server는 Anthropic 이외에서 구현한 MCP 서버, Community Servers는 대상 서비스와 관련이 없는 사용자가 제공한 수 있는 MCP 서버.

#### 참조 사이트

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction)
- [The Model Context Protocol (MCP) : A guide for AI integration](https://wandb.ai/byyoung3/Generative-AI/reports/The-Model-Context-Protocol-MCP-A-Guide-for-AI-Integration--VmlldzoxMTgzNDgxOQ)
- [Everything Wrong with MCP](https://blog.sshh.io/p/everything-wrong-with-mcp)