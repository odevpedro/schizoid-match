import React from 'react';
import { createRoot } from 'react-dom/client';
import { WebApp } from './WebApp';

createRoot(document.getElementById('root') as HTMLElement).render(<WebApp />);
