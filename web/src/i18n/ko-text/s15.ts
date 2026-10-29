// Korean text for components/visualizations/s15-integrated-harness.tsx.
const s15: Record<string, string> = {
  // Stages
  "Intake": "수집",
  "request, memory, background notes": "요청, 메모리, 백그라운드 메모",
  "Guardrails": "가드레일",
  "permissions, hooks, policy": "권한, 훅, 정책",
  "Route": "경로 선택",
  "choose the right work surface": "알맞은 작업 공간 선택",
  "Execute": "실행",
  "local tools, teams, task-bound worktrees": "로컬 도구, 팀, 작업에 묶인 worktree",
  "External": "외부",
  "MCP toolboxes return results": "MCP 도구 모음이 결과를 돌려줌",
  "Recover": "복구",
  "retry, compact, repair state": "재시도, 압축, 상태 복구",
  "Append": "덧붙이기",
  "one transcript stays authoritative": "하나의 기록이 기준으로 남음",

  // Surfaces
  "background": "백그라운드",
  "slow commands can finish later": "느린 명령은 나중에 끝나도 됨",
  "team": "팀",
  "teammates work through mailboxes": "팀원은 받은편지함으로 일함",
  "task-bound cwd selects a separate checkout": "작업에 묶인 cwd가 별도 체크아웃을 선택함",
  "external tools are normalized": "외부 도구를 표준 형태로 맞춤",

  // UI labels
  "Integrated Harness Turn": "통합 하네스의 한 턴",
  "One-turn journey": "한 턴의 여정",
  "Turn packet": "턴 패킷",
  "step": "단계",
  "request": "요청",
  "carried context": "함께 실린 컨텍스트",
  "decision": "결정",
  "result": "결과",
  "Source-of-truth transcript": "기준이 되는 기록",

  // Step 1
  "A Turn Starts as a Packet": "턴은 패킷으로 시작합니다",
  "The integrated harness first gathers everything the model should see, instead of scattering context across hidden places.":
    "통합 하네스는 컨텍스트를 보이지 않는 곳에 흩어 두지 않고, 모델이 봐야 할 것을 먼저 모두 모읍니다.",
  "Fix the web lesson visuals and verify the pages.": "웹 강의 시각화를 고치고 페이지를 확인해 줘.",
  "recent messages": "최근 메시지",
  "relevant memory": "관련 메모리",
  "background notes": "백그라운드 메모",
  "build one model-visible input packet": "모델이 볼 입력 패킷 하나를 만듦",
  "ready for a model call": "모델 호출 준비 완료",
  "user request enters": "사용자 요청 도착",
  "memory and notes are attached": "메모리와 메모 첨부됨",

  // Step 2
  "Guardrails Check the Packet": "가드레일이 패킷을 검사합니다",
  "Permissions and hooks are not separate side quests; they are the inspection gate before work happens.":
    "권한과 훅은 따로 노는 곁가지가 아닙니다. 작업이 일어나기 전에 거치는 검사 관문입니다.",
  "Edit files, run build, open browser.": "파일 수정, 빌드 실행, 브라우저 열기.",
  "permission mode": "권한 모드",
  "hook output": "훅 출력",
  "workspace rules": "작업 공간 규칙",
  "allowed work continues; risky work asks first": "허용된 작업은 계속하고, 위험한 작업은 먼저 물어봄",
  "safe action envelope": "안전한 행동 범위",
  "policy checked": "정책 확인됨",
  "allowed actions are visible": "허용된 행동이 보임",

  // Step 3
  "The Agent Picks Work Surfaces": "에이전트가 작업 공간을 고릅니다",
  "The model does not need every mechanism at once. It chooses the smallest surface that matches the job.":
    "모델은 모든 장치가 한꺼번에 필요하지 않습니다. 일에 맞는 가장 작은 작업 공간을 고릅니다.",
  "Search code, patch UI, verify rendered pages.": "코드 검색, UI 수정, 렌더링된 페이지 확인.",
  "available tools": "사용 가능한 도구",
  "team status": "팀 상태",
  "MCP registry": "MCP 레지스트리",
  "local edit first, external tools only when needed": "로컬 수정 먼저, 외부 도구는 필요할 때만",
  "work split into clear lanes": "작업을 명확한 갈래로 나눔",
  "route: code search": "경로: 코드 검색",
  "route: browser check": "경로: 브라우저 확인",
  "route: no teammate needed": "경로: 팀원 불필요",

  // Step 4
  "Work Runs in Bounded Places": "작업은 경계가 있는 곳에서 실행됩니다",
  "Tools, teammates, and worktrees all produce small result cards, so parallel work does not become one unreadable chat log.":
    "도구, 팀원, worktree는 모두 작은 결과 카드를 만들어 내므로, 병렬 작업이 읽을 수 없는 하나의 대화 로그가 되지 않습니다.",
  "Apply the patch and run the build.": "패치를 적용하고 빌드를 실행해.",
  "tool call": "도구 호출",
  "worktree lane": "worktree 갈래",
  "expected output": "예상 출력",
  "execute, then return summarized results": "실행한 뒤 요약된 결과를 돌려줌",
  "local evidence collected": "로컬 근거 수집됨",
  "patch applied": "패치 적용됨",
  "build output summarized": "빌드 출력 요약됨",

  // Step 5
  "External Results Re-enter the Same Lane": "외부 결과도 같은 갈래로 돌아옵니다",
  "MCP tools expand capability, but they still come back as ordinary tool results the agent can reason over.":
    "MCP 도구는 할 수 있는 일을 넓혀 주지만, 결과는 여전히 에이전트가 따져 볼 수 있는 평범한 도구 결과로 돌아옵니다.",
  "Use an external source or tool if local context is missing.": "로컬 컨텍스트가 부족하면 외부 자료나 도구를 써.",
  "MCP tool name": "MCP 도구 이름",
  "structured arguments": "구조화된 인자",
  "returned artifact": "돌려받은 산출물",
  "normalize external output before the next model step": "다음 모델 단계 전에 외부 출력을 표준 형태로 맞춤",
  "outside work is no longer special": "외부 작업도 더는 특별하지 않음",
  "MCP result received": "MCP 결과 수신",
  "result card appended": "결과 카드 덧붙임",

  // Step 6
  "Recovery Keeps the Turn Understandable": "복구가 턴을 이해할 수 있게 유지합니다",
  "Long context, command errors, and retries are handled as named recovery moves, not as mysterious branches.":
    "긴 컨텍스트, 명령 오류, 재시도는 알 수 없는 분기가 아니라 이름 붙은 복구 동작으로 처리합니다.",
  "If context or execution gets messy, repair before continuing.": "컨텍스트나 실행이 꼬이면 계속하기 전에 바로잡아.",
  "error text": "오류 내용",
  "retry count": "재시도 횟수",
  "compact summary": "압축 요약",
  "retry once, compact old detail, keep the reason visible": "한 번 재시도하고, 오래된 내용은 압축하고, 이유는 보이게 둠",
  "the turn remains legible": "턴을 계속 읽을 수 있음",
  "error classified": "오류 분류됨",
  "recovery note added": "복구 메모 추가됨",
  "work resumes": "작업 재개",

  // Step 7
  "Everything Writes Back to One Transcript": "모든 것은 하나의 기록으로 돌아옵니다",
  "The big lesson is boring in the best way: all mechanisms eventually append evidence to the same source of truth.":
    "핵심 교훈은 가장 좋은 의미로 지루합니다. 모든 장치는 결국 같은 기준 기록에 근거를 덧붙입니다.",
  "Report what changed and what was verified.": "무엇이 바뀌었고 무엇을 확인했는지 보고해.",
  "tool evidence": "도구 근거",
  "browser checks": "브라우저 확인 결과",
  "remaining risks": "남은 위험",
  "answer from the transcript, not from memory alone": "기억만이 아니라 기록을 바탕으로 답함",
  "next turn has a clean starting point": "다음 턴이 깔끔하게 출발함",
  "tests pass": "테스트 통과",
  "visual checks recorded": "화면 확인 기록됨",
  "final answer drafted": "최종 답변 초안 작성",
};

export default s15;
