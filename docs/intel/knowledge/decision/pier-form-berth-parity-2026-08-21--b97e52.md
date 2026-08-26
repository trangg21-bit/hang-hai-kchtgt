---
id: AM-b97e52d94d4cce61
kind: decision
topic: pier-form-berth-parity-2026-08-21
tags: []
importance: 0.85
agent: 
created: 2026-08-21T07:42:52.818Z
updated: 2026-08-21T08:03:24.166Z
---

Form cầu cảng (pier) ROUTED = frontend/src/pages/port/PierForm.tsx + PierList.tsx (App.tsx /pier/create + /pier/:id/edit; app/pier/PierListPage.tsx KHÔNG route). Sửa 2026-08-21 theo user (docs BA sai): (1) Đơn vị quản lý auto-fill /users/me, OrgUnitTreeSelect, disabled={isEdit||!isSystemAdmin}, cascade Cảng biển; (2) Thuộc luồng HH = Select GIS WATERWAY (lineObjectService) → navigationChannelId (BE đã có field); (3) Loại kết cấu chung catalog bến cảng (bệ cọc cao/cường từ/trọng lực/khác 1-4); (4) BỎ 'Loại cầu' (pierType) + 'Tải trọng thiết kế' (designLoad); (5) Phân cấp công trình Select 1-5 = Cấp đặc biệt/Cấp 1/2/3/4; (6) province required; (7) NÚT HÀNH ĐỘNG: trước không có loading → giờ giống bến cảng: PierList thêm state submitting+actionType, mỗi nút loading={submitting && actionType==='draft'|'submit'|'approve'|'update'}, PierForm nhận prop onSubmittingChange?.(true/false) trong handleSave (pattern BerthForm). Gate: npm run build (bun không có) exit 0. Lint biome có nhiều lỗi CÓ SẴN (exhaustive-deps PierForm:85 effect cũ, forEach/a11y PierList, PortListPage) — không thuộc phạm vi, vite build vẫn pass.
