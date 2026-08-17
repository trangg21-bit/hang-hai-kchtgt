---
id: F-004
name: Quản lý kết nối liên thông
slug: quan-ly-ket-noi-lien-thong
module-id: M-001
status: proposed
classification: local
priority: medium
created: 2026-07-27T00:00:00Z
last-updated: 2026-08-17
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý kết nối liên thông

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-004
**Module:** M-001 — Quản trị hệ thống
**Loại:** chức năng thường (chỉ xem nhật ký — không có bước phê duyệt, không tạo/sửa/xóa)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Màn hình **xem nhật ký hoạt động chia sẻ và tích hợp dữ liệu** (kết nối liên thông) — **chỉ xem, không có thao tác tạo, sửa, xóa** (tài liệu nền mục 3.4). Có 2 loại trao đổi: **Tích hợp** (chủ động — xem danh sách, xem lịch sử kết nối, xem nội dung gửi/nhận) và **Chia sẻ** (bị động — xem danh sách và chi tiết). Nhật ký do phân hệ khác (M-009) tự ghi; F-004 chỉ tra cứu: lọc theo tên kết nối, hệ thống gửi, trạng thái; tìm kiếm trong lịch sử theo Loại gửi, Số tham chiếu, Thời gian (từ-đến) và tìm kiếm nâng cao (Mã nhận, ID, Mục đích). Ai có quyền `connection:read` mới thấy menu và dữ liệu.

## 2. Trường dữ liệu

### 2.1. Tab Tích hợp — bộ lọc và cột bảng

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Tên kết nối | Không | Text | Bộ lọc (FilterBar) |
| 2 | Hệ thống gửi | Không | Text/Select | Bộ lọc |
| 3 | Trạng thái | Không | Select: Sử dụng / Không sử dụng | Bộ lọc |
| 4 | STT | — | Text (tự động) | Cột |
| 5 | Tên tài khoản | — | Text | Cột: tenTaiKhoan |
| 6 | Tên kết nối | — | Text | Cột: tenKetNoi |
| 7 | Hệ thống gửi | — | Text | Cột: heThongGui |
| 8 | Hệ thống nhận | — | Text | Cột: heThongNhan |
| 9 | Trạng thái | — | Tag: Sử dụng (xanh lá) / Không sử dụng (xám) | Cột: trangThai (BR-004-03) |
| 10 | Thao tác | — | Xem lịch sử (xem chi tiết) | Chỉ xem — không có thao tác Sửa |

### 2.2. Bảng Lịch sử kết nối (bảng con của Tab Tích hợp)

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Loại gửi | Không | Text/Select | Bộ lọc chính |
| 2 | Số tham chiếu | Không | Text | Bộ lọc chính: soThamChieu |
| 3 | Thời gian | Không | Date range (từ-đến) | Bộ lọc chính |
| 4 | Mã nhận / ID / Mục đích | Không | Text | Bộ lọc nâng cao (mở rộng): maNhan, id, mucDich |
| 5 | STT, ID, Thông tin gửi (7 cột), Thông tin nhận (2 cột) | — | Cột bảng | Loại, tên, số tham chiếu, thời gian gửi, mục đích, đơn vị, người gửi / thời gian nhận, mã nhận |
| 6 | Thao tác | — | Xem nội dung gửi / nội dung nhận | Popup JSON/text |

### 2.3. Tab Chia sẻ — bảng

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | STT | — | Text (tự động) | Cột |
| 2 | Tên tài khoản | — | Text | Cột: tenTaiKhoan |
| 3 | Tên kết nối | — | Text | Cột: tenKetNoi |
| 4 | Hệ thống gửi | — | Text | Cột: heThongGui |
| 5 | Hệ thống nhận | — | Text | Cột: heThongNhan |
| 6 | ID (mã giao dịch) | — | Text | Cột: maGiaoDich — chỉ có ở Chia sẻ, do hệ thống sinh (BR-004-02) |
| 7 | Trạng thái | — | Tag | Cột: trangThai |
| 8 | Thao tác | — | Xem chi tiết | Popup chi tiết chia sẻ (noiDungChiTiet) |

## 3. Trạng thái và phê duyệt

Theo tài liệu nền (mục 3.7) — giá trị phân loại/trạng thái lưu dạng **số** (INT) và map Enum ở backend:

- **Loại trao đổi:** TÍCH HỢP (chủ động — có bộ lọc và xem lịch sử) / CHIA SẺ (bị động — xem danh sách + chi tiết) — BR-004-01.
- **Trạng thái kết nối:** Sử dụng / Không sử dụng — BR-004-03.
- **ID giao dịch:** chỉ có trong Chia sẻ — mã giao dịch do hệ thống sinh — BR-004-02.

**Không có bước phê duyệt; không có thao tác tạo/sửa/xóa** — nhật ký do M-009 tự ghi (chỉ xem — tài liệu nền mục 3.4; brief cũ BR-004-04 "Log read-only" giữ phần read-only, **bỏ ngoại lệ sửa**).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (BR-004-01..BR-004-04 — kế thừa từ lean-spec cũ F-004, điều chỉnh theo tài liệu nền mục 3.4)

- BR-004-01 — 2 loại trao đổi: TÍCH HỢP (chủ động, có lọc + xem lịch sử) vs CHIA SẺ (bị động, xem chi tiết).
- BR-004-02 — ID chỉ có trong Chia sẻ — mã giao dịch do hệ thống sinh.
- BR-004-03 — Trạng thái kết nối: Sử dụng / Không sử dụng.
- BR-004-04 — Nhật ký hoạt động chia sẻ/tích hợp **read-only** (do M-009 ghi) — **không có bất kỳ thao tác tạo, sửa, xóa nào** (tài liệu nền mục 3.4). (Brief cũ: "Log read-only (do M-009 ghi), ngoại lệ: sửa Tên KN/Password/Trạng thái" — ngoại lệ sửa đã bỏ.)
- Bổ sung (tài liệu nền mục 3.4): màn hình chỉ xem — không có nút tạo/sửa/xóa; nhật ký được ghi bởi phân hệ tích hợp (M-009), F-004 không ghi.

### 4.2. Acceptance criteria kế thừa (AC-004-01..AC-004-07 — trừ AC-004-04 xung đột)

- AC-004-01 — Tab Tích hợp: filter → bảng STT, Tên TK, Tên KN, Hệ thống gửi, Hệ thống nhận, Trạng thái (tag), Thao tác (Xem lịch sử).
- AC-004-02 — Bảng Lịch sử: tìm kiếm Loại gửi + Số TC + Thời gian từ-đến → STT, ID, Thông tin gửi (7 cột), Thông tin nhận (2 cột), Thao tác (Xem ND gửi/nhận).
- AC-004-03 — Tìm kiếm nâng cao: mở rộng Mã nhận, ID, Mục đích gửi.
- AC-004-04 — (brief cũ: "Sửa: popup Tên KN + Password + Trạng thái → toast 'Đã cập nhật kết nối'") — **KHÔNG áp dụng**: mâu thuẫn với tài liệu nền mục 3.4 (chỉ xem).
- AC-004-05 — Tab Chia sẻ: bấm Tìm kiếm → STT, Tên TK, Tên KN, Hệ thống gửi, Hệ thống nhận, ID, Trạng thái (tag), Thao tác (Xem chi tiết).
- AC-004-06 — Popup chi tiết chia sẻ.
- AC-004-07 — Menu chỉ hiển thị khi có quyền `connection:read`.

### 4.3. User stories kế thừa (US-004-01..US-004-07 — trừ US-004-05 xung đột)

- US-004-01 (Must) — Xem log tích hợp với bộ lọc. US-004-02 (Must) — Xem lịch sử kết nối với tìm kiếm (Loại gửi, Số TC, thời gian). US-004-03 (Must) — Xem nội dung gửi/nhận. US-004-04 (Must) — Xem log chia sẻ.
- US-004-05 (brief cũ: "Edit connection (Tên KN, Password, Trạng thái)") — **KHÔNG áp dụng** (xung đột tài liệu nền mục 3.4).
- US-004-06 (Should) — Tìm kiếm nâng cao (Mã nhận, ID, Mục đích). US-004-07 (Should) — Lọc tích hợp theo trạng thái.

### 4.4. Phân quyền riêng

Quyền theo mẫu `<resource>:<action>`, gán động qua nhóm/tài khoản (tài liệu nền mục 3.2); quyền mới phải đăng ký trong `PermissionSeeder.java`.

| Thao tác | Quyền cần có | Ghi chú |
|---|---|---|
| Xem menu + danh sách + chi tiết + lịch sử + nội dung gửi/nhận | `connection:read` | Chỉ quyền đọc — không có quyền tạo/sửa/xóa (mục 3.4 nền) |
| Không có quyền `connection:read` | — | Không thấy menu (brief cũ: "Khác — No access") |

Bảng vai trò × thao tác (mô hình cũ — **đã thay thế** bằng bảng trên): system-admin view (+ edit limited theo brief cũ — đã bỏ phần edit); các tài khoản khác no access. Trong mô hình động, quyền truy cập thể hiện qua quyền `connection:read` gán động cho nhóm/tài khoản; ROLE_SYSTEM_ADMIN / ROLE_SUPER_ADMIN vượt qua mọi kiểm tra quyền.

**Admin Cục:** mặc định theo tài liệu nền mục 3.8 — full quyền + xem thêm metadata (người tạo, người sửa cuối, thời gian tạo/cập nhật); không có gì đặc biệt ngoài mặc định.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 2 loại trao đổi (TÍCH HỢP/CHIA SẺ) + trạng thái kết nối Sử dụng/Không sử dụng (INT) |
| 2 | Có bước phê duyệt không | Không |
| 3 | Lọc cha-con / theo đơn vị | Không — lọc theo tên kết nối, hệ thống gửi/nhận, trạng thái, thời gian (không lọc theo cây đơn vị tổ chức) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — cột ID (mã giao dịch) chỉ có trong Tab Chia sẻ (BR-004-02); bộ lọc nâng cao (Mã nhận, ID, Mục đích) mở rộng trong bảng Lịch sử; trạng thái tag xanh/xám |
| 5 | Quyền riêng | `connection:read` (chỉ đọc — không có quyền tạo/sửa/xóa) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — màn hình 2 tab (Tích hợp / Chia sẻ); bảng con Lịch sử kết nối bên trong Tab Tích hợp; popup xem nội dung gửi/nhận dạng JSON/text; chỉ-xem hoàn toàn (không có nút Thêm/Sửa/Xóa) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/lien-thong/tich-hop` | Danh sách tích hợp (filter: tenKetNoi, heThongGui, trangThai) | `connection:read` |
| GET | `/api/lien-thong/tich-hop/{id}/lich-su` | Lịch sử kết nối (filter: loaiGui, soThamChieu, tuNgay-denNgay, maNhan, id, mucDich) | `connection:read` |
| GET | `/api/lien-thong/tich-hop/lich-su/{id}/noi-dung-gui` | Nội dung gửi | `connection:read` |
| GET | `/api/lien-thong/tich-hop/lich-su/{id}/noi-dung-nhan` | Nội dung nhận | `connection:read` |
| GET | `/api/lien-thong/chia-se` | Danh sách chia sẻ | `connection:read` |
| GET | `/api/lien-thong/chia-se/{id}` | Chi tiết chia sẻ | `connection:read` |

Ghi chú: endpoint `PUT /api/lien-thong/tich-hop/{id}` (sửa Tên KN/Password/Trạng thái — brief cũ) **không còn** — mâu thuẫn với tài liệu nền mục 3.4 (chỉ xem).

> **Lưu ý:** backend hiện chưa có controller cho các endpoint trên — SA chốt contract với M-009 (bảng `data_sharing_logs`) khi triển khai.

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ. Các bảng dữ liệu do phân hệ **M-009** sở hữu và ghi (F-004 chỉ đọc) — cấu trúc cần SA xác nhận với M-009.

| Bảng | Trường (thực tế) | Ghi chú |
|---|---|---|
| `data_sharing_logs` (Entity `DataSharingLog` — `src/main/java/com/hanghai/kchtg/interconnect/entity/DataSharingLog.java`) | transaction_code, account_name, connection_name, sender_system, receiver_system, status, detail_content (+ trường audit từ `BaseEntity`) | Bảng duy nhất lưu nhật ký hoạt động chia sẻ/tích hợp dữ liệu; phân biệt 2 loại TÍCH HỢP/CHIA SẺ theo nội dung ghi (M-009) — cấu trúc chi tiết do SA chốt với M-009 |

Ghi chú: `status` hiện lưu VARCHAR(50) trong entity thực tế — theo mục 3.7 nền, SA/Dev quyết định chuyển sang số (INT) khi triển khai; tên cột đã là tiếng Anh chuẩn.
