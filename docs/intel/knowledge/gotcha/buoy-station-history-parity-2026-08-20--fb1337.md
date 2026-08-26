---
id: AM-fb1337d3ce68f892
kind: gotcha
topic: buoy-station-history-parity-2026-08-20
tags: []
importance: 0.7
agent: 
created: 2026-08-20T03:03:56.565Z
updated: 2026-08-20T03:03:56.565Z
---

BuoyStation (nhà trạm phao tiêu) 2026-08-20 KIỂM TRA: 'Thông tin thêm mới' trong Lịch sử (BuoyStationList.tsx HISTORY_FIELD_ORDER dòng 85-92) copy từ BuoyListPage — chứa field legacy không có trong form nhà trạm (type/color/shape/lightCharacteristic/range/description/lastInspectionDate/nextInspectionDate/lastRepairDate — entity BuoyStation.java dòng 143-151 khai báo không @Column), THIẾU condition (Tình trạng, bắt buộc form) và icon; history không render ảnh biểu tượng (buoy thì có), accent bar create=xanh lá trong khi buoy luôn xanh dương; detail tab Thông tin chung thiếu waterwayId/waterwayRouteId; province vẫn là tên string (entity đã có cột provinceId Integer nhưng frontend không gửi).
