"use client";

import { useEffect, useMemo, useState } from "react";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Heading3, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@repo/ui/utils/cn";
import { Button } from "#/components/ui/button";
import { Toggle } from "#/components/ui/toggle";
import { SERVICE_DESCRIPTION_MAX_CHARS } from "#/utils/service-description-limit";
import { normalizeServiceDescriptionHtml } from "#/utils/service-description-html";

export type ServiceDescriptionEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxChars?: number;
  "aria-invalid"?: boolean;
};

function preventToolbarFocusSteal(e: React.MouseEvent) {
  e.preventDefault();
}

function ServiceDescriptionToolbar(p: {
  editor: Editor;
  disabled: boolean;
  textLen: number;
  max: number;
  t: ReturnType<typeof useTranslations>;
}) {
  const { editor, disabled, textLen, max, t } = p;

  const formatGroup = (
    <>
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onMouseDown={preventToolbarFocusSteal}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled}
        aria-label={t("toolbar.bold")}
      >
        <Bold className="size-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onMouseDown={preventToolbarFocusSteal}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled}
        aria-label={t("toolbar.italic")}
      >
        <Italic className="size-4" />
      </Toggle>
      <div className="mx-0.5 h-5 w-px bg-slate-200" />
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onMouseDown={preventToolbarFocusSteal}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={disabled}
        aria-label={t("toolbar.heading2")}
      >
        <Heading2 className="size-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 3 })}
        onMouseDown={preventToolbarFocusSteal}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        disabled={disabled}
        aria-label={t("toolbar.heading3")}
      >
        <Heading3 className="size-4" />
      </Toggle>
      <div className="mx-0.5 h-5 w-px bg-slate-200" />
      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onMouseDown={preventToolbarFocusSteal}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        disabled={disabled}
        aria-label={t("toolbar.bulletList")}
      >
        <List className="size-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onMouseDown={preventToolbarFocusSteal}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled}
        aria-label={t("toolbar.orderedList")}
      >
        <ListOrdered className="size-4" />
      </Toggle>
    </>
  );

  const historyGroup = (
    <>
      <div className="mx-0.5 h-5 w-px bg-slate-200" />
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-8"
        onMouseDown={preventToolbarFocusSteal}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        aria-label={t("toolbar.undo")}
      >
        <Undo2 className="size-4" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-8"
        onMouseDown={preventToolbarFocusSteal}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        aria-label={t("toolbar.redo")}
      >
        <Redo2 className="size-4" />
      </Button>
    </>
  );

  const charCount = (
    <span className="ml-auto text-xs tabular-nums text-slate-500">{t("charCount", { current: textLen, max })}</span>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/80 px-2 py-1.5">
      {formatGroup}
      {historyGroup}
      {charCount}
    </div>
  );
}

export function ServiceDescriptionEditor(p: ServiceDescriptionEditorProps) {
  const t = useTranslations("services.descriptionEditor");
  const max = p.maxChars ?? SERVICE_DESCRIPTION_MAX_CHARS;
  const initial = useMemo(() => normalizeServiceDescriptionHtml(p.value), [p.value]);
  const [textLen, setTextLen] = useState(0);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: false,
        hardBreak: false,
      }),
      Placeholder.configure({
        placeholder: p.placeholder ?? "",
      }),
      CharacterCount.configure({
        limit: max,
      }),
    ],
    [max, p.placeholder],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      editable: !p.disabled,
      content: initial,
      editorProps: {
        attributes: {
          class: cn(
            "prose-editor min-h-[140px] px-3 py-2 text-sm leading-relaxed text-slate-900 outline-none",
            p["aria-invalid"] && "rounded-b-xl ring-2 ring-red-500 ring-offset-0",
          ),
        },
        handleDOMEvents: {
          blur: () => {
            p.onBlur?.();
            return false;
          },
        },
      },
      onUpdate: ({ editor: ed }) => {
        setTextLen(ed.getText().length);
        p.onChange(ed.getHTML());
      },
    },
    [extensions],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }
    setTextLen(editor.getText().length);
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(!p.disabled);
  }, [editor, p.disabled]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const next = normalizeServiceDescriptionHtml(p.value);
    const cur = editor.getHTML();
    if (next !== cur) {
      editor.commands.setContent(next, { emitUpdate: false });
      setTextLen(editor.getText().length);
    }
  }, [editor, p.value]);

  const toolbarRow = editor ? (
    <ServiceDescriptionToolbar editor={editor} disabled={!!p.disabled} textLen={textLen} max={max} t={t} />
  ) : null;

  const editorSurface = <EditorContent editor={editor} className="tiptap-root" />;

  const shell = (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-600/30",
        p.disabled && "pointer-events-none opacity-60",
      )}
    >
      {toolbarRow}
      {editorSurface}
    </div>
  );

  return shell;
}
