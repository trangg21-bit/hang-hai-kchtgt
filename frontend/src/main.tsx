import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { globalCssVars } from './theme';
import './index.css';

console.log('[main] JS loaded, starting React...');

// Inject globalCssVars vào <head> — single source of truth từ theme.ts
const styleTag = document.createElement('style');
styleTag.innerHTML = globalCssVars;
document.head.appendChild(styleTag);

// Error Boundary — bắt mọi lỗi render
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: 'red', background: '#fff' }}>
          <h2>❌ React Render Error</h2>
          <pre>{this.state.error.message}</pre>
          <pre style={{ fontSize: 11, color: '#666' }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById('root')!;
console.log('[main] root element:', rootEl ? 'found' : 'MISSING');

try {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
  console.log('[main] React render called successfully');
} catch (e) {
  console.error('[main] FATAL render error:', e);
  rootEl.innerHTML = `<div style="padding:40px;font-family:monospace;color:red"><h2>FATAL: ${(e as Error).message}</h2><pre>${(e as Error).stack}</pre></div>`;
}
