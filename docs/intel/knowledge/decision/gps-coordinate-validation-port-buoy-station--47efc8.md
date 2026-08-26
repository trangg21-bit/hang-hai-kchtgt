---
id: AM-47efc8f98e56ed20
kind: decision
topic: gps-coordinate-validation-port-buoy-station
tags: []
importance: 0.8
agent: 
created: 2026-08-22T08:20:33.400Z
updated: 2026-08-22T08:20:33.400Z
---

BuoyStation (nhà trạm phao tiêu) từng bị BỎ validate bắt buộc tọa độ GPS theo yêu cầu user 2026-08-20 (comment trong BuoyStationFormContent.tsx); ngày 2026-08-22 user yêu cầu áp dụng LẠI — đã khôi phục validate 'ít nhất N tọa độ theo GEOMETRY_POINT_COUNT (POINT:1,LINE:2,POLYGON:3)' + chặn khi gửi duyệt không có tọa độ, và đồng bộ message cảnh báo BuoyListPage theo chuẩn Cảng biển ('...tọa độ GPS.\nVui lòng nhập đầy đủ thông tin.'). Chuẩn chung 3 màn Port/Buoy/BuoyStation: check số tọa độ tối thiểu theo loại đối tượng; Port chỉ chặn khi gửi duyệt còn Buoy/BuoyStation chặn cả khi lưu nháp.
