// Korean text for components/visualizations/s07-skill-loading.tsx.
const s07: Record<string, string> = {
  "On-Demand Skill Loading": "필요할 때 스킬 로드",
  "System Prompt": "시스템 프롬프트",
  "always present": "항상 포함",
  "# Available Skills": "# 사용 가능한 스킬",
  // skill summaries
  "Review code for bugs, security, and maintainability": "버그, 보안, 유지보수성 관점에서 코드를 리뷰합니다",
  "Read, create, and modify PDF files": "PDF 파일을 읽고 만들고 수정합니다",
  "Design and build agents for a target domain": "대상 도메인에 맞는 에이전트를 설계하고 만듭니다",
  "Build MCP servers and expose external tools": "MCP 서버를 만들고 외부 도구를 노출합니다",
  // skill content lines
  "# Code Review Skill": "# 코드 리뷰 스킬",
  "1. Inspect the change and its surrounding code": "1. 변경 사항과 주변 코드를 살펴봅니다",
  "2. Prioritize bugs and behavioral regressions": "2. 버그와 동작 회귀를 우선합니다",
  "3. Report missing tests and residual risk": "3. 빠진 테스트와 남은 위험을 보고합니다",
  "# PDF Processing Skill": "# PDF 처리 스킬",
  "1. Choose text extraction or rendered inspection": "1. 텍스트 추출과 렌더링 검사 중 하나를 고릅니다",
  "2. Preserve page order and layout where needed": "2. 필요하면 페이지 순서와 레이아웃을 유지합니다",
  "3. Verify the produced PDF before returning it": "3. 만든 PDF를 돌려주기 전에 확인합니다",
  // user prompts
  "User asks:": "사용자 요청:",
  "Review this change for bugs and regressions.": "이 변경 사항에 버그나 회귀가 있는지 리뷰해 줘.",
  "Extract the tables from this PDF.": "이 PDF에서 표를 추출해 줘.",
  "The Skill tool returns content as a tool_result message. The model sees it in context and follows the instructions. The full file is now part of the message history.":
    "Skill 도구는 내용을 tool_result 메시지로 돌려줍니다. 모델은 컨텍스트에서 이를 보고 지시를 따릅니다. 이제 파일 전체가 메시지 기록의 일부가 됩니다.",
  "CATALOG": "카탈로그",
  "Names and descriptions in the system prompt": "시스템 프롬프트 안의 이름과 설명",
  "FULL CONTENT": "전체 내용",
  "Selected SKILL.md returned by load_skill": "load_skill이 돌려준 선택된 SKILL.md",
  "Loaded": "로드됨",
  // steps
  "Scan the Catalog": "카탈로그 훑기",
  "Startup adds skill names and descriptions to the system prompt.": "시작할 때 스킬 이름과 설명을 시스템 프롬프트에 넣습니다.",
  "A Specialized Task": "전문 작업",
  "The user asks for work covered by one of the listed skills.": "사용자가 목록에 있는 스킬 중 하나가 다루는 작업을 요청합니다.",
  "Load the Skill": "스킬 로드",
  "The full skill instructions are injected as a tool_result, not into the system prompt.": "스킬 지시문 전체가 시스템 프롬프트가 아니라 tool_result로 주입됩니다.",
  "Follow the Instructions": "지시 따르기",
  "The detailed instructions appear as if a tool returned them. The model follows them precisely.": "자세한 지시문이 도구가 돌려준 결과처럼 나타납니다. 모델은 이를 정확히 따릅니다.",
  "Load Another Skill": "다른 스킬 로드",
  "A later task can load a different SKILL.md through the same tool.": "이후 작업에서는 같은 도구로 다른 SKILL.md를 로드할 수 있습니다.",
  "Catalog and Full Content": "카탈로그와 전체 내용",
  "The catalog supports discovery; load_skill returns the selected instructions.": "카탈로그는 스킬을 찾는 데 쓰이고, load_skill은 선택된 지시문을 돌려줍니다.",
};
export default s07;
