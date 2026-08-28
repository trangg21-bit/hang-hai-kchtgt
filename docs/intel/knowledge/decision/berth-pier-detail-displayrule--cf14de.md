---
id: AM-cf14de158223c56d
kind: decision
topic: berth-pier-detail-displayrule
tags: []
importance: 0.7
agent: 
created: 2026-08-14T01:54:15.060Z
updated: 2026-08-14T01:54:15.060Z
---

BerthDetailContent.tsx (dòng ~136) và PierDetailContent.tsx (dòng ~165) từng hiển thị 'Quy tắc hiển thị' bằng r.displayRule — luôn null vì BerthForm gửi Number('Độ, phút, giây (DMS)')=NaN→null và PierForm KHÔNG gửi displayRule trong payload → chi tiết luôn '—' dù có dữ liệu vị trí. Đã sửa 2026-08-14: hiển thị 'Độ, phút, giây (DMS)' khi có geometryType||coordinates||latitude||longitude, ngược lại '—' (khớp fix cảng biển PortListPage/PortDetailContent cùng ngày). Lưu ý tồn đọng: displayRule (Integer) của Port/Berth/Pier KHÔNG BAO GIỜ được lưu xuống DB từ form.
