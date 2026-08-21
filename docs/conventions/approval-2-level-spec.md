---
document: base-pattern
scope: kcht-approval-2-level
version: 1.0
last-updated: 2026-08-21
---

# Quy trình phê duyệt 2 cấp KCHT — Tài liệu nền dùng chung

## Tài liệu này dùng để làm gì?

Hệ thống có **28 loại Kết cấu hạ tầng hàng hải (KCHT)** (cảng biển, bến cảng, cầu cảng, cảng cạn, vùng nước, đèn biển, phao tiêu, nhà trạm, đài duyên hải, luồng hàng hải, đê kè, hệ thống VTS, trạm radar, …). Giữa chúng, **quy trình phê duyệt là giống hệt nhau** — đều là phê duyệt tối đa 2 cấp (vòng 1 = Cảng vụ/Chi cục, vòng 2 = Cục) với cùng 7 trạng thái và cùng các quy tắc (chống tự duyệt, bắt buộc lý do từ chối, ghi nhật ký…).

**Phần chung ở đây = quy trình phê duyệt 2 cấp được cả 28 loại dùng lại** — xác định theo tài liệu nghiệp vụ gốc `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (quy tắc 10: "quy trình áp dụng giống nhau cho cả 28 loại").

Tài liệu này gom phần chung đó vào **một chỗ**, để mỗi loại KCHT chỉ cần một tài liệu ngắn ghi **phần riêng của nó** (trường dữ liệu, validation theo loại, endpoint) — không phải viết lại quy trình phê duyệt 28 lần.

## Ai cần đọc?

| Người đọc | Đọc phần nào |
|---|---|
| Người quản lý, người review | Mục 1 đến 3 — để hiểu quy trình phê duyệt quy định gì |
| Người viết tài liệu (BA) | Cả tài liệu, đặc biệt mục 4 |
| Người lập trình (dev) | **Mục 3 trước khi code** — đây là quy tắc nghiệp vụ bắt buộc phải làm đúng |

---

## 1. Các loại KCHT áp dụng (28 loại)

> **Phạm vi áp dụng:** tài liệu này là khung cho **phần phê duyệt** của toàn bộ 28 loại KCHT. Phần CRUD và các đặc thù khác của từng loại nằm trong feature-brief riêng của loại đó; tài liệu này **chỉ** quy định phần phê duyệt dùng chung. Danh sách đầy đủ 28 loại do từng module con giữ.
>
> **Không áp dụng cho:** quy trình phê duyệt **tài sản** (biến động tài sản, tài sản đài TTDH) — luồng tài sản có thêm 2 trạng thái riêng cho "thay đổi nguyên giá" (quy tắc 13 của tài liệu gốc), làm riêng, không trộn vào đây.

| Nhóm loại KCHT | Module chủ | Các loại (đã xác minh) |
|---|---|---|
| Cảng bến | M-002 | Cảng biển (Port), bến cảng (Berth), cầu cảng (Pier), cảng cạn (DryPort), vùng nước (WaterZone) |
| Khu nước / VTS | M-003 | Luồng hàng hải, đê kè, cơ sở sửa chữa đóng tàu, trạm radar, hệ thống VTS |
| Báo hiệu & thông tin | M-004 | Đèn biển, phao tiêu, nhà trạm phao, nhà trạm đèn, đài duyên hải (TTDH, Inmarsat, Cospas-Sarsat, LRIT, TT hàng hải Hải Phòng) |
| Bản đồ GIS | GIS | Point / Line / Polygon (lớp hiển thị đồng bộ) |

## 2. Quy định chung — đọc thêm ở các chỗ này

Đây là quy định chung **của toàn bộ hệ thống** (không riêng quy trình phê duyệt), đã có sẵn, không chép lại ở đây:

| Chỗ đọc | Chứa gì | Dùng khi nào |
|---|---|---|
| `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root) | **Nguồn sự thật nghiệp vụ** của quy trình 2 cấp — 7 trạng thái, 14 quy tắc, bảng chuyển trạng thái mục 7, 9 ca sử dụng | Khi cần đối chiếu gốc |
| `docs/conventions/` (list-screen-ui-standard, form-and-list-patterns, management-screen-ui-standard) | Cách dựng màn danh sách, form, cửa sổ | Khi làm hoặc kiểm tra màn hình |
| `frontend/src/theme.ts` và `frontend/src/tokens.ts` | Màu sắc, khoảng cách, cỡ chữ đã định sẵn. **Cấm** ghi thẳng giá trị | Khi viết giao diện |
| `AGENTS.md` mục "Permission Registration for New Modules" + "Data Scope Convention" | Mô hình phân quyền động theo nhóm/tài khoản + đăng ký `PermissionSeeder.java` + data scope theo đơn vị | Khi cần phân quyền hoặc làm entity nghiệp vụ |

## 3. Quy tắc nghiệp vụ chung của quy trình phê duyệt (đọc kỹ trước khi làm)

### 3.1. 7 trạng thái của một hồ sơ

Một hồ sơ KCHT trải qua đúng **7 trạng thái** (6 hoạt động + 1 lưu trữ). Ánh xạ enum đã chốt:

| # | Trạng thái nghiệp vụ | `ApprovalStatus` | Ghi chú |
|---|---|---|---|
| 1 | Lưu tạm | `DRAFT` (0) | Mặc định khi tạo, chỉ người nhập nhìn thấy |
| 2 | Chờ Cảng vụ / Chi cục duyệt | `PENDING_APPROVAL` (2) | Đã gửi đi, chờ vòng 1 |
| 3 | Chờ Cục duyệt | `APPROVED_LEVEL1` (3) | Vòng 1 đã duyệt xong; cũng là đích khi người gửi cấp Cục submit thẳng (bỏ vòng 1) |
| 4 | Bị Cảng vụ / Chi cục trả về | `REJECTED_LEVEL1` | Vòng 1 từ chối |
| 5 | Bị Cục trả về | `REJECTED_LEVEL2` | Vòng 2 từ chối |
| 6 | Đã duyệt | `APPROVED` (5) | Hoàn tất, hồ sơ chính thức có hiệu lực |
| 7 | Đã xóa (lịch sử) | `ARCHIVED` (7) | Chỉ xóa được khi "Lưu tạm"; lưu để đối chiếu, không hiển thị |

> `APPROVED_LEVEL2` (4) **giữ lại nhưng không dùng** trong luồng thống nhất (legacy — tránh ảnh hưởng dữ liệu cũ). Ordinal chính xác của `REJECTED_LEVEL1` / `REJECTED_LEVEL2` chốt khi implement (không xung đột `ARCHIVED(7)`).

### 3.2. 2 vòng duyệt + phân cấp theo đơn vị gửi (quy tắc 4, 14)

- Phê duyệt **tối đa 2 vòng, đúng thứ tự, không được nhảy vòng**: vòng 1 (Cảng vụ/Chi cục) duyệt trước, vòng 2 (Cục) duyệt sau.
- **Phân cấp theo đơn vị gửi**: người gửi thuộc **cấp Cục** → bỏ qua vòng 1, vào thẳng "Chờ Cục duyệt" (chỉ còn 1 vòng). Xác định "thuộc cấp Cục" bằng **`OrgUnit.level`** (level-based — đã chốt).

Bảng chuyển trạng thái (khớp mục 7 tài liệu gốc — **mỗi dòng = 1 test case**):

| Từ trạng thái | Hành động | Sang trạng thái | Ai thực hiện |
|---|---|---|---|
| (mới) | Lưu tạm | Lưu tạm | Người nhập |
| (mới) | Gửi duyệt ngay | Chờ Cảng vụ / Chi cục duyệt | Người nhập |
| Lưu tạm | Gửi duyệt | Chờ Cảng vụ / Chi cục duyệt | Người nhập |
| Chờ Cảng vụ / Chi cục duyệt | Đồng ý | Chờ Cục duyệt | Cảng vụ / Chi cục |
| Chờ Cảng vụ / Chi cục duyệt | Từ chối | Bị Cảng vụ / Chi cục trả về | Cảng vụ / Chi cục |
| Chờ Cục duyệt | Đồng ý | Đã duyệt | Cục |
| Chờ Cục duyệt | Từ chối | Bị Cục trả về | Cục |
| Bị Cảng vụ / Chi cục trả về | Sửa + gửi lại | Chờ Cảng vụ / Chi cục duyệt | Người nhập |
| Bị Cục trả về | Sửa + gửi lại | Chờ Cảng vụ / Chi cục duyệt | Người nhập |
| Đã duyệt | Sửa (lưu và phê duyệt) | Đã duyệt | Người có quyền phê duyệt |
| Lưu tạm | Xóa | Đã xóa (lịch sử) | Người nhập |
| Bất kỳ | Dữ liệu tích hợp lưu thẳng | Đã duyệt | Hệ thống ngoài |

> **Re-submit luôn vào lại vòng 1** (đã chốt): kể cả "Bị Cục trả về" cũng quay về "Chờ Cảng vụ / Chi cục duyệt" — không gửi thẳng lại Cục.
>
> **Case test bắt buộc:** không được nhảy vòng (Chờ Cảng vụ/Chi cục → Đã duyệt), không được duyệt ngược (Chờ Cục → Chờ Cảng vụ/Chi cục), không được gửi duyệt khi chưa điền đủ thông tin bắt buộc, không được xóa hồ sơ khi không ở trạng thái "Lưu tạm".

### 3.3. Chống tự duyệt (4-eyes) — quy tắc 8

- Quyền duyệt gắn với **chức vụ của người duyệt**: lãnh đạo Cảng vụ/Chi cục chỉ duyệt vòng 1, lãnh đạo Cục duyệt vòng 2.
- **Người duyệt không được duyệt hồ sơ do chính mình gửi** (4-eyes principle).

### 3.4. Từ chối bắt buộc nhập lý do — quy tắc 5

- Từ chối ở bất kỳ vòng nào đều **bắt buộc nhập lý do**, tối thiểu **10 ký tự**.

### 3.5. Nhật ký phê duyệt + lịch sử thay đổi — quy tắc 7, 11

- Mỗi lần **gửi duyệt** và mỗi lần **duyệt/từ chối** đều phải ghi lại **người thực hiện + thời điểm** (để truy vết).
- Mọi thay đổi trên hồ sơ đều ghi nhật ký (bản cũ lưu trong nhật ký thay đổi).

### 3.6. Xóa mềm — quy tắc 11

- Chỉ xóa được hồ sơ đang ở trạng thái **"Lưu tạm"**.
- Xóa là **xóa mềm**: chuyển sang "Đã xóa (lịch sử)", không xóa khỏi cơ sở dữ liệu.

### 3.7. Phân quyền + Admin Cục

- Phân quyền dạng `<resource>:<action>`, gán động qua nhóm/tài khoản (xem `AGENTS.md`); quyền mới phải đăng ký trong `PermissionSeeder.java`.
- **Admin Cục**: full quyền + xem thêm metadata (người tạo, người sửa cuối, thời gian tạo/cập nhật).
- Granularity resource: dùng chung `kcht` (quyền theo chức vụ, không theo loại) — còn mở, SA chốt khi triển khai.

### 3.8. Data scope theo đơn vị

- Entity nghiệp vụ KCHT phải có `orgUnitId` + khai `@Filter(orgUnitFilter)` + controller `@DataScope` (xem `AGENTS.md` mục Data Scope Convention).
- Đơn vị nào chỉ xem dữ liệu đơn vị đó; đơn vị cha xem được đơn vị con (subtree); Cục xem full.

---

## 4. Mỗi loại KCHT có một tài liệu riêng — gồm các phần sau

> Cấu trúc chi tiết theo mẫu `docs/feature-brief-template.md` (khuôn BA điền), 7 mục. **Mục 3 "Trạng thái và phê duyệt" KHÔNG chép lại quy trình** — chỉ ghi:
>
> `Phần phê duyệt: theo docs/conventions/approval-2-level-spec.md (mục 3)`
>
> rồi khai báo riêng nếu loại đó có điểm đặc biệt.

Trong bảng **"Điểm khác biệt so với mẫu chung"** (8 dòng bắt buộc), với mọi loại KCHT: dòng 2 ("Có bước phê duyệt không") = **Có — theo tài liệu nền mục 3**; các dòng còn lại khai báo theo từng loại (trạng thái riêng, lọc cha-con/theo đơn vị, quyền riêng…).

**Quy tắc quan trọng:** muốn thay đổi quy định chung ở mục 3 → **sửa tài liệu này trước**, rồi mới sửa tài liệu của từng loại — không để feature-brief mâu thuẫn với tài liệu này.

---

## 5. Tóm tắt

> 28 loại KCHT dùng chung MỘT quy trình phê duyệt 2 cấp — 7 trạng thái, 2 vòng, chống tự duyệt, bắt buộc lý do từ chối, ghi nhật ký, xóa mềm — nằm gọn trong mục 3 của tài liệu này. Mỗi loại chỉ cần một feature-brief ngắn ghi phần riêng, tham chiếu tài liệu này cho phần phê duyệt.
