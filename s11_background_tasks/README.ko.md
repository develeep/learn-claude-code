# s11: 백그라운드 작업 — 느린 작업은 백그라운드로 보냅니다

[English](README.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

s01 → ... → s09 → s10 → `s11` → [s12](../s12_cron_scheduler/) → s13 → ... → s16 → s17

> *"Slow operations go to the background, the Agent Loop continues"* — 백그라운드 스레드가 명령을 실행하고, 완료된 결과는 이후 턴에서 거둬들입니다.
>
> **하네스 레이어**: 백그라운드 — 비동기로 실행해 메인 루프를 막지 않습니다.

---

## 문제

파일을 읽거나 `git status`를 실행하는 일은 대개 금방 끝나므로, 동기로 실행해도 눈에 띄는 지연이 거의 없습니다. 하지만 의존성 설치, 전체 테스트 스위트 실행, 프로젝트 빌드는 몇 분씩 걸리기도 합니다. 명령이 끝날 때까지 하네스는 현재 응답에 있는 다음 도구 호출을 처리하지 못하고, 다음 모델 턴도 시작하지 못합니다.

이후 작업이 그 명령에 의존하지 않는다면 굳이 막아 둘 이유가 없습니다. 예를 들어 전체 테스트 스위트를 시작한 뒤, 테스트가 도는 동안 에이전트가 문서를 살펴보거나 다른 파일을 정리할 수 있습니다.

S11은 느린 Bash 명령을 백그라운드에서 실행해 이 문제를 해결합니다. 에이전트 루프는 계속 돌고, 완료된 결과는 이후 턴에서 거둬들입니다.

---

## 해결 방법

![Background Tasks Overview](images/background-tasks-overview.en.svg)

이 장에서는 느린 작업을 백그라운드 스레드로 보냅니다. 현재 도구 호출은 먼저 자리표시자 `tool_result`를 돌려주므로 에이전트 루프가 계속 진행됩니다. 이후 턴이 시작될 때 완료된 결과를 거둬 알림으로 대화에 추가합니다.

동기 실행과 백그라운드 실행 비교:

| | 동기 (s04) | 백그라운드 (s11) |
|---|---|---|
| 느린 작업 | 현재 도구 호출이 막힘 | 백그라운드 스레드가 실행 |
| 에이전트 루프 | 명령이 끝날 때까지 기다림 | 자리표시자 결과를 받은 뒤 계속 진행 |
| 결과 | 명령이 끝난 뒤 반환 | 먼저 `bg_id`를 반환하고, 결과는 이후 턴에서 거둬들임 |
| 판단 기준 | — | bash의 `run_in_background` 파라미터 |

---

## 동작 방식

### should_run_background: 명시적 요청

모델은 bash 도구의 `run_in_background` 파라미터로 백그라운드 실행을 요청합니다. 이 파라미터를 명시적으로 `true`로 지정한 bash 호출만 이 경로로 들어갑니다. 나머지 호출은 그대로 동기로 실행됩니다.

```python
def should_run_background(tool_name: str, tool_input: dict) -> bool:
    return (
        tool_name == "bash"
        and tool_input.get("run_in_background") is True
    )
```

하네스는 더 이상 `install`, `build`, `test` 같은 키워드로 추측하지 않습니다. 실행 방식은 도구 호출이 명시적으로 고릅니다.

### BackgroundManager: 백그라운드 실행과 생명주기

`BackgroundManager`는 작업 상태와 완료 큐를 관리합니다. `start()`는 작업을 등록하고 데몬 스레드를 띄운 뒤 곧바로 `bg_id`를 반환합니다.

```python
class BackgroundManager:
    def __init__(self):
        self.tasks = {}
        self.results = {}
        self._ready = []
        self._lock = threading.Lock()

    def start(self, block) -> str:
        # Register task, then run _run() in a daemon thread.
        ...

    def _run(self, task_id: str, command: str):
        output, exit_code = _run_bash_process(command)
        status = "completed" if exit_code == 0 else "failed"
        with self._lock:
            self.tasks[task_id]["status"] = status
            self.results[task_id] = _format_bash_result(output, exit_code)
            self._ready.append(task_id)
```

종료 코드가 0이 아니거나 워커에서 예외가 나면 `failed`가 됩니다. 셸은 자체 프로세스 그룹에서 시작합니다. 명령이 끝나거나, 시간 초과가 나거나, 에이전트가 정상 경로 또는 `SIGTERM` 경로로 종료되면 런타임이 그 원래 그룹을 멈춥니다. 이것은 생명주기 정리일 뿐 샌드박스가 아닙니다. 다른 세션을 만드는 프로세스는 그룹을 벗어날 수 있습니다.

### collect_background_results: 알림 수집

이후 턴이 시작될 때 `collect()`는 완료된 결과를 큐에서 꺼내 `<task_notification>` 메시지 형식으로 만듭니다.

```python
def collect_background_results() -> list[str]:
    return BACKGROUND.collect()
```

알림은 원래의 `tool_use_id`를 재사용하지 않습니다. 원래 도구 호출에는 이미 자리표시자 `tool_result`로 답했으므로, 완료된 결과를 거둘 때는 `task_notification` 형식의 독립된 이벤트로 추가합니다. `tool_use` 하나에는 여전히 정확히 `tool_result` 하나가 대응합니다.

### 루프 통합

에이전트 루프는 LLM을 호출하기 전마다 완료된 백그라운드 결과를 거둬들입니다. `execute_tool()`은 동기 실행과 백그라운드 실행 중 하나를 고르기 전에 여전히 메인 스레드에서 `PreToolUse`를 실행합니다.

```python
while True:
    inject_background_results(messages)
    response = client.messages.create(...)

def execute_tool(block) -> str:
    blocked = trigger_hooks("PreToolUse", block)
    if blocked is not None:
        return str(blocked)
    if should_run_background(block.name, block.input):
        task_id = start_background_task(block)
        output = f"[Background task {task_id} started]"
    else:
        output = call_tool(block)
    trigger_hooks("PostToolUse", block, output)
    return output
```

느린 작업은 먼저 `bg_id`가 담긴 자리표시자 tool_result를 돌려줍니다. 완료된 작업이 스스로 에이전트를 깨우지는 않습니다. 다음에 에이전트 루프가 돌 때 `inject_background_results()`가 그 결과를 거둬들입니다.

### 전체 흐름

```
Turn 1:
  LLM → bash "npm install" (run_in_background=true)
  → start_background_task → bg_0001
  → tool_result: "[Background task bg_0001 started]..."
  → LLM: "OK, I'll check later. Let me also read the config."

Turn 2:
  LLM → read_file "package.json" (fast, sync)
  → tool_result: file content

Turn 3:
  → collect bg_0001 as <task_notification>
  → LLM sees: config file + install notification in one message
```

npm install이 백그라운드에서 도는 동안 에이전트 루프는 read_file을 이어서 실행했습니다.

---

## s11에서 추가되는 것

| 구성 요소 | s04 커널 | s11 |
|-----------|-------------|-------------|
| 실행 모델 | 모두 동기 | 느린 작업은 백그라운드 스레드로 + 알림 주입 |
| bash 스키마 | `command` | `command` + `run_in_background` |
| 새 함수 | — | `should_run_background`, `start_background_task`, `collect_background_results`, `inject_background_results` |
| 새 타입 | — | `BackgroundManager` |
| 알림 형식 | — | `<task_notification>` (tool_use_id를 재사용하지 않음) |
| 루프 동작 | 도구를 동기로 실행 | 명시적 백그라운드 실행, 완료된 결과는 이후 턴에서 수집 |
| 도구 | 5개 | 5개 (bash 스키마에 파라미터 하나 추가) |

---

## 직접 해 보기

```sh
cd learn-claude-code
python s11_background_tasks/code.py
```

다음 프롬프트를 입력해 보세요.

1. `Run pip list in the background and find all Python files in this directory`
2. `Run npm install (use run_in_background) and while waiting, read package.json`
3. `Run a short sleep in the background, then list all Markdown files`

살펴볼 점: `run_in_background`를 명시적으로 지정하면 명령이 백그라운드로 디스패치되나요? `bg_id`가 반환되나요? 완료된 결과가 이후 턴에서 `<task_notification>` 형식으로 수집되나요?

---

## 다음 장

백그라운드 작업으로 "느린 작업이 루프를 막지 않게" 하는 문제는 풀었습니다. 그런데 정해진 일정에 맞춰 무언가를 하고 싶다면 어떨까요? "매일 아침 9시에 테스트 실행"이나 "5분마다 서버 상태 확인" 같은 일 말입니다.

s12 크론 스케줄러 → 에이전트에게 알람 시계를 줍니다.
