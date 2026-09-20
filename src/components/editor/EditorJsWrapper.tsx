'use client';

import React, { useEffect, useRef, useState } from 'react';
import type EditorJS from '@editorjs/editorjs';
import { editorImageUploader } from './uploader';
import { EditorJsOutput } from '@/types/article';

interface EditorProps {
  initialData?: EditorJsOutput | string;
  onChange?: (data: EditorJsOutput) => void;
  holderId?: string;
  placeholder?: string;
  readOnly?: boolean;
}

export default function EditorJsWrapper({
  initialData,
  onChange,
  holderId = 'editorjs-holder',
  placeholder = 'Write the breaking news story or editorial draft here...',
  readOnly = false,
}: EditorProps) {
  const editorInstance = useRef<EditorJS | null>(null);
  const isMounted = useRef(false);
  const [isReady, setIsReady] = useState(false);

  const onChangeRef = useRef(onChange);
  const initialDataRef = useRef(initialData);
  const placeholderRef = useRef(placeholder);
  const readOnlyRef = useRef(readOnly);

  useEffect(() => {
    onChangeRef.current = onChange;
    initialDataRef.current = initialData;
    placeholderRef.current = placeholder;
    readOnlyRef.current = readOnly;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isDestroyed = false;

    async function initEditor() {
      // Dynamic imports to prevent SSR issues
      const EditorJSModule = (await import('@editorjs/editorjs')).default;
      const Header = (await import('@editorjs/header')).default;
      const ImageTool = (await import('@editorjs/image')).default;
      const List = (await import('@editorjs/list')).default;
      const Quote = (await import('@editorjs/quote')).default;
      const Table = (await import('@editorjs/table')).default;
      const CodeTool = (await import('@editorjs/code')).default;
      const Delimiter = (await import('@editorjs/delimiter')).default;
      const Embed = (await import('@editorjs/embed')).default;
      const Marker = (await import('@editorjs/marker')).default;
      const InlineCode = (await import('@editorjs/inline-code')).default;

      // Parse initial data if passed as string
      let parsedData: EditorJsOutput | undefined = undefined;
      const rawInitial = initialDataRef.current;
      if (typeof rawInitial === 'string' && rawInitial.trim()) {
        try {
          if (rawInitial.startsWith('{') && rawInitial.endsWith('}')) {
            parsedData = JSON.parse(rawInitial);
          } else {
            // Raw text fallback to single paragraph block
            parsedData = {
              blocks: [
                {
                  type: 'paragraph',
                  data: { text: rawInitial },
                },
              ],
            };
          }
        } catch {
          parsedData = {
            blocks: [
              {
                type: 'paragraph',
                data: { text: rawInitial },
              },
            ],
          };
        }
      } else if (rawInitial && typeof rawInitial === 'object') {
        parsedData = rawInitial;
      }

      if (editorInstance.current) {
        try {
          await editorInstance.current.destroy();
          editorInstance.current = null;
        } catch {
          // ignore
        }
      }

      if (isDestroyed) return;

      const editor = new EditorJSModule({
        holder: holderId,
        readOnly: readOnlyRef.current,
        placeholder: placeholderRef.current,
        data: parsedData,
        tools: {
          header: {
            class: Header,
            inlineToolbar: ['marker', 'link', 'bold', 'italic'],
            config: {
              placeholder: 'Enter a heading...',
              levels: [1, 2, 3, 4],
              defaultLevel: 2,
            },
          },
          image: {
            class: ImageTool,
            config: {
              uploader: editorImageUploader,
            },
          },
          list: {
            class: List,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered',
            },
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
            config: {
              quotePlaceholder: 'Enter editorial quote...',
              captionPlaceholder: 'Quote author or citation',
            },
          },
          table: {
            class: Table as unknown as import('@editorjs/editorjs').ToolConstructable,
            inlineToolbar: true,
            config: {
              rows: 2,
              cols: 3,
            },
          },
          code: {
            class: CodeTool,
            config: {
              placeholder: 'Enter code snippet or embed script...',
            },
          },
          delimiter: Delimiter,
          embed: {
            class: Embed,
            config: {
              services: {
                youtube: true,
                twitter: true,
                vimeo: true,
              },
            },
          },
          marker: Marker,
          inlineCode: InlineCode,
        },
        async onChange() {
          if (onChangeRef.current && editorInstance.current) {
            try {
              const output = await editorInstance.current.save();
              onChangeRef.current(output as unknown as EditorJsOutput);
            } catch (err) {
              console.error('EditorJS save error:', err);
            }
          }
        },
        onReady() {
          setIsReady(true);
        },
      });

      editorInstance.current = editor;
    }

    if (!isMounted.current) {
      isMounted.current = true;
      initEditor();
    }

    return () => {
      isDestroyed = true;
      if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
        try {
          editorInstance.current.destroy();
        } catch {
          // ignore
        }
        editorInstance.current = null;
      }
      isMounted.current = false;
    };
  }, [holderId]);

  return (
    <div className="relative min-h-[400px] w-full bg-white dark:bg-zinc-950/40 rounded-xl border border-zinc-200 dark:border-zinc-800/80 p-4 md:p-8 text-zinc-900 dark:text-zinc-100 focus-within:border-amber-500/60 dark:focus-within:border-zinc-700 transition-colors shadow-sm dark:shadow-inner">
      {!isReady && (
        <div className="flex items-center justify-center py-12 text-zinc-500 gap-2 text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <span>Initializing Editorial Studio...</span>
        </div>
      )}
      <div id={holderId} className="editorjs-theme prose dark:prose-invert max-w-none" />
    </div>
  );
}
