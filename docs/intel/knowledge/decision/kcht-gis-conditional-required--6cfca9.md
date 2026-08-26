---
id: AM-6cfca953c760f437
kind: decision
topic: kcht-gis-conditional-required
tags: []
importance: 0.75
agent: 
created: 2026-08-14T01:46:04.820Z
updated: 2026-08-14T01:46:04.820Z
---

Tab 'Thông tin vị trí' của 3 form KCHT (PortListPage create+update, BerthForm.tsx, PierForm.tsx) đã thêm rules required có điều kiện theo Loại đối tượng (geometryType qua Form.useWatch): mapSymbolId, coordinateSystem, displayRule có `rules={watchedGeometryType ? [{required:true}] : []}`; label 'Tọa độ GPS' hiển thị * khi chọn loại đối tượng. coordinateSystem/displayRule tự set (1 / 'Độ, phút, giây (DMS)') khi chọn geometryType nên required luôn pass; mapSymbolId + GPS là chặn lưu thật sự (toast + rules).
