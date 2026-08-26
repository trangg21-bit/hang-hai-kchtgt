---
id: AM-a603567a4ac9f412
kind: decision
topic: buoy-history-drawer-parity
tags: []
importance: 0.8
agent: 
created: 2026-08-19T07:39:14.878Z
updated: 2026-08-19T08:07:18.600Z
---

Lịch sử Phao tiêu — bổ sung theo feedback user 2026-08-19: (1) 2 tab 'Bản ghi hiện tại/Tất cả bản ghi' bị xem là hiển thị THỪA → bọc Radio.Group trong <div style={{display:'none'}}> y hệt BerthList (giữ logic current mode, backend /history/all vẫn còn); (2) translateBuoyVal thêm map: approvalStatus (PROPOSED→'Chờ phê duyệt', PENDING_APPROVAL→'Chờ Cảng vụ duyệt', APPROVED_LEVEL1→'Chờ Cục duyệt', APPROVED→'Đã phê duyệt'...), geometryType (POINT/LINE/POLYGON→Đối tượng điểm/đường/vùng), provinceId (VIETNAM_PROVINCE_OPTIONS.find — value là MÃ tỉnh như '89'=Long An, không phải index), coordinateSystem ('1'→WGS-84, '2'→VN-2000). Các field số (Hình dạng/Kết cấu/Màu tháp...) user nhập số thật nên hiển thị số là đúng.
