'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Camera, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { FormattedMarkdown } from '@/components/ui/formatted-markdown';

export interface ClassNoteImageDraft {
  file: File;
  title: string;
  textClean: string;
  summary: string;
  processing: boolean;
  error?: string;
  mocked?: boolean;
}

/** Stage a photo and its AI note; the parent saves them only with the class log. */
export function ClassNoteImageUpload({ childId, subject, date, draft, onChange, disabled, isBn }: {
  childId: string | null;
  subject: string;
  date: string;
  draft: ClassNoteImageDraft | null;
  onChange: (draft: ClassNoteImageDraft | null) => void;
  disabled: boolean;
  isBn: boolean;
}) {
  const id = useId();
  const requestId = useRef(0);
  const [preview, setPreview] = useState('');
  const [editing, setEditing] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!draft?.file) { setPreview(''); return; }
    const url = URL.createObjectURL(draft.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [draft?.file]);

  useEffect(() => () => { requestId.current += 1; }, []);

  const generate = async (file: File) => {
    if (!childId || disabled) return;
    const request = ++requestId.current;
    const next: ClassNoteImageDraft = { file, title: '', textClean: '', summary: '', processing: true };
    setValidationError('');
    setEditing(false);
    onChange(next);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('subject', subject);
      form.append('date', date);
      const response = await api.post(`/children/${childId}/notes/ai-make`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const result = response.data?.data;
      if (!result?.aiSummary?.trim()) throw new Error('The AI service did not return a note. Please try again.');
      if (request !== requestId.current) return;
      onChange({ ...next, processing: false, summary: result.aiSummary,
        title: result.title || `${subject} — ${date}`, textClean: result.textClean || '', mocked: !!result.mocked });
    } catch (error: any) {
      if (request !== requestId.current) return;
      onChange({ ...next, processing: false, error: error?.response?.data?.error?.message || error.message
        || (isBn ? 'ছবি থেকে নোট তৈরি করা যায়নি।' : 'Could not generate a note from this image.') });
    }
  };

  const selectImage = (file?: File) => {
    if (!file || disabled) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setValidationError(isBn ? 'সর্বোচ্চ ৫ MB-এর JPEG, PNG, WebP বা GIF ছবি দিন।' : 'Choose a JPEG, PNG, WebP, or GIF image up to 5 MB.');
      return;
    }
    void generate(file);
  };

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-3 space-y-3">
      <div>
        <p className="text-xs font-bold">{isBn ? 'ছবি থেকে AI ক্লাস নোট' : 'AI class notes from an image'}</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {isBn ? 'খাতার বা বোর্ডের ছবি দিন। ক্লাস লগ সংরক্ষণ করলে ছবি ও নোট নোটের পাতাতেও থাকবে।'
            : 'Upload a notebook or board photo. Saving the class log adds both the image and note to the Notes page.'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <label htmlFor={`${id}-upload`} className={`inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-semibold ${disabled ? 'opacity-50' : 'cursor-pointer hover:bg-muted'}`}>
          <Upload className="w-3.5 h-3.5" />{isBn ? 'ছবি আপলোড' : 'Upload image'}
        </label>
        <input id={`${id}-upload`} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only"
          disabled={disabled || !childId} onChange={(event) => { selectImage(event.target.files?.[0]); event.target.value = ''; }} />
        <label htmlFor={`${id}-camera`} className={`inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-semibold ${disabled ? 'opacity-50' : 'cursor-pointer hover:bg-muted'}`}>
          <Camera className="w-3.5 h-3.5" />{isBn ? 'ছবি তুলুন' : 'Take photo'}
        </label>
        <input id={`${id}-camera`} type="file" accept="image/*" capture="environment" className="sr-only"
          disabled={disabled || !childId} onChange={(event) => { selectImage(event.target.files?.[0]); event.target.value = ''; }} />
      </div>
      {validationError && <p role="alert" className="text-xs text-destructive">{validationError}</p>}
      {draft && (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            {preview && <img src={preview} alt={isBn ? 'ক্লাস নোটের ছবি' : 'Class note image preview'} className="h-28 w-28 rounded-xl border object-contain bg-background" />}
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-semibold truncate">{draft.file.name}</p>
              <p className="text-muted-foreground">{(draft.file.size / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
            <Button type="button" variant="ghost" size="icon" disabled={disabled}
              aria-label={isBn ? 'ছবি সরান' : 'Remove image'}
              onClick={() => { requestId.current += 1; onChange(null); setValidationError(''); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          {draft.processing && <p role="status" className="flex items-center gap-2 text-xs text-primary"><Loader2 className="w-4 h-4 animate-spin" />{isBn ? 'ছবি থেকে নোট তৈরি হচ্ছে…' : 'Generating notes from your image…'}</p>}
          {draft.error && <p role="alert" className="text-xs text-destructive">{draft.error}</p>}
          {!draft.processing && (
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => void generate(draft.file)} className="text-xs gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />{isBn ? 'AI দিয়ে আবার তৈরি' : 'Retry AI generation'}
            </Button>
          )}
          {draft.mocked && <p className="text-xs text-amber-700 dark:text-amber-300">{isBn ? 'AI একটি বিকল্প নোট দিয়েছে। সংরক্ষণের আগে মূল ছবির সাথে মিলিয়ে সম্পাদনা করুন।' : 'AI returned fallback content. Review and edit it against the original image before saving.'}</p>}
          {(!!draft.summary || editing) && !draft.processing && (
            <div className="space-y-2">
              <label htmlFor={`${id}-title`} className="text-xs font-semibold">{isBn ? 'নোটের শিরোনাম' : 'Note title'}</label>
              <input id={`${id}-title`} value={draft.title} disabled={disabled} onChange={(event) => onChange({ ...draft, title: event.target.value })}
                className="w-full rounded-xl border bg-background px-3 py-2 text-xs" />
              <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => setEditing(!editing)} className="text-xs">
                {editing ? (isBn ? 'প্রিভিউ' : 'Preview note') : (isBn ? 'নোট সম্পাদনা' : 'Edit generated note')}
              </Button>
              {editing ? <textarea aria-label={isBn ? 'AI নোট সম্পাদনা' : 'Edit AI note'} rows={8} value={draft.summary} disabled={disabled}
                onChange={(event) => onChange({ ...draft, summary: event.target.value })}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm" />
                : <div className="max-h-72 overflow-y-auto rounded-xl border bg-background p-3"><FormattedMarkdown content={draft.summary} /></div>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
