---
document: lean-spec
feature-id: F-311
feature-name: Lịch sử Khu tránh trú bão
module-id: M-1025
scope: feature
version: 1.0
---

# Lean Spec — F-311: Lịch sử Khu tránh trú bão (StormShelterArea)

## Use Case

- **Actor:** người có `stormshelter:history`.
- **Main flow:** hiển thị thay đổi/phê duyệt ĐÃ duyệt (approved-only).

## Domain Model

Bảng `infrastructure_history`.

## Business Rules (bắt buộc)

- **BR-311-01:** approved-only. **BR-311-02:** Nháp/Lưu tạm không hiển thị. **BR-311-03:** data scope.

## Approval

- Không có bước phê duyệt. Nguồn: sheet "1 số logic" + tài liệu phê duyệt Mục 5 (Ca sử dụng 8).

## Data scope

- `@DataScope` + `@Filter(orgUnitFilter)`.

## Permissions

- `stormshelter:history`.

## Drift ghi nhận

- `@PreAuthorize` bị comment — SA/PMO chốt.
