# s02: 도구 사용 — 도구 하나를 더하면 한 줄만 더하면 됩니다

[English](README.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

s01 → `s02` → [s03](../s03_permission/) → s04 → ... → s16 → s17
> *"Add a tool, add just one handler"* — 루프는 그대로 둡니다. 새 도구를 디스패치 맵에 등록하면 끝입니다.
>
> **하네스 레이어**: 도구 디스패치 — 모델이 닿을 수 있는 범위를 넓힙니다.

---

## 도구는 bash 하나뿐

s01의 에이전트에게는 도구가 bash 하나뿐입니다. 파일을 읽으려면 `cat`, 쓰려면 `echo "..." > file.py`, 고치려면 `sed`를 씁니다.

모델은 "이 파일을 읽자"라고 생각하지만, 실제로는 `cat path/to/file`이라고 일일이 적어야 합니다. 번역 단계가 하나 더 끼는 셈이고, 토큰을 낭비하며 실수를 부릅니다.

---

## bash로 이미 할 수 있는데 왜 도구를 더할까요?

이 도구들이 에이전트에게 새로운 기본 능력을 주지는 않습니다. 같은 작업은 bash로도 할 수 있습니다. 이 도구들이 개선하는 것은 모델과 하네스 사이의 인터페이스입니다. `path` 인자를 받는 `read_file` 호출을 쓰면 의도를 셸 문법으로 옮길 필요가 없어서, 따옴표나 이스케이프 실수가 줄어듭니다.

하네스 쪽에서도 속을 알 수 없는 명령 문자열 대신 이름 붙은 작업과 구조화된 입력을 보게 됩니다. 그래서 이후의 정책을 더 정밀하게 만들 수 있습니다. s03은 도구별·경로별로 작업을 승인하거나 거부할 수 있고, s04는 공통 훅 지점에서 작업을 기록할 수 있습니다. s02는 이 장들이 기반으로 삼는 디스패치 구조를 마련합니다.

---

## 개요: 도구 디스패치

![Tool Dispatch](images/tool-dispatch.en.svg)

s01의 루프는 그대로 유지됩니다(LLM 호출, `tool_use` 블록 확인, 메시지 덧붙이기 — 한 글자도 바뀌지 않았습니다). 바뀐 것은 도구를 실행하는 그 한 줄뿐입니다. `run_bash()`가 `TOOL_HANDLERS[block.name]()` 디스패치 조회로 바뀝니다.

에이전트에 도구를 하나 더하려면 두 가지만 하면 됩니다.

1. **도구 정의**: `TOOLS` 배열에 항목 하나를 추가합니다
2. **핸들러 등록**: `TOOL_HANDLERS` 딕셔너리에 매핑 하나를 추가합니다

---

## 도구 1개에서 5개로

s01에는 bash만 있었습니다.

```python
TOOLS = [{"name": "bash", ...}]

def run_bash(command): ...
```

s02는 도구를 5개로 늘리고, 각각을 따로 정의합니다.

```python
TOOLS = [
    {"name": "bash",       "description": "Run a shell command.", ...},
    {"name": "read_file",  "description": "Read file contents.",  ...},
    {"name": "write_file", "description": "Write content to file.", ...},
    {"name": "edit_file",  "description": "Replace text in file once.", ...},
    {"name": "glob",       "description": "Find files by pattern.", ...},
]
```

도구마다 자기 구현 함수가 있습니다.

```python
def run_read(path, limit=None):
    lines = safe_path(path).read_text(encoding="utf-8").splitlines()
    if limit:
        lines = lines[:limit]
    return "\n".join(lines)

def run_write(path, content):
    safe_path(path).write_text(content, encoding="utf-8")
    return f"Wrote {len(content)} bytes to {path}"

def run_edit(path, old_text, new_text):
    text = safe_path(path).read_text(encoding="utf-8")
    if old_text not in text:
        return "Error: text not found"
    safe_path(path).write_text(text.replace(old_text, new_text, 1), encoding="utf-8")
    return f"Edited {path}"

def run_glob(pattern):
    import glob as g
    matches = sorted(set(g.glob(
        pattern, root_dir=WORKDIR, recursive=True)))
    shown = matches[:200]
    if len(matches) > 200:
        shown.append("... (more matches omitted; narrow the pattern)")
    return "\n".join(shown)
```

---

## 도구 디스패치

```python
TOOL_HANDLERS = {
    "bash":       run_bash,
    "read_file":  run_read,
    "write_file": run_write,
    "edit_file":  run_edit,
    "glob":       run_glob,
}

# Only one line changed in the loop — from hardcoded run_bash to dispatch lookup:
for block in tool_calls:
    handler = TOOL_HANDLERS[block.name]    # lookup
    output = handler(**block.input)         # call
    results.append(...)
```

도구 하나를 더하는 일 = `TOOLS` 배열에 항목 하나 + `TOOL_HANDLERS` 딕셔너리에 한 줄. 루프는 그대로입니다.

---

## 여러 도구 호출

모델은 tool_use 호출을 한 번에 여러 개 돌려줄 때가 많습니다. 예를 들면 "a.py와 b.py를 읽고, 모든 .py 파일 목록을 보여 줘" 같은 경우입니다.

호출은 `response.content`에 담긴 원래 순서대로 하나씩 실행됩니다.

---

## 한눈에 보기

| 개념 | 한 줄 설명 |
|---------|-----------|
| TOOL_HANDLERS | 도구 이름 → 핸들러 함수 딕셔너리. 도구 하나를 더하려면 매핑 한 줄을 더합니다 |
| 도구 정의 | 모델에게 "내가 할 수 있는 일"을 알려 주는 JSON 스키마 |
| 여러 도구 호출 | 모델이 tool_use를 한 번에 여러 개 돌려줄 수 있으며, 호출은 원래 순서대로 실행됩니다 |
| 루프는 그대로 | s01의 `while True` 루프 — 한 줄도 바뀌지 않았습니다 |

---

## s01에서 바뀐 점

| 구성 요소 | 이전 (s01) | 이후 (s02) |
|-----------|-------------|-------------|
| 도구 수 | 1개 (bash) | 5개 (+read, write, edit, glob) |
| 도구 실행 | 하드코딩된 `run_bash()` | TOOL_HANDLERS 디스패치 조회 |
| 경로 안전 | 없음 | safe_path 검증 (파일 도구만) |
| 루프 | `while True` + `tool_use` 블록 | s01과 동일 |

---

## 직접 해 보기

```sh
cd learn-claude-code
python s02_tool_use/code.py
```

다음 프롬프트를 입력해 보세요.

1. `Read the file README.md and tell me what this project is about`
2. `Create a file called test.py that prints "hello", then read it back`
3. `Find all Python files in this directory`
4. `Read both README.md and requirements.txt, then create a summary file`

모델이 언제 도구를 하나만 호출하고, 언제 여러 개를 한 번에 호출하는지 살펴보세요. 여러 도구 호출이 올바른 순서로 실행되는지도 확인해 보세요.

---

## 다음 장

이제 에이전트에게는 전용 도구 5개가 있습니다. 파일 도구는 `safe_path`로 보호되지만, bash에는 아무 제한이 없습니다. `rm -rf /`도 그대로 실행됩니다.

→ s03 권한: 도구를 실행하기 전에 관문을 둡니다. 이 작업은 안전한가요? 사용자 승인이 필요한가요?
