import { createClient } from "@/lib/supabase/server";

export default async function TestPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("groups").select("*");

  return (
    <pre style={{ padding: "2rem" }}>
      {JSON.stringify({ data, error }, null, 2)}
    </pre>
  );
}
