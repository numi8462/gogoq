# GogoQ - 그룹 일정 관리 캘린더

그룹원들과 함께하는 게임 및 모임 일정을 간편하게 관리할 수 있는 웹 애플리케이션입니다.
복잡한 일정 조율 없이, 한 곳에서 모든 일정을 생성하고 공유할 수 있습니다.

Supabase의 실시간 동기화 기능을 활용해
누군가 일정을 추가하거나 수정하면 모든 사용자에게 즉시 반영되어,
항상 최신 상태의 일정을 유지할 수 있습니다.

## 🎮 기능

- 그룹 생성/초대, 그룹 이름 설정 (생성자만 이름 수정 가능)
- 캘린더 뷰 (일별 이벤트)
- 이벤트 CRUD (생성/참여/모집관리)
- 실시간 참여자 동기화
- 로그인 없이 닉네임만으로 바로 이용하는 게스트 모드
- 이메일/비밀번호 또는 카카오 로그인 (선택 사항 — 게스트 모드와 병행 지원)
- 로그인 시 홈 화면에 참여한 방 목록 표시
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

## 🔐 인증 설계

기존에 닉네임만으로 굴러가던 게스트 플로우를 깨지 않으면서, 그 위에 선택적으로
계정을 얹는 방향으로 설계했습니다. 로그인은 옵션이지 게이트가 아닙니다.

- **NextAuth 등 별도 라이브러리 없이 Supabase Auth만 사용**: 이메일/비밀번호와
  카카오 OAuth 모두 Supabase Auth의 provider 기능으로 처리합니다.
- **게스트 모드는 그대로 유지**: 로그인하지 않아도 기존처럼 닉네임 입력만으로
  그룹 생성/참여/일정 등록이 전부 가능합니다.
- **"참여한 방"은 로그인 시에만 의미**: 로그인 사용자가 그룹을 방문/생성하면
  `group_members` 테이블에 자동으로 기록되고, 홈 화면에 목록으로 노출됩니다.
- **그룹 이름 수정 권한은 생성자로 제한**: `groups.creator_id`(로그인 사용자만
  값이 채워짐)와 로그인 사용자 id를 비교해 본인이 만든 그룹만 이름을 바꿀 수
  있습니다. 게스트가 만든 그룹은 소유자가 없어 이름 수정이 불가능합니다.
- **Auth 에러는 필드 단위로 매핑**: Supabase Auth가 반환하는 `error.code`를
  `lib/authErrors.ts`에서 한글 메시지 + 해당 입력 필드(이메일/비밀번호)로
  매핑해, 어느 칸이 왜 잘못됐는지 바로 보여줍니다.

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

### DB 마이그레이션 · 로그인 설정

로그인/그룹 이름/참여한 방 기능을 쓰려면 아래 작업이 필요합니다 (env 변수가
아니라 Supabase 대시보드에서 직접 설정).

1. `supabase/migrations/0001_auth_and_groups.sql`을 Supabase SQL Editor에서 실행
2. Authentication → Providers → Email의 "Confirm email" 여부 결정
3. 카카오 로그인을 쓰려면 Kakao Developers에서 앱 등록 후 Authentication →
   Providers → Kakao에 REST API 키(Client ID)/Client Secret 입력, Redirect URI로
   `https://<project-ref>.supabase.co/auth/v1/callback` 등록. 이메일 동의항목을
   못 받는 개인 개발자 앱이라면 같은 Provider 설정의 "Allow users without an
   email"을 켜면 됩니다.

이 설정 없이도 게스트 모드(닉네임만으로 그룹 생성/참여)는 그대로 동작합니다.

### 그룹 초대

- 생성 후 `/invite/[code]` 공유
- 게스트는 닉네임 설정 후 바로 참여, 로그인 사용자는 방문 시 "참여한 방"에 자동 기록

## 📁 프로젝트 구조

```
app/
├── group/[groupId]/  # 그룹 캘린더 페이지
├── login/            # 로그인/회원가입 페이지
├── auth/callback/    # 카카오 OAuth 콜백
├── api/groups/       # Supabase API
├── api/chat/         # Claude API 챗봇 Route Handler
├── api/og/           # 공유 미리보기 이미지
components/
├── calendar/         # 캘린더 UI
├── event/            # 이벤트 카드/폼
├── chat/             # 챗봇 위젯 · 확인 카드
├── group/            # 그룹 이름 수정 모달
├── common/           # 버튼/인풋/로고/다크모드 토글/토스트 등 공용 컴포넌트
hooks/                # TanStack Query hooks, useUser(로그인 상태)
lib/supabase/         # Supabase 클라이언트 · 세션 미들웨어
lib/authErrors.ts     # Supabase Auth 에러 → 한글 메시지/필드 매핑
lib/resolveRelativeDate.ts  # 상대 날짜 date-fns 검증 유틸
supabase/migrations/  # 참고용 DB 마이그레이션 SQL
proxy.ts              # 세션 리프레시 (Next.js 16 middleware)
```
