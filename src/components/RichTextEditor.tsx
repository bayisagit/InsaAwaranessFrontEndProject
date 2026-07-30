import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3, List, ListOrdered, Quote,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Highlighter, Link as LinkIcon, Unlink, RemoveFormatting, Code,
    Minus, Type
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // update link
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const btnClass = (isActive: boolean) =>
        `p-2 rounded hover:bg-muted transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`;

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-card/50 sticky top-0 z-10 rounded-t-xl">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold">
                <Bold className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic">
                <Italic className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Underline">
                <UnderlineIcon className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))} title="Strikethrough">
                <Strikethrough className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={btnClass(editor.isActive('highlight'))} title="Highlight">
                <Highlighter className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-border mx-1"></div>

            <select
                className="bg-transparent border border-border rounded text-sm p-1 mx-1 text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                onChange={(e) => {
                    const size = e.target.value;
                    if (size) {
                        editor.chain().focus().setFontSize(`${size}px`).run();
                    } else {
                        editor.chain().focus().unsetFontSize().run();
                    }
                }}
                defaultValue=""
                title="Font Size"
            >
                <option value="">Size</option>
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="24">24px</option>
                <option value="32">32px</option>
            </select>

            <div className="w-px h-6 bg-border mx-1"></div>

            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Heading 1">
                <Heading1 className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2">
                <Heading2 className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))} title="Heading 3">
                <Heading3 className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-border mx-1"></div>

            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet List">
                <List className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Numbered List">
                <ListOrdered className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Blockquote">
                <Quote className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnClass(editor.isActive('codeBlock'))} title="Code Block">
                <Code className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)} title="Horizontal Rule">
                <Minus className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-border mx-1"></div>

            <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="Align Left">
                <AlignLeft className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="Align Center">
                <AlignCenter className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btnClass(editor.isActive({ textAlign: 'right' }))} title="Align Right">
                <AlignRight className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={btnClass(editor.isActive({ textAlign: 'justify' }))} title="Justify">
                <AlignJustify className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-border mx-1"></div>

            <button type="button" onClick={setLink} className={btnClass(editor.isActive('link'))} title="Insert/Edit Link">
                <LinkIcon className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')} className={`p-2 rounded transition-colors ${!editor.isActive('link') ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'} text-muted-foreground`} title="Remove Link">
                <Unlink className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-border mx-1"></div>

            <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground ml-auto" title="Clear Formatting">
                <RemoveFormatting className="w-4 h-4" />
            </button>
        </div>
    );
};

const editorExtensions = [
    StarterKit.configure({
        link: false,
        underline: false,
    }),
    Underline,
    Highlight,
    TextStyle,
    FontSize,
    TextAlign.configure({
        types: ['heading', 'paragraph'],
    }),
    Link.configure({
        openOnClick: false,
        HTMLAttributes: {
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'text-primary underline cursor-pointer',
        },
    }),
];

export const RichTextEditor = ({ value, onChange, minHeight = "300px" }: RichTextEditorProps) => {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: editorExtensions,
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `tiptap prose prose-sm sm:prose-base prose-neutral dark:prose-invert max-w-none focus:outline-none px-4 py-4 min-h-[${minHeight}]`,
            },
        },
    });

    // Update content if value prop changes from outside (e.g. loading existing data)
    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    return (
        <div className="border border-border rounded-xl bg-card overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
            <MenuBar editor={editor} />
            <div className="max-h-[600px] overflow-y-auto">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
