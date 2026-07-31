---
id: F-017
name: Phê duyệt Bến cảng
slug: phe-duyet-bc
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:42Z
last-updated: 2026-07-30
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Phê duyệt Bến cảng

**Tài liệu:** BA Feature Brief
**Feature:** F-017 — Phê duyệt Bến cảng
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-07-30

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Phê duyệt Bến cảng là tính năng cho phép **Lãnh đạo (cấp Cục)** xem, phê duyệt hoặc từ chối các Bến cảng đang trong trạng thái chờ phê duyệt (`trangThaiPheDuyet = CHO_PHE_DUYET`). Giao diện hiển thị danh sách bến chờ duyệt với đầy đủ thông tin. Lãnh đạo có thể **Phê duyệt** (chuyển thành `DUOC_PHE_DUYET`) hoặc **Từ chối** (chuyển thành `TU_CHOI`) kèm lý do bắt buộc ≥10 ký tự. Mỗi quyết định tạo bản ghi **PheDuyetLog** để lưu vết kiểm toán. Ngoài ra, admin-operation và system-admin có thể phê duyệt ngay từ form tạo mới/cập nhật qua nút "Lưu và phê duyệt" (F-014, F-015).

### 1.2. Tại sao cần tính năng này?

Phê duyệt là bước kiểm soát chất lượng bắt buộc trước khi Bến cảng được đưa vào vận hành:

- Đảm bảo mọi bến đều được Lãnh đạo xem xét trước khi kích hoạt
- Lý do từ chối giúp người tạo biết chính xác cần sửa gì
- PheDuyetLog lưu vết vĩnh viễn phục vụ kiểm toán
- Hỗ trợ cả phê duyệt từ màn hình riêng (F-017) và phê duyệt nhanh từ form (F-014, F-015)

### 1.3. Luồng hoạt động chính

Lãnh đạo truy cập màn hình "Phê duyệt Bến cảng" → `GET /api/v1/ben-cang?trangThaiPheDuyet=CHO_PHE_DUYET` → danh sách bến chờ duyệt với các cột: Mã bến, Tên bến, Cảng mẹ, Loại kết cấu, Tình trạng, Ngày tạo, Người tạo. Chọn một bến → xem chi tiết đầy đủ 26 trường. **Phê duyệt:** confirmation dialog → xác nhận → `POST /api/v1/ben-cang/:id/approve` → `trangThaiPheDuyet = DUOC_PHE_DUYET` → tạo PheDuyetLog → toast "Đã phê duyệt Bến cảng" → bến biến mất khỏi danh sách chờ. **Từ chối:** dialog yêu cầu lý do ≥10 ký tự → `POST /api/v1/ben-cang/:id/reject` → `TU_CHOI` → tạo PheDuyetLog kèm lý do → toast "Đã từ chối Bến cảng".

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung. Mỗi vai trò có phạm vi truy cập và thao tác khác nhau, kiểm soát bởi RBAC.

### 2.1. Logic phân quyền chung

| Vai trò | Quyền xem | Quyền thao tác | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin (Admin Cục) | Xem toàn bộ | Phê duyệt, Từ chối (từ F-017); Lưu và phê duyệt (từ F-014/F-015) | Toàn bộ hệ thống | Toàn quyền |
| admin-operation | Xem toàn bộ | Phê duyệt, Từ chối (từ F-017); Lưu và phê duyệt (từ F-014/F-015) | Toàn bộ hệ thống | Vai trò vận hành chính |
| Lãnh đạo (cấp Cục) | Xem toàn bộ | Phê duyệt, Từ chối (từ F-017) | Toàn bộ hệ thống | **Vai trò chính của F-017** |
| admin | Xem trong đơn vị | Không | — | Không có quyền phê duyệt |
| Chuyên viên / Lãnh đạo đơn vị | Xem trong đơn vị | Không | — | Không có quyền phê duyệt |
| Cá nhân | Không có quyền | Không | — | Không áp dụng |

### 2.2. Logic phân quyền đặc biệt cho Admin Cục

- **Xem toàn bộ** bến chờ duyệt trên toàn hệ thống
- **Xem người phê duyệt** (họ tên, username)
- **Xem thời gian phê duyệt** (timestamp)
- **Xem lý do từ chối** đầy đủ

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-017-01:** Là Lãnh đạo (cấp Cục), tôi muốn xem danh sách tất cả Bến cảng đang chờ phê duyệt.
- **US-017-02:** Là Lãnh đạo, tôi muốn xem chi tiết đầy đủ 26 trường của bến trước khi quyết định.
- **US-017-03:** Là Lãnh đạo, tôi muốn phê duyệt bến với một click + xác nhận, bến chuyển thành DUOC_PHE_DUYET.
- **US-017-04:** Là Lãnh đạo, tôi muốn từ chối bến và nhập lý do ≥10 ký tự, bến chuyển thành TU_CHOI.
- **US-017-05:** Là Lãnh đạo, tôi muốn hệ thống tự động tạo PheDuyetLog ghi nhận mọi quyết định.

### Mức Should (nên có)

- **US-017-06:** Là Lãnh đạo, tôi muốn lọc danh sách chờ duyệt theo Đơn vị quản lý hoặc Cảng mẹ.
- **US-017-07:** Là Lãnh đạo, tôi muốn thấy lịch sử phê duyệt/từ chối gần đây của bến.

### Mức Could (có thể có sau)

- **US-017-08:** Là Lãnh đạo, tôi muốn phê duyệt/từ chối nhiều bến cùng lúc (bulk approve/reject).

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Danh sách chờ duyệt

**AC-017-01 — Danh sách chờ duyệt:** Màn hình "Phê duyệt Bến cảng" hiển thị danh sách bến có `trangThaiPheDuyet = CHO_PHE_DUYET`, gọi từ `GET /api/v1/ben-cang?trangThaiPheDuyet=CHO_PHE_DUYET`. Các cột: Mã bến, Tên bến, Cảng mẹ, Loại kết cấu, Tình trạng, Ngày tạo, Người tạo. **Xử lý khi lỗi:** API lỗi → toast "Không thể tải danh sách chờ phê duyệt".

**AC-017-02 — Lọc và tìm kiếm:** Hỗ trợ lọc theo Đơn vị quản lý, Cảng mẹ. Tìm kiếm theo mã bến/tên bến. Phân trang 20/50.

**AC-017-03 — Danh sách trống:** Nếu không có bến nào chờ duyệt → hiển thị "Không có Bến cảng nào đang chờ phê duyệt".

### Nhóm 2: Xem chi tiết

**AC-017-04 — Xem chi tiết bến chờ duyệt:** Click vào bến trong danh sách → hiển thị toàn bộ 26 trường (giống F-018 detail), read-only. **Xử lý khi lỗi:** Bến không tồn tại → 404.

### Nhóm 3: Phê duyệt

**AC-017-05 — Phê duyệt thành công:** Nhấn "Phê duyệt" → confirmation dialog "Bạn có chắc chắn muốn phê duyệt Bến cảng [maBen]?" → xác nhận → `POST /api/v1/ben-cang/:id/approve` → `trangThaiPheDuyet = DUOC_PHE_DUYET` → tạo PheDuyetLog (action=APPROVE) → toast "Đã phê duyệt Bến cảng" → bến biến mất khỏi danh sách chờ.

**AC-017-06 — Hủy phê duyệt:** Nhấn "Hủy" trong dialog → đóng dialog, không thực hiện.

### Nhóm 4: Từ chối

**AC-017-07 — Từ chối thành công:** Nhấn "Từ chối" → dialog yêu cầu nhập lý do (textarea, placeholder "Nhập lý do từ chối (tối thiểu 10 ký tự)"). Nhập ≥10 ký tự → nút "Xác nhận từ chối" enable → `POST /api/v1/ben-cang/:id/reject` body `{ "lyDo": "..." }` → `trangThaiPheDuyet = TU_CHOI` → tạo PheDuyetLog (action=REJECT, lyDo) → toast "Đã từ chối Bến cảng" → bến biến mất khỏi danh sách chờ.

**AC-017-08 — Chặn từ chối không lý do:** Nhập <10 ký tự → nút "Xác nhận từ chối" disable + counter hiển thị "[n]/10 ký tự tối thiểu". Để trống → lỗi "Lý do từ chối là bắt buộc".

### Nhóm 5: PheDuyetLog

**AC-017-09 — Ghi nhận log:** Mỗi quyết định phê duyệt/từ chối tạo 1 bản ghi PheDuyetLog: `benCangId`, `action` (APPROVE/REJECT), `pheDuyetBoi`, `thoiGian`, `lyDo` (nếu REJECT). Log không thể sửa/xóa.

### Nhóm 6: Phân quyền

**AC-017-10 — Giới hạn truy cập:** Admin, Chuyên viên, Lãnh đạo đơn vị, Cá nhân → không thấy menu "Phê duyệt Bến cảng". Truy cập URL trực tiếp → HTTP 403.

**AC-017-11 — Ẩn nút theo vai trò:** Nút "Phê duyệt" và "Từ chối" chỉ hiển thị cho Lãnh đạo (cấp Cục), admin-operation, system-admin.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-017-01 | **Chỉ phê duyệt bến CHO_PHE_DUYET** — không thể phê duyệt bến đã DUOC_PHE_DUYET, TU_CHOI, hoặc 'nhap' | Phê duyệt | Nghiệp vụ | Không |
| BR-017-02 | **Lý do từ chối bắt buộc ≥10 ký tự** — không cho phép từ chối nếu thiếu hoặc ngắn hơn | Từ chối | Nghiệp vụ | Không |
| BR-017-03 | **Mỗi bến chỉ duyệt một lần** — sau khi DUOC_PHE_DUYET hoặc TU_CHOI, chỉ reset về CHO_PHE_DUYET khi cập nhật (F-015) | Luồng | Nghiệp vụ | Cập nhật → reset |
| BR-017-04 | **PheDuyetLog bất biến** — không cho phép sửa hoặc xóa sau khi ghi nhận | Audit | Bảo mật | Không |
| BR-017-05 | **Lãnh đạo, admin-op, system-admin được duyệt** — các vai trò khác không có quyền | RBAC | Bảo mật | Không |
| BR-017-06 | **Audit log mọi thao tác** — actor, thời gian, hành động, IP | Audit | Bảo mật | Không |

---

## 6. Mô hình dữ liệu

> 🔴 = trường mới.

### 6.1. Bảng `ben_cang` — trường phê duyệt

- 🔴 **trang_thai_phe_duyet:** NVARCHAR(50) — CHO_PHE_DUYET / DUOC_PHE_DUYET / TU_CHOI
- 🔴 **ly_do_tu_choi:** NVARCHAR(500), nullable — lý do từ chối (chỉ khi TU_CHOI)

### 6.2. 🔴 Bảng mới `phe_duyet_log` — nhật ký phê duyệt

- 🔴 **id:** BIGINT, PK, AUTO_INCREMENT
- 🔴 **ben_cang_id:** BIGINT, NOT NULL, FK → ben_cang.id
- 🔴 **action:** NVARCHAR(20), NOT NULL — APPROVE / REJECT
- 🔴 **phe_duyet_boi:** NVARCHAR(100), NOT NULL — người phê duyệt
- 🔴 **thoi_gian:** TIMESTAMP, DEFAULT NOW()
- 🔴 **ly_do:** NVARCHAR(500), nullable — lý do (chỉ khi REJECT)

---

## 7. API Endpoints

### 7.1. F-017 — Phê duyệt

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/ben-cang?trangThaiPheDuyet=CHO_PHE_DUYET` | Danh sách bến chờ phê duyệt (hỗ trợ filter: orgUnitId, cangBienId, search) | `bencang:approve` |
| GET | `/api/v1/ben-cang/{id}` | Xem chi tiết bến chờ duyệt | `bencang:approve` |
| POST | `/api/v1/ben-cang/{id}/approve` | Phê duyệt → DUOC_PHE_DUYET + PheDuyetLog | `bencang:approve` |
| POST | `/api/v1/ben-cang/{id}/reject` | Từ chối → TU_CHOI + PheDuyetLog (body: `{ "lyDo": "..." }`) | `bencang:approve` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Luồng phê duyệt

```
Lãnh đạo → màn hình "Phê duyệt Bến cảng"
→ GET /api/v1/ben-cang?trangThaiPheDuyet=CHO_PHE_DUYET
→ Danh sách bến chờ duyệt
→ Chọn bến → xem chi tiết (GET /api/v1/ben-cang/{id})
→ "Phê duyệt" → confirmation dialog → xác nhận
→ POST /api/v1/ben-cang/{id}/approve
→ Server: UPDATE ben_cang SET trang_thai_phe_duyet = 'DUOC_PHE_DUYET'
         INSERT phe_duyet_log (action='APPROVE', phe_duyet_boi, thoi_gian)
→ Response 200 → toast "Đã phê duyệt Bến cảng"
→ Bến biến mất khỏi danh sách chờ
```

### 8.2. Luồng từ chối

```
Lãnh đạo → chọn bến → "Từ chối"
→ Dialog: textarea "Nhập lý do từ chối (tối thiểu 10 ký tự)"
→ Nhập ≥10 ký tự → "Xác nhận từ chối"
→ POST /api/v1/ben-cang/{id}/reject { "lyDo": "..." }
→ Server: UPDATE ben_cang SET trang_thai_phe_duyet = 'TU_CHOI', ly_do_tu_choi = :lyDo
         INSERT phe_duyet_log (action='REJECT', ly_do, phe_duyet_boi, thoi_gian)
→ Response 200 → toast "Đã từ chối Bến cảng"
→ Bến biến mất khỏi danh sách chờ
```

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** GET danh sách ≤500ms, POST approve/reject ≤1s, ≥30 concurrent users
- **Mở rộng:** PheDuyetLog thiết kế đơn giản, dễ mở rộng thêm trường
- **Bảo mật:** RBAC `bencang:approve`; không cho phép sửa/xóa PheDuyetLog; HTTPS
- **Độ tin cậy:** Transaction atomicity (update ben_cang + insert PheDuyetLog); rollback nếu lỗi
- **UX:** Confirmation dialog trước mọi hành động; counter ký tự lý do từ chối; toast thông báo
- **Pháp lý:** PheDuyetLog lưu trữ vĩnh viễn; audit log ≥2 năm

---

## 10. Yêu cầu giao diện

> Token từ theme.ts và tokens.ts. Không hardcode.

### 10.1. Màn hình danh sách chờ duyệt

- **Component:** `BenCangApprovalPage`
- **Header:** "Phê duyệt Bến cảng" + badge số lượng chờ duyệt
- **FilterBar:** Đơn vị quản lý, Cảng mẹ, Tìm kiếm
- **Bảng columns:** Mã bến, Tên bến, Cảng mẹ, Loại kết cấu, Tình trạng, Ngày tạo, Người tạo, Thao tác
- **Thao tác mỗi dòng:** "Phê duyệt" (primary) + "Từ chối" (danger)
- **Pagination:** 20/50 mục

### 10.2. Dialog phê duyệt

- **Tiêu đề:** "Phê duyệt Bến cảng"
- **Nội dung:** "Bạn có chắc chắn muốn phê duyệt Bến cảng [maBen] - [tenBen]?"
- **Nút:** "Hủy" (outlined) + "Xác nhận phê duyệt" (primary)

### 10.3. Dialog từ chối

- **Tiêu đề:** "Từ chối Bến cảng"
- **Nội dung:** "Bạn có chắc chắn muốn từ chối Bến cảng [maBen] - [tenBen]?"
- **Textarea:** placeholder "Nhập lý do từ chối (tối thiểu 10 ký tự)"
- **Counter:** "[n]/10 ký tự tối thiểu" (đỏ nếu <10, xanh nếu đủ)
- **Nút:** "Hủy" (outlined) + "Xác nhận từ chối" (danger, disable đến khi ≥10 ký tự)

### 10.4. Trạng thái UI

- Danh sách trống: "Không có Bến cảng nào đang chờ phê duyệt"
- Đang tải: spinner
- Phê duyệt thành công: toast xanh + dòng biến mất
- Từ chối thành công: toast cam + dòng biến mất
- Lỗi: toast đỏ

---

## Consolidation Note

Merged with UI feature F-077 (ui-phe-duyet-bc) — 2026-07-30
