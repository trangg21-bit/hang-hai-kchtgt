---
id: F-015
name: Quản lý Bến cảng - Cập nhật
slug: ql-bc-cap-nhat
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:42Z
last-updated: 2026-07-31
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Bến cảng - Cập nhật

**Tài liệu:** BA Feature Brief
**Feature:** F-015 — Quản lý Bến cảng - Cập nhật
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-07-31

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cập nhật Bến cảng cho phép người dùng có thẩm quyền chỉnh sửa thông tin Bến cảng đã tồn tại. Form **pre-fill** từ `GET /api/v1/ben-cang/:id`. Các trường bất biến: **Mã bến** (RO), **Đơn vị quản lý** (RO). Nếu đổi **Cảng biển** → sinh lại mã bến.

Sau khi lưu, tùy theo action:
- **Lưu tạm:** giữ nguyên trạng thái hiện tại
- **Gửi phê duyệt:** reset `trangThaiPheDuyet = CHO_PHE_DUYET` (bắt đầu lại từ Cảng vụ), **reset tất cả trường audit phê duyệt về NULL** (`ngay_pd_cang_vu`, `can_bo_pd_cang_vu`, `ngay_pd_cuc`, `can_bo_pd_cuc`), lưu `ngay_gui_phe_duyet`, `can_bo_gui_phe_duyet`, tạo `LichSuThayDoi`
- **Lưu và phê duyệt** (admin-op/system-admin): `status = DA_PHE_DUYET` ngay

### 1.2. Tại sao cần tính năng này?

- Dữ liệu Bến cảng luôn phản ánh đúng tình trạng thực tế
- Mọi thay đổi được ghi nhận qua LichSuThayDoi
- Reset phê duyệt + xóa audit cũ đảm bảo quy trình 2 cấp được thực hiện lại từ đầu
- Khi đổi Cảng biển, mã bến sinh lại tự động

### 1.3. Luồng hoạt động chính

Danh sách/Chi tiết → "Chỉnh sửa" → GET pre-fill → sửa → chọn action: Lưu tạm / Gửi PD / Lưu & PD.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Logic phân quyền chung

| Vai trò | Quyền thao tác | Ghi chú |
|---|---|---|
| system-admin (Admin Cục) | Cập nhật, Lưu tạm, Gửi PD, Lưu & PD | Toàn quyền |
| admin-operation | Cập nhật, Lưu tạm, Gửi PD, Lưu & PD | Vai trò vận hành |
| admin | Cập nhật, Lưu tạm | Không Gửi PD |
| Chuyên viên / Lãnh đạo đơn vị | Cập nhật, Lưu tạm | ĐVQL auto-fill RO |
| Lãnh đạo (cấp Cục) | Không | Chỉ duyệt từ F-017 |
| Cá nhân | Không | |

### 2.2. Admin Cục: xem người sửa, thời gian sửa, lịch sử PD

---

## 3. User Stories

### Mức Must
- **US-015-01:** Mở form chỉnh sửa, pre-fill đầy đủ. Mã bến + ĐVQL RO.
- **US-015-02:** Chỉnh sửa các trường, "Lưu tạm" giữ nguyên trạng thái.
- **US-015-03:** "Gửi phê duyệt" → reset về CHO_PHE_DUYET, xóa audit PD cũ, lưu ngày/người gửi.
- **US-015-04:** admin-op/system-admin: "Lưu và phê duyệt" → DA_PHE_DUYET ngay.
- **US-015-05:** Đổi Cảng biển → sinh lại mã bến.
- **US-015-06:** Mọi cập nhật tạo LichSuThayDoi.

### Mức Should
- **US-015-07:** Nút "Hủy" có xác nhận nếu thay đổi.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Pre-fill
**AC-015-01:** GET pre-fill 26 trường. Mã bến RO, ĐVQL RO. Lỗi → toast.
**AC-015-02:** Đổi Cảng biển → `GET /generate-code` → sinh mã mới + cảnh báo.

### Nhóm 2: Lưu tạm
**AC-015-03:** "Lưu tạm" → PUT action=draft → giữ nguyên status, tạo LichSuThayDoi.

### Nhóm 3: Gửi phê duyệt
**AC-015-04:** "Gửi PD" → PUT action=submit → `status=CHO_PHE_DUYET`, **reset `ngay_pd_cang_vu`, `can_bo_pd_cang_vu`, `ngay_pd_cuc`, `can_bo_pd_cuc` về NULL**, lưu `ngay_gui_phe_duyet`, `can_bo_gui_phe_duyet`, tạo LichSuThayDoi → toast "Đã gửi phê duyệt, chờ Cảng vụ/Chi cục duyệt".
**AC-015-05:** Thiếu trường bắt buộc hoặc 0 GPS → lỗi.

### Nhóm 4: Lưu và phê duyệt
**AC-015-06:** admin-op/system-admin → `status=DA_PHE_DUYET`, tạo PheDuyetLog (cap=CUC) + LichSuThayDoi.

### Nhóm 5: Xác thực & Audit
**AC-015-07:** GPS [-90,90], [-180,180]. Số ≥0.
**AC-015-08:** LichSuThayDoi: fieldChanged, oldValue, newValue, changedBy, changedAt.

### Nhóm 6: Phân quyền
**AC-015-09:** "Gửi PD" cho admin-op/system-admin. "Lưu & PD" cho admin-op/system-admin. "Lưu tạm" cho tất cả.
**AC-015-10:** Lãnh đạo (cấp Cục)/Cá nhân → ẩn nút "Chỉnh sửa", HTTP 403.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-015-01 | **Mã bến bất biến** — RO; đổi Cảng biển → tự sinh lại | Cập nhật | Thiết kế | Đổi Cảng biển |
| BR-015-02 | **ĐVQL bất biến tuyệt đối** — mọi trạng thái, mọi vai trò | Cập nhật | Nghiệp vụ | Không |
| BR-015-03 | **Reset phê duyệt khi Gửi PD** — `CHO_PHE_DUYET`; reset `ngay_pd_cang_vu`, `can_bo_pd_cang_vu`, `ngay_pd_cuc`, `can_bo_pd_cuc` về NULL | Gửi PD | Nghiệp vụ | Lưu & PD → DA_PHE_DUYET |
| BR-015-04 | **Lưu ngày/người gửi PD** — `ngay_gui_phe_duyet`, `can_bo_gui_phe_duyet` | Gửi PD | F-018 | Không |
| BR-015-05 | **Lưu tạm không reset trạng thái** — giữ nguyên status | Lưu tạm | Nghiệp vụ | Không |
| BR-015-06 | **LichSuThayDoi bắt buộc** — mọi lần cập nhật | Cập nhật | Audit | Không |
| BR-015-07 | **GPS, Loại kết cấu, File** — như F-014 | Cập nhật | — | — |

---

## 6. Mô hình dữ liệu

Như F-014 section 6. Bổ sung:

### 6.1. Bảng `lich_su_thay_doi`
- id, ben_cang_id, field_changed, old_value, new_value, changed_by, changed_at

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/ben-cang/{id}` | Pre-fill form | `bencang:update` |
| PUT | `/api/v1/ben-cang/{id}` | Cập nhật. Body: action + các trường + coordinates[] | `bencang:update` |
| GET | `/api/v1/ben-cang/generate-code?cangBienId=` | Sinh lại mã khi đổi CB | `bencang:update` |
| GET | `/api/v1/cang-bien?orgUnitId=&status=HIEN_HANH` | Danh sách CB | `bencang:update` |
| POST | `/api/v1/ben-cang/{id}/attachments` | Upload file | `bencang:update` |
| DELETE | `/api/v1/ben-cang/{id}/attachments/{attId}` | Xóa file | `bencang:update` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Pre-fill
GET → form 26 trường → Mã bến RO, ĐVQL RO.

### 8.2. Đổi Cảng biển
Đổi → GET /generate-code → mã mới + cảnh báo.

### 8.3. Gửi phê duyệt (có reset audit)
```
"Gửi phê duyệt" → PUT action=submit
→ UPDATE status=CHO_PHE_DUYET
→ SET ngay_pd_cang_vu=NULL, can_bo_pd_cang_vu=NULL, ngay_pd_cuc=NULL, can_bo_pd_cuc=NULL
→ SET ngay_gui_phe_duyet=NOW(), can_bo_gui_phe_duyet=currentUser
→ INSERT lich_su_thay_doi (từng trường thay đổi)
→ toast "Đã gửi phê duyệt, chờ Cảng vụ/Chi cục duyệt"
```

### 8.4. Lưu và phê duyệt
```
admin-op/system-admin → "Lưu và phê duyệt"
→ PUT action=approve → status=DA_PHE_DUYET
→ INSERT phe_duyet_log (cap=CUC, action=APPROVE) + lich_su_thay_doi
```

---

## 9. Yêu cầu phi chức năng

- Hiệu năng: GET ≤500ms, PUT ≤2s, ≥50 concurrent
- Bảo mật: RBAC; tampering detection mã bến + ĐVQL; HTTPS
- Độ tin cậy: Transaction atomicity; rollback toàn bộ
- UX: Pre-fill mượt; loading indicator; toast; modal xác nhận rời form
- Pháp lý: LichSuThayDoi ≥2 năm

---

## 10. Yêu cầu giao diện

> Token từ theme.ts và tokens.ts.

### 10.1. Cấu trúc form (giống F-014, pre-fill)

5 nhóm: Thông tin chung (ĐVQL RO, Mã bến RO) → Công bố → Vị trí → File → Action

### 10.2. Action buttons

- "Lưu tạm" (outlined)
- "Gửi phê duyệt" (primary) — admin-op/system-admin
- "Lưu và phê duyệt" (primary) — admin-op/system-admin

### 10.3. Bảng trường form

Như F-014. Khác biệt: ĐVQL RO, Mã bến RO.

---

## Consolidation Note

Merged with UI feature F-076 (ui-ql-bc-cap-nhat) — 2026-07-31
