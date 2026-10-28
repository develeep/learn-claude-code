# s14: MCP 도구 — 외부 도구를 발견하고 호출하기

[English](README.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

[s04](../s04_hooks/) → `s14` → [s15](../s15_integrated_harness/) → s16 → s17

> **하네스 레이어**: MCP 도구 — 서비스에 연결하고, 도구를 발견하고, 그 도구를 에이전트 루프에 더합니다.

---

## 문제

앞 장의 기본 도구는 `code.py`에 직접 작성되어 있습니다. `search_docs`, `deploy_status`, `trigger_deploy`를 추가하면 문서 시스템과 배포 플랫폼을 연동할 수는 있습니다. 하지만 서비스가 늘어날 때마다 도구 정의, 매개변수 스키마, 호출 핸들러를 한 벌씩 더 만들어야 합니다.

MCP는 이 책임을 나눕니다. 서버는 도구 목록과 호출 엔드포인트를 제공합니다. 하네스는 서버에 연결하고, 모델에 보일 이름을 붙이고, 권한을 검사한 뒤, 발견한 도구를 모델에 넘깁니다.

---

## 해결 방법

![MCP Architecture](images/mcp-architecture.en.svg)

이 장은 s04의 기본 도구 5개와 훅에서 시작해 세 가지를 더합니다.

- `MCPClient`는 서버가 돌려준 도구 정의와 호출 핸들러를 저장합니다.
- `connect_mcp`는 서버 하나에 연결해 도구 목록을 받아 옵니다.
- `assemble_tool_pool`은 기본 도구와 연결된 모든 서버의 도구를 합칩니다.

`docs`와 `deploy` 서버는 `tools/list`, `tools/call`, 동적 도구 풀을 보여 주기 위해 프로세스 안에 둔 대역입니다. 이 장에서는 실제 MCP 전송 계층을 구현하지 않습니다.

---

## 동작 방식

### 1. 기본 에이전트 루프는 그대로입니다

하네스는 모델을 호출할 때마다 그 전에 현재 도구 풀을 조립합니다.

```python
def agent_loop(messages: list):
    while True:
        tools, handlers = assemble_tool_pool()
        response = client.messages.create(
            model=MODEL,
            system=assemble_system_prompt(),
            messages=messages,
            tools=tools,
            max_tokens=8000,
        )
        ...
```

새 서버가 연결되면 다음 `assemble_tool_pool()` 호출에서 그 서버의 도구가 모델 입력에 더해집니다. 도구 결과는 여전히 `tool_result` 블록으로 메시지에 덧붙습니다.

### 2. MCPClient는 발견 결과와 호출 핸들러를 저장합니다

```python
class MCPClient:
    def register(self, tool_defs, handlers):
        self.tools = list(tool_defs)
        self._handlers = dict(handlers)

    def call_tool(self, tool_name, args):
        handler = self._handlers.get(tool_name)
        if not handler:
            return f"MCP error: unknown tool '{tool_name}'"
        try:
            return str(handler(**args))
        except Exception as error:
            return f"MCP error: {type(error).__name__}: {error}"
```

`register()`는 발견한 도구 목록을, `call_tool()`은 호출 경계를 나타냅니다. 오류가 나도 에이전트 루프를 끝내지 않고 모델에 돌려줍니다.

### 3. connect_mcp는 연결과 발견만 맡습니다

```python
def connect_mcp(name: str) -> str:
    if name in mcp_clients:
        return f"MCP server '{name}' already connected"
    factory = MOCK_SERVERS.get(name)
    if not factory:
        return f"Unknown server '{name}'"
    server = factory()
    mcp_clients[name] = server
    ...
```

처음에 모델에게는 기본 도구 5개와 `connect_mcp`만 보입니다. `connect_mcp(name="docs")`를 호출하면 하네스가 docs 클라이언트를 저장하고, 다음 모델 호출부터는 다음 도구도 보입니다.

```text
mcp__docs__search
mcp__docs__get_version
```

### 4. 접두사로 서버별 도구를 구분합니다

여러 서버가 `search`나 `status`를 똑같이 내놓을 수 있습니다. 그래서 하네스는 다음 형식을 씁니다.

```text
mcp__{server}__{tool}
```

`normalize_mcp_name()`은 모델 도구 이름에 쓸 수 없는 문자를 밑줄로 바꿉니다. 도구 풀을 조립할 때는 정규화한 이름끼리 충돌하는지, 64자 제한을 넘지 않는지도 확인합니다.

```python
prefixed = f"mcp__{safe_server}__{safe_tool}"
if prefixed in origins:
    raise ValueError("MCP tool name collision after normalization")
```

덕분에 `docs.one/get.version`과 `docs_one/get_version`이 아무 경고 없이 같은 이름으로 합쳐지는 일은 없습니다.

### 5. 도구 정의와 핸들러는 함께 풀에 들어갑니다

```python
tools.append({
    "name": prefixed,
    "description": tool_def.get("description", ""),
    "input_schema": schema,
})
handlers[prefixed] = (
    lambda *, client=server, tool=raw_name, **kwargs:
    client.call_tool(tool, kwargs)
)
```

모델은 접두사가 붙은 이름을 봅니다. 핸들러는 서버의 원래 도구 이름으로 `MCPClient`를 호출합니다. 기본 인자로 현재 클라이언트와 도구를 붙잡아 두므로, 모든 lambda가 루프의 마지막 항목을 가리키는 일이 생기지 않습니다.

### 6. 권한은 호스트가 정합니다

MCP 서버는 `readOnlyHint`나 `destructiveHint`를 줄 수 있지만, 이 힌트는 서버가 보낸 것일 뿐 권한 부여가 아닙니다. 이 장에서는 호스트 쪽 정책을 씁니다.

```python
MCP_HOST_POLICY = {
    ("docs", "search"): "allow",
    ("docs", "get_version"): "allow",
    ("deploy", "status"): "allow",
    ("deploy", "trigger"): "confirm",
}
```

`permission_hook()`은 정규화한 도구 이름으로 이 정책을 찾습니다. 정책에 없는 외부 도구는 기본적으로 확인을 거쳐야 합니다. 설명에 `readOnly`가 들어 있다고 해서 그 도구를 신뢰하지는 않습니다.

### 7. 입력 오류는 도구 경계에서 처리합니다

모델이 필수 인자를 빠뜨리거나 서버가 받지 않는 필드를 보낼 수 있습니다. `execute_tool()`과 `MCPClient.call_tool()`은 모두 이런 오류를 잡아 오류 `tool_result`로 돌려줍니다.

```text
MCP error: TypeError: <lambda>() missing 1 required argument: 'query'
```

모델은 학습용 스크립트를 끝내지 않고 다음 턴에 인자를 고칠 수 있습니다.

---

## s04에서 달라진 점

| 구성 요소 | s04 | s14 |
|---|---|---|
| 기본 도구 | 고정된 도구 5개 | 변화 없음 |
| 도구 출처 | `code.py` 안의 정의 | 기본 도구와 발견한 MCP 도구 |
| 도구 풀 | 고정된 `TOOLS` | 매 턴 `assemble_tool_pool()`로 조립 |
| 외부 도구 이름 | 없음 | `mcp__{server}__{tool}` |
| 권한 | 셸·경로 검사 | 호스트 쪽 MCP 정책 추가 |
| MCP 전송 계층 | 없음 | 프로세스 안의 서버 대역으로 경계를 보여 줌 |

이 장에는 Task, Background, Cron, Team, Worktree가 들어 있지 않습니다. 이들은 s15 통합 하네스에서 MCP와 합쳐집니다.

---

## 직접 해 보기

```sh
cd learn-claude-code
python s14_mcp_plugin/code.py
```

다음을 입력합니다.

```text
Connect to the docs server, search for agent hooks, and tell me the current documentation API version.
```

일반적인 도구 호출 흐름은 다음과 같습니다.

```text
connect_mcp(name="docs")
mcp__docs__search(query="agent hooks")
mcp__docs__get_version()
```

이어서 다음을 입력합니다.

```text
Connect to the deploy server and check the web service status. Do not trigger a deployment.
```

`status`는 호스트 정책에 따라 실행되고, `trigger`는 사용자 확인을 거쳐야 합니다.

---

## 다음 장

여기서 MCP는 아직 독립된 갈래입니다. s15 통합 하네스는 기본 도구, 훅, 스킬, 컨텍스트, 메모리, 작업, 백그라운드 작업, cron, 팀, MCP를 하나의 런타임으로 합칩니다.
