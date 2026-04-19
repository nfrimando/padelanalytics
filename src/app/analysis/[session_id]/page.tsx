import { supabase } from "@/lib/supabase/client";
import { notFound } from "next/navigation";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ session_id: string }>;
}) {
  const { session_id } = await params;
  // Check if session exists
  const { data: session, error } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", session_id)
    .single();

  if (!session || error) {
    notFound();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Hello World</h1>
    </div>
  );
}
