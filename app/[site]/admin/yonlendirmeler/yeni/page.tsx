import { RedirectForm } from "@/components/admin/redirect-form";

export const instant = false;

export const metadata = { title: "Yeni Yönlendirme" };

export default function NewAdminRedirectPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Yeni Yönlendirme</h2>
        <p className="text-sm text-zinc-500">
          Eski bir adresi sitedeki yeni bir adrese bağlayın. Kural kaydedildiği
          anda canlı sitede geçerli olur.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <RedirectForm />
      </div>
    </div>
  );
}
