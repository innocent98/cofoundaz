import { useState } from 'react';

export type DocumentSubTab = 'Library' | 'Document' | 'Templates' | 'Signatures' | 'Shared';

export interface VersionHistoryItem {
  version: string;
  description: string;
  author: string;
  date: string;
}

export interface SharedUserItem {
  name: string;
  initials: string;
  role: string;
  permission: 'Can comment' | 'Can edit' | 'Can view';
}

export interface LibraryItem {
  id: string;
  title: string;
  type: 'PDF' | 'DOC' | 'XLS' | 'PPT';
  category: string;
  owner: string;
  modified: string;
  status: string;
  aiGenerated?: boolean;
}

export interface SignatureRequestItem {
  title: string;
  meta: string;
  status: 'Awaiting' | 'Complete' | 'Expired';
  actionText: string;
  signers: { name: string; signed: boolean }[];
}

export interface SharedListItem {
  document: string;
  sharedWith: string;
  access: 'View' | 'Edit' | 'Comment';
  lastViewed: string;
}

export interface TemplateCardItem {
  title: string;
  description: string;
  category: 'BUSINESS' | 'FUNDRAISING' | 'FINANCE' | 'OPERATIONS';
  icon: string;
}

const VERSION_HISTORY: VersionHistoryItem[] = [
  { version: 'v4', description: 'Narrowed the non-compete to 12 months, Lagos only.', author: 'Amara', date: '2h ago' },
  { version: 'v3', description: 'Legal advisor comments applied.', author: 'Tayo N.', date: 'Yesterday' },
  { version: 'v2', description: 'AI contract review findings addressed.', author: 'Amara', date: '3d ago' },
  { version: 'v1', description: 'Created from the contractor agreement template.', author: 'Amara', date: '5d ago' },
];

const SHARED_USERS: SharedUserItem[] = [
  { name: 'Tayo Nwachukwu', initials: 'TN', role: 'legal advisor', permission: 'Can comment' },
  { name: 'Daniel Kariuki', initials: 'DK', role: 'co-founder', permission: 'Can edit' },
  { name: 'Grace Adeyemi', initials: 'GA', role: 'accountant', permission: 'Can view' },
];

const LIBRARY_DOCS: LibraryItem[] = [
  { id: '1', title: 'Contractor agreement, Tayo review', type: 'PDF', category: 'Legal', owner: 'Amara', modified: '2h ago', status: 'Awaiting signature' },
  { id: '2', title: 'Kolo business plan', type: 'DOC', category: 'Corporate', owner: 'Amara', modified: 'Yesterday', status: 'Final', aiGenerated: true },
  { id: '3', title: 'Financial model, 36 months', type: 'XLS', category: 'Financials', owner: 'Grace', modified: '3d ago', status: 'Final', aiGenerated: true },
  { id: '4', title: 'Pre-seed deck v3', type: 'PPT', category: 'Fundraising', owner: 'Amara', modified: '4d ago', status: 'Draft' },
  { id: '5', title: 'Mutual NDA, Thrive SACCO', type: 'PDF', category: 'Legal', owner: 'Amara', modified: '1w ago', status: 'Signed' },
  { id: '6', title: 'Brand positioning statement', type: 'DOC', category: 'Marketing', owner: 'Amara', modified: '2w ago', status: 'Final', aiGenerated: true },
];

const INITIAL_SIGNATURE_REQUESTS: SignatureRequestItem[] = [
  {
    title: 'Contractor agreement, Chidi A.',
    meta: 'Sent Jul 24 • 1 of 2 signed',
    status: 'Awaiting',
    actionText: 'Remind',
    signers: [
      { name: 'Amara Okafor', signed: true },
      { name: 'Chidi Anigbogu', signed: false }
    ]
  },
  {
    title: 'Mutual NDA, Thrive SACCO',
    meta: 'Sent Jul 18 • 2 of 2 signed',
    status: 'Complete',
    actionText: 'Download',
    signers: [
      { name: 'Amara Okafor', signed: true },
      { name: 'Thrive SACCO', signed: true }
    ]
  },
  {
    title: 'Founder IP assignment',
    meta: 'Sent Jul 2 • 1 of 2 signed',
    status: 'Expired',
    actionText: 'Resend',
    signers: [
      { name: 'Amara Okafor', signed: true },
      { name: 'Daniel Kariuki', signed: false }
    ]
  }
];

const SHARED_LIST_ITEMS: SharedListItem[] = [
  { document: 'Pre-seed deck v3', sharedWith: 'Sahel Fund', access: 'View', lastViewed: 'Today 10:12' },
  { document: 'Financial model, 36 months', sharedWith: 'Grace Adeyemi', access: 'Edit', lastViewed: 'Yesterday' },
  { document: 'Contractor agreement', sharedWith: 'Tayo Nwachukwu', access: 'Comment', lastViewed: '2h ago' },
  { document: 'Data room index', sharedWith: 'Ventures for Africa', access: 'View', lastViewed: '3d ago' },
];

export function useDocumentsApi() {
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequestItem[]>(INITIAL_SIGNATURE_REQUESTS);
  
  return {
    versionHistory: VERSION_HISTORY,
    sharedUsers: SHARED_USERS,
    libraryDocs: LIBRARY_DOCS,
    sharedListItems: SHARED_LIST_ITEMS,
    signatureRequests,
    setSignatureRequests
  };
}

