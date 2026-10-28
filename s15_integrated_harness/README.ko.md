# s15: 통합 하네스 — 메커니즘은 여럿, 루프는 하나

[English](README.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

s01 → ... → s13 → [s14](../s14_mcp_plugin/) → `s15` → [s16](../s16_workflow_runtime/) → s17

> *"Many mechanisms, one loop"* — 도구, 권한, 메모리, 작업, 팀, 플러그인이 모두 같은 `while True`에 매달립니다.
>
> **하네스 레이어**: 통합 — 이 예제에서 쓰는 메커니즘을 실행 가능한 시스템 하나로 묶습니다.

---

## 문제

앞 장들은 메커니즘마다 따로 실행 가능한 예제를 두었습니다. 이 장에서는 통합 런타임에 필요한 메커니즘을 서로 연결합니다.

오래 실행되는 코딩 에이전트에는 다음이 한꺼번에 필요합니다.

- 도구 디스패치와 권한 경계
- 훅 확장 지점
- 할 일 계획과 작업 그래프
- 스킬, 메모리, 런타임 시스템 프롬프트 조립
- 압축과 오류 복구
- 백그라운드 작업과 cron 스케줄링
- 팀, 프로토콜, IDLE 상태의 작업 점유
- 작업에 묶인 worktree
- MCP 외부 도구 통합

S15는 또 하나의 독립된 메커니즘을 소개하지 않습니다. 기존 메커니즘이 모델 루프의 어디로 들어오고, 그 이벤트가 어떻게 같은 대화로 돌아오는지 보여 줍니다.

---

## 해결 방법

![System Architecture](images/system-architecture.en.svg)

S15는 새 메커니즘을 도입하지 않습니다. 앞 장의 구성 요소를 통합 하네스 하나로 연결합니다.

```text
user input
  → UserPromptSubmit hooks
  → cron/background notification injection
  → context compact
  → memory + skills + MCP state assemble the system prompt
  → LLM
  → has tool_use block?
      no  → Stop hooks → return
      yes → PreToolUse hooks + permission
          → TOOL_HANDLERS / MCP handlers / background dispatch
          → PostToolUse hooks
          → tool_result / task_notification back to messages
          → next round
```

루프 구조는 그대로입니다. 모델을 호출하고, 응답에 `tool_use` 블록이 있는지 확인하고, 도구를 실행하고, 결과를 `messages`에 덧붙입니다. 도구 실행을 계속할지는 `tool_use` 블록이 있는지로 정해집니다.

---

## 구성 요소별 위치

| 위치 | 구성 요소 | 역할 |
|----------|-----------|------|
| 사용자 입력 주변 | `UserPromptSubmit` 훅 | 사용자 입력을 기록, 주입, 감사 |
| LLM 호출 전 | cron 큐 | 예약된 프롬프트를 `messages`에 주입 |
| LLM 호출 전 | 백그라운드 알림 | 끝난 백그라운드 작업을 `<task_notification>`으로 주입 |
| LLM 호출 전 | 압축 파이프라인 | 큰 출력의 예산 관리, 기록 잘라 내기, 오래된 도구 결과 압축, 필요하면 요약 |
| LLM 호출 전 | 메모리 / 스킬 / MCP 상태 | 모델이 현재 능력과 장기 컨텍스트를 볼 수 있게 시스템 프롬프트 조립 |
| LLM 호출 | 오류 복구 | 429/529 재시도, `max_tokens` 상향, prompt-too-long이면 압축 |
| 도구 실행 전 | `PreToolUse` 훅 + 권한 | 위험한 명령, 범위 밖 쓰기, 파괴적인 MCP 도구 차단 |
| 도구 디스패치 | `assemble_tool_pool` | 내장 도구와 동적 MCP 도구 조립 |
| 도구 실행 중 | 백그라운드 디스패치 | 명시적으로 표시된 bash 작업을 데몬 스레드로 옮기고 자리표시 결과 반환 |
| 도구 실행 후 | `PostToolUse` 훅 | 큰 출력 경고, 로그, 후처리 |
| 루프로 복귀 | tool_result | `tool_use`마다 `tool_result` 하나, 그다음 모델 라운드로 |
| 이번 라운드에 tool_use 없음 / 종료 시 | `Stop` 훅 | 통계, 정리, 감사 |

---

## code.py의 구성

### 도구와 디스패치

내장 도구 풀에는 도구 26개가 있습니다.

```text
bash, read_file, write_file, edit_file, glob
todo_write, task, load_skill, compact
create_task, update_task, list_tasks, get_task, claim_task, complete_task
schedule_cron, list_crons, cancel_cron
spawn_teammate, list_teammates, send_message
request_shutdown, request_plan, review_plan
create_worktree
connect_mcp
```

`assemble_tool_pool()`이 라운드마다 이들을 조립합니다.

```text
BUILTIN_TOOLS + connected MCP tools
BUILTIN_HANDLERS + mcp__server__tool handlers
```

`connect_mcp("docs")`를 호출하면 다음 라운드부터 `mcp__docs__search` 같은 도구가 노출됩니다.

### 권한과 훅

권한은 도구 실행 줄에 하드코딩되어 있지 않습니다. `PreToolUse` 훅입니다.

```python
blocked = trigger_hooks("PreToolUse", block)
if blocked:
    results.append(tool_result(block.id, blocked))
    continue
```

즉 권한, 로그, 감사 로직이 모두 같은 훅 지점에 붙습니다. 리더의 도구, 일회성 서브에이전트의 도구, 팀원의 도구가 모두 `PreToolUse`를 거치고, 허용된 호출은 핸들러가 실행된 뒤 `PostToolUse`를 실행합니다.

정책은 MCP 서버가 스스로 내놓은 설명을 권한 근거로 믿지 않습니다. 호스트가 알려진 읽기 전용 호출만 담은 작고 정확한 허용 목록을 관리하고, 그 밖의 MCP 도구는 모두 사용자에게 묻습니다. 파일 도구는 `WORKDIR` 밖에서 거부되고, bash 명령은 매번 실행 전에 묻습니다. 대화형 승인 프롬프트는 포그라운드의 사용자 턴만 열 수 있습니다. 비동기 턴은 메인 CLI와 stdin을 두고 다투지 않고 닫힌 쪽으로 실패합니다.

### 계획과 작업

S15에는 계획 레이어가 두 개 있습니다.

- `todo_write`: 현재 세션용 가벼운 계획으로, 메모리에 보관
- 작업 그래프: `.tasks/task_*.json` 아래에 두는, 세션을 넘나들고 의존성을 알며 점유할 수 있는 작업 파일

앞의 것은 에이전트 하나가 방향을 잃지 않게 하고, 뒤의 것은 팀 협업을 지원합니다.

둘은 의도를 공유할 뿐 구현은 다릅니다. `todo_write`는 세션 체크리스트 하나를 통째로 바꾸고, 작업 레코드는 안정적인 ID를 가지며 하나씩 생명주기가 갱신됩니다. 아래에 나오는 별도의 `task` 도구는 "격리된 서브에이전트 하나를 디스패치한다"는 뜻이며, 작업 시스템이 아닙니다.

통합 호스트에서도 작업 그래프는 두 단계로 만듭니다. 리더가 먼저 작업 노드를 모두 만든 다음, `create_task`가 돌려준 런타임 ID로 `update_task`를 호출합니다. 팀원은 목록 조회, 점유, 완료 연산만 받으므로, 작업을 나누기 전에 리더가 의존성 구조를 확정합니다.

### 서브에이전트와 팀

S15에는 두 가지 위임 방식이 있습니다.

- `task`: 일회성 서브에이전트입니다. 격리된 `messages[]`를 쓰고, 중간 컨텍스트는 버리고, 최종 요약만 돌려줍니다.
- `spawn_teammate`: 지속되는 팀원 스레드입니다. 준비된 `task_id`를 받으면 런타임이 스레드를 시작하기 전에 그 작업을 점유하고, 받지 않으면 팀원은 IDLE 상태로 나중 작업을 기다릴 수 있습니다. 배정이 없는 팀원은 파일 도구나 Shell 도구를 쓸 수 없습니다. 팀원은 고정된 도구 라운드 상한 없이 `WORK → result → IDLE`을 따릅니다. 모델이나 디스패치가 실패하면 `error`를 내보내고, 스레드 정리 과정에서 끝나지 않은 배정을 작업 보드로 되돌립니다. 모델을 호출하기 전마다 받은편지함을 비우므로, 직접 메시지와 종료 요청이 끊김 없이 이어지는 도구 사용 뒤에서 기다리는 일이 없습니다. 유휴 상태에서는 먼저 `MessageBus` 전달을 기다리고, 대기 시간이 지난 뒤에야 준비된 작업을 훑어 많아야 하나를 원자적으로 점유합니다.

팀원을 띄운 뒤 리더는 모델 루프 안에서 팀원 상태를 거듭 조회하지 않고 현재 턴을 끝냅니다. 리더의 메일함에 팀 이벤트가 들어오면 런타임이 다음 턴을 시작합니다.

일회성 서브에이전트는 컨텍스트 격리를 해결하고, 지속되는 팀원은 오래 걸리는 병렬 협업을 해결합니다.

### 메모리, 스킬, 프롬프트

S15는 s09의 메모리 런타임을 그대로 다시 씁니다. 모델을 호출하기 전마다 `.memory/MEMORY.md` 카탈로그를 읽고, 현재 요청과 관련된 레코드를 골라 그 내용을 `assemble_system_prompt(context)`에 넘깁니다. 턴이 끝나면 `extract_memories()`가 이후 세션에 도움이 될 정보를 남기고, 새 레코드가 저장되면 이어서 `consolidate_memories()`가 실행됩니다.

같은 시스템 프롬프트에는 정체성, 도구 안내, 작업 공간, 스킬 카탈로그, 연결된 MCP 서버도 들어갑니다. 스킬은 카탈로그만 넣고, 전체 내용은 `load_skill(name)`이 필요할 때 불러옵니다.

### 압축과 복구

LLM을 호출하기 전에 S15는 압축 파이프라인을 실행합니다.

```text
tool_result_budget → snip_compact → micro_compact → compact_history
```

`snip_compact`는 메시지 수가 50개에 이르면 전체 기록을 보관한 뒤, 보관 표시를 포함해 메시지 30개를 목표로 중간 부분을 잘라 냅니다. 그러면 다음 보관 기록을 쓰기 전까지 새 메시지가 들어올 여유가 생기지만, 그 대가로 컨텍스트에 바로 남는 최근 메시지는 줄어듭니다. 도구 호출과 결과의 짝은 깨지지 않으므로, 남는 개수가 목표를 조금 넘을 수 있습니다. `micro_compact`는 컨텍스트 한도를 넘었을 때만 실행됩니다. 이미 소비된 오래된 결과를 저장한 다음 복구 경로로 바꾸고, 최근 3개는 온전히 두며, 한도의 80% 근처에서 멈춥니다. 아직 보지 않은 새 결과 자체가 너무 크면, S15는 기록 요약을 고려하기 전에 미리보기와 전체 출력 경로를 남깁니다.

모델 호출은 복구 로직으로 감쌉니다.

- 429: 지수 백오프로 재시도
- 529: 지수 백오프, 실패가 반복되면 선택적으로 대체 모델로 전환
- `max_tokens`: 최대 토큰을 올린 뒤 이어서 쓰도록 요청
- prompt too long: 사후 압축 후 재시도

### 백그라운드와 cron

bash 호출에 `run_in_background=true`가 설정되면 메인 루프는 명령을 기다리지 않고 자리표시 결과를 돌려줍니다.

```text
should_run_background → start_background_task → placeholder tool_result
background done → task_notification → next round injects messages
```

명시적으로 표시된 bash 호출만 백그라운드 경로로 들어갑니다. 종료 코드가 0이 아니거나 워커에서 예외가 나면 `failed` 알림이 만들어집니다. 셸은 저마다 자기 프로세스 그룹에서 실행되고, 명령이나 에이전트 프로세스가 정상 경로나 `SIGTERM` 경로로 끝나면 런타임이 그 그룹을 멈춥니다. 다른 세션을 만드는 프로세스는 그 그룹을 벗어날 수 있습니다.

cron 스케줄러는 데몬 스레드로 돌며 1초에 한 번 확인합니다. 영속적인 일회성 작업은 큐에 들어가기 전에 `pending_delivery`로 저장되고, 그 프롬프트를 담은 모델 호출이 성공할 때까지 그 상태로 남습니다. 호출이 실패하면 큐로 되돌아가고, 재시작하면 다시 큐에 들어갑니다. 따라서 전달은 최소 한 번(at-least-once)입니다. CLI는 `cron_queue`, 리더의 받은편지함, 끝난 백그라운드 작업을 지켜보며, 이 중 어느 것이든 자동 에이전트 턴 하나를 깨울 수 있습니다.

### worktree와 MCP

s13에서 물려받은 작업 단위 worktree 동작이 작업 디렉터리를 관리합니다.

- 대기 중이고 소유자가 없는 작업은 메인 작업 공간에 머물 수도 있고, `create_worktree(name, task_id)`로 별도 브랜치와 디렉터리에 묶일 수도 있습니다
- 생성할 때는 작업, 이름, 경로, 브랜치, Git 레지스트리를 미리 검증합니다. Git 명령이 실패하면 레지스트리와 브랜치 상태에 맞춰 대조하고, 일부만 만들어진 체크아웃은 묶이지 않은 채 수동 복구를 위해 보존합니다
- 유휴 팀원은 준비된 작업 하나를 원자적으로 점유하고, 배정에는 `task_id`와 실제로 쓰는 `cwd`가 함께 기록됩니다
- 리더도 `spawn_teammate`에 준비된 `task_id`를 넘길 수 있으며, 이때 스레드는 점유가 성공한 뒤에야 시작됩니다
- 팀원의 파일 도구는 모두 그 `cwd`를 씁니다. 작업은 소유한 팀원만 완료할 수 있고, 배정은 그 모델 턴이 끝날 때까지 선택된 상태로 남습니다
- 제거는 호스트 쪽 `remove_worktree()` 헬퍼에 남겨 둡니다. 모델은 이를 호출할 수 없습니다. 사용자나 호스트가 먼저 작업 소유권, 배정 임대, 백그라운드 작업, Git 상태를 확인하며, 파괴적인 제거에는 사용자의 별도 확인이 필요합니다

worktree는 도구의 기본 디렉터리를 바꿉니다. 작업 사본을 나눌 뿐 샌드박스가 아니며, 프로세스 그룹 정리로는 다른 세션을 시작한 프로세스를 가둘 수 없습니다. 삭제를 호스트가 맡는 이유가 여기에 있습니다.

작업을 점유하거나 놓으면 배정 버전이 바뀌고 이전 계획 승인은 무효가 됩니다. 일반 `send_message`는 텍스트만 전달하며, 작업의 정체성도 계획 상태도 바꾸지 않습니다.

MCP는 외부 능력을 맡습니다.

- `connect_mcp(name)`이 mock 서버에 연결합니다
- `assemble_tool_pool()`이 MCP 도구를 조립하고, 정규화한 이름이 겹치면 거부합니다
- 도구 이름은 `mcp__server__tool` 형식을 씁니다

---

## s14와 달라진 점

| 범위 | s14 MCP | s15 통합 하네스 |
|-------|---------|-------------------------|
| 내장 도구 | 6 | 25 |
| 외부 도구 | 연결된 MCP 도구 | 같은 동적 MCP 경로와 호스트 정책 |
| 로컬 메커니즘 | S04 도구, 훅, 권한, MCP | 할 일, 서브에이전트, 스킬, 압축, 메모리, 작업 그래프, 백그라운드 bash, cron, 팀, worktree |
| 이벤트 출처 | 사용자 입력과 도구 결과 | 사용자 입력, 도구 결과, cron 프롬프트, 백그라운드 알림, 팀 이벤트 |

---

## 직접 해 보기

```sh
cd learn-claude-code
python s15_integrated_harness/code.py
```

다음 프롬프트를 입력해 보세요.

1. `Inspect this repository and tell me which Python files matter most.`
2. `Search the connected documentation for agent loop guidance.`
3. `Refactor the authentication module and login page in parallel in separate worktrees. Show me each plan before editing.`
4. `Remind me about the meeting in 3 minutes.`
5. `Install the dependencies in the background while you read README.md.`

다음을 살펴보세요.

- 도구 호출마다 훅/권한을 거치는지
- `connect_mcp` 다음 라운드에 MCP 도구가 나타나는지
- `run_in_background=true`인 bash 호출이 백그라운드 자리표시 결과를 돌려주는지
- 시간이 되면 cron이 자동으로 알려 주는지
- 팀원이 계획을 제출하고 승인 전까지 멈추는지
- 유휴 팀원이 준비된 작업을 하나만 원자적으로 점유하는지
- 팀원의 파일 도구가 모두 점유한 작업의 `cwd`로 바뀌는지
- 완료한 뒤에도 그 턴이 끝날 때까지 작업 `cwd`가 유지되다가 IDLE에서 풀리는지

---

## 다음 장

[s16 워크플로 런타임](../s16_workflow_runtime/)은 이 호스트에 `Workflow` 도구를 더합니다. 워크플로는 고정된 오케스트레이션 경로를 코드에 두고 진행 상황을 기록해, 같은 실행을 이어서 재개할 수 있게 합니다.
