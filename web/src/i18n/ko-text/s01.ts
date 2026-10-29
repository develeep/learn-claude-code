// Korean text for components/visualizations/s01-agent-loop.tsx and shared/step-controls.tsx.
const s01: Record<string, string> = {
  "The Agent While-Loop": "에이전트 while 루프",
  "Start": "시작",
  "API Call": "API 호출",
  "Execute Tool": "도구 실행",
  "Append Result": "결과 덧붙이기",
  "Break / Done": "종료 / 완료",
  "[ empty ]": "[ 비어 있음 ]",
  "Fix the login bug": "로그인 버그 고쳐 줘",
  "auth.ts contents...": "auth.ts 내용...",
  "file updated": "파일 수정됨",
  "end_turn: Done!": "end_turn: 완료!",
  "The While Loop": "while 루프",
  "Every agent is a while loop that keeps calling the model until it says 'stop'.": "모든 에이전트는 모델이 '멈춤'이라고 할 때까지 모델을 계속 호출하는 while 루프입니다.",
  "User Input": "사용자 입력",
  "The loop starts when the user sends a message.": "사용자가 메시지를 보내면 루프가 시작됩니다.",
  "Call the Model": "모델 호출",
  "Send all messages to the LLM. It sees everything and decides what to do.": "모든 메시지를 LLM에 보냅니다. LLM은 전체를 보고 무엇을 할지 정합니다.",
  "The model wants to use a tool. The loop continues.": "모델이 도구를 쓰려고 합니다. 루프가 계속됩니다.",
  "Execute & Append": "실행하고 덧붙이기",
  "Run the tool, append the result to messages[]. Feed it back.": "도구를 실행하고 결과를 messages[]에 덧붙여 다시 넘깁니다.",
  "Loop Again": "다시 루프",
  "Same code path, second iteration. The model decides to edit a file.": "같은 코드 경로로 두 번째 반복을 돕니다. 모델이 파일을 수정하기로 합니다.",
  "The model is done. Loop exits. That's the entire agent.": "모델이 작업을 마쳤습니다. 루프가 끝납니다. 에이전트는 이게 전부입니다.",
  // shared/step-controls.tsx
  "Reset": "처음으로",
  "Previous step": "이전 단계",
  "Pause": "일시정지",
  "Auto-play": "자동 재생",
  "Next step": "다음 단계",
};

export default s01;
