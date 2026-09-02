---
id: F-321
name: "Phê duyệt Bến phao"
slug: phe-duyet-bp
module-id: M-026
status: proposed
classification: local
priority: medium
created: "2026-08-28"
last-updated: "2026-08-28"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Phê duyệt Bến phao

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-321
**Module:** M-026 — Quản lý Bến phao
**Loại:** chức năng **có bước phê duyệt** (2 cấp C1→C2)
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + `docs/conventions/approval-2-level-spec.md` mục 3 (quy trình chung 28 loại KCHT) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module (`ba/00-lean-spec.md`) để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):** người duyệt C1/C2 chỉ nhìn thấy hồ sơ thuộc phạm vi đơn vị mình (DataScope); lãnh đạo Cục duyệt C2 xem full qua `orgunit:scope_all`/`admin:all`. Khai báo đầy đủ ở mục 5, dòng 3 — SA chốt khi duyệt.

---

## 1. Mô tả ngắn

Hồ sơ bến phao sau khi gửi duyệt trải qua **2 vòng phê duyệt đúng thứ tự, không nhảy vòng**: vòng 1 — Lãnh đạo Cảng vụ/Chi cục duyệt (C1); vòng 2 — Lãnh đạo Cục duyệt (C2). Người duyệt đồng ý (có thể kèm nội dung phê duyệt) hoặc từ chối (bắt buộc nhập lý do ≥ 10 ký tự). Chống tự duyệt (4-eyes): người duyệt không duyệt hồ sơ do chính mình gửi. Mỗi lần gửi/duyệt/từ chối ghi người thực hiện + thời điểm + nội dung (approval-audit columns trên bản ghi). Hồ sơ đã duyệt là hồ sơ chính thức có hiệu lực, xuất hiện trong mọi dropdown options (APPROVED ONLY).

## 2. Trường dữ liệu

Không có form nhập dữ liệu hồ sơ. Popup phê duyệt gồm: trạng thái hiện tại (badge read-only), nút "Đồng ý" (kèm ô nhập **Nội dung phê duyệt** — không bắt buộc) hoặc "Từ chối" (kèm ô nhập **Lý do từ chối** — bắt buộc, ≥ 10 ký tự). Các approval-audit columns hiển thị ở tab "Xử lý & theo dõi" của drawer chi tiết (xem ma trận mục 4: trường 47–57).

## 3. Trạng thái và phê duyệt

**Phần phê duyệt: theo `docs/conventions/approval-2-level-spec.md` (mục 3).** Trạng thái lưu dạng số (7 trạng thái chuẩn). Quy trình đầy đủ:

1. **Gửi duyệt** (F-318/F-319): hồ sơ DRAFT/REJECTED_* bấm "Lưu và gửi phê duyệt" → `APPROVED_LEVEL1` (chờ Cảng vụ/Chi cục), ghi `submittedForApprovalAt/By`.
2. **Vòng 1 — Cảng vụ/Chi cục:** lãnh đạo Cảng vụ/Chi cục có quyền `buoyberth:approve`/`buoyberth:approvec1` bấm "Cảng vụ phê duyệt" → Đồng ý: `APPROVED_LEVEL2` (chờ Cục), ghi `portAuthorityApprovedAt/By` + nội dung; Từ chối: `REJECTED_LEVEL1`, ghi `rejectionReason`.
3. **Vòng 2 — Cục:** lãnh đạo Cục bấm "Cục phê duyệt" → Đồng ý: `APPROVED` (hoàn tất), ghi `departmentApprovedAt/By` + nội dung; Từ chối: `REJECTED_LEVEL2`, ghi `rejectionReason`.
4. **Sau từ chối:** người nhập sửa + gửi lại → quay `APPROVED_LEVEL1` (luôn vào lại vòng 1, kể cả bị Cục trả về).
5. **Hồ sơ Đã duyệt:** chỉ sửa qua "Lưu và phê duyệt" (người có quyền phê duyệt), giữ nguyên `APPROVED`.

| Từ | Hành động | Sang | Ai |
|---|---|---|---|
| `DRAFT` | Gửi duyệt | `APPROVED_LEVEL1` | Người nhập |
| `APPROVED_LEVEL1` | Đồng ý C1 | `APPROVED_LEVEL2` | Cảng vụ/Chi cục |
| `APPROVED_LEVEL1` | Từ chối C1 | `REJECTED_LEVEL1` | Cảng vụ/Chi cục |
| `APPROVED_LEVEL2` | Đồng ý C2 | `APPROVED` | Cục |
| `APPROVED_LEVEL2` | Từ chối C2 | `REJECTED_LEVEL2` | Cục |
| `REJECTED_LEVEL1`/`REJECTED_LEVEL2` | Sửa + gửi lại | `APPROVED_LEVEL1` | Người nhập |

**Quy tắc bắt buộc (tài liệu chung mục 3.3–3.5):** chống tự duyệt 4-eyes (người duyệt không duyệt hồ sơ mình gửi); từ chối bắt buộc lý do ≥ 10 ký tự; mỗi gửi/duyệt/từ chối ghi người + thời điểm; không được nhảy vòng, không duyệt ngược, không gửi duyệt khi thiếu trường bắt buộc.

**⚠️ ĐỘ LỆCH CODE (drift c.6 — ghi nhận, không sửa):** code dùng `APPROVED_LEVEL1` = chờ C1, `APPROVED_LEVEL2` = chờ C2 (tài liệu chung mục 3.1 dùng `PENDING_APPROVAL` = chờ C1, `APPROVED_LEVEL1` = chờ C2). Trạng thái nghiệp vụ đúng 7 giá trị; cần SA/QA đối chiếu khi xử lý drift.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md` + `approval-2-level-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-321-01 | Duyệt 2 vòng đúng thứ tự: C1 (Cảng vụ/Chi cục) trước, C2 (Cục) sau; không nhảy vòng (`APPROVED_LEVEL1`→`APPROVED` bị chặn), không duyệt ngược | Approve |
| BR-321-02 | `approve` với `cap=CANG_VU` chỉ hợp lệ khi hồ sơ `APPROVED_LEVEL1` (lỗi: "Không thể phê duyệt cấp Cảng vụ: trạng thái hiện tại không hợp lệ"); `cap=CUC` chỉ hợp lệ khi `APPROVED_LEVEL2` (lỗi: "…cần phê duyệt cấp Cảng vụ trước"); `cap` khác → "Cấp phê duyệt không hợp lệ" | Approve |
| BR-321-03 | Từ chối bắt buộc lý do ≥ 10 ký tự; ghi vào `rejectionReason`; reject cấp C2 → `REJECTED_LEVEL2`, cấp C1 → `REJECTED_LEVEL1` | Reject |
| BR-321-04 | Chống tự duyệt (4-eyes): người duyệt không duyệt hồ sơ do chính mình gửi (`submittedForApprovalBy = người duyệt` → từ chối) | Approve/Reject |
| BR-321-05 | Mỗi gửi/duyệt/từ chối ghi: người thực hiện + thời điểm (+ nội dung phê duyệt nếu có, trim, ≤ 1000 ký tự) vào approval-audit columns của bản ghi | Approve/Reject/Submit |
| BR-321-06 | Hồ sơ `APPROVED` là hồ sơ chính thức: chỉ xuất hiện trong `/options` (APPROVED ONLY); không hạ trạng thái khi sửa sau duyệt (giữ `APPROVED`) | Approve/Read |
| BR-321-07 | Nút duyệt chỉ hiện với người có quyền và đúng cấp: C1 → `buoyberth:approve`/`approvec1` trên hồ sơ `APPROVED_LEVEL1`; C2 → `buoyberth:approve`/`approvec2` trên hồ sơ `APPROVED_LEVEL2`; không có quyền → ẩn nút | Approve |
| BR-321-08 | Duyệt/từ chối phải trong phạm vi DataScope của người duyệt (Cục xem full qua `orgunit:scope_all`) | Approve/Reject |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-321-01 — Duyệt C1→C2:** Gửi duyệt hồ sơ → `APPROVED_LEVEL1`; C1 đồng ý → `APPROVED_LEVEL2` + `portAuthorityApprovedAt/By`; C2 đồng ý → `APPROVED` + `departmentApprovedAt/By`; hồ sơ xuất hiện trong dropdown options của màn khác.
- **AC-321-02 — Từ chối:** C1 từ chối kèm lý do → `REJECTED_LEVEL1` + `rejectionReason`; bỏ trống lý do / < 10 ký tự → không gửi được. Sửa + gửi lại → `APPROVED_LEVEL1` (vào lại vòng 1).
- **AC-321-03 — Chặn nhảy vòng:** Gọi approve CUC trên hồ sơ `APPROVED_LEVEL1` → lỗi "cần phê duyệt cấp Cảng vụ trước"; gọi approve CANG_VU trên hồ sơ `APPROVED` → lỗi trạng thái không hợp lệ.
- **AC-321-04 — Chống tự duyệt:** Người gửi = người duyệt → bị từ chối thao tác (4-eyes).

### 4.3. User Stories kế thừa (nếu có)

- **US-321-01:** Là lãnh đạo Cảng vụ, tôi muốn duyệt hồ sơ bến phao của đơn vị mình để đưa lên Cục xem xét.
- **US-321-02:** Là lãnh đạo Cục, tôi muốn duyệt vòng cuối để hồ sơ chính thức có hiệu lực.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Duyệt/từ chối vòng 1 (C1) | `buoyberth:approve`, `buoyberth:approvec1` |
| Duyệt/từ chối vòng 2 (C2) | `buoyberth:approve`, `buoyberth:approvec2` |
| Gửi duyệt (submit) | `buoyberth:update` |
| Sửa hồ sơ APPROVED ("Lưu và phê duyệt") | `buoyberth:approvec2` |

**Admin Cục:** full quyền `buoyberth:*` + xem thêm metadata (người tạo, người sửa cuối, thời gian) — theo tài liệu nền mục 3.7/3.8, không có quyền riêng ngoài seed. **10 quyền `buoyberth:*` ĐÃ SEED — không seed lại.**

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không có — 7 trạng thái chuẩn KCHT |
| 2 | Có bước phê duyệt không | **Có — theo tài liệu nền mục 3** (2 vòng C1→C2, không nhảy vòng, 4-eyes, lý do từ chối ≥ 10 ký tự) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — người duyệt chỉ thấy hồ sơ trong DataScope; Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Nút "Cảng vụ phê duyệt" chỉ trên `APPROVED_LEVEL1`; "Cục phê duyệt" chỉ trên `APPROVED_LEVEL2`; ô lý do từ chối hiện khi bấm Từ chối |
| 5 | Quyền riêng | `buoyberth:approve`, `buoyberth:approvec1`, `buoyberth:approvec2`, `buoyberth:update` (submit) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không — popup duyệt theo mẫu chung; nhãn trạng thái lấy từ nguồn duy nhất (ApprovalStatusBadge — lưu ý drift c.6) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/buoy-berth/{id}/approve` | Duyệt hồ sơ (body `ApproveRequest`: `cap=CANG_VU\|CUC`, `content` không bắt buộc) | `buoyberth:approve` / `approvec1` / `approvec2` |
| POST | `/api/v1/buoy-berth/{id}/reject` | Từ chối hồ sơ (body `RejectRequest`: `cap`, `lyDo` bắt buộc) | `buoyberth:approve` |
| GET | `/api/v1/buoy-berth/{id}` | Nạp hồ sơ + approval-audit columns cho popup duyệt | `buoyberth:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ. *(Bảng `buoy_berths` đã có migration — không đề xuất thay đổi.)*

**Bảng `buoy_berths` — approval-audit columns (đã có):** `approval_status` SMALLINT NOT NULL, `submitted_for_approval_at` TIMESTAMP, `submitted_for_approval_by` VARCHAR(100), `port_authority_approved_at` TIMESTAMP, `port_authority_approved_by` VARCHAR(100), `port_authority_approval_content` VARCHAR(1000), `department_approved_at` TIMESTAMP, `department_approved_by` VARCHAR(100), `department_approval_content` VARCHAR(1000), `rejection_reason` VARCHAR(500). ~~Ghi bảng `approval_logs`/`change_logs`~~ (bảng đã bị drop bởi `V20260825162500` — drift c.8, không khôi phục trong phạm vi brief này).
