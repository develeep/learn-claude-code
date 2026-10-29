// Korean text for components/visualizations/s02-tool-dispatch.tsx.
const s02: Record<string, string> = {
  "Tool Dispatch Map": "도구 디스패치 맵",
  "Incoming:": "들어온 요청:",
  "waiting for tool_call...": "tool_call 기다리는 중...",
  "All routes active": "모든 경로 활성",
  "Execute shell commands": "셸 명령 실행",
  "Read file contents": "파일 내용 읽기",
  "Create or overwrite a file": "파일 생성 또는 덮어쓰기",
  "Apply targeted edits": "필요한 부분만 수정",
  "The Dispatch Map": "디스패치 맵",
  "A dictionary maps tool names to handler functions. The loop code never changes.": "딕셔너리가 도구 이름을 핸들러 함수에 연결합니다. 루프 코드는 바뀌지 않습니다.",
  "Route: bash": "라우팅: bash",
  "tool_call.name -> handlers['bash'](input). Name-based routing.": "tool_call.name -> handlers['bash'](input). 이름으로 라우팅합니다.",
  "Route: read_file": "라우팅: read_file",
  "Same pattern, different handler. Validate input, execute, return result.": "같은 패턴에 핸들러만 다릅니다. 입력을 검증하고, 실행하고, 결과를 돌려줍니다.",
  "Route: write_file": "라우팅: write_file",
  "Every tool returns a tool_result that goes back into messages[].": "모든 도구는 tool_result를 돌려주고, 이 결과는 messages[]로 다시 들어갑니다.",
  "Route: edit_file": "라우팅: edit_file",
  "Adding a new tool = adding one entry to the dispatch map.": "새 도구 추가 = 디스패치 맵에 항목 하나 추가입니다.",
  "The Key Insight": "핵심 통찰",
  "The while loop stays the same. You only grow the dispatch map. That's it.": "while 루프는 그대로입니다. 디스패치 맵만 늘려 가면 됩니다. 그게 전부입니다.",
};

export default s02;
