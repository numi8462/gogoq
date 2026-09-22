import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Group } from "@/types";

const supabase = createClient();

export const myGroupKeys = {
  all: (userId: string) => ["my-groups", userId] as const,
};

// 로그인 사용자가 방문/생성해서 group_members에 등록된 그룹 목록
const fetchMyGroups = async (userId: string): Promise<Group[]> => {
  const { data, error } = await supabase
    .from("group_members")
    .select("joined_at, groups(id, created_at, invite_code, name, creator_id)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })
    .returns<{ groups: Group | null }[]>();

  if (error) throw error;

  return (data ?? [])
    .map((row) => row.groups)
    .filter((g): g is Group => !!g);
};

export const useMyGroups = (userId: string | undefined) => {
  return useQuery({
    queryKey: myGroupKeys.all(userId ?? ""),
    queryFn: () => fetchMyGroups(userId!),
    enabled: !!userId,
  });
};

// 로그인 사용자가 그룹 페이지를 방문할 때 "참여한 방"으로 기록 (이미 있으면 무시)
export const recordGroupVisit = async (groupId: string, userId: string) => {
  const { error } = await supabase
    .from("group_members")
    .upsert(
      { group_id: groupId, user_id: userId },
      { onConflict: "group_id,user_id", ignoreDuplicates: true },
    );

  if (error) throw error;
};

const updateGroupName = async ({ id, name }: { id: string; name: string }) => {
  const { data, error } = await supabase
    .from("groups")
    .update({ name })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const useUpdateGroupName = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGroupName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
    },
  });
};
