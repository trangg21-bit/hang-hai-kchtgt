---
id: AM-1b4740bb55b0f852
kind: decision
topic: buoy-station-refactor-2026-08-18
tags: []
importance: 0.85
agent: 
created: 2026-08-18T04:47:06.420Z
updated: 2026-08-18T04:47:06.420Z
---

Refactor frontend Nhà trạm phao tiêu (/buoy-station, M-014) sang mô hình Quản lý cảng biển (/port): user đã duyệt làm thẳng ngoài pipeline SDLC (do pipeline C2 bị chặn cứng bởi migrate-legacy không chạy được). Thay đổi: BuoyStationList.tsx giờ mở Tạo mới/Chỉnh sửa/Chi tiết bằng Drawer (width 1000), form tách thành BuoyStationFormContent.tsx, bỏ route /buoy-station/create và /buoy-station/:id khỏi App.tsx (giữ duy nhất /buoy-station như /port), BuoyStationForm.tsx giờ là file không dùng nữa (giữ lại chờ user quyết xóa). Verify: vite build pass, eslint chạy theo kết quả. Lưu ý: file BuoyStationList.tsx dùng dòng cực dài khiến read wrap dòng — khi edit phải dùng fragment ngắn duy nhất, không dùng anchor đa dòng.
