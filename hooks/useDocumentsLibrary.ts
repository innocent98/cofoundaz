'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiErrorInfo } from '@/lib/api/api-error';
import { getFolders, getTrash, listDocuments, listFiles, type FolderTree } from '@/lib/api/documents';
import { docToItem, fileToItem, type LibraryItem } from '@/lib/documents-format';

/** Which slice of the library is showing. A folder is its full path ("Legal/NDAs"). */
export type LibraryView = { kind: 'all' } | { kind: 'uncategorized' } | { kind: 'trash' } | { kind: 'folder'; path: string };

export function viewKey(v: LibraryView): string {
  return v.kind === 'folder' ? `folder:${v.path}` : v.kind;
}

const EMPTY_TREE: FolderTree = { folders: [], uncategorized: 0, trash: 0, total: 0 };

/** Server-filtered library list (search and folder are applied by the API). */
export function useDocumentsLibrary(view: LibraryView, q: string, enabled = true) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [tree, setTree] = useState<FolderTree>(EMPTY_TREE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const key = viewKey(view);

  const reload = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const folder = view.kind === 'folder' ? view.path : undefined;
      const [folders, rows] = await Promise.all([
        getFolders(),
        view.kind === 'trash'
          ? getTrash().then((t) => [...t.documents.map(docToItem), ...t.files.map(fileToItem)])
          : Promise.all([listDocuments({ q, folder }), listFiles({ q, folder })]).then(([d, f]) => [
              ...d.map(docToItem),
              ...f.map(fileToItem),
            ]),
      ]);
      if (mine !== seq.current) return; // a newer request superseded this one
      let list = rows;
      if (view.kind === 'uncategorized') list = rows.filter((r) => !r.folder);
      if (view.kind === 'trash' && q.trim()) {
        const t = q.trim().toLowerCase();
        list = rows.filter((r) => r.title.toLowerCase().includes(t));
      }
      list.sort((a, b) => b.modified.localeCompare(a.modified) || a.title.localeCompare(b.title));
      setTree(folders);
      setItems(list);
      setError(null);
    } catch (err) {
      if (mine !== seq.current) return;
      setError(apiErrorInfo(err, 'Could not load your documents.').message);
    } finally {
      if (mine === seq.current) setLoading(false);
    }
    // key stands in for the view object so an equal view does not refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, q]);

  useEffect(() => {
    if (!enabled) return;
    void (async () => {
      await reload();
    })();
  }, [reload, enabled]);

  return { items, tree, loading, error, reload };
}
