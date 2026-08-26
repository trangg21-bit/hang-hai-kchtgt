---
id: AM-d21d3f7813c0d3b5
kind: decision
topic: kcht-form-symbol-disabled
tags: []
importance: 0.7
agent: 
created: 2026-08-14T01:47:27.147Z
updated: 2026-08-14T01:47:27.147Z
---

Quy tắc UI 'chưa chọn Loại đối tượng (geometryType) thì không chọn được Biểu tượng (mapSymbolId)' đã đồng bộ ở các form KCHT: PierForm.tsx + DryPortForm.tsx dùng disabled={!watchedGeometryType} (Form.useWatch), BerthForm.tsx dùng disabled={!watchedGeometryType}, PortListPage.tsx 2 modal dùng disabled={!createGeometryType}/!updateGeometryType, PortFormContent.tsx dùng disabled={!geometryType}. PortCreatePage.tsx + PortUpdatePage.tsx KHÔNG được route trong App.tsx (không dùng) nên chưa áp dụng quy tắc.
