---
id: AM-78ce1772b303236d
kind: decision
topic: kcht-location-tab-fields
tags: []
importance: 0.6
agent: 
created: 2026-08-14T01:34:35.182Z
updated: 2026-08-14T01:34:35.182Z
---

Tab 'Thông tin vị trí' của 3 form KCHT: cảng biển (services/port/PortListPage.tsx, có 2 modal create+update TÁCH RIÊNG), bến cảng (pages/port/BerthForm.tsx), cầu cảng (pages/port/PierForm.tsx) dùng chung 4 trường geometryType/mapSymbolId/coordinateSystem/displayRule. displayRule hiện render là Input disabled (free text) dù backend Port/Berth khai Integer, còn DryPortForm (chuẩn) dùng Select DISPLAY_RULE_OPTIONS — dấu hiệu lệch type tồn đọng. PortFormContent.tsx, PortCreatePage.tsx, PortUpdatePage.tsx và app/{berth,pier,dryport}/* là code chết (không route trong App.tsx).
