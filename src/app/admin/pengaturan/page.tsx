import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";

export default async function AdminPengaturanPage() {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from("ticket_categories")
    .select("*")
    .order("created_at", { ascending: true });

  const { data: rejectionReasons } = await supabase
    .from("rejection_reasons")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan Platform</h1>
      <SettingsClient
        initialCategories={categories || []}
        initialRejectionReasons={rejectionReasons || []}
      />
    </div>
  );
}
