---
document: lean-spec
feature-id: F-305
feature-name: Lịch sử Khu chuyển tải
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-305: Lịch sử Khu chuyển tải (TransferArea)

## Use Case

- **Actor:** người có `transferarea:history`.
- **Trigger:** chọn "Lịch sử" từ menu dòng.
- **Main flow:** hiển thị danh sách thay đổi/phê duyệt ĐÃ duyệt (approved-only).
- **Alternate/error:** hồ sơ chưa duyệt (Nháp/Lưu tạm) → không có bản ghi lịch sử.

## Domain Model

Bảng tập trung `infrastructure_history` (không dùng `change_logs`/`approval_logs` legacy).

## Business Rules (bắt buộc)

- **BR-305-01:** approved-only — chỉ hiển thị thay đổi đã phê duyệt.
- **BR-305-02:** Nháp/Lưu tạm không tạo/không hiển thị bản ghi lịch sử.
- **BR-305-03:** data scope theo đơn vị.

## Approval

- Không có bước phê duyệt. Nguồn quy tắc: sheet "1 số logic" + tài liệu phê duyệt Mục 5 (Ca sử dụng 8 — sửa hồ sơ đã duyệt).

## Data scope

- `@DataScope` + `@Filter(orgUnitFilter)`.

## Permissions

- `transferarea:history`.

## Drift ghi nhận

- `@PreAuthorize` bị comment ở controller — SA/PMO chốt.
