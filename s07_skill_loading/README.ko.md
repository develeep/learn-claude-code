# s07: 스킬 로딩 — 필요할 때 스킬을 불러옵니다

[English](README.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

s01 → s02 → s03 → s04 → s05 → s06 → `s07` → [s08](../s08_context_compact/) → s09 → ... → s16 → s17

> 시스템 프롬프트에는 스킬 카탈로그가 들어가고, `load_skill`은 `SKILL.md` 전체를 돌려줍니다.
>
> **하네스 레이어**: 지식 로딩 — 어떤 스킬이 있는지 모델에게 보여 주고, 이름으로 하나를 불러옵니다.

---

## 문제

프로젝트에 React 컴포넌트 규약, SQL 스타일 가이드, API 설계 문서가 있다고 해 봅시다. 에이전트가 개발하면서 이 규칙들을 따르게 하고 싶다면, 가장 직접적인 방법은 전부 시스템 프롬프트에 넣는 것입니다.

```python
SYSTEM = (
    f"You are a coding agent. "
    + open("docs/react-style.md").read()
    + open("docs/sql-style.md").read()
    + open("docs/api-design.md").read()
)
```

이렇게 하면 에이전트가 모든 규약을 읽을 수는 있습니다. 하지만 지금 작업에 필요한 문서 하나만 고르는 대신 세 문서를 모두 시스템 프롬프트에 고정해 버립니다. LLM을 호출할 때마다 세 문서의 전문이 모델에 전달됩니다. 작업이 React 컴포넌트만 고치는 일이라면 관련 있는 것은 React 규약뿐입니다. 그런데도 SQL 스타일 가이드와 API 설계 문서가 입력 토큰을 쓰고, 코드와 대화, 도구 결과가 들어갈 수 있었던 컨텍스트 창 공간을 차지합니다.

---

## 해결 방법

![Skill Overview](images/skill-overview.en.svg)

시작할 때 `SkillLoader`가 `skills/*/SKILL.md`를 훑어 YAML 프런트매터에서 `name`과 `description`을 읽고, 이 카탈로그를 시스템 프롬프트에 넣습니다. 모델은 전체 지침이 필요하면 `load_skill(name)`을 호출합니다. 돌려받은 `SKILL.md`는 `tool_result`로 메시지 목록에 덧붙습니다.

| 내용 | 모델 입력 | 추가 시점 |
|---------|-------------|-------|
| 스킬 이름과 설명 | 시스템 프롬프트 | 시작할 때 |
| `SKILL.md` 전체 | `tool_result` | `load_skill`을 호출할 때 |

---

## 동작 방식

스킬 하나는 `SKILL.md`가 들어 있는 디렉터리 하나입니다.

```text
skills/
  agent-builder/SKILL.md
  code-review/SKILL.md
  mcp-builder/SKILL.md
  pdf/SKILL.md
```

### 스킬 훑기

```python
class SkillLoader:
    def scan(self):
        self.skills.clear()
        skills_root = self.skills_dir.resolve()
        for manifest in sorted(self.skills_dir.glob("*/SKILL.md")):
            if (not manifest.is_file()
                    or not manifest.resolve().is_relative_to(skills_root)):
                continue
            content = manifest.read_text(encoding="utf-8")
            metadata, body = self.parse_frontmatter(content)
            raw_name = metadata.get("name")
            name = raw_name.strip() if isinstance(raw_name, str) else ""
            name = name or manifest.parent.name
            raw_description = metadata.get("description")
            description = (raw_description.strip()
                           if isinstance(raw_description, str) else "")
            description = description or body.split("\n", 1)[0]
            description = " ".join(str(description).lstrip("# ").split())
            self.skills[name] = {
                "name": name,
                "description": description,
                "content": content,
            }
```

`catalog()`는 이름과 설명만 돌려줍니다.

```text
- code-review: Perform thorough code reviews...
- pdf: Process PDF files...
```

### 시스템 프롬프트 만들기

```python
ENVIRONMENT_PROMPT = (
    "Windows: the bash tool runs through cmd.exe; use cmd.exe syntax, not Unix "
    "Bash or PowerShell syntax, and prefer dedicated file tools for file operations"
    if os.name == "nt"
    else "Unix-like: the bash tool runs the system shell"
)

def build_system_prompt() -> str:
    return (
        f"You are a coding agent at {WORKDIR}. Environment: {ENVIRONMENT_PROMPT}. "
        "Use tools to solve tasks. "
        "Act, don't explain.\n\n"
        f"Skills available:\n{SKILL_LOADER.catalog()}\n\n"
        "Use load_skill to read the full instructions when a skill applies."
    )
```

이 함수는 고정된 에이전트 지침과 시작할 때 찾은 카탈로그를 합칩니다.

### 전체 내용 불러오기

```python
def load(self, name: str) -> str:
    skill = self.skills.get(name)
    if skill:
        return skill["content"]
    available = ", ".join(self.skills) or "none"
    return f"Error: Unknown skill '{name}'. Available: {available}"
```

`name`은 시작할 때 만든 등록부에서 찾는 키일 뿐, 파일 경로로 해석하지 않습니다. 도구가 값을 돌려주면 기존 에이전트 루프가 그 내용을 새 `tool_result` 메시지로 덧붙입니다.

---

## 직접 해 보기

```sh
cd learn-claude-code
python s07_skill_loading/code.py
```

다음 프롬프트를 입력해 보세요.

1. `What skills are available?`
2. `Load the code-review skill and follow its instructions`
3. `Review README.md and load the relevant skill first`

시스템 프롬프트에는 카탈로그만 들어 있는지, `load_skill`을 호출한 뒤에야 `SKILL.md` 전체가 나타나는지 확인해 보세요.

---

## 다음 장

도구 호출이 쌓이면 `messages[]`에 예전 파일 내용과 도구 결과가 계속 남습니다.

→ s08 컨텍스트 압축: 예전 메시지를 줄여, 이후 호출에 쓸 컨텍스트를 확보합니다.
