import React from 'react';
import katex from 'katex';

/**
 * Markdown + LaTeX rendering for note cards and the AI-explanation panel.
 *
 * Three bugs this file used to have, all fixed here:
 *
 *  1. `stripMarkdown`'s `_(.*?)_` italic rule ate the `\f` of `\frac`, turning
 *     `\frac{1}{2}` into `rac{1}{2}`. Math spans are now extracted **before**
 *     any emphasis rule runs, and restored afterwards.
 *  2. `stripMarkdown` removed `\(...\)` while `FormattedMarkdown` rendered it, so
 *     the card excerpt and the modal body disagreed. Both now use the same
 *     math handling.
 *  3. The inline regex used a lookbehind (`(?<!\*)`), which is a **SyntaxError**
 *     on Safari < 16.4 and on any non-V8 engine — the module failed to parse and
 *     the whole page went blank. The lookbehind is gone.
 *
 * Math is rendered with KaTeX. The note corpus is full of `\frac`, `\pm` and
 * `\sqrt`, which previously displayed literally.
 */

const MATH_INLINE = '\\(([^\\]*?)\\)';
const MATH_DISPLAY = '\\[([^\\]*?)\\]';

/** Placeholder-protected math segments. */
interface MathSegment {
  token: string;
  tex: string;
  display: boolean;
}

function extractMath(md: string): { text: string; segments: MathSegment[] } {
  const segments: MathSegment[] = [];
  let counter = 0;

  // Display math first — `\[ ... \]` is rarer and more specific.
  const withDisplay = md.replace(/\\\[([\s\S]*?)\\\]/g, (_m, tex: string) => {
    const token = `%%MATH${counter}%%`;
    segments.push({ token, tex, display: true });
    counter++;
    return token;
  });

  const text = withDisplay.replace(/\\\(([\s\S]*?)\\\)/g, (_m, tex: string) => {
    const token = `%%MATH${counter}%%`;
    segments.push({ token, tex, display: false });
    counter++;
    return token;
  });

  return { text, segments };
}

function restoreMath(text: string, segments: MathSegment[]): string {
  let out = text;
  for (const seg of segments) {
    out = out.split(seg.token).join(seg.tex);
  }
  return out;
}

/**
 * Strips markdown symbols for clean snippet previews on note cards.
 *
 * Math is preserved verbatim (the delimiters are removed but the LaTeX body is
 * kept) so a preview of `\frac{1}{2}` does not become `rac{1}{2}`.
 */
export function stripMarkdown(md: string = ''): string {
  if (!md || typeof md !== 'string') return '';

  const { text, segments } = extractMath(md);

  const stripped = text
    .replace(/^#+\s+/gm, '') // Remove #, ##, ### headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
    .replace(/__(.*?)__/g, '$1') // Remove __bold__
    .replace(/\*(.*?)\*/g, '$1') // Remove *italic*
    .replace(/(^|[^\w\\])_(.*?)_(?=$|[^\w])/g, '$1$2') // Remove _italic_ without eating \frac
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Remove inline code / code blocks
    .replace(/^\s*[-*•]\s+/gm, '') // Remove bullet points
    .replace(/^\s*\d+[\.\)]\s+/gm, '') // Remove numbered list prefixes
    .replace(/^\s*>\s+/gm, '') // Remove blockquotes
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links [text](url)
    .replace(/\s+/g, ' ') // Collapse multiple whitespace/newlines
    .trim();

  return restoreMath(stripped, segments);
}

/** Renders a LaTeX segment with KaTeX. Falls back to the raw source on error. */
function renderMath(tex: string, display: boolean, key: string): React.ReactNode {
  try {
    const html = katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      output: 'html',
      strict: 'ignore',
    });
    return (
      <span
        key={key}
        className={display ? 'block my-2 overflow-x-auto text-foreground' : 'inline-block align-middle'}
        // KaTeX output is generated locally from the note body. `trust: false`
        // (the default) means no `\href`/`\url` escapes, so no HTML is injected.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return (
      <span
        key={key}
        className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md bg-primary/10 text-primary font-mono text-[11px] sm:text-xs font-semibold border border-primary/20 align-middle"
      >
        {tex}
      </span>
    );
  }
}

/**
 * Parses inline markdown: bold, italic, code, formulas, links
 */
function renderInlineText(text: string): React.ReactNode[] {
  if (!text) return [];

  // Tokens:
  // 1. Math formulas: \( ... \) or \[ ... \]
  // 2. Inline code: ` ... `
  // 3. Bold: ** ... ** or __ ... __
  // 4. Italic: * ... * or _ ... _
  // 5. Links: [text](url)
  //
  // NOTE: no lookbehind here — `(?<!\*)` is a SyntaxError on older Safari and on
  // any non-V8 engine, which broke the whole page at module-parse time.
  const regex = /(\\\([\s\S]*?\\\)|\\[\s\S]*?\\\]|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\))/g;

  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // 1. Math formula \( ... \) or \[ ... \]
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      return renderMath(part.slice(2, -2).trim(), false, `math-${idx}`);
    }
    if (part.startsWith('\\[') && part.endsWith('\\]')) {
      return renderMath(part.slice(2, -2).trim(), true, `math-${idx}`);
    }

    // 2. Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-[11px] font-bold border border-border"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // 3. Bold: **bold** or __bold__
    if ((part.startsWith('**') && part.endsWith('**') && part.length > 4) ||
        (part.startsWith('__') && part.endsWith('__') && part.length > 4)) {
      return (
        <strong key={idx} className="font-extrabold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // 4. Italic: *italic*
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-foreground/90 font-medium">
          {part.slice(1, -1)}
        </em>
      );
    }

    // 5. Link: [text](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 font-bold"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Regular text
    return <span key={idx}>{part}</span>;
  }).filter(Boolean);
}

interface FormattedMarkdownProps {
  content?: string | null;
  className?: string;
}

export function FormattedMarkdown({ content, className = '' }: FormattedMarkdownProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];

  let currentList: { type: 'ul' | 'ol'; items: { text: string; indent: number }[] } | null = null;

  const flushList = () => {
    if (!currentList || currentList.items.length === 0) return;

    if (currentList.type === 'ul') {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="space-y-2 my-2.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li
              key={idx}
              className={`flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-foreground/90 ${
                item.indent > 0 ? 'ml-5 text-muted-foreground' : ''
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 shadow-2xs" />
              <div className="flex-1 min-w-0">{renderInlineText(item.text)}</div>
            </li>
          ))}
        </ul>
      );
    } else {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="space-y-2 my-2.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li
              key={idx}
              className={`flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-foreground/90 ${
                item.indent > 0 ? 'ml-5' : ''
              }`}
            >
              <span className="min-w-[18px] h-[18px] px-1 rounded bg-muted text-foreground flex items-center justify-center font-extrabold text-[10px] sm:text-[11px] shrink-0 mt-0.5 border border-border/70">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">{renderInlineText(item.text)}</div>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Empty line flushes active lists and acts as vertical spacing
    if (!trimmed) {
      flushList();
      continue;
    }

    // 0. Display math on its own line: \[ ... \]
    if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) {
      flushList();
      blocks.push(
        <div key={`math-block-${blocks.length}`}>
          {renderMath(trimmed.slice(2, -2).trim(), true, `math-block-${blocks.length}`)}
        </div>
      );
      continue;
    }

    // 1. Heading 1: # Title
    if (trimmed.startsWith('# ')) {
      flushList();
      const title = trimmed.slice(2).trim();
      blocks.push(
        <h1
          key={`h1-${blocks.length}`}
          className="text-lg sm:text-2xl font-black tracking-tight text-foreground pb-2 border-b-2 border-primary/30 mt-5 mb-3"
        >
          {renderInlineText(title)}
        </h1>
      );
      continue;
    }

    // 2. Heading 2: ## Subheading
    if (trimmed.startsWith('## ')) {
      flushList();
      const title = trimmed.slice(3).trim();
      blocks.push(
        <h2
          key={`h2-${blocks.length}`}
          className="text-base sm:text-xl font-extrabold tracking-tight text-foreground pb-1.5 border-b border-border/60 mt-4 mb-2.5 flex items-center gap-2"
        >
          <span className="w-1.5 h-4 rounded-full bg-primary inline-block" />
          <span>{renderInlineText(title)}</span>
        </h2>
      );
      continue;
    }

    // 3. Heading 3: ### Section Banner (handles emojis like 📌, 📐, ⚡, 💡, ⚠️, 🎯)
    if (trimmed.startsWith('### ')) {
      flushList();
      const title = trimmed.slice(4).trim();

      // Check thematic styling based on emoji / keywords
      let themeClass = 'bg-primary/10 border-primary/30 text-primary';

      if (title.includes('📌') || title.toLowerCase().includes('concept') || title.includes('সংজ্ঞা')) {
        themeClass = 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300';
      } else if (title.includes('📐') || title.toLowerCase().includes('equation') || title.includes('সূত্র')) {
        themeClass = 'bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300';
      } else if (title.includes('⚡') || title.toLowerCase().includes('law') || title.includes('নিয়ম')) {
        themeClass = 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300';
      } else if (title.includes('💡') || title.toLowerCase().includes('tip') || title.includes('টিপস')) {
        themeClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300';
      } else if (title.includes('⚠️') || title.toLowerCase().includes('exam') || title.includes('প্রশ্ন')) {
        themeClass = 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300';
      }

      blocks.push(
        <div
          key={`h3-${blocks.length}`}
          className={`p-2.5 sm:p-3 rounded-2xl border font-bold text-xs sm:text-sm mt-4 mb-2.5 flex items-center gap-2 shadow-2xs ${themeClass}`}
        >
          <span className="font-extrabold tracking-tight">{renderInlineText(title)}</span>
        </div>
      );
      continue;
    }

    // 4. Heading 4: #### Minor Heading
    if (trimmed.startsWith('#### ')) {
      flushList();
      const title = trimmed.slice(5).trim();
      blocks.push(
        <h4
          key={`h4-${blocks.length}`}
          className="text-xs sm:text-sm font-bold text-foreground mt-3 mb-1.5"
        >
          {renderInlineText(title)}
        </h4>
      );
      continue;
    }

    // 5. Blockquote: > text
    if (trimmed.startsWith('> ')) {
      flushList();
      const text = trimmed.slice(2).trim();
      blocks.push(
        <blockquote
          key={`bq-${blocks.length}`}
          className="border-l-4 border-amber-500/80 bg-amber-500/5 p-3 rounded-r-2xl my-2 text-xs sm:text-sm text-foreground/90 italic font-medium"
        >
          {renderInlineText(text)}
        </blockquote>
      );
      continue;
    }

    // 6. Horizontal separator: --- or ***
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList();
      blocks.push(<hr key={`hr-${blocks.length}`} className="my-3 border-border/70" />);
      continue;
    }

    // 7. Unordered list item: - item or * item
    const ulMatch = rawLine.match(/^(\s*)(?:[-*•])\s+(.+)$/);
    if (ulMatch) {
      const indent = ulMatch[1].length;
      const text = ulMatch[2];

      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push({ text, indent });
      continue;
    }

    // 8. Ordered list item: 1. item or 1) item
    const olMatch = rawLine.match(/^(\s*)(?:\d+[\.\)])\s+(.+)$/);
    if (olMatch) {
      const indent = olMatch[1].length;
      const text = olMatch[2];

      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push({ text, indent });
      continue;
    }

    // 9. Standard paragraph line
    flushList();
    blocks.push(
      <p
        key={`p-${blocks.length}`}
        className="text-xs sm:text-sm leading-relaxed text-foreground/90 my-1.5"
      >
        {renderInlineText(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
}

export default FormattedMarkdown;
