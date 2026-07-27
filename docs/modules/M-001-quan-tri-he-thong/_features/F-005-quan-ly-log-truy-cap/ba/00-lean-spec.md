---
feature-id: F-005
document: lean-spec
output-mode: lean
last-updated: 2026-07-27T00:00:00Z
---

# Feature F-005: Quản lý log truy cập — Lean Business Analysis Spec

## 1. Summary

| Field | Value |
|---|---|
| Feature ID | F-005 |
| Feature Name | Quản lý log truy cập |
| Slug | quan-ly-log-truy-cap |
| Module | M-001 (Quản trị hệ thống) |
| Classification | local |
| Priority | medium |
| Complexity | Simple (3 business rules, 1 actor) |
| Tech Stack | Spring Boot + Spring Security + JWT + ReactJS + MSSQL 2022 |

**Business Intent:** Quản trị hệ thống cần khả năng tra cứu, xem và xuất lịch sử hoạt động truy cập hệ thống, bao gồm 3 hành động: Đăng nhập, Đăng xuất, Truy cập chức năng. Hỗ trợ lọc theo ngày truy cập, đơn vị và email.

**Scope:** Tra cứu log với 3 hành động, lọc theo ngày truy cập + đơn vị + email, xuất CSV, xem chi tiết.

---

## 2. Scope

### In Scope

| # | Capability | Description |
|---|---|---|
| 1 | Xem danh sách log | Hiển thị danh sách log phân trang với 3 hành động (Đăng nhập, Đăng xuất, Truy cập chức năng) |
| 2 | Lọc theo ngày truy cập | Lọc log theo khoảng ngày (Từ ngày — Đến ngày) |
| 3 | Lọc theo đơn vị | Lọc log theo đơn vị trực thuộc của người dùng |
| 4 | Lọc theo email | Lọc log theo email người dùng |
| 5 | Xem chi tiết log | Hiển thị toàn bộ thông tin log: thời gian, hành động, email, đơn vị, chức năng, IP, trình duyệt, phiên đăng nhập |
| 6 | Xuất CSV | Export log ra file CSV (chỉ khi có quyền xuất) |
| 7 | Phân trang | Phân trang danh sách log với điều hướng trang |

### Out of Scope

| # | Capability | Reason |
|---|---|---|
| 1 | Quản lý log lỗi, tài khoản, cấu hình | Chỉ tập trung vào log truy cập/đăng nhập |
| 2 | Chỉnh sửa/xóa log thủ công | Log là immutable |
| 3 | Tạo log thủ công | Chỉ hệ thống tự tạo log |
| 4 | Thống kê aggregate | Không thuộc phạm vi |
| 5 | Retention policy tự động xóa | Không thuộc phạm vi |
| 6 | Cảnh báo bất thường | Không thuộc phạm vi |
| 7 | Tích hợp SIEM bên ngoài | Không thuộc phạm vi |

---

## 3. Actors & Permissions

| Role | Access |
|---|---|
| Người dùng được phân quyền | Xem danh sách log, xem chi tiết, xuất CSV (nếu được cấp quyền xuất) |

Quyền hạn cụ thể (xem, xuất CSV) theo phân quyền hệ thống.

---

## 4. User Stories (MoSCoW)

| ID | Story | Priority |
|---|---|---|
| US-005-01 | Là người dùng được phân quyền, tôi muốn xem danh sách log truy cập hệ thống (Đăng nhập, Đăng xuất, Truy cập chức năng) để theo dõi hoạt động | Must |
| US-005-02 | Là người dùng được phân quyền, tôi muốn lọc log theo ngày truy cập, đơn vị và email để tìm kiếm nhanh các bản ghi | Must |
| US-005-03 | Là người dùng được phân quyền, tôi muốn xem chi tiết từng bản ghi log (thời gian, hành động, email, đơn vị, chức năng, IP, trình duyệt, phiên) để có đầy đủ thông tin | Should |
| US-005-04 | Là người dùng có quyền xuất CSV, tôi muốn xuất danh sách log ra file CSV để phục vụ báo cáo | Should |

---

## 5. Acceptance Criteria

| ID | Acceptance Criterion | Negative Path |
|---|---|---|
| AC-005-01 | Hệ thống hiển thị danh sách log với 3 hành động (Đăng nhập, Đăng xuất, Truy cập chức năng) và đầy đủ các cột: thời gian, email, đơn vị, hành động, chức năng, IP, trình duyệt, phiên | Nếu không có dữ liệu → hiển thị empty state |
| AC-005-02 | Người dùng có thể lọc log theo ngày truy cập (Từ ngày — Đến ngày), đơn vị và email với kết quả phân trang chính xác | Nếu ngày bắt đầu > ngày kết thúc → hiển thị lỗi validation |
| AC-005-03 | Không có kết quả phù hợp với bộ lọc → hiển thị thông báo "Không có log nào phù hợp với bộ lọc" | — |
| AC-005-04 | Xem chi tiết log hiển thị đầy đủ: thời gian, hành động, email, đơn vị, chức năng, IP, trình duyệt, phiên đăng nhập | Với Đăng nhập/Đăng xuất: trường Chức năng hiển thị "—" |
| AC-005-05 | Nút Xuất CSV chỉ hiển thị khi người dùng có quyền xuất; file CSV đúng định dạng | Nếu không có quyền → nút bị ẩn |
| AC-005-06 | Log là immutable: không có nút Sửa/Xóa trên giao diện; không cho phép API UPDATE/DELETE | Attempt UPDATE/DELETE → HTTP 403 |
| AC-005-07 | Phân trang hiển thị đúng số lượng bản ghi và điều hướng trang chính xác | Mặc định 20 dòng/trang |

---

## 6. Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-005-01 | Log ghi nhận 3 hành động: Đăng nhập, Đăng xuất, Truy cập chức năng | Tất cả log | Nghiệp vụ |
| BR-005-02 | Log là immutable — không cho phép sửa hoặc xóa thủ công | Data Integrity | Audit requirement |
| BR-005-03 | Chỉ hệ thống tự tạo log khi người dùng thực hiện hành động; không thể tạo log thủ công | Tạo log | Integrity constraint |

---

## 7. Entities

| Entity | Key Fields | Notes |
|---|---|---|
| **AccessLog** | id, thoi_gian_truy_cap, email, don_vi, hanh_dong (Đăng nhập/Đăng xuất/Truy cập chức năng), chuc_nang, dia_chi_ip, thong_tin_trinh_duyet, phien_dang_nhap | Bảng log chính, immutable |

---

## 8. API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/logs | Danh sách log (phân trang, filter by date/unit/email) | JWT |
| GET | /api/v1/logs/{id} | Chi tiết log | JWT |
| GET | /api/v1/logs/export | Xuất log CSV | JWT (cần quyền export) |

---

## 9. Log Actions Detail

| Hành động | Mô tả | Badge màu |
|---|---|---|
| Đăng nhập | Người dùng đăng nhập vào hệ thống | Xanh lá |
| Đăng xuất | Người dùng đăng xuất khỏi hệ thống | Xám |
| Truy cập chức năng | Người dùng truy cập vào một chức năng cụ thể | Xanh dương |

---

## 10. Test Scenarios

| ID | Scenario | Type | Expected Result |
|---|---|---|---|
| TS-005-01 | Xem danh sách log với filter ngày truy cập | E2E | Hiển thị đúng log trong khoảng thời gian, phân trang chính xác |
| TS-005-02 | Lọc theo đơn vị | E2E | Kết quả chỉ hiển thị log của đơn vị được chọn |
| TS-005-03 | Lọc theo email | E2E | Kết quả chỉ hiển thị log của email được nhập |
| TS-005-04 | Xem chi tiết log | E2E | Hiển thị đầy đủ 8 trường thông tin |
| TS-005-05 | Xuất CSV (có quyền) | E2E | File CSV đúng định dạng |
| TS-005-06 | Xuất CSV (không có quyền) | Security | Nút Xuất CSV bị ẩn |
| TS-005-07 | Không có nút Sửa/Xóa | UI | Giao diện chỉ có nút Xem chi tiết |
| TS-005-08 | Phân trang | E2E | Phân trang hoạt động chính xác |
| TS-005-09 | Empty state | UI | Hiển thị "Không có log nào phù hợp với bộ lọc" |
| TS-005-10 | Đăng nhập/Đăng xuất → Chức năng hiển thị "—" | UI | Cột Chức năng hiển thị "—" cho 2 hành động này |

---

## 11. Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Q1: Creates new domain elements? | Yes | AccessLog là entity mới với immutable semantics |
| Q2: Affects system architecture? | No | Sử dụng stack hiện có, không thay đổi kiến trúc |
| Q3: Approach clear from existing architecture? | Yes | Pattern đơn giản: Repository + Controller + read-only UI |

**Triage Verdict:** Route to engineering-system-architect (Q1=Yes).
