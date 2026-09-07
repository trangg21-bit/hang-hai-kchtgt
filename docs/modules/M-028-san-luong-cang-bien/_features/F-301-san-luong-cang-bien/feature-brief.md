---
id: F-301
name: "Sản lượng cảng biển"
slug: san-luong-cang-bien
module-id: M-028
status: proposed
classification: local
priority: high
created: 2026-09-02
last-updated: 2026-09-06
locked-fields: []
consumed_by_modules: []
source-paths:
  - src/main/java/com/hanghai/kchtg/seaportthroughput/entity/SeaportThroughput.java
  - src/main/java/com/hanghai/kchtg/seaportthroughput/entity/SeaportThroughputFile.java
  - src/main/java/com/hanghai/kchtg/seaportthroughput/repository/SeaportThroughputRepository.java
  - src/main/java/com/hanghai/kchtg/seaportthroughput/repository/SeaportThroughputFileRepository.java
  - src/main/java/com/hanghai/kchtg/seaportthroughput/dto/SeaportThroughputCreateRequest.java
  - src/main/java/com/hanghai/kchtg/seaportthroughput/dto/SeaportThroughputUpdateRequest.java
  - src/main/java/com/hanghai/kchtg/seaportthroughput/dto/SeaportThroughputResponse.java
  - src/main/java/com/hanghai/kchtg/seaportthroughput/dto/SeaportThroughputFileResponse.java
  - src/main/java/com/hanghai/kchtg/seaportthroughput/dto/SearchResultResponse.java
  - src/main/java/com/hanghai/kchtg/seaportthroughput/service/SeaportThroughputService.java
  - src/main/java/com/hanghai/kchtg/seaportthroughput/controller/SeaportThroughputController.java
  - src/main/java/com/hanghai/kchtg/gis/search/dto/InfrastructureType.java
  - src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java
  - src/main/resources/db/migration/V20260905120000__seaport_throughput.sql
  - frontend/src/pages/seaport-throughput/SeaportThroughputPage.tsx
  - frontend/src/pages/seaport-throughput/SeaportThroughputDrawer.tsx
  - frontend/src/pages/seaport-throughput/seaportThroughputMeta.ts
  - frontend/src/services/seaportThroughputService.ts
  - frontend/src/services/seaportThroughputService.test.ts
  - frontend/src/components/InputDecimal.tsx
---

# Đặc tả nghiệp vụ: Sản lượng cảng biển

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`) — **đã scaffold id F-301 trong M-028** (folder chính thức: `docs/modules/M-028-san-luong-cang-bien/_features/F-301-san-luong-cang-bien/`)
**Chức năng:** F-301 — Sản lượng cảng biển
**Module:** M-028 — Sản lượng cảng biển
**Loại:** chức năng có bước phê duyệt (2 cấp: Cảng vụ/Chi cục → Cục)
**Tham chiếu:**
- Nguồn sự thật: Excel `HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` — sheet `30->43`, cụm **#33 'QL Sản lượng cảng biển'** (khối cột đứng trước cụm #34 'QL Kiểm kê tài sản').
- Tài liệu yêu cầu gốc (hh.csdl): TKCT/URD mục **III.7.53 Quản lý sản lượng cảng biển** + **III.7.54 Phê duyệt thông tin sản lượng cảng biển** (`docs/intel/temp_extract/20260616T031810-3cef57d6c3853955-ZOxvv1/URD_MTIS_VMD_v3.0_PHCV-00000000.txt`, ~dòng 66173 trở đi; `docs/intel/_tkct_raw.txt` UC #148/#149).
- Tài liệu nền `ba/01-base-pattern.md` của M-028: **chưa tồn tại** (module scaffold mới 2026-09-06; phần CHUNG của module được đặc tả tại `ba/00-lean-spec.md` của M-028) — brief này chỉ ghi phần RIÊNG theo Excel #33.

> ✅ **Đối chiếu Excel 2026-09-04:** toàn bộ mục 6–7 là đề xuất của BA (SA chốt khi scaffold) — đã đọc kỹ từng ô cụm #33: `SelectOrgCode` **disabled khi sửa**; `DatePicker` **chọn tháng**; **24 dòng `InputDecimal`** (STT 4–27) cờ **List = F, Filter = F, Detail = T, Create = T**; cột **Sửa để trống** trên Excel. Các chỗ còn ghi **UNRESOLVED** là khoảng trống cần SA chốt khi scaffold — không bịa.

---

## 1. Mô tả ngắn

- Chức năng cho phép chuyên viên/người dùng cảng **kê khai và quản lý sản lượng cảng biển** theo từng kỳ: mỗi bản ghi gắn với một Đơn vị quản lý và một mốc "Thời gian tổng hợp sản lượng" (theo tháng).
- Dữ liệu sản lượng hàng hóa được khai theo **8 chỉ tiêu × 3 nhóm tuyến/vận chuyển**: Hàng container / Hàng khô / Hàng lỏng / Hàng khác, mỗi loại có đơn vị **(Tấn)** và **(Tấn - Km)**; ba nhóm gồm *Sản lượng vận tải trong nước*, *Sản lượng vận tải nước ngoài*, *Sản lượng theo tuyến vận chuyển*; kèm chỉ tiêu **Vận tải hành khách (Lượt hành khách)** và File đính kèm.
- Số liệu kê khai phải qua **luồng phê duyệt 2 cấp: Lãnh đạo Cảng vụ/Chi cục (cấp 1) → Lãnh đạo Cục (cấp 2)**; trạng thái hiển thị dạng badge (Lưu tạm / … / Ban hành), có cán bộ + ngày cập nhật, lịch sử hình thành và lịch sử phê duyệt.
- Người dùng: Chuyên viên Cục/Cảng vụ/Chi cục (kê khai, cập nhật, gửi duyệt), Lãnh đạo Cảng vụ/Chi cục & Cục (phê duyệt), Admin Cục.
- Sau khi được duyệt (ban hành), số liệu là **đầu vào nguồn** cho các báo cáo khối lượng hàng hóa của module Thống kê chuyên đề cũ (xem phân tích `overlap-analysis.md`: các feature F-165/166/168/169 nằm ở module cũ — không thuộc phạm vi M-028).

## 2. Trường dữ liệu

Nguồn: khối cột cụm **#33** sheet `30->43` + URD III.7.53 (MH Cập nhật / MH Tìm kiếm — 2 nguồn khớp nhau về danh sách và thứ tự trường STT 1–28). Cờ cột `Danh sách / Bộ lọc / Xem chi tiết / Tạo mới / Sửa` ghi theo giá trị đọc được trên Excel; ô không đọc chắc → **UNRESOLVED**.

### Thông tin chung (phần đầu bản ghi)

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị quản lý | Có | `SelectOrgCode` (dropdown đơn vị; **disabled khi sửa**) | Excel: Loại điều khiển `SelectOrgCode (disabled khi sửa)`. Cờ: Danh sách = Có, Bộ lọc = Có, Xem chi tiết = Có, Tạo mới = Có, Sửa = không đổi (disabled). Gán theo đơn vị của người kê khai (DataScope — xem §4/§5). Cột EN: `org_unit_id` |
| 2 | Thời gian tổng hợp sản lượng | Có | `DatePicker` (chọn tháng) | Excel ghi chú thêm "disabled" (khi nào disabled — sau khi đã ban hành? — **UNRESOLVED**, chờ SA chốt; URD MH Cập nhật: bắt buộc "X"). Cờ: Danh sách = Có, Bộ lọc = Có, Xem chi tiết = Có, Tạo mới = Có. Cột EN: `report_month` |
| 3 | Ghi chú | Không | `InputTextArea` | Cờ: Xem chi tiết = Có, Tạo mới = Có; Danh sách/Bộ lọc = Không. Cột EN: `note` |

### Sản lượng vận tải trong nước (nhóm chỉ tiêu 1)

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 4 | Hàng container (Tấn) | Không | `InputDecimal` | Cờ: Danh sách = Không, Bộ lọc = Không, Xem chi tiết = Có, Tạo mới = Có; Sửa (ô cờ để trống trên Excel — **UNRESOLVED**; theo URD có trong MH Cập nhật nên dự kiến sửa được). Mặc định 0. EN: `domestic_container_ton` |
| 5 | Hàng container (Tấn - Km) | Không | `InputDecimal` | như trên. EN: `domestic_container_ton_km` |
| 6 | Hàng khô (Tấn) | Không | `InputDecimal` | EN: `domestic_dry_ton` |
| 7 | Hàng khô (Tấn - Km) | Không | `InputDecimal` | EN: `domestic_dry_ton_km` |
| 8 | Hàng lỏng (Tấn) | Không | `InputDecimal` | EN: `domestic_liquid_ton` |
| 9 | Hàng lỏng (Tấn - Km) | Không | `InputDecimal` | EN: `domestic_liquid_ton_km` |
| 10 | Hàng khác (Tấn) | Không | `InputDecimal` | EN: `domestic_other_ton` |
| 11 | Hàng khác (Tấn - Km) | Không | `InputDecimal` | EN: `domestic_other_ton_km` |

### Sản lượng vận tải nước ngoài (nhóm chỉ tiêu 2)

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 12 | Hàng container (Tấn) | Không | `InputDecimal` | như nhóm trong nước. EN: `foreign_container_ton` |
| 13 | Hàng container (Tấn - Km) | Không | `InputDecimal` | EN: `foreign_container_ton_km` |
| 14 | Hàng khô (Tấn) | Không | `InputDecimal` | EN: `foreign_dry_ton` |
| 15 | Hàng khô (Tấn - Km) | Không | `InputDecimal` | EN: `foreign_dry_ton_km` |
| 16 | Hàng lỏng (Tấn) | Không | `InputDecimal` | EN: `foreign_liquid_ton` |
| 17 | Hàng lỏng (Tấn - Km) | Không | `InputDecimal` | EN: `foreign_liquid_ton_km` |
| 18 | Hàng khác (Tấn) | Không | `InputDecimal` | EN: `foreign_other_ton` |
| 19 | Hàng khác (Tấn - Km) | Không | `InputDecimal` | EN: `foreign_other_ton_km` |

### Sản lượng theo tuyến vận chuyển (nhóm chỉ tiêu 3)

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 20 | Hàng container (Tấn) | Không | `InputDecimal` | EN: `route_container_ton` |
| 21 | Hàng container (Tấn - Km) | Không | `InputDecimal` | EN: `route_container_ton_km` |
| 22 | Hàng khô (Tấn) | Không | `InputDecimal` | EN: `route_dry_ton` |
| 23 | Hàng khô (Tấn - Km) | Không | `InputDecimal` | EN: `route_dry_ton_km` |
| 24 | Hàng lỏng (Tấn) | Không | `InputDecimal` | EN: `route_liquid_ton` |
| 25 | Hàng lỏng (Tấn - Km) | Không | `InputDecimal` | EN: `route_liquid_ton_km` |
| 26 | Hàng khác (Tấn) | Không | `InputDecimal` | EN: `route_other_ton` |
| 27 | Hàng khác (Tấn - Km) | Không | `InputDecimal` | EN: `route_other_ton_km` |

### Vận tải hành khách

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 28 | Lượt hành khách | Không | `Input` (số) | URD: `Input Text`. Excel cụm #33: hàng kế sau #27 — cờ từng ô chưa đối chiếu chắc (UNRESOLVED); dự kiến giống nhóm chỉ tiêu (Xem/Create = Có). EN: `passenger_trips` |

### File đính kèm

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 29 | File đính kèm | Không | `UploadFileTable` | Danh sách file con: STT + Tên file (URD). Kèm thao tác xóa file đính kèm (UC #148). EN: bảng con `seaport_throughput_file` |

### Nhóm trường theo dõi & phê duyệt (đuôi bản ghi — chờ xác nhận cột)

> Các trường này xuất hiện ở cuối khối cụm #33 và khớp với mẫu "Xử lý & theo dõi" dùng chung cho các đối tượng có phê duyệt 2 cấp (đối chiếu CSV `QL bến phao` TAB 5). STT và cờ từng ô trên Excel chưa đối chiếu hết từ bản văn phẳng → **đánh dấu UNRESOLVED** tới khi scaffold.

| Trường | Kiểu / ràng buộc | Ghi chú |
|---|---|---|
| Trạng thái | `Select` hiển thị dạng **badge** (read-only) | Badge trạng thái chuẩn (viên thuốc, màu semantic). Giá trị: Lưu tạm → … → Ban hành (xem §3). Có trên Danh sách + Bộ lọc + Xem chi tiết |
| Cán bộ cập nhật | `Text` (hiển thị, không nhập) | List + Detail |
| Ngày cập nhật | `DatePicker`/`Text` (hiển thị, không nhập) | List + Detail; bộ lọc "Ngày cập nhật (Từ ngày - đến ngày)" (URD MH Tìm kiếm #4); sort mặc định theo Ngày cập nhật giảm dần |
| Ngày gửi phê duyệt / Cán bộ gửi phê duyệt | `Text` (read-only) | List + Detail |
| Ngày phê duyệt cấp Cảng vụ/Chi cục / Cán bộ phê duyệt cấp Cảng vụ/Chi cục / Nội dung phê duyệt | `Text` (read-only) | Nội dung phê duyệt chỉ ở Detail |
| Ngày phê duyệt cấp Cục / Cán bộ phê duyệt cấp Cục / Nội dung phê duyệt | `Text` (read-only) | Nội dung phê duyệt chỉ ở Detail |
| Lịch sử hình thành / Lịch sử phê duyệt | màn hình/xem riêng | UC #148 "xem thông tin lịch sử hình thành" — ghi từ bảng lịch sử tập trung |

## 3. Trạng thái và phê duyệt

- Trạng thái lưu dạng **số nguyên (Enum ORDINAL)**, không lưu chữ — theo convention dự án (`ApprovalStatus`/`BaseApprovableEntity`, mặc định `DRAFT` khi tạo).
- **Đề xuất ánh xạ trạng thái chuẩn (SA chốt khi scaffold — UNRESOLVED tới lúc đó):**

| Nhãn UI (Excel) | Trạng thái hệ thống (đề xuất) | Ý nghĩa |
|---|---|---|
| Lưu tạm | `DRAFT` | Mới tạo, chưa gửi duyệt — sửa/xóa được |
| (Chờ Cảng vụ/Chi cục duyệt) | `PENDING_L1` (tương đương SUBMITTED) | Đã gửi phê duyệt cấp 1 |
| (Chờ Cục duyệt) | `PENDING_L2` | Đã được cấp Cảng vụ/Chi cục duyệt, chờ cấp Cục |
| Ban hành (= Đã duyệt) | `APPROVED` | Cấp Cục phê duyệt → khóa sửa dữ liệu chính, chỉ còn trường theo dõi |
| Từ chối | `REJECTED` | Từ chối ở cấp 1 hoặc cấp 2 (kèm lý do) → quay về sửa/gửi lại |

- **Luồng phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục):**
  1. Chuyên viên tạo bản ghi (mặc định **Lưu tạm**), nhập đủ số liệu, gửi phê duyệt → ghi `Ngày gửi phê duyệt`/`Cán bộ gửi phê duyệt`.
  2. **Lãnh đạo Cảng vụ/Chi cục** duyệt cấp 1: chấp nhận → chuyển lên Cục; từ chối → nhập lý do từ chối, bản ghi về `REJECTED`.
  3. **Lãnh đạo Cục** duyệt cấp 2: chấp nhận → **Ban hành** (`APPROVED`); từ chối → nhập lý do, về `REJECTED`.
  4. Mỗi bước ghi `Ngày/Cán bộ/Nội dung phê duyệt` tương ứng + lịch sử phê duyệt; nguyên tắc **4-eyes**: người kê khai không tự duyệt bản ghi của mình.
- Tab "Lịch sử & Phê duyệt" chỉ hiển thị khi `drawerMode !== 'create'` (theo convention Form Drawer).
- **Ghi chú trạng thái trên Excel:** nhãn hiển thị trên badge ghi là "Trạng thái (lưu tạm/ban hành/lịch sử)" — cần chốt ý nghĩa "lịch sử" (thẻ xem lịch sử hay trạng thái trung gian); hiện hiểu là: badge hiển thị Lưu tạm/Ban hành, còn **lịch sử** là màn hình xem riêng. UNRESOLVED nếu khác.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc RIÊNG của chức năng (chưa có trong phần chung). Phần chung (DataScope, badge 6 trạng thái, quy ước đa ngôn ngữ, cache tên đơn vị…) theo AGENTS.md và sẽ nằm trong tài liệu nền module khi scaffold.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-SLCB-01 | Mỗi bản ghi sản lượng xác định duy nhất bởi (org_unit_id, report_month); trùng (đơn vị, tháng) khi tạo/sửa → báo lỗi "Đã tồn tại số liệu sản lượng của đơn vị trong tháng này" | Create/Edit |
| BR-SLCB-02 | Đơn vị quản lý bắt buộc, được gán mặc định = đơn vị của người kê khai (hoặc chọn trong phạm vi DataScope); **không đổi khi sửa** (disabled) | Create |
| BR-SLCB-03 | Thời gian tổng hợp sản lượng bắt buộc, chọn theo tháng (MM/YYYY); không cho phép 2 bản ghi cùng đơn vị cùng tháng (xem BR-01) | Create |
| BR-SLCB-04 | Chỉ tiêu số liệu nhập số ≥ 0, mặc định 0; không nhập âm | Create/Edit |
| BR-SLCB-05 | Khi trạng thái = Ban hành (`APPROVED`): khóa sửa/xóa các trường kê khai (1–29); chỉ xem và theo dõi | Edit/Delete |
| BR-SLCB-06 | Chỉ gửi phê duyệt khi trạng thái Lưu tạm hoặc Từ chối (sửa lại) | Submit |
| BR-SLCB-07 | 4-eyes: người kê khai không được tự phê duyệt bản ghi do mình tạo | Approve |
| BR-SLCB-08 | Từ chối ở bất kỳ cấp nào bắt buộc nhập lý do từ chối (lưu vào nội dung phê duyệt + lịch sử) | Reject |
| BR-SLCB-09 | Cập nhật từ file (Excel): validate theo đúng danh sách cột = §2 (Đơn vị quản lý bắt buộc, Thời gian tổng hợp bắt buộc); dòng lỗi liệt kê rõ, không ghi nửa chừng (all-or-nothing hoặc báo cáo lỗi theo dòng — SA chốt) | Import |
| BR-SLCB-10 | Mọi thay đổi trạng thái/sửa/xóa ghi đầy đủ thông tin kiểm toán (`operatorId`/`updatedBy`/`deletedBy`) và vào lịch sử tập trung | All |
| BR-SLCB-11 | Không nhập tên đơn vị tự do: luôn lấy từ cây đơn vị (OrgUnit) qua `OrgUnitCacheService`; response trả `orgUnitId` + `orgUnitName` | All |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-SLCB-01** — Tạo mới: nhập đủ trường bắt buộc, lưu tạm thành công, badge = "Lưu tạm". Khi thiếu trường bắt buộc: chặn và hiển thị lỗi tiếng Việt.
- **AC-SLCB-02** — Gửi duyệt: bản ghi Lưu tạm gửi duyệt → trạng thái chờ duyệt, ghi Ngày/Cán bộ gửi phê duyệt.
- **AC-SLCB-03** — Duyệt 2 cấp: Cảng vụ/Chi cục duyệt → chờ Cục; Cục duyệt → "Ban hành"; từ chối ở cấp nào cũng phải nhập lý do.
- **AC-SLCB-04** — Danh sách: đủ 4 trạng thái `loading / error / empty / data`; filter gồm Đơn vị quản lý (cây), Trạng thái, Thời gian tổng hợp, khoảng Ngày cập nhật.
- **AC-SLCB-05** — Số liệu đã Ban hành không sửa được số liệu chính (chỉ xem/lịch sử).
- **AC-SLCB-06** — Cập nhật từ file Excel: file đúng mẫu → nhập thành công; sai định dạng/thiếu cột bắt buộc → báo lỗi cụ thể, không mất dữ liệu đã nhập.
- **AC-SLCB-07** — Lịch sử hình thành/phê duyệt hiển thị đúng thứ tự thời gian (mặc định mới nhất trước), đủ Ngày/Cán bộ/Nội dung từng bước.

### 4.3. User Stories kế thừa (nếu có)

- **US-SLCB-01:** Là chuyên viên cảng vụ, tôi kê khai số liệu sản lượng tháng của đơn vị mình và gửi lên để lãnh đạo duyệt.
- **US-SLCB-02:** Là lãnh đạo Cảng vụ/Chi cục, tôi duyệt/từ chối số liệu của các đơn vị trong phạm vi để chuyển lên Cục.
- **US-SLCB-03:** Là lãnh đạo Cục, tôi phê duyệt cấp cuối để số liệu chính thức (ban hành) làm nguồn báo cáo thống kê.
- **US-SLCB-04:** Là cán bộ được phân quyền, tôi cập nhật số liệu hàng loạt từ file Excel và xem báo cáo lỗi dòng.

### 4.4. Phân quyền riêng

Đề xuất (dạng `<resource>:<action>` — SA chốt khi seed `PermissionSeeder`):

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách / chi tiết / lịch sử | `seaport-throughput:read` |
| Tạo mới / Lưu tạm | `seaport-throughput:create` |
| Sửa bản ghi (chưa ban hành) | `seaport-throughput:update` |
| Xóa bản ghi (chưa ban hành) | `seaport-throughput:delete` |
| Gửi phê duyệt | `seaport-throughput:submit` |
| Cập nhật từ file Excel | `seaport-throughput:import` |
| Phê duyệt cấp Cảng vụ/Chi cục | `seaport-throughput:approve` (phạm vi đơn vị Cảng vụ/Chi cục) |
| Phê duyệt cấp Cục (ban hành) | `seaport-throughput:approve_level2` |
| Từ chối | `seaport-throughput:reject` (theo cấp tương ứng) |

**Admin Cục:** mặc định theo tài liệu nền — full quyền + xem thêm metadata người tạo/người sửa/thời gian; đồng thời là cấp duyệt cuối (ban hành) cho toàn bộ đơn vị qua `orgunit:scope_all`/`admin:all`.

**Ghi chú phân quyền theo vai trò (dự kiến):**

| Vai trò | read | create/update/delete | submit/import | approve (Cảng vụ) | approve_level2 (Cục) |
|---|---|---|---|---|---|
| Chuyên viên Cục/Cảng vụ/Chi cục | ✅ (trong phạm vi đơn vị) | ✅ | ✅ | — | — |
| Lãnh đạo Cảng vụ/Chi cục | ✅ | — | — | ✅ | — |
| Lãnh đạo Cục | ✅ full | — | — | — | ✅ |
| Admin Cục / ROLE_SYSTEM_ADMIN | ✅ | ✅ (vượt mọi kiểm tra) | ✅ | ✅ | ✅ |

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — trạng thái phê duyệt 2 cấp (Lưu tạm → chờ Cảng vụ → chờ Cục → Ban hành / Từ chối); badge màu semantic; hiểu rõ "lịch sử" là màn hình xem riêng (UNRESOLVED tới khi chốt) |
| 2 | Có bước phê duyệt không | Có — 2 cấp: Cảng vụ/Chi cục → Cục, mỗi cấp ghi Ngày/Cán bộ/Nội dung phê duyệt; 4-eyes; từ chối nhập lý do |
| 3 | Lọc cha-con / theo đơn vị | **Có — theo đơn vị.** Trường `org_unit_id` (Đơn vị quản lý) bắt buộc, nguồn gán = đơn vị người tạo (fallback) hoặc chọn trong phạm vi; controller khai `@DataScope`, entity khai `@Filter(orgUnitFilter)`; chiều ghi validate `OrgUnitScopeService`; ngoại lệ: không |
| 4 | Trường chỉ hiện trong điều kiện nào | Các trường theo dõi/phê duyệt (Ngày/Cán bộ/Nội dung phê duyệt cấp 1, cấp 2) chỉ xuất hiện sau khi gửi duyệt/duyệt tương ứng; tab Lịch sử ẩn khi `create` |
| 5 | Quyền riêng | `seaport-throughput:{read,create,update,delete,submit,import,approve,approve_level2,reject}` (đề xuất) + Admin Cục |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — File đính kèm (UploadFileTable) và cập nhật từ file Excel dữ liệu sản lượng (MH "Tìm kiếm – File upload" URD) |
| 8 | Giao diện khác mẫu chung | Không ngoài mẫu — danh sách (ScreenHeader/FilterBar/StatusTabs/DataTable/Pagination), form trong Drawer, badge trạng thái viên thuốc theo convention; điểm riêng: form có 3 nhóm 8 chỉ tiêu số (Tấn & Tấn-Km) dạng nhóm trường/bảng con gọn |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/seaport-throughput` | Danh sách + lọc (Đơn vị quản lý, Trạng thái, Thời gian tổng hợp, khoảng Ngày cập nhật); sort mặc định Ngày cập nhật giảm dần | `seaport-throughput:read` |
| GET | `/api/seaport-throughput/{id}` | Chi tiết (gồm 3 nhóm chỉ tiêu + hành khách + file) | `seaport-throughput:read` |
| POST | `/api/seaport-throughput` | Tạo mới (mặc định DRAFT — Lưu tạm) | `seaport-throughput:create` |
| PUT | `/api/seaport-throughput/{id}` | Sửa (chỉ khi chưa ban hành) | `seaport-throughput:update` |
| DELETE | `/api/seaport-throughput/{id}` | Xóa mềm (chỉ khi chưa ban hành; ghi `deletedBy`) | `seaport-throughput:delete` |
| POST | `/api/seaport-throughput/{id}/submit` | Gửi phê duyệt (DRAFT/REJECTED → chờ duyệt) | `seaport-throughput:submit` |
| POST | `/api/seaport-throughput/{id}/approve` | Duyệt cấp Cảng vụ/Chi cục (→ chờ Cục) | `seaport-throughput:approve` |
| POST | `/api/seaport-throughput/{id}/approve-level2` | Duyệt cấp Cục (→ Ban hành) | `seaport-throughput:approve_level2` |
| POST | `/api/seaport-throughput/{id}/reject` | Từ chối (kèm lý do), cấp theo user gọi | `seaport-throughput:reject` |
| GET | `/api/seaport-throughput/{id}/history` | Lịch sử hình thành + phê duyệt | `seaport-throughput:read` |
| POST | `/api/seaport-throughput/import` | Cập nhật số liệu từ file Excel (kèm file) | `seaport-throughput:import` |
| POST | `/api/seaport-throughput/{id}/files` | Upload/xóa file đính kèm | `seaport-throughput:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `seaport_throughput`** (bản ghi đầu — 1 dòng/đơn vị/tháng):
- 🔴 `id` UUID PK; 🔴 `org_unit_id` UUID NOT NULL (Đơn vị quản lý — DataScope; index + unique `(org_unit_id, report_month)`); 🔴 `report_month` DATE/tháng (chỉ lưu tháng); 🔴 `note` TEXT
- 🔴 Nhóm "trong nước": `domestic_container_ton`, `domestic_container_ton_km`, `domestic_dry_ton`, `domestic_dry_ton_km`, `domestic_liquid_ton`, `domestic_liquid_ton_km`, `domestic_other_ton`, `domestic_other_ton_km` DECIMAL
- 🔴 Nhóm "nước ngoài": `foreign_*` (8 cột cùng cấu trúc trên)
- 🔴 Nhóm "theo tuyến vận chuyển": `route_*` (8 cột cùng cấu trúc trên)
- 🔴 `passenger_trips` BIGINT/DECIMAL (Lượt hành khách)
- 🔴 Trạng thái: `approval_status` INT/ENUM ORDINAL (theo §3), `submitted_at`, `submitted_by`, `approved_l1_at`, `approved_l1_by`, `approved_l1_note`, `approved_l2_at` (= ban hành), `approved_l2_by`, `approved_l2_note`, `rejected_at`, `rejected_by`, `rejection_reason`
- Trường kiểm toán kế thừa BaseEntity/BaseApprovableEntity (`created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_at`…)
- 🔴 `org_unit_name` KHÔNG lưu — hiển thị qua `OrgUnitCacheService` (chỉ lưu `org_unit_id`)

**Bảng `seaport_throughput_file`** (🔴 bảng con file đính kèm): `id`, `throughput_id` FK, `file_name`, `file_path`/blob ref, `created_by`, `created_at`.

**Bảng `infrastructure_history` / approval-history tập trung:** ghi lịch sử hình thành + phê duyệt (không tạo bảng lịch sử riêng — convention dự án).

**Ghi chú:** nếu thiết kế chuẩn hóa theo 1 dòng/loại hàng (bảng con `throughput_detail`: `route_type` ENUM DOMESTIC/FOREIGN/ROUTE, `cargo_type` ENUM CONTAINER/DRY/LIQUID/OTHER, `ton`, `ton_km`) — SA chốt giữa 2 phương án (24 cột cố định vs bảng con 8 dòng × 3 nhóm); brief nghiêng về **24 cột + passenger_trips** để khớp trực tiếp Excel/URD, nhưng bảng con dễ mở rộng tuyến.

> ⏳ **Chờ SA quyết định:** tái dùng package `com.hanghai.kchtg.statistics` (đang chứa service cũ của module Thống kê chuyên đề — `StatisticsForm`/`PortThroughputService`/`CargoVolumeService`…) HAY tạo entity riêng `seaport_throughput` — **BA đề xuất entity riêng** khớp 1:1 Excel #33 / URD III.7.53, đặt ở package mới theo chuẩn module hiện tại (ví dụ `com.hanghai.kchtg.seaportthroughput`), không ghép chung với package statistics legacy của module cũ.
