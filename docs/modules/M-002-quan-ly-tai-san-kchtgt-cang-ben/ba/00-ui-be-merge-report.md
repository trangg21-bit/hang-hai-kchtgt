---
id: M-002-ui-be-merge-report
module-id: M-002
name: "UI → BE feature-brief merge report"
slug: ui-be-merge-report
created: 2026-08-21
---

# Báo cáo merge UI feature-brief → BE feature-brief — Module M-002

**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại công việc:** Đối soát tài liệu (documentation-only reconciliation) — không đổi mã nguồn, không đổi `implementations.yaml`.
**Ngày thực hiện:** 2026-08-21

---

## 1. Tóm tắt

- **20 UI feature-brief** (F-078..F-083, F-088..F-092, F-097, F-098, F-101..F-107) được merge vào **15 BE feature-brief** đích theo mapping trong brief.
- **5 brief Cầu cảng** (F-020, F-021, F-022, F-024, F-025) được chuẩn hóa: nội dung merged hiện nằm tại `feature-brief.md` **gốc của feature dir**; `ba/feature-brief.md` cũ đã xóa. `ba/00-lean-spec.md` của 5 feature này **giữ nguyên**.
- **Xóa sau merge:** `feature-brief.md` của cả 20 UI dir + `F-078-ui-ql-cc-danh-sach/ba/00-lean-spec.md`.
- Tất cả 30 BE feature-brief (F-008..F-037) còn nguyên và chứa nội dung UI đã merge.

---

## 2. Bảng mapping chi tiết

| UI brief (dir) | UI nội dung | BE đích | Trạng thái trước merge | Đã merge gì |
|---|---|---|---|---|
| F-078-ui-ql-cc-danh-sach | Danh sách Cầu cảng | **F-024 (xem-cc)** | BE đã có màn chi tiết; **thiếu** màn danh sách | Thêm API list (GET `/api/v1/cau-cang` + dropdown CB/BC), mục 9.2 (cột, bộ lọc, hành động dòng, phân trang), mục 11.9 (ScreenHeader/FilterBar/StatusTabs/DataTable/Pagination + states + mobile) |
| F-079-ui-xem-cc-chi-tiet | Chi tiết Cầu cảng | **F-024 (xem-cc)** | Nội dung chi tiết (badge, breadcrumb, actions, download/print, approve/reject) **đã có sẵn** trong F-024 | Xác nhận đã phủ, không thêm lại |
| F-105-ui-upload-giayto-cc | Upload giấy tờ Cầu cảng | **F-024 (xem-cc)** | Thiếu luồng upload | Thêm API POST/DELETE giay-to, mục 11.10 (button "Thêm văn bản đính kèm", modal, luồng, BR-105-01..06, phân quyền) |
| F-080-ui-ql-cc-tao-moi | Tạo mới Cầu cảng | **F-020 (ql-cc-tao-moi)** | BE (tại `ba/feature-brief.md`) **đã merge sẵn** UI (11.1-11.8 FormCrud, fields A-H, states, mobile) | Chuẩn hóa vị trí: ghi ra root `feature-brief.md`, xóa `ba/feature-brief.md` |
| F-081-ui-ql-cc-cap-nhat | Cập nhật Cầu cảng | **F-021 (ql-cc-cap-nhat)** | BE (tại `ba/feature-brief.md`) **đã merge sẵn** UI (mục 6 FormCrud EDIT) | Chuẩn hóa vị trí: ghi ra root, xóa `ba/feature-brief.md` |
| F-082-ui-phe-duyet-cc | Phê duyệt Cầu cảng | **F-023 (phe-duyet-cc)** | BE root **chưa có** UI (template cũ) | Thêm `### UI Flow`, `## UI Scope` (dialog xác nhận, reason ≥10 ký tự, POST approve/reject, PheDuyetLog, toasts, RBAC), `## Consolidation Note` |
| F-097-ui-ql-cc-xoa | Xóa Cầu cảng | **F-022 (ql-cc-xoa)** | BE (tại `ba/feature-brief.md`) **đã merge sẵn** UI (mục 6 dialog xác nhận, toast, refresh) | Chuẩn hóa vị trí: ghi ra root, xóa `ba/feature-brief.md` |
| F-098-ui-ql-cc-lich-su | Lịch sử Cầu cảng | **F-025 (ql-cc-lich-su)** | BE (tại `ba/feature-brief.md`) **đã merge sẵn** UI (mục 10 card box, FilterBar, badges, states) | Chuẩn hóa vị trí: ghi ra root, xóa `ba/feature-brief.md` |
| F-083-ui-ql-cct-danh-sach | Danh sách Cảng cạn | **F-030 (xem-cct)** | BE chỉ có màn chi tiết; **thiếu** màn danh sách | Thêm API GET list + PUT submit, mục 11 (hành động dòng, gửi phê duyệt, UI list-view, BR-083-01..08) |
| F-106-ui-upload-giayto-cct | Upload giấy tờ Cảng cạn | **F-030 (xem-cct)** | Thiếu upload | Thêm API attachments (POST/GET/DELETE), mục 12 (thông số, validation, BR-106-01..05, bảng `dry_port_attachments`, UI upload) |
| F-088-ui-ql-vn-danh-sach | Danh sách Vùng nước | **F-036 (xem-vn)** | **Đã merge sẵn** (merged-from: F-088-UI) | Xác nhận đã phủ (list components, field mapping, cột bảng), không thêm lại |
| F-089-ui-xem-vn-chi-tiet | Chi tiết Vùng nước | **F-036 (xem-vn)** | **Đã merge sẵn** (merged-from: F-089-UI) | Xác nhận đã phủ (5-card layout, badges, audit), không thêm lại |
| F-107-ui-upload-giayto-vn | Upload giấy tờ Vùng nước | **F-036 (xem-vn)** | Thiếu upload | Thêm API POST/DELETE giay-to, mục 10.8 (button, modal, luồng, BR-107-01..06, phân quyền) |
| F-090-ui-ql-vn-tao-moi | Tạo mới Vùng nước | **F-032 (ql-vn-tao-moi)** | **Đã merge sẵn** (merged-from: F-090-UI) | Xác nhận đã phủ (form fields, Zod, UX), không thêm lại |
| F-091-ui-ql-vn-cap-nhat | Cập nhật Vùng nước | **F-033 (ql-vn-cap-nhat)** | **Đã merge sẵn** (merged-from: F-091-UI) | Xác nhận đã phủ (readonly maVungNuoc, prefill, LichSuThayDoi), không thêm lại |
| F-092-ui-phe-duyet-vn | Phê duyệt Vùng nước | **F-035 (phe-duyet-vn)** | **Đã merge sẵn** (merged-from: F-092-UI) | Xác nhận đã phủ (modal 2 tab, reason ≥10, PheDuyetLog), không thêm lại |
| F-101-ui-ql-vn-xoa | Xóa Vùng nước | **F-034 (ql-vn-xoa)** | **Đã merge sẵn** (merged-from: F-101-UI) | Xác nhận đã phủ (soft-delete, confirm dialog), không thêm lại |
| F-102-ui-ql-vn-lich-su | Lịch sử Vùng nước | **F-037 (ql-vn-lich-su)** | **Đã merge sẵn** (merged-from: F-102-UI) | Xác nhận đã phủ (table, CREATE indicator, field filter), không thêm lại |
| F-103-ui-upload-giayto-cb | Upload giấy tờ Cảng biển | **F-012 (xem-cb)** | F-012 đã có hiển thị đính kèm (AC-012-07, BR-012-05, bảng port_attachment) nhưng **thiếu luồng upload** | Thêm API POST/GET/DELETE giay-to, mục 11 (button, modal, luồng, BR-103-01..06, phân quyền) |
| F-104-ui-upload-giayto-bc | Upload giấy tờ Bến cảng | **F-018 (xem-bc)** | F-018 đã merge F-073/F-074 (list + chi tiết) nhưng **thiếu luồng upload** | Thêm API POST/GET/DELETE giay-to, mục 11 (button, modal, luồng, BR-104-01..06, phân quyền) |

**Ghi chú mapping upload:** mỗi UI upload brief tham chiếu trang chi tiết của thực thể (F-103 → "trang chi tiết Cảng biển (F-069)", F-104 → F-074, F-105 → F-079, F-106 → F-030, F-107 → F-089) — các trang này đều đã được hợp nhất về BE đích (F-069/F-070 → F-012; F-073/F-074 → F-018; F-078/F-079 → F-024; F-083 → F-030; F-088/F-089 → F-036), nên nội dung upload được merge vào đúng BE đích. ✅

---

## 3. Các file đã xóa

### 3.1. `feature-brief.md` của 20 UI dir (đã xóa sau khi merge)

| Dir | BE đích |
|---|---|
| `F-078-ui-ql-cc-danh-sach` | F-024 |
| `F-079-ui-xem-cc-chi-tiet` | F-024 |
| `F-080-ui-ql-cc-tao-moi` | F-020 |
| `F-081-ui-ql-cc-cap-nhat` | F-021 |
| `F-082-ui-phe-duyet-cc` | F-023 |
| `F-083-ui-ql-cct-danh-sach` | F-030 |
| `F-088-ui-ql-vn-danh-sach` | F-036 |
| `F-089-ui-xem-vn-chi-tiet` | F-036 |
| `F-090-ui-ql-vn-tao-moi` | F-032 |
| `F-091-ui-ql-vn-cap-nhat` | F-033 |
| `F-092-ui-phe-duyet-vn` | F-035 |
| `F-097-ui-ql-cc-xoa` | F-022 |
| `F-098-ui-ql-cc-lich-su` | F-025 |
| `F-101-ui-ql-vn-xoa` | F-034 |
| `F-102-ui-ql-vn-lich-su` | F-037 |
| `F-103-ui-upload-giayto-cb` | F-012 |
| `F-104-ui-upload-giayto-bc` | F-018 |
| `F-105-ui-upload-giayto-cc` | F-024 |
| `F-106-ui-upload-giayto-cct` | F-030 |
| `F-107-ui-upload-giayto-vn` | F-036 |

### 3.2. File khác đã xóa

- `F-078-ui-ql-cc-danh-sach/ba/00-lean-spec.md` — xóa theo brief.

### 3.3. Xác nhận 5 Cau cảng chuẩn hóa

| Feature | `feature-brief.md` ở ROOT? | `ba/feature-brief.md` cũ đã xóa? | `ba/00-lean-spec.md` giữ nguyên? |
|---|---|---|---|
| F-020-ql-cc-tao-moi | ✅ Có | ✅ Đã xóa | ✅ Còn |
| F-021-ql-cc-cap-nhat | ✅ Có | ✅ Đã xóa | ✅ Còn |
| F-022-ql-cc-xoa | ✅ Có | ✅ Đã xóa | ✅ Còn |
| F-024-xem-cc | ✅ Có | ✅ Đã xóa | ✅ Còn |
| F-025-ql-cc-lich-su | ✅ Có | ✅ Đã xóa | ✅ Còn |

---

## 4. Ghi chú kiểm soát phạm vi

- **Không sửa** `implementations.yaml` (module-level + feature-level): module-level `docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/implementations.yaml` giữ nguyên; 30 file `implementations.yaml` của BE features (F-008..F-037) giữ nguyên — đã xác minh bằng glob trước và sau.
- **Không sửa** `ba/00-lean-spec.md` của BE features (F-008..F-037): giữ nguyên.
- **Không chạm** `src/`, `frontend/src/`, module M-001/M-003/M-004, `docs/intel`.
- **Không chạy git** (không add/commit/push).

### ⚠️ Quan sát cần xác minh (không thuộc thao tác của run này)

- Tại thời điểm bắt đầu session, listing `_features/F-078-ui-ql-cc-danh-sach` hiển thị có file `implementations.yaml`; tuy nhiên tại thời điểm kiểm tra cuối, thư mục UI chỉ còn `ba/` (rỗng) — **không còn** `implementations.yaml` nào dưới các UI dir.
- Payload trả về của cả 2 patch (5 move + 21 delete) **không chứa bất kỳ thao tác nào** trên `implementations.yaml` (đã search toàn văn payload, 0 match). Các thao tác của run này chỉ là: 5 move `ba/feature-brief.md → feature-brief.md` và 21 delete (20 `feature-brief.md` + 1 `F-078/ba/00-lean-spec.md`).
- Ngoài ra, projection SDLC (`ai-kit query module-features`) chỉ đăng ký F-008..F-037; 20 UI feature-brief hiện diện trong `drift-files` với `produced_at: null` — tức chưa từng được projection ghi nhận chính thức.
- **Khuyến nghị:** PMO/tech-lead xác minh bằng git (ví dụ `git status`/`git diff --stat` trên `docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/_features/F-0*-ui-*/`) để xác định nguyên trạng các `implementations.yaml` của UI dir trước run; nếu chúng từng tồn tại và bị xóa ngoài run này, cần khôi phục từ git.

---

## 5. Kết luận

1. ✅ Cả 15 BE đích (F-012, F-018, F-020, F-021, F-022, F-023, F-024, F-025, F-030, F-032, F-033, F-034, F-035, F-036, F-037) chứa nội dung UI đã merge, không mất nội dung (screen/field/flow/component).
2. ✅ `feature-brief.md` của 20 UI dir đã xóa; `F-078/ba/00-lean-spec.md` đã xóa.
3. ✅ F-020/021/022/024/025 có `feature-brief.md` ở root; `ba/feature-brief.md` cũ không còn.
4. ✅ Báo cáo này nằm tại `docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/ba/00-ui-be-merge-report.md` và liệt kê đầy đủ mapping.
5. ⚠️ Chỉ có file trong `docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/` bị thay đổi (cộng quan sát mục 4 về UI implementations.yaml cần xác minh git).
