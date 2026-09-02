---
id: F-321
name: "Phê duyệt Bến phao"
slug: phe-duyet-bp
module-id: M-026
status: proposed
classification: local
priority: medium
created: 2026-08-28
last-updated: 2026-08-28
locked-fields: []
consumed_by_modules: []
---

# Lean Spec — F-321 Phê duyệt Bến phao (C1/C2)

**Module:** M-026 — Quản lý Bến phao
**Phần chung:** `ba/00-lean-spec.md` (module mục 5) + `approval-2-level-spec.md` mục 3 (quy trình 2 cấp 28 loại KCHT).
**Nguồn:** code hiện trạng (READ ONLY): `BuoyBerthApprovalService`, `ApproveRequest`, `RejectRequest`, `BuoyBerthController`.

## 1. Mục đích & phạm vi

Phê duyệt hồ sơ bến phao qua 2 vòng đúng thứ tự: C1 (Cảng vụ/Chi cục) → C2 (Cục). Đồng ý hoặc từ chối (bắt buộc lý do ≥ 10 ký tự). Chống tự duyệt 4-eyes. Ghi approval-audit columns. **Ngoài phạm vi:** sửa hồ sơ (F-319), xóa (F-320).

## 2. Use Cases

- UC-01 Gửi duyệt (từ F-318/F-319) → `APPROVED_LEVEL1` + ghi submitted.
- UC-02 Duyệt C1 → `APPROVED_LEVEL2` + ghi C1.
- UC-03 Duyệt C2 → `APPROVED` + ghi C2.
- UC-04 Từ chối C1 → `REJECTED_LEVEL1` + lý do.
- UC-05 Từ chối C2 → `REJECTED_LEVEL2` + lý do.
- UC-06 Sửa + gửi lại từ REJECTED_* → `APPROVED_LEVEL1`.

## 3. Business Rules (BR-321-NN)

| ID | Quy tắc | Oracle kiểm chứng |
|---|---|---|
| BR-321-01 | 2 vòng đúng thứ tự, không nhảy vòng, không duyệt ngược | approve CUC trên APPROVED_LEVEL1 → lỗi "cần phê duyệt cấp Cảng vụ trước" |
| BR-321-02 | `cap` hợp lệ: CANG_VU chỉ trên APPROVED_LEVEL1; CUC chỉ trên APPROVED_LEVEL2; khác → IllegalArgumentException | approve cap="XXX" → 400 "Cấp phê duyệt không hợp lệ" |
| BR-321-03 | Từ chối bắt buộc lý do ≥ 10 ký tự; reject ở C2 → REJECTED_LEVEL2, C1 → REJECTED_LEVEL1 | reject thiếu lyDo → 400; hồ sơ APPROVED_LEVEL2 reject → REJECTED_LEVEL2 + rejectionReason |
| BR-321-04 | 4-eyes: người duyệt ≠ người gửi | approve bởi user đã submit → từ chối thao tác |
| BR-321-05 | Ghi người + thời điểm (+nội dung trim, ≤1000) mỗi bước | Sau approve C1: `portAuthorityApprovedAt/By` có giá trị |
| BR-321-06 | APPROVED = hồ sơ chính thức; chỉ bản ghi APPROVED trong `/options` | Dropdown cảng/đơn vị khác không thấy hồ sơ DRAFT/PENDING |
| BR-321-07 | Nút duyệt theo cấp + quyền; không quyền → ẩn nút | User không có approvec1 → không thấy "Cảng vụ phê duyệt" |
| BR-321-08 | Duyệt trong DataScope (Cục full) | User Cảng vụ không thấy hồ sơ đơn vị khác để duyệt |

## 4. Luồng chính

1. Hồ sơ ở `APPROVED_LEVEL1` → lãnh đạo Cảng vụ/Chi cục bấm "Cảng vụ phê duyệt" (hoặc "Từ chối").
2. Popup: nhập Nội dung phê duyệt (không bắt buộc) hoặc Lý do từ chối (bắt buộc).
3. POST `/api/v1/buoy-berth/{id}/approve` (cap=CANG_VU) hoặc `/reject`.
4. Hồ sơ sang `APPROVED_LEVEL2` / `REJECTED_LEVEL1`.
5. Vòng 2 tương tự với cap=CUC → `APPROVED` / `REJECTED_LEVEL2`.

**Luồng lỗi:** trạng thái sai → 400 với message tiếng Việt; lý do ngắn → chặn gửi; tự duyệt → chặn.

## 5. Trạng thái

Bảng chuyển trạng thái đầy đủ tại feature-brief F-321 mục 3 và `ba/00-lean-spec.md` mục 5. **⚠️ Drift c.6:** code dùng APPROVED_LEVEL1 = chờ C1, APPROVED_LEVEL2 = chờ C2 (lệch tài liệu chung dùng PENDING_APPROVAL/APPROVED_LEVEL1) — ghi nhận, không sửa.

## 6. Validation

`cap` NotBlank; `lyDo` NotBlank + ≥ 10 ký tự (tài liệu chung 3.4); `content` không bắt buộc, trim, ≤ 1000.

## 7. Data scope & phân quyền

- DataScope theo đơn vị người duyệt; Cục full qua `orgunit:scope_all`.
- Quyền: `buoyberth:approve` + `buoyberth:approvec1` (C1) / `buoyberth:approvec2` (C2); submit = `buoyberth:update`. Admin Cục full + metadata.
- ⚠️ Drift c.7: `@PreAuthorize` đang comment — đã ghi nhận, không sửa.

## 8. Tài liệu tham chiếu

`ba/00-lean-spec.md` (module mục 5, 9, 11) · feature-brief F-321 · `BuoyBerthApprovalService.java` · `ApproveRequest.java`/`RejectRequest.java` · `BuoyBerthController.java` (approve/reject).
