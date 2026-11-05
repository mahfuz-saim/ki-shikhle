'use client';

import { FormattedMarkdown } from '@/components/ui/formatted-markdown';

/** Render the same saved notes in the child and parent class-log views. */
export function ClassLogNotes({ entry, isBn }: { entry: any; isBn: boolean }) {
  const notes = Array.isArray(entry?.linkedNotes) ? [...entry.linkedNotes] : [];
  if (entry?.notes?.trim() && !notes.some((note: any) => note.status === 'class_log')) {
    notes.unshift({ id: `legacy-${entry.id}`, textClean: entry.notes });
  }
  if (!notes.length) return null;
  return (
    <section className="rounded-xl border bg-primary/5 p-3 space-y-3">
      <h4 className="text-xs font-bold text-primary">{isBn ? 'ক্লাস নোট' : 'Class notes'}</h4>
      {notes.map((note: any) => (
        <div key={note.id} className="space-y-1 text-sm break-words">
          {note.title && <p className="text-xs font-semibold">{note.title}</p>}
          <FormattedMarkdown content={note.aiSummary || note.textClean || ''} />
          {note.fileUrl && (
            <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
              {isBn ? 'সংযুক্ত নোট খুলুন' : 'Open attached note'}
            </a>
          )}
        </div>
      ))}
    </section>
  );
}
