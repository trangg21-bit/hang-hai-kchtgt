---
id: AM-978a00a05a925fcc
kind: decision
topic: buoystation-remove-gps-required-validation
tags: []
importance: 0.8
agent: 
created: 2026-08-20T08:41:01.326Z
updated: 2026-08-20T08:41:01.326Z
---

Form Nhà trạm Phao, tiêu (frontend/src/services/buoy-station/BuoyStationFormContent.tsx handleSave) ĐÃ BỎ validate bắt buộc tọa độ GPS (2026-08-20, theo yêu cầu user): xóa check 'Loại đối tượng yêu cầu ít nhất N tọa độ GPS' (GEOMETRY_POINT_COUNT) và check 'Vui lòng thêm ít nhất một tọa độ GPS để gửi phê duyệt' (chặn SUBMIT/APPROVED) — Lưu và gửi phê duyệt / Lưu và phê duyệt giờ không bắt nhập tọa độ. VẪN GIỮ range check -90..90/-180..180 khi có tọa độ. LƯU Ý: cùng validate vẫn còn ở BuoyListPage (674/686/792), PortListPage (801/952), DryPortList (861/868), BerthForm (186), PierForm (103) — user chỉ muốn sửa màn nhà trạm.
