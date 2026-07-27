---
feature-id: F-004
document: lean-spec
output-mode: lean
last-updated: 2026-07-27T00:00:00Z
---

# Feature F-004: Quản lý kết nối liên thông chia sẻ dữ liệu — Lean Business Analysis Spec

## 1. Summary

| Field | Value |
|---|---|
| Feature ID | F-004 |
| Feature Name | Quản lý kết nối liên thông chia sẻ dữ liệu |
| Slug | quan-ly-ket-noi-lien-thong-chia-se-du-lieu |
| Module | M-001 (Quản trị hệ thống) |
| Classification | local |
| Priority | medium |
| Complexity | Medium-High (4 BR, 2 tabs, 7 API, mới hoàn toàn) |
| Tech Stack | Spring Boot + Spring Security + JWT + ReactJS + MSSQL 2022 |

**Business Intent:** Màn hình xem nhật ký toàn bộ hoạt động chia sẻ và tích hợp dữ liệu. 2 loại trao đổi: Tích hợp (chủ động, có filter + sửa) và Chia sẻ (bị động, xem chi tiết).

**Scope:** 2 tab, 7 API, read-mostly (có 1 chức năng sửa), tìm kiếm nâng cao trong lịch sử kết nối.

---

## 2. Scope

### In Scope

| # | Capability | Description |
|---|---|---|
| 1 | Tab Tích hợp | Filter: tên KN, hệ thống gửi, trạng thái. Bảng: STT, Tên TK, Tên KN, Hệ thống gửi, Hệ thống nhận, Trạng thái, Thao tác (Xem LS + Sửa) |
| 2 | Xem lịch sử KN | Bảng con + tìm kiếm: Loại gửi, Số TC, Thời gian (từ-đến). Nâng cao: Mã nhận, ID, Mục đích |
| 3 | Xem nội dung gửi/nhận | Popup JSON/text |
| 4 | Sửa kết nối | Popup sửa: Tên KN, Password, Trạng thái |
| 5 | Tab Chia sẻ | Bấm Tìm kiếm → Bảng: STT, Tên TK, Tên KN, Hệ thống gửi, Hệ thống nhận, ID, Trạng thái, Thao tác (Xem chi tiết) |

### Out of Scope

| # | Capability | Reason |
|---|---|---|
| 1 | Thêm/Xóa bản ghi log | Log do M-009 tự ghi |
| 2 | Xuất CSV | Không thuộc phạm vi |

---

## 3. Actors & Permissions

| Role | Level | Access |
|---|---|---|
| system-admin | View + Edit (limited) | Xem cả 2 tab, sửa Tên KN/Password/Trạng thái |
| Khác | No access | Không thấy menu |

**Permission:** `connection:read`.

---

## 4. User Stories (MoSCoW)

| ID | Story | Priority |
|---|---|---|
| US-004-01 | View integration logs with filter | Must |
| US-004-02 | View connection history with search (Loại gửi, Số TC, thời gian) | Must |
| US-004-03 | View sent/received content | Must |
| US-004-04 | View sharing logs | Must |
| US-004-05 | Edit connection (Tên KN, Password, Trạng thái) | Must |
| US-004-06 | Advanced search (Mã nhận, ID, Mục đích) | Should |
| US-004-07 | Filter integration by status | Should |

---

## 5. Acceptance Criteria

| ID | Acceptance Criterion |
|---|---|
| AC-004-01 | Tab Tích hợp: filter → bảng STT, Tên TK, Tên KN, Hệ thống gửi, Hệ thống nhận, Trạng thái (tag), Thao tác (Xem LS + Sửa) |
| AC-004-02 | Bảng LS: tìm kiếm Loại gửi + Số TC + Thời gian từ-đến → STT, ID, Thông tin gửi (7 cột), Thông tin nhận (2 cột), Thao tác (Xem ND gửi/nhận) |
| AC-004-03 | Tìm kiếm nâng cao: mở rộng Mã nhận, ID, Mục đích gửi |
| AC-004-04 | Sửa: popup Tên KN + Password + Trạng thái → toast "Đã cập nhật kết nối" |
| AC-004-05 | Tab Chia sẻ: bấm Tìm kiếm → STT, Tên TK, Tên KN, Hệ thống gửi, Hệ thống nhận, ID, Trạng thái (tag), Thao tác (Xem chi tiết) |
| AC-004-06 | Popup chi tiết chia sẻ |
| AC-004-07 | Menu `connection:read` |

---

## 6. Business Rules

| ID | Rule |
|---|---|
| BR-004-01 | 2 loại: TÍCH HỢP (chủ động, có filter + sửa) vs CHIA SẺ (bị động, không filter) |
| BR-004-02 | ID chỉ có trong Chia sẻ — mã giao dịch do hệ thống sinh |
| BR-004-03 | Trạng thái Sử dụng/Không sử dụng |
| BR-004-04 | Log read-only (do M-009 ghi), ngoại lệ: sửa Tên KN/Password/Trạng thái |

---

## 7. Entities (nguồn từ M-009)

| Bảng | Trường chính | Tab |
|---|---|---|
| integration_logs | id, tenTaiKhoan, tenKetNoi, heThongGui, heThongNhan, trangThai, password (encrypted) | Tích hợp |
| integration_details | logId, loai, ten, soThamChieu, thoiGianGui, mucDich, donVi, nguoiGui, thoiGianNhan, maNhan, noiDungGui, noiDungNhan | Lịch sử KN |
| sharing_logs | id, maGiaoDich, tenTaiKhoan, tenKetNoi, heThongGui, heThongNhan, trangThai, noiDungChiTiet | Chia sẻ |

---

## 8. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/lien-thong/tich-hop | DS tích hợp (filter: tenKetNoi, heThongGui, trangThai) |
| GET | /api/lien-thong/tich-hop/{id}/lich-su | LS KN (filter: loaiGui, soThamChieu, tuNgay-denNgay, maNhan, id, mucDich) |
| GET | /api/lien-thong/tich-hop/lich-su/{id}/noi-dung-gui | Nội dung gửi |
| GET | /api/lien-thong/tich-hop/lich-su/{id}/noi-dung-nhan | Nội dung nhận |
| PUT | /api/lien-thong/tich-hop/{id} | Sửa (tenKetNoi, password, trangThai) |
| GET | /api/lien-thong/chia-se | DS chia sẻ |
| GET | /api/lien-thong/chia-se/{id} | Chi tiết chia sẻ |

---

## 9. UI/UX — Theme Token Compliance

> TUYỆT ĐỐI KHÔNG hardcode.

### 9.1 Layout

`AppLayout.tsx`: sidebar `272px` `#12468C`, header `64px`, nền `#eaf0f6`.

### 9.2 Tab Tích hợp

**FilterBar:** Input tên KN + Input hệ thống gửi + Select trạng thái + Tìm kiếm (`actionPrimary`).

**DataTable:** STT, Tên TK, Tên KN, Hệ thống gửi, Hệ thống nhận, Trạng thái (tag), Thao tác (Xem LS + Sửa).

**Bảng con:** Tìm kiếm Loại gửi + Số TC + Date range + [Nâng cao: Mã nhận, ID, Mục đích]. Bảng: STT, ID, T.tin gửi (7 cột), T.tin nhận (2 cột), Thao tác (Xem ND gửi/nhận).

**Popup Sửa:** Tên KN + Password + Trạng thái → Lưu.

### 9.3 Tab Chia sẻ

Nút Tìm kiếm → DataTable: STT, Tên TK, Tên KN, Hệ thống gửi, Hệ thống nhận, ID, Trạng thái (tag), Thao tác (Xem chi tiết).

### 9.4 Token

`actionPrimary` 1 lần (Tìm kiếm). `spaceFormField=12px`, `radiusPill=999px`, `height=40`. Tag: Sử dụng=xanh lá, Không sử dụng=xám.

### 9.5 States

Loading→skeleton, Empty→"Không tìm thấy kết quả", Error→Alert+Thử lại.

---

## 10. Gap Analysis

| # | Gap | Severity |
|---|---|---|
| 1 | Hoàn toàn mới — chưa có BE (7 API) | Cao |
| 2 | Hoàn toàn mới — chưa có FE (2 tab + bảng con + popup) | Cao |
| 3 | Cần xác nhận bảng log đã có trong M-009 | Cao |

---

## 11. Pipeline Triage

| Question | Answer |
|---|---|
| Q1: New domain? | Yes |
| Q2: Affects architecture? | Yes (7 API mới, module mới) |
| Q3: Approach clear? | No (cần SA xác nhận schema M-009) |

**Verdict:** Route đến **engineering-system-architect**.
