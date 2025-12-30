import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './routes/AppRouter';
import { queryClient } from './queryClient.ts';
import './index.css';
import './styles/print.css';

console.log('[React Init] Starting main.tsx');

// Aplica o tema antes da renderização para evitar "flash" de tema incorreto
// Prioridade: localStorage > preferência do sistema
const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
document.documentElement.classList.toggle('dark', initialTheme === 'dark');

console.log('[React Init] Theme applied:', initialTheme);
console.log('[React Init] Looking for #root element');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[React Init] CRITICAL: #root element not found!');
  throw new Error('Root element not found');
}

console.log('[React Init] Root element found, creating React root');

try {
  const root = createRoot(rootElement);
  console.log('[React Init] React root created, rendering app');

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    </StrictMode>,
  );

  console.log('[React Init] App rendered successfully');
} catch (error) {
  console.error('[React Init] CRITICAL ERROR during render:', error);
  throw error;
}
