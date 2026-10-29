// Korean text for components/visualizations/s06-subagent.tsx.
const s06: Record<string, string> = {
  "Subagent Context Isolation": "서브에이전트 컨텍스트 격리",
  "Parent agent loop": "부모 에이전트 루프",
  "Subagent loop": "서브에이전트 루프",
  "(fresh)": "(새로 시작)",
  "MESSAGE BOUNDARY": "메시지 경계",
  "not yet started": "아직 시작 안 함",
  "parent receives one task result": "부모는 task 결과 하나만 받음",
  "Preparing final response...": "최종 응답 준비 중...",
  "local messages released": "로컬 메시지 해제됨",
  "task prompt": "작업 프롬프트",
  "summary": "요약",
  // message blocks
  "user: Build login + tests": "user: 로그인과 테스트 만들어 줘",
  "assistant: Planning approach...": "assistant: 접근 방식 계획 중...",
  "tool_result: project structure": "tool_result: 프로젝트 구조",
  "task: Write unit tests for auth": "task: auth 단위 테스트 작성",
  "tool_use: read auth.ts": "tool_use: auth.ts 읽기",
  "tool_use: write test.ts": "tool_use: test.ts 쓰기",
  "final: 3 tests written, all passing": "final: 테스트 3개 작성, 모두 통과",
  // steps
  "Parent Context": "부모 컨텍스트",
  "The parent agent has accumulated messages from the conversation.": "부모 에이전트는 대화에서 메시지를 쌓아 왔습니다.",
  "Run Subagent": "서브에이전트 실행",
  "Task runs a nested agent loop with fresh messages[]. Only the task prompt is passed.": "Task는 새 messages[]로 중첩된 에이전트 루프를 실행합니다. 작업 프롬프트만 전달됩니다.",
  "Independent Work": "독립된 작업",
  "The child has its own context. It doesn't see the parent's history.": "자식은 자기만의 컨텍스트를 가집니다. 부모의 기록은 보지 못합니다.",
  "Final Response": "최종 응답",
  "The subagent finishes with a text response.": "서브에이전트는 텍스트 응답으로 작업을 마칩니다.",
  "Return Final Text": "최종 텍스트 반환",
  "The final text becomes the task tool result in the parent conversation.": "최종 텍스트는 부모 대화에서 task 도구의 결과가 됩니다.",
  "Parent Continues": "부모가 이어서 진행",
  "The parent continues without copying the subagent's intermediate messages.": "부모는 서브에이전트의 중간 메시지를 복사하지 않고 이어서 진행합니다.",
};

export default s06;
