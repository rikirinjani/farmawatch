import { createClient } from "@/lib/supabase/server";
import { formatDate, getStatusLabel, getStatusBadgeClass } from "@/lib/utils";
import UserManagementClient from "./UserManagementClient";

export default async function AdminPenggunaPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const isSuperAdmin = currentProfile?.role === "superadmin";

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Manajemen Pengguna
      </h1>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Nama
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                  Provinsi
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                  WhatsApp
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Peran
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                  Tanggal Daftar
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users && users.length > 0 ? (
                users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.full_name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email || "-"}</td>
                    <td className="px-4 py-3 text-gray-700 hidden md:table-cell">
                      {u.province}
                    </td>
                    <td className="px-4 py-3 text-gray-700 hidden md:table-cell">
                      {u.whatsapp}
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStatusBadgeClass(u.status)}>
                        {getStatusLabel(u.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-600">
                        {u.role === "superadmin"
                          ? "Super Admin"
                          : u.role === "admin"
                          ? "Admin"
                          : "Pengguna"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <UserManagementClient
                        userId={u.id}
                        currentStatus={u.status}
                        currentRole={u.role}
                        isSuperAdmin={isSuperAdmin}
                        userName={u.full_name}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Tidak ada pengguna terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
