export type Group = {
  id: string;
  created_at: string;
  invite_code: string;
  name: string | null;
  creator_id: string | null;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
};

export type EventColor =
  | "blue"
  | "red"
  | "green"
  | "purple"
  | "orange"
  | "gray";

export type Event = {
  id: string;
  group_id: string;
  title: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  status: "open" | "closed" | "cancelled";
  color?: EventColor;
};

export type Participant = {
  id: string;
  event_id: string;
  nickname: string;
  joined_at: string;
};
