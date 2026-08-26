---
id: AM-58efd6926ea4690e
kind: decision
topic: port-detail-displayrule-hardcode
tags: []
importance: 0.65
agent: 
created: 2026-08-14T01:44:41.368Z
updated: 2026-08-14T01:44:41.368Z
---

Chi tiết cảng biển (PortListPage modal xem chi tiết dòng ~3289 + PortDetailContent.tsx dòng 84) từng gán cứng 'Quy tắc hiển thị: Độ, phút, giây (DMS)' bất kể dữ liệu. Đã sửa 2026-08-14: hiển thị 'Độ, phút, giây (DMS)' CHỈ khi selectedRecord.geometryType || coordinates, ngược lại '—' (khớp logic setFieldsValue của form ở PortListPage dòng 575/1283). Lưu ý: Port.displayRule backend là Integer nhưng form gửi displayRule:undefined vì Number('Độ, phút, giây (DMS)')=NaN → cột display_rule thực tế luôn NULL.
