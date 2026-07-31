---
id: F-017
name: Phê duyệt Bến cảng
slug: phe-duyet-bc
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:42Z
last-updated: 2026-07-31
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Phê duyệt Bến cảng

**Tài liệu:** BA Feature Brief
**Feature:** F-017 — Phê duyệt Bến cảng
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-07-31

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Phê duyệt Bến cảng là tính năng cho phép phê duyệt Bến cảng theo **quy trình 2 cấp**:

1. **Cấp Cảng vụ/Chi cục** — duyệt trước, chuyển trạng thái `CHO_PHE_DUYET` → `CHO_PD_CAP_CUC`
2. **Cấp Cục** — duyệt sau, chuyển trạng thái `CHO_PD_CAP_CUC` → `DA_PHE_DUYET`

Mỗi cấp có thể **Phê duyệt** hoặc **Từ chối** (kèm lý do ≥10 ký tự). Mỗi quyết định tạo bản ghi **PheDuyetLog** (có trường `cap` để phân biệt cấp). Giao diện hiển thị danh sách bến đang chờ ở cấp tương ứng với người dùng.

Ngoài ra, admin-operation và system-admin có thể phê duyệt nhanh cả 2 cấp từ form tạo mới/cập nhật qua nút "Lưu và phê duyệt" (F-014, F-015).

### 1.2. Tại sao cần tính năng này?

Phê duyệt 2 cấp đảm bảo kiểm soát chất lượng chặt chẽ:

- Cấp Cảng vụ/Chi cục: kiểm tra tính hợp lệ về mặt kỹ thuật, vị trí, kết cấu
- Cấp Cục: phê duyệt cuối cùng về mặt quy hoạch, chính sách
- Mỗi cấp có thể từ chối và yêu cầu chỉnh sửa, tạo vòng phản hồi
- PheDuyetLog lưu vết đầy đủ ai duyệt, cấp nào, khi nào

### 1.3. Luồng hoạt động chính

**Cấp Cảng vụ/Chi cục:** Bến sau khi tạo/cập nhật và gửi phê duyệt có trạng thái `CHO_PHE_DUYET`. Cán bộ Cảng vụ/Chi cục truy cập màn hình "Phê duyệt Bến cảng" → thấy danh sách bến chờ cấp mình → xem chi tiết → Phê duyệt (`CHO_PD_CAP_CUC`) hoặc Từ chối (`TU_CHOI`).

**Cấp Cục:** Bến sau khi Cảng vụ duyệt có trạng thái `CHO_PD_CAP_CUC`. Cán bộ Cục truy cập màn hình → thấy danh sách bến chờ cấp mình → xem chi tiết → Phê duyệt (`DA_PHE_DUYET`) hoặc Từ chối (`TU_CHOI`).

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung. Mỗi vai trò có phạm vi truy cập và thao tác khác nhau, kiểm soát bởi RBAC.

### 2.1. Logic phân quyền chung

| Vai trò | Quyền xem | Quyền thao tác | Cấp duyệt | Ghi chú |
|---|---|---|---|---|
| system-admin (Admin Cục) | Xem toàn bộ | Phê duyệt, Từ chối cả 2 cấp; Lưu và phê duyệt (F-014/F-015) | Cục | Toàn quyền |
| admin-operation | Xem toàn bộ | Phê duyệt, Từ chối cả 2 cấp; Lưu và phê duyệt (F-014/F-015) | Cục | Vai trò vận hành chính |
| Lãnh đạo (cấp Cục) | Xem toàn bộ | Phê duyệt, Từ chối | **Cục** | Chỉ duyệt cấp Cục |
| Cán bộ Cảng vụ/Chi cục | Xem trong đơn vị | Phê duyệt, Từ chối | **Cảng vụ/Chi cục** | Chỉ duyệt cấp Cảng vụ |
| admin | Xem trong đơn vị | Không | — | Không có quyền phê duyệt |
| Chuyên viên / Lãnh đạo đơn vị | Xem trong đơn vị | Không | — | Không có quyền phê duyệt |
| Cá nhân | Không có quyền | Không | — | Không áp dụng |

### 2.2. Logic phân quyền đặc biệt cho Admin Cục

- **Xem toàn bộ** bến ở mọi cấp duyệt
- **Xem người phê duyệt từng cấp** (họ tên, username)
- **Xem thời gian phê duyệt từng cấp** (timestamp)
- **Xem lý do từ chối** đầy đủ

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-017-01:** Là Cán bộ Cảng vụ/Chi cục, tôi muốn xem danh sách bến đang chờ cấp tôi duyệt (`CHO_PHE_DUYET`).
- **US-017-02:** Là Cán bộ Cục, tôi muốn xem danh sách bến đang chờ cấp tôi duyệt (`CHO_PD_CAP_CUC`).
- **US-017-03:** Là Cán bộ Cảng vụ, tôi muốn phê duyệt bến → chuyển `CHO_PD_CAP_CUC` để Cục duyệt tiếp.
- **US-017-04:** Là Cán bộ Cục, tôi muốn phê duyệt bến → chuyển `DA_PHE_DUYET`, bến chính thức được kích hoạt.
- **US-017-05:** Là Cán bộ bất kỳ cấp, tôi muốn từ chối bến với lý do ≥10 ký tự → `TU_CHOI`.

### Mức Should (nên có)

- **US-017-06:** Là Cán bộ, tôi muốn xem toàn bộ lịch sử phê duyệt (ai duyệt cấp nào, khi nào).
- **US-017-07:** Là Cán bộ, tôi muốn lọc danh sách theo Đơn vị quản lý hoặc Cảng mẹ.

### Mức Could (có thể có sau)

- **US-017-08:** Là Cán bộ, tôi muốn phê duyệt/từ chối nhiều bến cùng lúc (bulk).

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Danh sách chờ duyệt

**AC-017-01 — Danh sách theo cấp:** Màn hình hiển thị bến theo cấp của người dùng:
- Cán bộ Cảng vụ/Chi cục → bến có `trangThaiPheDuyet = CHO_PHE_DUYET`
- Cán bộ Cục, Lãnh đạo, admin-op, system-admin → bến có `trangThaiPheDuyet = CHO_PD_CAP_CUC`
- **Xử lý khi lỗi:** API lỗi → toast "Không thể tải danh sách chờ phê duyệt".

**AC-017-02 — Cột danh sách:** Mã bến, Tên bến, Cảng mẹ, Loại kết cấu, Tình trạng, Ngày gửi PD, Người gửi PD. Với cấp Cục: hiển thị thêm Ngày PD cấp Cảng vụ, Người PD cấp Cảng vụ.

### Nhóm 2: Phê duyệt

**AC-017-03 — Phê duyệt cấp Cảng vụ:** Nhấn "Phê duyệt" → confirmation dialog → `POST /api/v1/ben-cang/:id/approve` body `{ "cap": "CANG_VU" }` → `trangThaiPheDuyet = CHO_PD_CAP_CUC` → tạo PheDuyetLog (cap=CANG_VU, action=APPROVE) → toast "Đã phê duyệt, chuyển Cục duyệt" → bến chuyển sang danh sách chờ Cục.

**AC-017-04 — Phê duyệt cấp Cục:** Nhấn "Phê duyệt" → confirmation dialog → `POST /api/v1/ben-cang/:id/approve` body `{ "cap": "CUC" }` → `trangThaiPheDuyet = DA_PHE_DUYET` → tạo PheDuyetLog (cap=CUC, action=APPROVE) → toast "Đã phê duyệt Bến cảng" → bến biến mất khỏi danh sách chờ.

### Nhóm 3: Từ chối

**AC-017-05 — Từ chối:** Nhấn "Từ chối" → dialog yêu cầu lý do ≥10 ký tự → `POST /api/v1/ben-cang/:id/reject` body `{ "cap": "...", "lyDo": "..." }` → `trangThaiPheDuyet = TU_CHOI` → tạo PheDuyetLog (action=REJECT, lyDo) → toast "Đã từ chối Bến cảng". Từ chối ở bất kỳ cấp nào cũng dừng quy trình.

**AC-017-06 — Chặn từ chối không lý do:** Nhập <10 ký tự → nút disable + counter "[n]/10 ký tự tối thiểu".

### Nhóm 4: PheDuyetLog

**AC-017-07 — Ghi nhận log:** Mỗi quyết định tạo 1 bản ghi: `benCangId`, `cap` (CANG_VU/CUC), `action` (APPROVE/REJECT), `pheDuyetBoi`, `thoiGian`, `lyDo`. Log bất biến.

### Nhóm 5: Phân quyền

**AC-017-08 — Giới hạn theo cấp:** Cán bộ Cảng vụ không thấy/thao tác được bến ở cấp Cục và ngược lại. Admin Cục/admin-op thấy và thao tác được cả 2 cấp.

**AC-017-09 — Từ chối truy cập:** Vai trò không có quyền → ẩn menu "Phê duyệt". URL trực tiếp → HTTP 403.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-017-01 | **Duyệt tuần tự 2 cấp** — Cảng vụ/Chi cục duyệt trước → `CHO_PD_CAP_CUC`; Cục duyệt sau → `DA_PHE_DUYET`. Không được duyệt vượt cấp | Phê duyệt | Nghiệp vụ | Admin Cục có thể duyệt cả 2 cấp |
| BR-017-02 | **Từ chối dừng quy trình** — từ chối ở bất kỳ cấp nào → `TU_CHOI`, không tiếp tục. Muốn duyệt lại → cập nhật (F-015) → gửi lại PD | Từ chối | Nghiệp vụ | Không |
| BR-017-03 | **Lý do từ chối ≥10 ký tự** — bắt buộc, không cho phép bỏ trống | Từ chối | UX | Không |
| BR-017-04 | **PheDuyetLog có trường `cap`** — CANG_VU / CUC, bất biến sau khi ghi | Audit | Thiết kế | Không |
| BR-017-05 | **Phân quyền theo cấp** — Cảng vụ chỉ duyệt cấp mình; Cục chỉ duyệt cấp mình; Admin Cục/admin-op duyệt được cả 2 | RBAC | Bảo mật | Admin Cục |
| BR-017-06 | **Audit log mọi thao tác** — actor, thời gian, hành động, IP | Audit | Bảo mật | Không |

---

## 6. Mô hình dữ liệu

> 🔴 = trường mới.

### 6.1. Bảng `ben_cang` — trạng thái phê duyệt

- 🔴 **trang_thai_phe_duyet:** NVARCHAR(50) — `CHO_PHE_DUYET` (chờ Cảng vụ) / `CHO_PD_CAP_CUC` (chờ Cục) / `DA_PHE_DUYET` / `TU_CHOI` / `NHAP`
- 🔴 **ly_do_tu_choi:** NVARCHAR(500), nullable

> **Luồng trạng thái:** `NHAP` → (gửi PD) → `CHO_PHE_DUYET` → (Cảng vụ duyệt) → `CHO_PD_CAP_CUC` → (Cục duyệt) → `DA_PHE_DUYET`. Từ chối ở bất kỳ đâu → `TU_CHOI`.

### 6.2. 🔴 Bảng `phe_duyet_log` — cập nhật

- id: BIGINT, PK
- ben_cang_id: BIGINT, FK
- 🔴 **cap:** NVARCHAR(20), NOT NULL — `CANG_VU` / `CUC`
- action: NVARCHAR(20), NOT NULL — `APPROVE` / `REJECT`
- phe_duyet_boi: NVARCHAR(100), NOT NULL
- thoi_gian: TIMESTAMP, DEFAULT NOW()
- ly_do: NVARCHAR(500), nullable

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/ben-cang?trangThaiPheDuyet=CHO_PHE_DUYET` | Danh sách chờ cấp Cảng vụ | `bencang:approve` (Cảng vụ) |
| GET | `/api/v1/ben-cang?trangThaiPheDuyet=CHO_PD_CAP_CUC` | Danh sách chờ cấp Cục | `bencang:approve` (Cục) |
| GET | `/api/v1/ben-cang/{id}` | Xem chi tiết bến | `bencang:approve` |
| POST | `/api/v1/ben-cang/{id}/approve` | Phê duyệt. Body: `{ "cap": "CANG_VU" \| "CUC" }` | `bencang:approve` |
| POST | `/api/v1/ben-cang/{id}/reject` | Từ chối. Body: `{ "cap": "...", "lyDo": "..." }` | `bencang:approve` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Luồng phê duyệt cấp Cảng vụ/Chi cục

```
Cán bộ Cảng vụ → màn hình "Phê duyệt Bến cảng"
→ GET /api/v1/ben-cang?trangThaiPheDuyet=CHO_PHE_DUYET
→ Danh sách bến chờ cấp mình
→ Chọn bến → xem chi tiết (GET /api/v1/ben-cang/{id})
→ "Phê duyệt" → confirmation dialog → xác nhận
→ POST /api/v1/ben-cang/{id}/approve { "cap": "CANG_VU" }
→ UPDATE trang_thai_phe_duyet = 'CHO_PD_CAP_CUC'
  INSERT phe_duyet_log (cap='CANG_VU', action='APPROVE', ...)
→ toast "Đã phê duyệt, chuyển Cục duyệt"
→ Bến chuyển sang danh sách chờ cấp Cục
```

### 8.2. Luồng phê duyệt cấp Cục

```
Cán bộ Cục → màn hình "Phê duyệt Bến cảng"
→ GET /api/v1/ben-cang?trangThaiPheDuyet=CHO_PD_CAP_CUC
→ Danh sách bến chờ cấp mình (kèm thông tin ai duyệt cấp Cảng vụ, khi nào)
→ Chọn bến → xem chi tiết
→ "Phê duyệt" → confirmation dialog → xác nhận
→ POST /api/v1/ben-cang/{id}/approve { "cap": "CUC" }
→ UPDATE trang_thai_phe_duyet = 'DA_PHE_DUYET'
  INSERT phe_duyet_log (cap='CUC', action='APPROVE', ...)
→ toast "Đã phê duyệt Bến cảng"
→ Bến biến mất khỏi danh sách chờ
```

### 8.3. Luồng từ chối

```
Cán bộ bất kỳ cấp → chọn bến → "Từ chối"
→ Dialog: textarea "Nhập lý do từ chối (tối thiểu 10 ký tự)"
→ Nhập ≥10 ký tự → "Xác nhận từ chối"
→ POST /api/v1/ben-cang/{id}/reject { "cap": "...", "lyDo": "..." }
→ UPDATE trang_thai_phe_duyet = 'TU_CHOI', ly_do_tu_choi = :lyDo
  INSERT phe_duyet_log (cap, action='REJECT', lyDo, ...)
→ toast "Đã từ chối Bến cảng"
→ Bến biến mất khỏi danh sách chờ
```

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** GET danh sách ≤500ms, POST approve/reject ≤1s, ≥30 concurrent users
- **Mở rộng:** PheDuyetLog có trường cap, dễ mở rộng thêm cấp nếu cần
- **Bảo mật:** RBAC `bencang:approve` + kiểm tra cấp; không cho phép sửa/xóa log; HTTPS
- **Độ tin cậy:** Transaction atomicity (update ben_cang + insert PheDuyetLog); rollback nếu lỗi
- **UX:** Confirmation dialog trước mọi hành động; counter ký tự; hiển thị rõ cấp đang duyệt
- **Pháp lý:** PheDuyetLog lưu trữ vĩnh viễn; audit log ≥2 năm

---

## 10. Yêu cầu giao diện

> Token từ theme.ts và tokens.ts. Không hardcode.

### 10.1. Màn hình danh sách chờ duyệt

- **Component:** `BenCangApprovalPage`
- **Header:** "Phê duyệt Bến cảng" + badge cấp hiện tại ("Cấp Cảng vụ/Chi cục" hoặc "Cấp Cục")
- **FilterBar:** Đơn vị quản lý, Cảng mẹ, Tìm kiếm
- **Bảng columns:** Mã bến, Tên bến, Cảng mẹ, Loại kết cấu, Tình trạng, Ngày gửi PD, Người gửi PD (+ cột Cảng vụ nếu là cấp Cục)
- **Thao tác:** "Phê duyệt" (primary) + "Từ chối" (danger)
- **Pagination:** 20/50

### 10.2. Dialog phê duyệt

- **Tiêu đề:** "Phê duyệt Bến cảng (Cấp [Cảng vụ/Cục])"
- **Nội dung:** "Bạn có chắc chắn muốn phê duyệt Bến cảng [maBen] - [tenBen]?"
- **Nút:** "Hủy" + "Xác nhận phê duyệt" (primary)

### 10.3. Dialog từ chối

- **Tiêu đề:** "Từ chối Bến cảng"
- **Textarea:** "Nhập lý do từ chối (tối thiểu 10 ký tự)"
- **Counter:** "[n]/10" (đỏ nếu <10, xanh nếu đủ)
- **Nút:** "Hủy" + "Xác nhận từ chối" (danger, disable đến khi ≥10)

### 10.4. Trạng thái UI

- Danh sách trống: "Không có Bến cảng nào đang chờ phê duyệt"
- Đang tải: spinner
- Phê duyệt thành công: toast xanh + dòng biến mất
- Từ chối: toast cam + dòng biến mất
- Lỗi: toast đỏ

---

## Consolidation Note

Merged with UI feature F-077 (ui-phe-duyet-bc) — 2026-07-31
