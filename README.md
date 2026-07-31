# GogoQ - 그룹 일정 관리 캘린더

그룹원들과 함께하는 게임 및 모임 일정을 간편하게 관리할 수 있는 웹 애플리케이션입니다.
복잡한 일정 조율 없이, 한 곳에서 모든 일정을 생성하고 공유할 수 있습니다.

Supabase의 실시간 동기화 기능을 활용해
누군가 일정을 추가하거나 수정하면 모든 사용자에게 즉시 반영되어,
항상 최신 상태의 일정을 유지할 수 있습니다.

## 🎮 기능

- 그룹 생성/초대
- 캘린더 뷰 (일별 이벤트)
- 이벤트 CRUD (생성/참여/모집관리)
- 실시간 참여자 동기화
- 닉네임 기반 참여
- **AI 챗봇으로 자연어 일정 생성/수정/삭제** ("다음주 금요일 저녁 8시에 축구하자")
- 다크모드 (시스템 설정 자동 감지 + 수동 토글)

## 🛠 기술 스택

```
Frontend: Next.js 16 (App Router) + TypeScript + TailwindCSS 4
State: Zustand, TanStack Query v5
Backend: Supabase (Auth, DB, Realtime)
AI: Anthropic Claude API (@anthropic-ai/sdk, tool calling)
Utils: date-fns, lucide-react, nanoid
```

## 🤖 AI 활용

일정 관리 챗봇(`app/api/chat`)은 "AI에게 맡기는 부분"과 "코드가 직접 검증하는 부분"을
의도적으로 분리해서 설계했습니다.

- **서버사이드 전용 호출**: Claude API는 Route Handler(`app/api/chat/route.ts`)에서만
  호출하고, API 키는 클라이언트에 절대 노출하지 않습니다.
- **자유 텍스트 파싱 금지, tool calling만 허용**: LLM 응답을 문자열로 파싱하지 않고,
  `create_schedule` / `update_schedule` / `delete_schedule` 세 가지 구조화된 tool
  호출만 신뢰합니다. 텍스트로 "등록했어요" 같은 응답이 와도 실제 처리로 취급하지 않습니다.
- **AI는 제안만, 확정은 사람이**: tool 호출 결과는 바로 DB에 반영되지 않고 확인
  카드로 먼저 보여준 뒤, 사용자가 승인 버튼을 눌러야만 Supabase insert/update/delete가
  일어납니다.
- **상대 날짜는 LLM 단독 판단에 맡기지 않음**: "다음주 금요일" 같은 표현은 LLM이 뽑은
  절대 날짜와 별개로 `lib/resolveRelativeDate.ts`(date-fns 기반)로 다시 계산해
  교차 검증하고, 값이 다르면 date-fns 계산 결과로 보정합니다.
- **수정/삭제 대상 매칭은 컨텍스트 주입으로 해결**: 그룹의 현재 일정 목록을 매 요청마다
  프롬프트에 함께 전달해, LLM이 "그 머더미스터리 일정" 같은 자연어 참조를 실제
  `event_id`로 매칭하게 합니다. 모호하면 추측하지 않고 되묻도록 프롬프트로 강제합니다.
- **모델 선택**: 날짜/시간 추출 같은 단순 구조화 작업에는 최상위 모델이 굳이 필요
  없다고 판단해 비용 효율적인 `claude-haiku-4-5`를 사용합니다. 참여자 여유시간 교집합
  계산(예정된 Phase 4) 같은 순수 로직도 LLM 대신 TS 함수로 처리할 계획입니다 — 정확도와
  비용 두 가지 이유로, LLM은 "계산"이 아니라 "이해/생성"이 필요한 지점에만 씁니다.

## 🚀 시작하기

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)

### 환경 변수 (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```

`ANTHROPIC_API_KEY`가 없으면 캘린더/그룹 기능은 정상 동작하지만 AI 챗봇만 비활성화됩니다.

### 그룹 초대

- 생성 후 `/invite/[code]` 공유
- 참여 후 닉네임 설정

## 📁 프로젝트 구조

```
app/
├── group/[groupId]/  # 그룹 캘린더 페이지
├── api/groups/       # Supabase API
├── api/chat/         # Claude API 챗봇 Route Handler
├── api/og/           # 공유 미리보기 이미지
components/
├── calendar/         # 캘린더 UI
├── event/            # 이벤트 카드/폼
├── chat/             # 챗봇 위젯 · 확인 카드
├── common/           # 버튼/인풋/로고/다크모드 토글 등 공용 컴포넌트
hooks/                # TanStack Query hooks
lib/supabase/         # Supabase 클라이언트
lib/resolveRelativeDate.ts  # 상대 날짜 date-fns 검증 유틸
```
