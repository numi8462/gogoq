-- groups: 이름 + 생성자
alter table groups add column if not exists name text;
alter table groups add column if not exists creator_id uuid references auth.users(id) on delete set null;

-- group_members: 로그인 사용자가 "방문/생성"한 그룹 = 참여한 방
create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

alter table group_members enable row level security;

create policy "select own memberships" on group_members
  for select using (auth.uid() = user_id);

create policy "insert own membership" on group_members
  for insert with check (auth.uid() = user_id);

-- groups: 생성자만 이름 수정 가능
-- 주의: groups 테이블에 기존에 켜져 있는 RLS 정책이 있는지 확인 후 실행할 것.
-- RLS가 꺼져 있다면 먼저 `alter table groups enable row level security;`와
-- 기존 select/insert를 허용하는 정책을 함께 만들어야 이 update 정책만 추가했을 때
-- 나머지 동작이 막히지 않는다.
create policy "creator can update group name" on groups
  for update using (auth.uid() = creator_id);
