# s04: 훅 — 루프에 걸어 두고, 루프 안에 쓰지 마세요

[English](README.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

s01 → s02 → s03 → `s04` → [s05](../s05_todo_write/) → s06 → ... → s16 → s17

> *"Hang on the loop, don't write into it"* — 훅은 도구 실행 전후에 확장 로직을 끼워 넣습니다.
>
> **하네스 레이어**: 훅 — 루프를 건드리지 않는 확장 지점입니다.

---

## 문제

s03의 에이전트에는 권한 검사가 있습니다. 하지만 "bash 호출을 모두 기록하기", "파일을 쓴 뒤 자동으로 git add 하기"처럼 검사를 하나 새로 넣을 때마다 `agent_loop` 함수를 고쳐야 합니다.

루프는 금세 이렇게 됩니다.

```python
def agent_loop(messages):
    while True:
        # ... LLM call ...
        for block in response.content:
            if block.type != "tool_use":
                continue
            log_to_file(block)          # added a line
            check_permission(block)     # added a line
            notify_slack(block)         # added another line
            output = execute(block)
            auto_git_add(block)         # yet another line
            # ... the loop is unrecognizable
```

확장하고 싶은 것은 에이전트의 동작인데, 실제로 고치는 것은 루프 자체입니다. 루프는 안정된 핵심으로 남아야 하고, 확장은 바깥에 걸려 있어야 합니다.

---

## 해결 방법

![Hooks Overview](images/hooks-overview.en.svg)

s03의 루프와 권한 로직은 그대로 둡니다. 바뀌는 것은 하나뿐입니다. `check_permission()`을 루프 본문 안에서 꺼내 훅으로 옮깁니다. 이제 루프는 검사 함수를 직접 호출하지 않습니다. 대신 `trigger_hooks("PreToolUse", block)`을 호출하고, 무엇을 실행할지는 레지스트리가 정합니다.

이벤트 4개로 에이전트의 한 사이클 전체를 다룹니다.

| 이벤트 | 발생 시점 | 대표적인 용도 |
|-------|---------------|-------------|
| UserPromptSubmit | 사용자 입력 후, LLM에 들어가기 전 | 입력 검증, 컨텍스트 주입 |
| PreToolUse | 도구 실행 전 | 권한 검사, 로그 기록 |
| PostToolUse | 도구 실행 후 | 부수 효과(자동 git add 등), 출력 검사 |
| Stop | 루프가 끝나려 할 때 | 정리, 루프를 계속할지 결정 |

확장은 `register_hook()`으로 추가합니다. 루프는 `trigger_hooks()`만 호출합니다.

---

## 동작 방식

**훅 레지스트리**: 이벤트 이름을 콜백 목록에 대응시키는 dict입니다.

```python
HOOKS = {
    "UserPromptSubmit": [],
    "PreToolUse": [],
    "PostToolUse": [],
    "Stop": [],
}

def register_hook(event: str, callback):
    HOOKS[event].append(callback)

def trigger_hooks(event: str, *args):
    for callback in HOOKS[event]:
        result = callback(*args)
        if result is not None:   # return value ≠ None → hook says "stop"
            return result
    return None
```

`PreToolUse`가 None이 아닌 값을 반환하면 현재 도구 실행이 막힙니다. `Stop`이 None이 아닌 값을 반환하면 루프가 계속 돕니다. `UserPromptSubmit`과 `PostToolUse`의 반환값은 제어 흐름에 영향을 주지 않습니다.

**UserPromptSubmit**은 사용자 입력 후, LLM에 들어가기 전에 발생합니다. 다음 훅은 현재 작업 디렉터리를 기록합니다.

```python
def context_inject_hook(query: str) -> str | None:
    """Inject current working directory info into every prompt."""
    print(f"\033[90m[HOOK] UserPromptSubmit: working in {WORKDIR}\033[0m")
    return None   # return None = no modification, let prompt through

register_hook("UserPromptSubmit", context_inject_hook)
```

메인 루프에서는 사용자 입력 직후에 발생시킵니다.

```python
query = input("s04 >> ")
trigger_hooks("UserPromptSubmit", query)   # ← before entering LLM
history.append({"role": "user", "content": query})
agent_loop(history)
```

**PreToolUse / PostToolUse**는 도구 실행 전후의 훅입니다. s03의 권한 검사 로직을 이제 PreToolUse 훅으로 감싸고, 로그 훅과 큰 출력 알림 훅을 더합니다.

```python
# PreToolUse: permission check (s03 logic, moved from loop to hook)
def permission_hook(block):
    if block.name == "bash":
        for pattern in DENY_LIST:
            if pattern in block.input.get("command", ""):
                return "Permission denied by deny list"
    if block.name in ("read_file", "write_file", "edit_file"):
        path = block.input.get("path", "")
        if not (WORKDIR / path).resolve().is_relative_to(WORKDIR):
            choice = input("   Allow? [y/N] ").strip().lower()
            if choice not in ("y", "yes"):
                return "Permission denied by user"
    return None

# PreToolUse: logging
def log_hook(block):
    print(f"[HOOK] {block.name}(...)")

# PostToolUse: large output reminder
def large_output_hook(block, output):
    if len(str(output)) > 100000:
        print(f"[HOOK] ⚠ Large output from {block.name}")

register_hook("PreToolUse", permission_hook)
register_hook("PreToolUse", log_hook)
register_hook("PostToolUse", large_output_hook)
```

**Stop**은 루프가 끝나려 할 때 발생합니다. 다음 훅은 정리용 요약을 출력합니다.

```python
def summary_hook(messages: list) -> str | None:
    """Print a summary when the loop is about to stop."""
    tool_count = sum(1 for m in messages
                     for b in (m.get("content") if isinstance(m.get("content"), list) else [])
                     if isinstance(b, dict) and b.get("type") == "tool_result")
    print(f"\033[90m[HOOK] Stop: session used {tool_count} tool calls\033[0m")
    return None   # return None = allow stop, return string = force continuation

register_hook("Stop", summary_hook)
```

agent_loop에서는 종료 직전에 발생시킵니다.

```python
tool_calls = [
    block for block in response.content if block.type == "tool_use"
]
if not tool_calls:
    force = trigger_hooks("Stop", messages)   # ← before exiting
    if force:
        # hook returned a message → inject it and continue
        messages.append({"role": "user", "content": force})
        continue
    return
```

**루프에서 바뀌는 곳은 한 군데뿐입니다**: s03은 `check_permission(block)`을 직접 호출했고, s04는 이를 `trigger_hooks("PreToolUse", block)`으로 바꿉니다.

```python
for block in tool_calls:
    # s03: if not check_permission(block): ...
    # s04: hooks replace hardcoding
    blocked = trigger_hooks("PreToolUse", block)
    if blocked:
        results.append({"type": "tool_result", "tool_use_id": block.id,
                        "content": str(blocked)})
        continue

    handler = TOOL_HANDLERS.get(block.name)
    output = handler(**block.input) if handler else f"Unknown: {block.name}"

    trigger_hooks("PostToolUse", block, output)

    results.append({"type": "tool_result", "tool_use_id": block.id,
                    "content": output})
```

훅 4개가 에이전트 사이클의 핵심 지점인 입력 → 실행 전 → 실행 후 → 종료를 모두 다룹니다. 루프는 trigger_hooks()만 호출하고, 로직은 모두 훅 콜백 안에 있습니다.

---

## s03과 달라진 점

| 구성 요소 | 이전 (s03) | 이후 (s04) |
|-----------|-------------|-------------|
| 확장 방식 | 루프 안에 check_permission()을 하드코딩 | HOOKS 레지스트리 + trigger_hooks() |
| 새 함수 | — | register_hook, trigger_hooks |
| 훅 콜백 | — | context_inject_hook, permission_hook, log_hook, large_output_hook, summary_hook |
| 루프 | check_permission()을 직접 호출 | trigger_hooks("PreToolUse", ...)를 호출 |
| 종료 제어 | 없음 | trigger_hooks("Stop", ...)로 종료를 막을 수 있음 |
| 입력 가로채기 | 없음 | trigger_hooks("UserPromptSubmit", ...)로 컨텍스트를 주입할 수 있음 |

---

## 직접 해 보기

```sh
cd learn-claude-code
python s04_hooks/code.py
```

다음 프롬프트를 입력해 보세요.

1. `Read the file README.md` (바로 통과해야 합니다. 훅 로그를 살펴보세요)
2. `Create a file called test.txt` (파일이 만들어진 뒤 PostToolUse가 발생하는지 살펴보세요)
3. `Delete all temporary files in /tmp` (bash + rm이 권한 훅을 발생시킵니다)

살펴볼 점: 도구를 실행할 때마다 그 전에 `[HOOK]` 로그가 나타나나요? 권한이 거부될 때, 그것을 가로챈 것은 훅인가요, 아니면 루프에 하드코딩된 코드인가요?

---

## 다음 장

이제 에이전트는 작업을 안전하게 실행할 수 있습니다. 그런데 "무엇을 먼저 하고, 그다음에는 무엇을 할까?" 하고 멈춰서 생각한 적이 있을까요? 복잡한 작업이 주어지면 곧바로 뛰어들까요, 아니면 먼저 계획을 세울까요?

→ s05 TodoWrite: 에이전트에게 계획 도구를 줍니다. 먼저 목록을 만들고, 그다음에 실행합니다.
