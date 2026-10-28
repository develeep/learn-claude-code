# s01: 에이전트 루프 — 루프 하나면 충분합니다

[English](README.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

`s01` → [s02](../s02_tool_use/) → s03 → s04 → ... → s16 → s17
> *"One loop & Bash is all you need"* — 도구 하나와 루프 하나가 모이면 에이전트 하나가 됩니다.
>
> **하네스 레이어**: 루프 — 모델과 현실 세계를 잇는 첫 번째 다리입니다.

---

## 문제

모델에게 "내 디렉터리의 파일 목록을 보여 주고 XXX.py를 실행해 줘"라고 요청한다고 해 봅시다.

모델은 bash 명령을 출력할 수 있습니다. 하지만 출력을 마치면 거기서 멈춥니다. 명령을 스스로 실행하지 않고, 실행 결과를 보고 추론을 이어 가지도 않습니다.

직접 명령을 실행하고, 출력을 대화창에 다시 붙여 넣어 모델이 이어서 답하게 할 수는 있습니다. 다음 명령이 나오면 또 실행하고 또 붙여 넣습니다.

주고받을 때마다 사람이 중간 단계를 맡는 셈입니다. 이 장에서는 이 과정을 자동화합니다.

---

## 해결 방법

![Agent Loop](images/agent-loop.en.svg)

`while True` 루프를 하나 둡니다. 모델이 도구를 호출하면 계속 돌고, 호출하지 않으면 멈춥니다. 루프는 응답의 콘텐츠 블록을 직접 확인합니다.

| 신호 | 의미 | 루프의 동작 |
|--------|---------|-------------|
| `tool_use` 블록이 있음 | 모델이 도구 호출을 요청함 | 실행 → 결과를 다시 넘김 → 계속 |
| `tool_use` 블록이 없음 | 모델이 도구를 호출하지 않음 | 루프 종료 |

---

## 동작 방식

이 과정을 한 단계씩 코드로 옮깁니다.

**1단계**: 사용자의 질문을 첫 메시지로 둡니다.

```python
messages = [{"role": "user", "content": query}]
```

**2단계**: 메시지와 도구 정의를 LLM에 보냅니다.

```python
response = client.messages.create(
    model=MODEL, system=SYSTEM, messages=messages,
    tools=TOOLS, max_tokens=8000,
)
```

**3단계**: 모델의 응답을 메시지에 덧붙이고, 도구를 호출했는지 확인합니다. 도구 호출이 없으면 끝납니다.

```python
messages.append({"role": "assistant", "content": response.content})
tool_calls = [
    block for block in response.content if block.type == "tool_use"
]
if not tool_calls:
    return
```

실제 `tool_use` 블록만 실행 단계로 넘어가므로, 루프가 빈 도구 결과 메시지를 덧붙이는 일은 없습니다.

**4단계**: 모델이 요청한 도구를 실행하고 결과를 모읍니다.

```python
results = []
for block in tool_calls:
    output = run_bash(block.input["command"])
    results.append({
        "type": "tool_result",
        "tool_use_id": block.id,
        "content": output,
    })
```

**5단계**: 도구 결과를 새 메시지로 덧붙이고 2단계로 돌아갑니다.

```python
messages.append({"role": "user", "content": results})
```

전체를 하나의 함수로 합치면 다음과 같습니다.

```python
def agent_loop(messages):
    while True:
        response = client.messages.create(
            model=MODEL, system=SYSTEM, messages=messages,
            tools=TOOLS, max_tokens=8000,
        )
        messages.append({"role": "assistant", "content": response.content})

        tool_calls = [
            block for block in response.content if block.type == "tool_use"
        ]
        if not tool_calls:
            return

        results = []
        for block in tool_calls:
            output = run_bash(block.input["command"])
            results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": output,
            })
        messages.append({"role": "user", "content": results})
```

30줄을 조금 넘는 이 코드가 실행 가능한 가장 작은 에이전트 하네스의 핵심입니다. 이 코드 자체가 지능은 아닙니다. 모델이 계속 행동할 수 있게 해 주는 가장 작은 런타임 틀입니다. 모델은 도구를 호출할지, 어떤 도구를 호출할지 결정하고, 하네스는 도구를 실행해 결과를 새 메시지로 덧붙입니다. 이어지는 16개 장은 모두 이 루프 위에 메커니즘을 더합니다. 루프 자체는 바뀌지 않습니다.

---

## 직접 해 보기

> **안전 주의**: 이 코드는 모델이 만든 셸 명령을 실행합니다. 프로젝트 파일에 영향이 가지 않도록 임시 테스트 디렉터리에서 실행하세요. 권한 제어는 s03에서 추가합니다.

**설정** (처음 실행할 때):

```sh
pip install -r requirements.txt
cp .env.example .env
# Edit .env, fill in ANTHROPIC_API_KEY and MODEL_ID
```

**실행**:

```sh
python s01_agent_loop/code.py
```

다음 프롬프트를 입력해 보세요.

1. `Create a file called hello.py that prints "Hello, World!"`
2. `List all Python files in this directory`
3. `What is the current git branch?`

모델이 언제 도구를 호출해 루프가 이어지고, 언제 호출하지 않아 루프가 끝나는지 살펴보세요.

---

## 다음 장

지금 모델에게는 bash만 있습니다. 파일을 읽으려면 `cat`, 파일을 쓰려면 `echo ... >`, 파일을 찾으려면 `find`를 써야 합니다. 보기에도 번거롭고 실수하기도 쉽습니다.

→ s02 도구 사용: 제대로 된 도구 5개를 주면 어떻게 될까요? 모델이 여러 도구를 한 번에 호출할까요? 병렬로 실행되는 도구끼리 서로 충돌하지는 않을까요?
