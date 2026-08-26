---
id: AM-cc41f8dc0cb309e4
kind: decision
topic: dryport-form-ui
tags: []
importance: 0.7
agent: 
created: 2026-08-17T04:12:12.202Z
updated: 2026-08-17T04:12:12.202Z
---

Form cảng cạn (frontend/src/pages/port/DryPortList.tsx) đã tinh chỉnh UI theo mẫu cảng biển: tạo mới 3 nút (Lưu tạm/Lưu và gửi phê duyệt/Lưu và phê duyệt), chỉnh sửa chỉ 1 nút 'Cập nhật' (action UPDATE không gửi saveAction → backend giữ trạng thái DRAFT/PENDING, đổi APPROVED→PENDING). Tab 1 'Thông tin chung' 15 field theo thứ tự đặc tả. Tab 2 tên 'Thời điểm công bố đưa vào sử dụng' (đã bỏ field announcementTime khỏi form, còn Quyết định công bố số/Ngày ra quyết định công bố/Đơn vị ra quyết định công bố TextArea). 6 field required: orgUnitId, dryPortName, provinceId, detailedLocation, teuCapacity, portStatus. Validate GPS khi chọn geometryType. Khu vực: Phía Bắc/Phía Nam/Miền Trung - Tây Nguyên. Title chỉnh sửa 'Chỉnh sửa {mã} — {tên}', tạo mới 'Thêm mới Cảng cạn'.
