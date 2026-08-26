---
id: AM-0669445289f46162
kind: gotcha
topic: frontend-build-and-loading-pattern
tags: []
importance: 0.7
agent: 
created: 2026-08-21T04:33:22.095Z
updated: 2026-08-21T04:33:22.095Z
---

Frontend build trên máy này KHÔNG có bun — dùng `npm run build` trong frontend/ (script build = vite build thuần, không có tsc). Cảng biển là màn tham chiếu cho pattern loading nút: services/port/PortListPage.tsx dùng actionTypeRef + actionType state, mỗi nút loading={submitting && actionType === 'xxx'}.
