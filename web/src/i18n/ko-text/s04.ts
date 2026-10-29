// Korean text for components/visualizations/s04-hooks.tsx.
const s04: Record<string, string> = {
  "Hook Workbench": "훅 작업대",
  "The loop stays boring on purpose: it calls ": "루프는 일부러 단순하게 둡니다. 루프는 ",
  ", and the registry decides what extra logic runs.": "만 호출하고, 어떤 추가 로직을 실행할지는 레지스트리가 정합니다.",
  "Hook registry": "훅 레지스트리",
  "This turn": "이번 턴",
  "Audit log": "감사 로그",
  "Beginner rule: adding behavior means registering a callback, not editing the core model-tool-result loop.": "입문자 규칙: 동작을 추가한다는 것은 콜백을 등록하는 것이지, 핵심 모델-도구-결과 루프를 고치는 것이 아닙니다.",
  // HOOKS[].when
  "after input, before LLM": "입력 후, LLM 호출 전",
  "after tool_use, before handler": "tool_use 후, 핸들러 실행 전",
  "after handler, before next turn": "핸들러 실행 후, 다음 턴 전",
  "before final output": "최종 출력 전",
  // STEPS
  "Hooks Are Registered Outside the Loop": "훅은 루프 밖에 등록됩니다",
  "The loop only knows event names; callback behavior lives in the registry.": "루프는 이벤트 이름만 압니다. 콜백 동작은 레지스트리에 있습니다.",
  "Input hooks can log, validate, or inject context before the model sees the prompt.": "입력 훅은 모델이 프롬프트를 보기 전에 기록하거나, 검증하거나, 컨텍스트를 주입할 수 있습니다.",
  "The Core Loop Still Chooses a Tool": "핵심 루프는 여전히 도구를 고릅니다",
  "Calling the model and receiving tool_use remains the same as before.": "모델을 호출하고 tool_use를 받는 과정은 이전과 같습니다.",
  "Permission and logging hooks run before the handler touches the workspace.": "핸들러가 작업 공간을 건드리기 전에 권한 훅과 로깅 훅이 실행됩니다.",
  "Result hooks inspect output or trigger side effects after execution.": "결과 훅은 실행 후 출력을 검사하거나 부수 효과를 일으킵니다.",
  "Cleanup and summary hooks run when the model stops asking for tools.": "모델이 더 이상 도구를 요청하지 않으면 정리 훅과 요약 훅이 실행됩니다.",
  // TurnCard
  "User input": "사용자 입력",
  "Read README.md and summarize it.": "README.md를 읽고 요약해 줘.",
  "LLM chooses tool": "LLM이 도구 선택",
  "Tool waits at pre-hook": "도구가 사전 훅에서 대기",
  "permission_hook + log_hook inspect the call.": "permission_hook + log_hook이 호출을 검사합니다.",
  "Handler returned output": "핸들러가 출력 반환",
  "large_output_hook checks result size.": "large_output_hook이 결과 크기를 확인합니다.",
  "No more tool_use": "더 이상 tool_use 없음",
  "summary_hook records final session stats.": "summary_hook이 최종 세션 통계를 기록합니다.",
  // AuditLog
  "[registry] four hook slots registered": "[registry] 훅 슬롯 4개 등록됨",
  "[UserPromptSubmit] working directory logged": "[UserPromptSubmit] 작업 디렉터리 기록됨",
  "[loop] model returned read_file tool_use": "[loop] 모델이 read_file tool_use 반환",
  "[PreToolUse] permission allowed; tool call logged": "[PreToolUse] 권한 허용됨, 도구 호출 기록됨",
  "[PostToolUse] output size checked": "[PostToolUse] 출력 크기 확인됨",
  "[Stop] session used 1 tool call": "[Stop] 세션에서 도구 호출 1회 사용",
};

export default s04;
