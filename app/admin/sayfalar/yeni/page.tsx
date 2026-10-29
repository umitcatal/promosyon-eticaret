import { PageForm } from "@/components/admin/page-form";

export const metadata = {
  title: "Yeni Sayfa",
};

export default async function NewAdminPage(
  props: PageProps<"/admin/sayfalar/yeni">
) {
  const query = await props.searchParams;
  const returnTo =
    typeof query.donus === "string" && query.donus.startsWith("/admin")
      ? query.donus
      : "/admin/sayfalar";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Yeni Sayfa</h2>
        <p className="text-sm text-zinc-500">
          Zengin metin editörüyle sayfa içeriğini oluşturun.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <PageForm returnTo={returnTo} />
      </div>
    </div>
  );
}
