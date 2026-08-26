---
id: AM-6ba6975290ca48f0
kind: gotcha
topic: pier-field-mapping
tags: []
importance: 0.8
agent: 
created: 2026-08-22T01:17:24.012Z
updated: 2026-08-22T01:17:24.012Z
---

Màn Pier/Cầu cảng (frontend/src/app/pier): lệch tên field FE↔BE — FE types.ts dùng taiTrong/loaiCau/operationalCapacity/loaiHinhHoc/toaDo/bieuTuongId nhưng API (PierService.toResponse) trả designLoad/pierType/operationalFunction/geometryType/coordinates/mapSymbolId → cột Tải trọng, Loại cầu, Công năng, Biểu tượng hiển thị rỗng. Form Tạo mới bind loaiCau + operationalCapacity nhưng create schema (zod) không có 2 key này (có pierType/operationalFunction) → giá trị bị strip khi submit. Backend có waterAreaNeutralScope nhưng UI không có input nào. Modal Sửa chỉ ~10 trường trong khi CSV spec 62 trường.
