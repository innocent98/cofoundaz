'use client';

import React, { useState } from 'react';
import { useToast } from '../ToastContext';

export default function SyncPage() {
  const { triggerToast } = useToast();
  
  const [isGoogleConnected, setIsGoogleConnected] = useState(true);
  const [isOutlookConnected, setIsOutlookConnected] = useState(false);
  const [syncDirection, setSyncDirection] = useState<'both' | 'import' | 'export'>('both');

  return (
    ${fixExtract(extractSync)}
  );
}
