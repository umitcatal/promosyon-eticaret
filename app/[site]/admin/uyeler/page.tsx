import { updateUserRoleAction } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata = {
  title: "Üyeler",
};

type UserAdminRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  order_count: number;
  google_id: string | null;
};

export default async function AdminUsersPage() {
  const users = db
    .prepare(
      `SELECT u.*,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
       FROM users u
       ORDER BY u.id DESC
       LIMIT 300`
    )
    .all() as UserAdminRow[];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Üyeler</h2>
        <p className="text-sm text-zinc-500">{users.length} kayıtlı üye</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Üye</th>
              <th className="px-4 py-3 font-semibold">Telefon</th>
              <th className="px-4 py-3 font-semibold">Kayıt</th>
              <th className="px-4 py-3 text-center font-semibold">Sipariş</th>
              <th className="px-4 py-3 font-semibold">Giriş</th>
              <th className="px-4 py-3 font-semibold">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-800">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-zinc-400">{user.email}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {user.phone ?? "-"}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {formatDateTime(user.created_at)}
                </td>
                <td className="px-4 py-3 text-center text-zinc-600">
                  {user.order_count}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
                    {user.google_id ? "Google" : "E-posta"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form
                    action={updateUserRoleAction}
                    className="flex items-center gap-2"
                  >
                    <input name="userId" type="hidden" value={user.id} />
                    <select
                      className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
                      defaultValue={user.role}
                      name="role"
                    >
                      <option value="customer">Müşteri</option>
                      <option value="admin">Yönetici</option>
                    </select>
                    <button
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                      type="submit"
                    >
                      Kaydet
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
