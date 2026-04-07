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

## 🛠 기술 스택

```
Frontend: Next.js 16 (App Router) + TypeScript + TailwindCSS 4
State: Zustand, TanStack Query v5
Backend: Supabase (Auth, DB, Realtime)
Utils: date-fns, lucide-react, nanoid
```

## 🚀 시작하기

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)

### 그룹 초대

- 생성 후 `/invite/[code]` 공유
- 참여 후 닉네임 설정

## 📁 프로젝트 구조

```
app/
├── group/[groupId]/  # 그룹 캘린더 페이지
├── api/groups/       # Supabase API
components/
├── calendar/         # 캘린더 UI
├── event/           # 이벤트 카드/폼
hooks/               # TanStack Query hooks
lib/supabase/        # Supabase 클라이언트
```
