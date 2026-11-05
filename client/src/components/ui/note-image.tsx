'use client';

import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { api } from '@/lib/api';

const FILES_PREFIX = '/api/v1/files/';

/** Uploaded note files are stored as `/api/v1/files/<key>` and need the user's token. */
export function isProtectedFileUrl(fileUrl?: string | null): boolean {
  return typeof fileUrl === 'string' && fileUrl.startsWith(FILES_PREFIX);
}

function fileKey(fileUrl: string): string {
  return encodeURIComponent(fileUrl.slice(FILES_PREFIX.length).split(/[?#]/)[0]);
}

/**
 * Turn a stored note `fileUrl` into something the browser can load.
 *
 *  - Static/demo paths (`/notes/x.png`) and absolute URLs are returned unchanged.
 *  - `/api/v1/files/<key>`: `<img>` and `<a>` cannot send the Bearer token, and the path
 *    is relative to the API, not the web app. Ask the API for a short-lived signed URL;
 *    if storage has none (local disk in dev), fetch the bytes with the token and use a
 *    blob URL. Callers must revoke blob URLs (see `useNoteFileUrl`).
 */
export async function resolveNoteFileUrl(fileUrl: string): Promise<{ url: string; isBlob: boolean }> {
  if (!isProtectedFileUrl(fileUrl)) return { url: fileUrl, isBlob: false };
  const key = fileKey(fileUrl);
  const res = await api.get(`/files/${key}/url`);
  const signed: string | null | undefined = res.data?.data?.url;
  if (signed) return { url: signed, isBlob: false };
  const blob = await api.get(`/files/${key}`, { responseType: 'blob' });
  return { url: URL.createObjectURL(blob.data as Blob), isBlob: true };
}

/** React hook: resolved URL for a note file (null while loading or on error). */
export function useNoteFileUrl(fileUrl?: string | null) {
  const [state, setState] = useState<{ url: string | null; error: boolean }>({ url: null, error: false });

  useEffect(() => {
    if (!fileUrl) {
      setState({ url: null, error: false });
      return;
    }
    let cancelled = false;
    let blobUrl: string | null = null;
    setState({ url: null, error: false });
    resolveNoteFileUrl(fileUrl)
      .then(({ url, isBlob }) => {
        if (isBlob) blobUrl = url;
        if (cancelled) {
          if (blobUrl) URL.revokeObjectURL(blobUrl);
          return;
        }
        setState({ url, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ url: null, error: true });
      });
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [fileUrl]);

  return state;
}

type NoteImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { fileUrl: string };

/** `<img>` for a note attachment that works for protected uploads and static demo images. */
export function NoteImage({ fileUrl, alt, className, ...rest }: NoteImageProps) {
  const { url, error } = useNoteFileUrl(fileUrl);
  if (error) {
    return (
      <div className={`flex items-center justify-center p-6 text-xs text-muted-foreground ${className || ''}`}>
        Image unavailable
      </div>
    );
  }
  if (!url) {
    return <div className={`animate-pulse bg-muted/40 min-h-32 w-full ${className || ''}`} aria-busy="true" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} {...rest} />;
}

/** Open a note attachment in a new tab (resolving protected uploads first). */
export async function openNoteFile(fileUrl: string) {
  if (!isProtectedFileUrl(fileUrl)) {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  // Open the tab synchronously (inside the click) so popup blockers allow it.
  const tab = window.open('', '_blank');
  try {
    const { url } = await resolveNoteFileUrl(fileUrl);
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else {
      window.location.href = url;
    }
  } catch {
    tab?.close();
  }
}
