---
id: AM-324943f4042815b4
kind: decision
topic: portlist-gis-tab-validation
tags: []
importance: 0.8
agent: 
created: 2026-08-21T01:46:30.576Z
updated: 2026-08-21T01:46:30.576Z
---

PortListPage (Cảng biển) tab Thông tin vị trí 2026-08-21: Biểu tượng bản đồ bỏ required (vẫn disabled cho tới khi chọn Loại đối tượng); validation GPS chỉ chạy khi action submit/approve — Lưu tạm (draft) KHÔNG bắt buộc tọa độ; khi gửi duyệt/phê duyệt bắt buộc theo GEOMETRY_POINT_COUNT: POINT>=1, LINE>=2, POLYGON>=3. Hệ quy chiếu vẫn disabled + tự set WGS-84; displayRule vẫn auto-set chuỗi 'Độ, phút, giây (DMS)' và payload Number() -> NaN nên không gửi được (chưa sửa, user chưa yêu cầu).
