"use client";

import { deletePageAction } from "@/app/actions/content";

export function DeletePageForm({ pageId }: { pageId: number }) {
  return (
    <form
      action={deletePageAction}
      onSubmit={(event) => {
        if (!window.confirm("Bu sayfa silinsin mi?")) {
          event.preventDefault();
        }
      }}
    >
      <input name="pageId" type="hidden" value={pageId} />
      <button
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        type="submit"
      >
        Sil
      </button>
    </form>
  );
}
