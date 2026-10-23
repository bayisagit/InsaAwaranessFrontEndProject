'use client';

import React from 'react';
import { PwaRegister } from './PwaRegister';
import { PwaInstallProvider } from './PwaInstallPrompt';
import { OfflineIndicator } from './OfflineIndicator';

export function PwaManager({ children }: { children: React.ReactNode }) {
  return (
    <PwaInstallProvider>
      <PwaRegister />
      <OfflineIndicator />
      {children}
    </PwaInstallProvider>
  );
}
export { PwaInstallButton } from './PwaInstallPrompt';
