"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-orange-600 text-white"
          : "bg-white text-zinc-700 hover:bg-zinc-100"
      } disabled:cursor-not-allowed disabled:opacity-40`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return <div className="h-11 border-b border-zinc-200 bg-zinc-50" />;
  }

  function setLink() {
    if (!editor) return;
    const previous = (editor.getAttributes("link").href as string) ?? "";
    const url = window.prompt("Bağlantı adresi", previous || "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50 p-2">
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        label="H2"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      />
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        label="H3"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      />
      <span className="mx-1 h-5 w-px bg-zinc-300" />
      <ToolbarButton
        active={editor.isActive("bold")}
        label="Kalın"
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        active={editor.isActive("italic")}
        label="İtalik"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        active={editor.isActive("underline")}
        label="Altı çizili"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <span className="mx-1 h-5 w-px bg-zinc-300" />
      <ToolbarButton
        active={editor.isActive("bulletList")}
        label="Madde"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        active={editor.isActive("orderedList")}
        label="Numara"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        active={editor.isActive("blockquote")}
        label="Alıntı"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        active={editor.isActive("link")}
        label="Bağlantı"
        onClick={setLink}
      />
      <span className="mx-1 h-5 w-px bg-zinc-300" />
      <ToolbarButton
        disabled={!editor.can().undo()}
        label="Geri"
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        disabled={!editor.can().redo()}
        label="İleri"
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  );
}

export function RichTextEditor({
  name,
  initialContent,
}: {
  name: string;
  initialContent: string;
}) {
  const [html, setHtml] = useState(initialContent);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "rich-text min-h-56 px-4 py-3 focus:outline-none [&_.ProseMirror-selectednode]:outline-none",
      },
    },
    onUpdate: ({ editor: current }) => setHtml(current.getHTML()),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-300 bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <input name={name} type="hidden" value={html} />
    </div>
  );
}
