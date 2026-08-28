---
id: AM-5ea2f94b8a438631
kind: decision
topic: buoy-station-gis-tab-parity-2026-08-20
tags: []
importance: 0.75
agent: 
created: 2026-08-20T02:01:25.533Z
updated: 2026-08-20T02:16:48.684Z
---

CẬP NHẬT (2026-08-20, user phản hồi): đã BỎ hành vi 'luôn yêu cầu ≥1 tọa độ khi lưu nháp' của BuoyStationFormContent.handleSave — trước đây geomType mặc định 'POINT' khi chưa chọn loại đối tượng → lỗi 'Loại đối tượng đã chọn yêu cầu ít nhất 1 tọa độ GPS' ngay cả khi chưa chọn gì. Nay theo đúng chuẩn BuoyListPage: chỉ kiểm tra số tọa độ khi ĐÃ chọn geometryType (POINT=1/LINE=2/POLYGON=3); khi saveAction SUBMIT/APPROVED mà không có tọa độ → 'Vui lòng thêm ít nhất một tọa độ GPS để gửi phê duyệt'; payload gửi geometryType/objectType = undefined nếu chưa chọn (backend create/update chấp nhận null, chỉ tạo spatial object khi có coordinates).
