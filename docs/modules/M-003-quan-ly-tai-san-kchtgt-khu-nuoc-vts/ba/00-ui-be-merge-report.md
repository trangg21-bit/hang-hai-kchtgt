---
id: M-003-ui-be-merge-report
module-id: M-003
name: "UI → BE feature-brief merge report"
slug: ui-be-merge-report
created: 2026-08-23
---

# Báo cáo merge UI feature-brief → BE feature-brief — Module M-003

**Module:** M-003 — Quản lý tài sản KCHTGT - Khu nước & VTS
**Loại công việc:** Đối soát tài liệu + thực thi merge (documentation reconciliation + merge execution) — không đổi mã nguồn, không đổi `implementations.yaml`.
**Ngày thực hiện:** 2026-08-23
**Trạng thái: ✅ ĐÃ THỰC THI**

---

## 1. Tóm tắt

- **2 UI feature-brief** của module M-003 được gán mapping hợp nhất về **2 BE feature-brief đích** và **đã merge thực thi trong run này**:
  - `F-068-quan-ly-tram-radar-xem-danh-sach` (UI "Danh sách Trạm radar") → **F-060 (xem-chi-tiet-tram-radar)** — ✅ đã merge
  - `F-XX1-quan-ly-co-so-sua-chua-dong-tau-danh-sach` (UI "Danh sách CSSCĐT") → **F-054 (xem-chi-tiet-co-so-sua-chua-dong-tau)** — ✅ đã merge
- Trước merge, cả 2 BE đích **chỉ có màn hình chi tiết** (F-060: `GET /radar-station/:id`, `GET /radar-station/:id/history`; F-054: `GET /co-so-sua-chua/:id`, `GET /co-so-sua-chua/:id/history`, `GET /co-so-sua-chua/:id/attachments/:fileId/download`) và **thiếu màn hình danh sách** — đúng dạng lỗ hổng đã xử lý ở M-002 (F-078 → F-024, F-083 → F-030). Sau merge, cả 2 brief đích đều chứa đầy đủ nội dung danh sách (API list, cột, bộ lọc, tab trạng thái, hành động dòng, phân trang, RBAC, lọc `orgUnitId`).
- **Toàn bộ trạng thái phê duyệt trong nội dung merge được chuẩn hóa sang 7 trạng thái** theo `docs/conventions/approval-2-level-spec.md` §3.1 (`DRAFT`=0, `PENDING_APPROVAL`=2, `APPROVED_LEVEL1`=3, `REJECTED_LEVEL1`=8, `REJECTED_LEVEL2`=9, `APPROVED`=5, `ARCHIVED`=7) — không còn `PROPOSED`/`UNDER_REVIEW`/`REJECTED`/`S_0..S_6` (đã xác minh grep = 0 trên toàn bộ `_features/`).
- **File đã xóa (merge thực thi):**
  - `F-068-quan-ly-tram-radar-xem-danh-sach/feature-brief.md` — ✅ ĐÃ XÓA (giữ nguyên `lean-spec.md`)
  - `F-XX1-quan-ly-co-so-sua-chua-dong-tau-danh-sach/feature-brief.md` — ✅ ĐÃ XÓA (dir chỉ chứa file này → dir rỗng)
- **Đồng bộ 7 trạng thái toàn module:** ngoài F-060/F-054, các brief còn lại của M-003 được rà soát và chuyển sang 7 trạng thái chuẩn (F-038, F-039, F-040, F-041, F-042, F-044, F-045, F-046, F-047, F-048 cả 2 dir, F-051, F-052, F-053, F-055, F-056, F-057, F-058, F-059, F-061, F-062, F-063, F-065) — xem mục 2.2 (F-051/F-052/F-055 bổ sung trong final cleanup pass).
- **Quan sát chỉ báo cáo (không thuộc thao tác run này):**
  1. ⚠️ **Trùng ID F-048**: hai thư mục cùng mang tiền tố F-048 — `F-048-quan-ly-de-ke-danh-sach` (UI "Danh sách Đê/kè") và `F-048-xem-chi-tiet-de-ke` (BE "Xem chi tiết Đê/kè", frontmatter `id: F-048-detail`) — xem mục 4.1.
  2. ⚠️ **Mô hình 4 trạng thái cũ trong `DESIGN.md`**: `DESIGN.md` §2 dùng `PROPOSED / UNDER_REVIEW / APPROVED / REJECTED` (enum `TrangThaiPheDuyet`) trong khi chuẩn hệ thống là **7 trạng thái** (`DRAFT / PENDING_APPROVAL / APPROVED_LEVEL1 / REJECTED_LEVEL1 / REJECTED_LEVEL2 / APPROVED / ARCHIVED`, enum `ApprovalStatus`) — xem mục 4.2. Không thuộc phạm vi run này (chỉ báo cáo).

---

## 2. Bảng mapping chi tiết (đã thực thi)

### 2.1. Nội dung merge chính

| UI brief (dir) | UI nội dung | BE đích | Trạng thái trước merge | Đã merge gì (nội dung đã hợp nhất) |
|---|---|---|---|---|
| F-068-quan-ly-tram-radar-xem-danh-sach | Danh sách Trạm radar — màn hình trung tâm của nhóm Trạm radar: 16 cột (mục 9.2.1), bộ lọc (mục 9.2.2, Đơn vị quản lý dùng **TreeSelect/Cascader dạng cây** giữ `orgUnitId`), hành động dòng gated theo trạng thái (mục 9.2.3: Xóa khi DRAFT, Phê duyệt khi PENDING_APPROVAL/APPROVED_LEVEL1), phân trang 20/100 sort `updatedDate` DESC (mục 9.2.4), UI list-view §11.7 (ScreenHeader + FilterTableLayout/FilterBar/StatusTabs/DataTable/Pagination từ `frontend/src/components/list-view/`, StatusTabs chuẩn Tất cả/Lưu tạm/Chờ duyệt/Đã duyệt/Bị trả về, 4 states loading/empty/error/data, bảng role-visibility, mobile card view) | **F-060 (xem-chi-tiet-tram-radar)** | BE chỉ có màn chi tiết (`GET /radar-station/:id`, `/:id/history`); **thiếu** màn danh sách | ✅ Đã thêm: §1.1/§1.3 list-screen hub + entry flow; API list `GET /api/v1/radar-station?page=&pageSize=&sortBy=&sortOrder=&search=&orgUnitId=&cangBienId=&vtsSystemId=&ttdhVtsId=&donViKhaiThacId=&provinceId=&conditionStatus=&approvalStatus=&tuNgay=&denNgay=` + `GET /api/v1/vts-system?approvalStatus=APPROVED` + `DELETE /api/v1/radar-station/:id`; mục 9.2 (danh sách); mục 11.7 (list-view); badge trạng thái 7 màu chuẩn; Consolidation Note ghi rõ nguồn F-068 |
| F-XX1-quan-ly-co-so-sua-chua-dong-tau-danh-sach | Danh sách CSSCĐT — điểm vào của nhóm CSSCĐT: US-LIST-01..08, AC-LIST-01..09, BR-LIST-01..06, tìm kiếm tên/địa điểm, lọc loại hình dịch vụ / trạng thái phê duyệt / tình trạng / đơn vị, tab trạng thái kèm số lượng, phân trang 20 dòng/trang (đổi 10/20/50), sắp xếp theo `updatedAt` DESC, hành động dòng (Xem/Sửa/Xóa/Gửi duyệt/Lịch sử), mobile card view | **F-054 (xem-chi-tiet-co-so-sua-chua-dong-tau)** | BE chỉ có màn chi tiết (`GET /co-so-sua-chua/:id`, `/:id/history`, `/:id/attachments/:fileId/download`); **thiếu** màn danh sách | ✅ Đã thêm: US-LIST/AC-LIST/BR-LIST (7 trạng thái chuẩn, bỏ `S_0..S_6`); §6 mermaid + bảng trạng thái chuẩn hóa (DRAFT/PENDING_APPROVAL/APPROVED_LEVEL1/REJECTED_LEVEL1/REJECTED_LEVEL2/APPROVED/ARCHIVED); §8 API list/search `GET /api/v1/co-so-sua-chua` + `/search` (quyền `kcht:view`) + bảng query-params (page/size/keyword/orgUnitId/cangBienId/cauCangId/provinceId/loaiHinhDichVu/status/tinhTrang/ngayCapNhatTu/ngayCapNhatDen/sortBy/sortDir); mục 9.2 (danh sách, bộ lọc đơn vị dạng TreeSelect/Cascader giữ `orgUnitId`); mục 11.4/11.5/11.6 (list-view components, states, mobile); Consolidation Note ghi rõ nguồn F-XX1 |

**Ghi chú mapping:** đúng mẫu M-002 — màn hình danh sách được hợp nhất vào feature BE "xem" (view) của cùng nhóm thực thể, vì feature "xem" là nơi giữ màn hình chính của nhóm (list + detail + điều hướng). Các feature BE khác cùng nhóm (tạo mới, cập nhật, xóa, phê duyệt, lịch sử) giữ nguyên.

**Ghi chú ID F-XX1:** thư mục `F-XX1-quan-ly-co-so-sua-chua-dong-tau-danh-sach` có frontmatter `id: F-XXX` (không khớp tên dir `F-XX1`) — đánh dấu cần chuẩn hóa ID khi đăng ký lại feature; brief UI đã merge vào F-054 nên ID dir không còn ý nghĩa hoạt động.

### 2.2. Đồng bộ 7 trạng thái trên các brief còn lại (đã thực thi)

Ngoài F-060/F-054, các brief sau được rà soát và chuyển toàn bộ tham chiếu trạng thái cũ sang 7 trạng thái chuẩn (grep `UNDER_REVIEW` / `PROPOSED (Lưu tạm)` / `\bPROPOSED\b` / `\bREJECTED\b` = **0** trên toàn bộ `_features/` sau khi xong):

| Cluster | Brief đã đồng bộ |
|---|---|
| Luồng hàng hải | F-038, F-039, F-040, F-041, F-042 |
| Đê/kè | F-044, F-045, F-046, F-047, F-048 (cả 2 dir: `xem-chi-tiet-de-ke` + `quan-ly-de-ke-danh-sach`) |
| CSSCĐT | F-051, F-052, F-053, F-055 |
| Trạm radar | F-056, F-057, F-058, F-059, F-061 |
| Hệ thống VTS | F-062, F-063, F-065 |

- 5 brief phê duyệt (F-041, F-047, F-053, F-059, F-065) mô tả đầy đủ luồng 2 cấp với `REJECTED_LEVEL1`/`REJECTED_LEVEL2` (từ chối C1 → REJECTED_LEVEL1, từ chối C2 → REJECTED_LEVEL2), chống tự duyệt 4-eyes, lý do từ chối bắt buộc.
- ⚠️ **Bổ sung (final cleanup pass 2026-08-23):** rà soát lại phát hiện 3 brief CSSCĐT còn mang mô hình trạng thái cũ `S_0..S_6` — **F-051** (luồng lưu/API/JSON/mermaid), **F-052** (bảng điều kiện xóa, luồng xóa, BR/AC), **F-055** (BR-055-06) — đã được chuẩn hóa sang 7 trạng thái theo đúng mapping F-053/F-054 (S_0→ARCHIVED, S_1→DRAFT, S_2→PENDING_APPROVAL, S_3→APPROVED_LEVEL1, S_4→REJECTED_LEVEL1, S_5→REJECTED_LEVEL2, S_6→APPROVED). Sau pass này, grep `S_[0-6]` trên F-051/F-052/F-055 = 0.
- Các brief không còn tham chiếu trạng thái cũ (F-043, F-049, F-050, F-064, F-066, F-067) không cần sửa.

---

## 3. Các file đã xóa (merge thực thi)

### 3.1. ✅ Đã xóa trong run này

| Dir | File | BE đích | Trạng thái |
|---|---|---|---|
| `F-068-quan-ly-tram-radar-xem-danh-sach` | `feature-brief.md` | F-060 | ✅ ĐÃ XÓA (giữ nguyên `lean-spec.md`) |
| `F-XX1-quan-ly-co-so-sua-chua-dong-tau-danh-sach` | `feature-brief.md` | F-054 | ✅ ĐÃ XÓA (dir chỉ chứa file này → dir rỗng) |

### 3.2. Trạng thái hiện tại trên đĩa (đã xác minh sau merge)

| Dir | `feature-brief.md` | `lean-spec.md` | `implementations.yaml` |
|---|---|---|---|
| `F-068-quan-ly-tram-radar-xem-danh-sach` | ❌ Đã xóa | ✅ Còn | Không có |
| `F-XX1-quan-ly-co-so-sua-chua-dong-tau-danh-sach` | ❌ Đã xóa | Không có | Không có (dir rỗng) |
| `F-048-xem-chi-tiet-de-ke` (BE chuẩn) | ✅ Còn | `F-048-detail-lean-spec.md` | ✅ Còn |
| `F-048-quan-ly-de-ke-danh-sach` (UI — xem 4.1) | ✅ Còn | ✅ Còn | Không có |

---

## 4. Quan sát chỉ báo cáo (không thuộc thao tác của run này)

### 4.1. ⚠️ Trùng ID F-048 — hai thư mục cùng tiền tố F-048

- `F-048-quan-ly-de-ke-danh-sach/` — brief UI "Danh sách Đê/kè" (frontmatter `id: F-048`, `slug: ql-de-ke-danh-sach`), chứa `feature-brief.md` + `lean-spec.md`, **không có** `implementations.yaml`.
- `F-048-xem-chi-tiet-de-ke/` — brief BE "Xem chi tiết Đê/kè" (frontmatter `id: F-048-detail`, `slug: ql-de-ke-xem-chi-tiet`), chứa `feature-brief.md` + `F-048-detail-lean-spec.md` + `implementations.yaml`.
- Projection module (`module-brief.md`, `implementations.yaml`) chỉ đăng ký **một** F-048 = `xem-chi-tiet-de-ke`; thư mục UI `F-048-quan-ly-de-ke-danh-sach` **chiếm dụng ID F-048** dù nội dung là danh sách UI (mẫu y hệt F-068/F-XX1 — vốn được đặt ID riêng). Đây là lỗi đặt tên dir: brief UI danh sách Đê/kè lẽ ra phải mang ID riêng (kiểu F-068/F-XX1), không được dùng lại ID feature BE đã tồn tại.
- **Hệ quả:** hai thư mục cùng tiền tố F-048 gây nhầm lẫn khi tra cứu; brief UI này **chưa được đưa vào mapping merge** (không nằm trong phạm vi F-068→F-060 / F-XX1→F-054) — cần PMO/tech-lead quyết định: (a) đổi ID dir UI sang ID riêng và merge vào F-048 như mẫu M-002 (F-078 → F-024), hoặc (b) gộp nội dung danh sách vào `F-048-xem-chi-tiet-de-ke` và xóa dir UI. **Khuyến nghị (a)** để đồng bộ với F-068/F-XX1 và tránh mất dấu vết. Trạng thái trạng thái phê duyệt trong brief UI này đã được đồng bộ sang 7 trạng thái chuẩn trong run này (mục 2.2).

### 4.2. ⚠️ Mô hình 4 trạng thái cũ trong `DESIGN.md` (stale so với chuẩn hệ thống)

- `docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md` §2 "Shared Approval State Machine" mô tả **4 trạng thái**: `PROPOSED → UNDER_REVIEW → APPROVED / REJECTED` (enum `TrangThaiPheDuyet`), kèm bảng chuyển trạng thái 6 dòng và enum 4 giá trị.
- Chuẩn hệ thống hiện hành: **`docs/conventions/approval-2-level-spec.md` §3.1 — tập đóng 7 trạng thái** (`DRAFT`=0, `PENDING_APPROVAL`=2, `APPROVED_LEVEL1`=3, `REJECTED_LEVEL1`=8, `REJECTED_LEVEL2`=9, `APPROVED`=5, `ARCHIVED`=7), map sang enum `ApprovalStatus` (`src/main/java/com/hanghai/kchtg/common/entity/ApprovalStatus.java` — đã xác minh tồn tại với đúng 10 giá trị, ordinal 0..9). `PROPOSED`, `APPROVED_LEVEL2`, `REJECTED` là giá trị **legacy**, không dùng trong luồng thống nhất.
- Các brief UI của module trước merge cũng tham chiếu mô hình cũ: F-068 dùng `approvalStatus = PROPOSED`; F-XX1 dùng `S_0..S_6`; F-048-UI dùng badge 4 màu — **toàn bộ đã được dịch sang 7 trạng thái chuẩn khi merge/đồng bộ** (mục 2).
- **Khuyến nghị (chưa thực hiện — ngoài phạm vi run này):** cập nhật `DESIGN.md` §2 sang 7 trạng thái chuẩn (tham chiếu `approval-2-level-spec.md` §3.1, không chép lại toàn bộ quy trình). Tài liệu nền `ba/01-base-pattern.md` mục 3.5 đã dùng 7 trạng thái chuẩn làm chuẩn duy nhất.

---

## 5. Ghi chú kiểm soát phạm vi

- **Files đã thay đổi trong run này (toàn bộ nằm trong `docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/`):**
  - **Merge (sửa nội dung):** `_features/F-060-xem-chi-tiet-tram-radar/feature-brief.md`, `_features/F-054-xem-chi-tiet-co-so-sua-chua-dong-tau/feature-brief.md` (nhận toàn bộ nội dung UI, chuẩn hóa 7 trạng thái, frontmatter `last-updated` → 2026-08-23).
  - **Xóa:** `_features/F-068-quan-ly-tram-radar-xem-danh-sach/feature-brief.md` (giữ `lean-spec.md`), `_features/F-XX1-quan-ly-co-so-sua-chua-dong-tau-danh-sach/feature-brief.md`.
  - **Đồng bộ 7 trạng thái:** F-038, F-039, F-040, F-041, F-042, F-044, F-045, F-046, F-047, F-048 (cả 2 dir), F-051, F-052, F-053, F-055, F-056, F-057, F-058, F-059, F-061, F-062, F-063, F-065 (feature-brief.md).
  - **Báo cáo này:** `ba/00-ui-be-merge-report.md` (cập nhật trạng thái thực thi).
- **Không sửa:** `_state.md` (byte-identical, đã xác minh sha256), `ba/00-lean-spec.md`, `DESIGN.md`, `module-brief.md`, `implementations.yaml` (module-level + feature-level), `ba/01-base-pattern.md` (giữ nguyên từ run trước).
- **Không chạm:** `src/`, `frontend/src/`, module M-001/M-002/M-004, `docs/intel`, `docs/conventions` (approval-2-level-spec.md, list-screen-ui-standard.md...), `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.
- **Không chạy git** (không add/commit/push).
- Còn lại ngoài phạm vi: chuẩn hóa ID F-XX1/F-048-UI, cập nhật `DESIGN.md` §2, xử lý thư mục UI F-048 (mục 4) — cần PMO/tech-lead quyết định.

---

## 6. Kết luận

1. ✅ **F-068 → F-060 đã merge**: F-060 chứa toàn bộ spec danh sách Trạm radar (mục 9.2 + §11.7) chuẩn hóa 7 trạng thái; `F-068/feature-brief.md` đã xóa (giữ `lean-spec.md`).
2. ✅ **F-XX1 → F-054 đã merge**: F-054 chứa toàn bộ spec danh sách CSSCĐT (US-LIST/AC-LIST/BR-LIST, §8 list/search `kcht:view`, mục 9.2, §11.4-11.6) chuẩn hóa 7 trạng thái; `F-XX1/feature-brief.md` đã xóa.
3. ✅ **Đồng bộ 7 trạng thái toàn module**: grep `UNDER_REVIEW` / `PROPOSED (Lưu tạm)` / `\bPROPOSED\b` / `\bREJECTED\b` / `S_[0-6]` trên toàn bộ `docs/modules/M-003-.../_features/` = **0** (sau khi merge + đồng bộ các brief còn lại, bao gồm final cleanup pass F-051/F-052/F-055).
4. ✅ 5 brief phê duyệt (F-041, F-047, F-053, F-059, F-065) mô tả luồng 2 cấp với `REJECTED_LEVEL1`/`REJECTED_LEVEL2`.
5. ✅ `_state.md` byte-identical (sha256 không đổi); không sửa `src/**`, `frontend/**`, `implementations.yaml`, file ngoài M-003; không git.
6. ⚠️ Quan sát chỉ báo cáo: **trùng ID F-048** (mục 4.1) và **mô hình 4 trạng thái cũ trong `DESIGN.md`** (mục 4.2) — cần PMO/tech-lead xử lý.
