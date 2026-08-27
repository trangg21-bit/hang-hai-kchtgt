import React, { createContext, useContext } from 'react';
import { ConfigProvider } from 'antd';
import * as defaultThemeTokens from '../tokens';

/**
 * Lớp cho phép đổi bộ theme token theo từng nhánh cây component.
 *
 * Các component dùng chung (list-view, shared…) trước đây import thẳng từ
 * `tokens.ts`, nên mọi màn hình buộc phải trông giống nhau. Với `useThemeToken()`,
 * chúng đọc token từ context, còn màn hình quyết định bộ token nào được dùng:
 *
 *   import * as themeTokenChk from '../../themetokenchk';
 *   <ThemeTokenProvider tokens={themeTokenChk}> … </ThemeTokenProvider>
 *
 * Không bọc provider thì mặc định vẫn là `tokens.ts` — các màn hiện có giữ nguyên
 * giao diện.
 *
 * FILE NÀY KHÔNG CHỨA GIÁ TRỊ GIAO DIỆN. Màu, kích thước và cả các quy tắc CSS
 * đều nằm trong file theme (`tokens.ts` / `themetokenchk.ts`); ở đây chỉ có cơ
 * chế phân phát. Muốn đổi giao diện thì sửa file theme, không sửa file này.
 */

/**
 * `tokens.ts` khai báo màu/kích thước bằng `export const`, nên TypeScript suy ra
 * kiểu literal (ví dụ `'#0E6FD6'` chứ không phải `string`). Nới về kiểu nguyên
 * thủy để bộ token khác gán được giá trị khác; các style object giữ nguyên kiểu.
 */
type Widen<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : T;

export type ThemeToken = { [K in keyof typeof defaultThemeTokens]: Widen<(typeof defaultThemeTokens)[K]> };

const ThemeTokenContext = createContext<ThemeToken>(defaultThemeTokens);

export function useThemeToken(): ThemeToken {
  return useContext(ThemeTokenContext);
}

/** Class đánh dấu vùng áp theme; file theme nhận nó qua `themeScopedCss(scope)`. */
export const THEME_SCOPE_CLASS = 'theme-token-scope';

/**
 * Popup của antd (Dropdown, Select, DatePicker…) render ra portal ở `body`,
 * NẰM NGOÀI thẻ bọc theme — nên không thừa hưởng biến CSS lẫn quy tắc scope.
 * Component nào mở popup phải gắn class này qua `rootClassName` để kéo nó
 * vào phạm vi theme.
 */
const SCOPE_CLASS = THEME_SCOPE_CLASS;

export interface ThemeTokenProviderProps {
  tokens?: ThemeToken;
  theme?: ThemeToken;
  children: React.ReactNode;
}

export function ThemeTokenProvider({ tokens, theme, children }: ThemeTokenProviderProps) {
  const activeTokens = tokens || theme || defaultThemeTokens;
  const style = {
    ...(activeTokens?.themeCssVariables || {}),
    // `display: contents` để thẻ bọc này KHÔNG sinh hộp bố cục — chuỗi flex/height
    // của trang bên trong giữ nguyên như khi chưa có provider.
    display: 'contents',
  } as React.CSSProperties;

  return (
    <ThemeTokenContext.Provider value={activeTokens}>
      {/*
        ConfigProvider lồng bên trong để Drawer/Modal/Select/DatePicker — những thứ
        antd tự vẽ, React không chạm được style — cũng dùng màu và font của bộ
        token này. Giá trị lấy nguyên từ file theme, ở đây không khai gì thêm.
      */}
      <ConfigProvider theme={activeTokens?.antdTheme}>
        {activeTokens?.themeScopedCss && <style>{activeTokens.themeScopedCss(SCOPE_CLASS)}</style>}
        <div className={SCOPE_CLASS} style={style}>
          {children}
        </div>
      </ConfigProvider>
    </ThemeTokenContext.Provider>
  );
}

export { defaultThemeTokens };
