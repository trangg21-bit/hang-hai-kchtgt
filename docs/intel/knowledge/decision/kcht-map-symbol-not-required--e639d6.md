---
id: AM-e639d6f4786f81cc
kind: decision
topic: kcht-map-symbol-not-required
tags: []
importance: 0.7
agent: 
created: 2026-08-18T08:37:10.952Z
updated: 2026-08-18T08:37:10.952Z
---

Form cảng biển (PortListPage.tsx services/port, modal create L~2174 + update L~2944): mapSymbolId trước đây bị disabled={!geometryType} VÀ rules required khi đã chọn Loại đối tượng ('Biểu tượng bản đồ là bắt buộc khi chọn loại đối tượng') — đã bỏ cả 2 (2026-08-18, C0) cho đúng yêu cầu: biểu tượng bản đồ không bắt buộc, chọn được độc lập với loại đối tượng. PortFormContent.tsx (không được render, chỉ là form chuẩn tham khảo) cũng bỏ disabled={!geometryType}. Bến cảng (BerthListPage bieuTuongId), cầu cảng (PierListPage bieuTuongId), cảng cạn (DryPortListPage không có field biểu tượng trong form create/update) vốn không required.
