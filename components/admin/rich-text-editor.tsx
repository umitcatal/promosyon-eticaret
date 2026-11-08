"use client";

import { useState, type ReactNode } from "react";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Code2,
  Eraser,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
import { EditorImageDialog } from "@/components/admin/editor-image-dialog";

const TEXT_COLORS = [
  "#14130f",
  "#17513e",
  "#8a6a1f",
  "#9b2c2c",
  "#1d4ed8",
  "#6b21a8",
];

const HIGHLIGHT_COLORS = [
  "#f5e7c6",
  "#fde68a",
  "#d9f99d",
  "#bfdbfe",
  "#fecdd3",
  "#e9d5ff",
];

function ToolButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-md px-1.5 text-xs font-semibold transition ${
        active
          ? "bg-orange-600 text-white"
          : "bg-white text-zinc-700 hover:bg-zinc-100"
      } disabled:cursor-not-allowed disabled:opacity-40`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-zinc-300" />;
}

function PopoverButton({
  label,
  active,
  disabled,
  trigger,
  panelClassName = "w-52",
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  trigger: ReactNode;
  panelClassName?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <ToolButton
        active={open || active}
        disabled={disabled}
        label={label}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger}
      </ToolButton>
      {open ? (
        <>
          <button
            aria-hidden
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
            tabIndex={-1}
            type="button"
          />
          <div
            className={`absolute left-0 top-full z-40 mt-1 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg ${panelClassName}`}
          >
            {children(() => setOpen(false))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function TableMenu({ editor, inTable }: { editor: Editor; inTable: boolean }) {
  const itemClass =
    "flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <PopoverButton label="Tablo" trigger={<Table2 size={15} />}>
      {(close) => (
        <div className="space-y-0.5">
          <button
            className={itemClass}
            onClick={() => {
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run();
              close();
            }}
            type="button"
          >
            Tablo ekle (3x3)
          </button>
          <span className="my-1 block h-px bg-zinc-200" />
          <button
            className={itemClass}
            disabled={!inTable}
            onClick={() => {
              editor.chain().focus().addRowBefore().run();
              close();
            }}
            type="button"
          >
            Üstüne satır ekle
          </button>
          <button
            className={itemClass}
            disabled={!inTable}
            onClick={() => {
              editor.chain().focus().addRowAfter().run();
              close();
            }}
            type="button"
          >
            Altına satır ekle
          </button>
          <button
            className={itemClass}
            disabled={!inTable}
            onClick={() => {
              editor.chain().focus().deleteRow().run();
              close();
            }}
            type="button"
          >
            Satırı sil
          </button>
          <span className="my-1 block h-px bg-zinc-200" />
          <button
            className={itemClass}
            disabled={!inTable}
            onClick={() => {
              editor.chain().focus().addColumnBefore().run();
              close();
            }}
            type="button"
          >
            Sola sütun ekle
          </button>
          <button
            className={itemClass}
            disabled={!inTable}
            onClick={() => {
              editor.chain().focus().addColumnAfter().run();
              close();
            }}
            type="button"
          >
            Sağa sütun ekle
          </button>
          <button
            className={itemClass}
            disabled={!inTable}
            onClick={() => {
              editor.chain().focus().deleteColumn().run();
              close();
            }}
            type="button"
          >
            Sütunu sil
          </button>
          <span className="my-1 block h-px bg-zinc-200" />
          <button
            className={itemClass}
            disabled={!inTable}
            onClick={() => {
              editor.chain().focus().toggleHeaderRow().run();
              close();
            }}
            type="button"
          >
            Başlık satırını değiştir
          </button>
          <button
            className={itemClass}
            disabled={!inTable}
            onClick={() => {
              editor.chain().focus().mergeCells().run();
              close();
            }}
            type="button"
          >
            Hücreleri birleştir
          </button>
          <button
            className={itemClass}
            disabled={!inTable}
            onClick={() => {
              editor.chain().focus().splitCell().run();
              close();
            }}
            type="button"
          >
            Hücreyi böl
          </button>
          <span className="my-1 block h-px bg-zinc-200" />
          <button
            className={`${itemClass} text-red-600 hover:bg-red-50`}
            disabled={!inTable}
            onClick={() => {
              editor.chain().focus().deleteTable().run();
              close();
            }}
            type="button"
          >
            Tabloyu sil
          </button>
        </div>
      )}
    </PopoverButton>
  );
}

function EditorToolbar({
  editor,
  onOpenImage,
  onShowSource,
}: {
  editor: Editor;
  onOpenImage: () => void;
  onShowSource: () => void;
}) {
  const ui = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      strike: current.isActive("strike"),
      code: current.isActive("code"),
      highlight: current.isActive("highlight"),
      paragraph: current.isActive("paragraph"),
      h2: current.isActive("heading", { level: 2 }),
      h3: current.isActive("heading", { level: 3 }),
      h4: current.isActive("heading", { level: 4 }),
      bulletList: current.isActive("bulletList"),
      orderedList: current.isActive("orderedList"),
      blockquote: current.isActive("blockquote"),
      link: current.isActive("link"),
      alignLeft: current.isActive({ textAlign: "left" }),
      alignCenter: current.isActive({ textAlign: "center" }),
      alignRight: current.isActive({ textAlign: "right" }),
      alignJustify: current.isActive({ textAlign: "justify" }),
      inTable: current.isActive("table"),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });

  function setLink() {
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
    <div className="relative z-20 flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50 p-2">
      <ToolButton
        active={ui.paragraph}
        label="Paragraf"
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        P
      </ToolButton>
      <ToolButton
        active={ui.h2}
        label="Başlık 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolButton>
      <ToolButton
        active={ui.h3}
        label="Başlık 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolButton>
      <ToolButton
        active={ui.h4}
        label="Başlık 4"
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
      >
        H4
      </ToolButton>

      <Divider />

      <ToolButton
        active={ui.bold}
        label="Kalın"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={15} />
      </ToolButton>
      <ToolButton
        active={ui.italic}
        label="İtalik"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={15} />
      </ToolButton>
      <ToolButton
        active={ui.underline}
        label="Altı çizili"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline size={15} />
      </ToolButton>
      <ToolButton
        active={ui.strike}
        label="Üstü çizili"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={15} />
      </ToolButton>
      <ToolButton
        active={ui.code}
        label="Satır içi kod"
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={15} />
      </ToolButton>

      <PopoverButton
        active={ui.highlight}
        label="Vurgu rengi"
        panelClassName="w-44"
        trigger={<Highlighter size={15} />}
      >
        {(close) => (
          <div>
            <div className="grid grid-cols-6 gap-1.5">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  aria-label={`Vurgu ${color}`}
                  className="h-6 w-6 rounded-full border border-zinc-300 transition hover:scale-110"
                  key={color}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color }).run();
                    close();
                  }}
                  style={{ backgroundColor: color }}
                  title={color}
                  type="button"
                />
              ))}
            </div>
            <button
              className="mt-2 w-full rounded-md px-2 py-1 text-left text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100"
              onClick={() => {
                editor.chain().focus().unsetHighlight().run();
                close();
              }}
              type="button"
            >
              Vurguyu kaldır
            </button>
          </div>
        )}
      </PopoverButton>

      <PopoverButton
        label="Metin rengi"
        panelClassName="w-44"
        trigger={<Palette size={15} />}
      >
        {(close) => (
          <div>
            <div className="grid grid-cols-6 gap-1.5">
              {TEXT_COLORS.map((color) => (
                <button
                  aria-label={`Renk ${color}`}
                  className="h-6 w-6 rounded-full border border-zinc-300 transition hover:scale-110"
                  key={color}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    close();
                  }}
                  style={{ backgroundColor: color }}
                  title={color}
                  type="button"
                />
              ))}
            </div>
            <button
              className="mt-2 w-full rounded-md px-2 py-1 text-left text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100"
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                close();
              }}
              type="button"
            >
              Rengi kaldır
            </button>
          </div>
        )}
      </PopoverButton>

      <ToolButton
        label="Biçimi temizle"
        onClick={() =>
          editor.chain().focus().unsetAllMarks().clearNodes().run()
        }
      >
        <Eraser size={15} />
      </ToolButton>

      <Divider />

      <ToolButton
        active={ui.alignLeft}
        label="Sola hizala"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft size={15} />
      </ToolButton>
      <ToolButton
        active={ui.alignCenter}
        label="Ortala"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter size={15} />
      </ToolButton>
      <ToolButton
        active={ui.alignRight}
        label="Sağa hizala"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight size={15} />
      </ToolButton>
      <ToolButton
        active={ui.alignJustify}
        label="Yasla"
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
      >
        <AlignJustify size={15} />
      </ToolButton>

      <Divider />

      <ToolButton
        active={ui.bulletList}
        label="Madde listesi"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={15} />
      </ToolButton>
      <ToolButton
        active={ui.orderedList}
        label="Numaralı liste"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={15} />
      </ToolButton>
      <ToolButton
        active={ui.blockquote}
        label="Alıntı"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={15} />
      </ToolButton>
      <ToolButton
        label="Yatay çizgi"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus size={15} />
      </ToolButton>

      <Divider />

      <ToolButton active={ui.link} label="Bağlantı" onClick={setLink}>
        <Link2 size={15} />
      </ToolButton>
      <ToolButton
        disabled={!ui.link}
        label="Bağlantıyı kaldır"
        onClick={() =>
          editor.chain().focus().extendMarkRange("link").unsetLink().run()
        }
      >
        <Unlink size={15} />
      </ToolButton>
      <ToolButton label="Görsel ekle" onClick={onOpenImage}>
        <ImagePlus size={15} />
      </ToolButton>
      <TableMenu editor={editor} inTable={ui.inTable} />

      <Divider />

      <ToolButton
        disabled={!ui.canUndo}
        label="Geri al"
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 size={15} />
      </ToolButton>
      <ToolButton
        disabled={!ui.canRedo}
        label="İleri al"
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 size={15} />
      </ToolButton>

      <span className="ml-auto" />
      <ToolButton label="HTML kaynağı" onClick={onShowSource}>
        <Code2 size={15} />
      </ToolButton>
    </div>
  );
}

function EditorStatusBar({ editor }: { editor: Editor }) {
  const stats = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      characters: current.storage.characterCount.characters() as number,
      words: current.storage.characterCount.words() as number,
    }),
  });

  return (
    <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[11px] font-medium text-zinc-500">
      <span>{stats.words} kelime</span>
      <span>{stats.characters} karakter</span>
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
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [imageOpen, setImageOpen] = useState(false);

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
      ImageExtension.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { loading: "lazy", decoding: "async" },
      }),
      TableKit.configure({ table: { resizable: true } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Placeholder.configure({ placeholder: "İçeriğinizi buraya yazın..." }),
      CharacterCount,
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text min-h-56 px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor: current }) => setHtml(current.getHTML()),
  });

  function showSource() {
    if (!editor) return;
    setHtml(editor.getHTML());
    setMode("html");
  }

  function showVisual() {
    if (editor) {
      editor.commands.setContent(html || "<p></p>", { emitUpdate: true });
      setHtml(editor.getHTML());
    }
    setMode("visual");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-300 bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
      {mode === "visual" ? (
        <>
          {editor ? (
            <EditorToolbar
              editor={editor}
              onOpenImage={() => setImageOpen(true)}
              onShowSource={showSource}
            />
          ) : (
            <div className="h-11 border-b border-zinc-200 bg-zinc-50" />
          )}
          <div className="max-h-[65vh] overflow-y-auto">
            <EditorContent editor={editor} />
          </div>
          {editor ? <EditorStatusBar editor={editor} /> : null}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 p-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              HTML kaynağı
            </span>
            <button
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
              onClick={showVisual}
              type="button"
            >
              <Code2 size={14} />
              Görsel düzenleyiciye dön
            </button>
          </div>
          <textarea
            aria-label="HTML kaynağı"
            className="block min-h-56 w-full resize-y bg-white px-4 py-3 font-mono text-xs leading-relaxed text-zinc-900 outline-none"
            onChange={(event) => setHtml(event.target.value)}
            spellCheck={false}
            value={html}
          />
          <p className="border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500">
            Kaynak görünümündeki desteklenmeyen etiketler kayıtta temizlenir.
          </p>
        </>
      )}

      <input name={name} type="hidden" value={html} />

      {imageOpen && editor ? (
        <EditorImageDialog
          editor={editor}
          onClose={() => setImageOpen(false)}
        />
      ) : null}
    </div>
  );
}
