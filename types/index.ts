export type Group = {
  id: string;
  created_at: string;
  invite_code: string;
};

export type Event = {
  id: string;
  group_id: string;
  title: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  status: "open" | "closed" | "cancelled";
};

export type Participant = {
  id: string;
  event_id: string;
  nickname: string;
  joined_at: string;
};
