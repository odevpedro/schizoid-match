import React from 'react';
import { createRoot } from 'react-dom/client';
import { WebApp } from './WebApp';

if (typeof global === 'undefined') {
  (window as any).global = window;
}

createRoot(document.getElementById('root') as HTMLElement).render(<WebApp />);
