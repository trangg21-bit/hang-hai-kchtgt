import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { globalCssVars } from './theme';
import './index.css';

// Inject globalCssVars vào <head> — single source of truth từ theme.ts
const styleTag = document.createElement('style');
styleTag.innerHTML = globalCssVars;
document.head.appendChild(styleTag);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
