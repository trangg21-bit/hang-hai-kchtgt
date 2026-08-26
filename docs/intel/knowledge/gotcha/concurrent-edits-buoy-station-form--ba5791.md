---
id: AM-ba5791fa979c0cb2
kind: gotcha
topic: concurrent-edits-buoy-station-form
tags: []
importance: 0.8
agent: 
created: 2026-08-22T08:25:38.220Z
updated: 2026-08-22T08:25:38.220Z
---

Tiến trình/session KHÁC đang đồng thời sửa frontend/src/services/buoy-station/BuoyStationFormContent.tsx (quan sát 2026-08-22): ngoài thay đổi của tôi còn xuất hiện rules maxLength (address ≤500, totalArea/usableArea ≤20 chữ số, staffCount ≤5, note ≤2000) do người khác thêm — không phải tôi. Cảnh báo workspace memory về concurrent process sửa file giữa pipeline là CÓ THẬT và ảnh hưởng cả source code, không chỉ docs. Trước khi sửa tiếp file này nên kiểm tra diff xem có thay đổi lạ không.
