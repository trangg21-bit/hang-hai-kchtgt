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
      const isDynamicImportError = this.state.error.message?.includes('Failed to fetch dynamically imported module')
        || this.state.error.message?.includes('Loading chunk');

      if (isDynamicImportError) {
        return (
          <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h3 style={{ color: '#0F172A', marginBottom: 8 }}>Hệ thống vừa cập nhật phiên bản mới</h3>
            <p style={{ color: '#64748B', marginBottom: 20 }}>Mã nguồn vừa được làm mới trên máy chủ. Vui lòng tải lại trang để tiếp tục.</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                borderRadius: 999,
                background: '#0E6FD6',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              Tải lại trang (F5)
            </button>
          </div>
        );
      }

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
