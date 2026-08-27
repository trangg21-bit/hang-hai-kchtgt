---
id: AM-4229c9e5106db0e5
kind: gotcha
topic: jsx-stale-render-comment
tags: []
importance: 0.8
agent: 
created: 2026-08-18T04:30:51.530Z
updated: 2026-08-18T04:30:51.530Z
---

Khi giữ code cũ làm comment STALE_RENDER trong JSX: đặt `/*` TRONG expression container và đóng bằng `*/}` (comment đóng trước, `}` đóng container sau). SAI nếu: (a) `}` đóng container TRƯỚC `/*` → comment nằm ở JSX-text nơi comment không hoạt động → TS1382 'Unexpected token. Did you mean >'; (b) dùng `//` line comment → nội dung `>`/`=>` trong JSX text cũng vỡ. PortListPage.tsx dùng pattern này (không có `}` — container đóng ở tail cũ).
