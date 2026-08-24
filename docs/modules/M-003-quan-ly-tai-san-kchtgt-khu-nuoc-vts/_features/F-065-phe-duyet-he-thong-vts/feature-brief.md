---
id: F-065
name: "Phe duyet He thong VTS"
slug: phe-duyet-he-thong-vts
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-30T00:00:00Z"
last-updated: "2026-08-20T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phe duyet He thong VTS

## 1. Mô tả ngắn
Quy trình phê duyệt 2 cấp cho Hệ thống VTS: Cấp 1 (Trưởng phòng/Chi cục/Cảng vụ) → Cấp 2 (Lãnh đạo Cục), chuyển trạng thái từ DRAFT → PENDING_APPROVAL → APPROVED_LEVEL1 → APPROVED (từ chối cấp 1 → REJECTED_LEVEL1, từ chối cấp 2 → REJECTED_LEVEL2). Người dùng thực hiện phê duyệt/từ chối qua thanh thao tác trên Form chi tiết hoặc menu ngữ cảnh trên bảng danh sách.

## 2. Luồng thao tác & Giao diện phê duyệt

### 2.1. Phê duyệt C1 (Cảng vụ / Chi cục)
1. Người dùng có quyền `vts:approvec1` chọn "Phê duyệt C1" (khi bản ghi ở trạng thái `PENDING_APPROVAL`).
2. Hệ thống hiển thị **Popup xác nhận phê duyệt cấp 1 (Cảng vụ/Chi cục)**:
   - Ô nhập **Nội dung / Ý kiến phê duyệt**: Textarea tối đa 500 ký tự, placeholder gợi ý: *"Nhập nội dung / ý kiến phê duyệt..."*. Trường này là **tùy chọn (không bắt buộc)**.
   - Nếu người dùng để trống và bấm "Xác nhận phê duyệt", hệ thống tự động ghi nhận nội dung mặc định là `"Đã phê duyệt"`.
3. Bản ghi chuyển sang trạng thái `APPROVED_LEVEL1`, ghi nhận `approver_level1`, `approved_date_level1` và bản ghi trong bảng lịch sử phê duyệt (`approval_history`).

### 2.2. Phê duyệt C2 (Cục Hàng hải)
1. Người dùng có quyền `vts:approvec2` chọn "Phê duyệt C2" (khi bản ghi ở trạng thái `APPROVED_LEVEL1`).
2. **Quy tắc chống tự duyệt (Self-Approval Prevention / Nguyên tắc 4 mắt)**:
   - Nếu tài khoản hiện tại trùng với người đã duyệt C1 (`approver_level1`), nút "Phê duyệt C2" và "Từ chối C2" sẽ bị vô hiệu hóa (disabled) trên giao diện kèm Tooltip cảnh báo: *"Bạn không thể tự phê duyệt hồ sơ do mình xét duyệt C1"*.
   - Backend chặn tại tầng Service: Nếu `approverLevel2 == approverLevel1` sẽ ném ngoại lệ chặn giao dịch.
3. Hệ thống hiển thị **Popup xác nhận phê duyệt cấp 2 (Cục)** với ô nhập ý kiến phê duyệt tương tự Cấp 1.
4. Bản ghi chuyển sang trạng thái `APPROVED`, ghi nhận `approver_level2`, `approved_date_level2` và bản ghi lịch sử.

### 2.3. Từ chối phê duyệt (C1 / C2)
1. Khi chọn "Từ chối", hệ thống hiển thị **Popup Từ chối**.
2. **Lý do từ chối là BẮT BUỘC** (tối thiểu 10 ký tự). Nút "Từ chối" chỉ kích hoạt khi đã nhập đủ 10 ký tự.
3. Bản ghi chuyển sang trạng thái `REJECTED_LEVEL1` (từ chối C1) hoặc `REJECTED_LEVEL2` (từ chối C2), lưu lý do vào `rejection_reason` và bảng lịch sử phê duyệt.

## 3. Quy tắc nghiệp vụ

| ID | Quy tắc | Mô tả chi tiết |
|---|---|---|
| BR-065-01 | Phê duyệt 2 cấp | C1: PENDING_APPROVAL → APPROVED_LEVEL1; C2: APPROVED_LEVEL1 → APPROVED. Từ chối C1 → REJECTED_LEVEL1; từ chối C2 → REJECTED_LEVEL2 |
| BR-065-02 | Chống tự phê duyệt (Self-approval guard) | Người duyệt C2 không được trùng với người duyệt C1 (`approverLevel1 != approverLevel2`). Áp dụng cả Frontend và Backend. |
| BR-065-03 | Ý kiến phê duyệt | Tùy chọn khi duyệt (mặc định "Đã phê duyệt" nếu để trống). Bắt buộc tối thiểu 10 ký tự khi từ chối. |
| BR-065-04 | Lịch sử phê duyệt | Mọi hành động duyệt/từ chối đều lưu bản ghi kiểm toán trong `approval_history`. |

## 4. Phân quyền

| Quyền | Mã quyền | Vai trò áp dụng |
|---|---|---|
| Phê duyệt C1 | `vts:approvec1` | Lãnh đạo Phòng / Chi cục / Cảng vụ |
| Phê duyệt C2 | `vts:approvec2` | Lãnh đạo Cục |
| Xem lịch sử duyệt | `vts:history` | Toàn bộ tài khoản có quyền đọc VTS |

## 5. Cấu trúc bảng & Thực thể liên quan

- Bảng chính `vts_system`: Lưu trạng thái `approval_status`, người duyệt `approver_level1`, `approver_level2`, ngày duyệt `approved_date_level1`, `approved_date_level2`, lý do từ chối `rejection_reason`. *(Đã loại bỏ 2 cờ boolean thừa `approved_level1`, `approved_level2`)*.
- Bảng lịch sử `approval_history`: Lưu vết chi tiết từng lần duyệt/từ chối kèm lý do (`reason`), người thực hiện (`actor_id`), thời gian (`action_time`), cấp duyệt (`approval_level`).

