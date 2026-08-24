---
id: F-015
name: Quản lý Bến cảng - Cập nhật
slug: ql-bc-cap-nhat
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:42Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Bến cảng - Cập nhật

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-015 — Quản lý Bến cảng - Cập nhật
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (cập nhật → duyệt lại theo quy trình 2 cấp)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`berth:update`) chỉnh sửa thông tin Bến cảng đã tồn tại, với form pre-fill từ API. Các trường bất biến: **Mã bến** (read-only) và **Đơn vị quản lý** (read-only). Nếu đổi **Cảng biển** → hệ thống sinh lại mã bến. Ba action khi lưu: **Lưu tạm** (giữ trạng thái), **Gửi phê duyệt** (reset về đầu quy trình 2 cấp — xóa các dấu phê duyệt cũ, ghi nhận ngày/người gửi), **Lưu và phê duyệt** (chỉ admin-operation / system-admin). Mọi cập nhật đều ghi change log.

## 2. Trường dữ liệu

Cấu trúc theo entity `Berth` (bảng `berths`) — danh sách trường **khớp 100%** sheet `QL Bến cảng` — file `HH_Tính năng & danh sách các trường thông tin.xlsx` (nguồn sự thật đã được xác nhận): tên trường, loại điều khiển và cờ hiển thị tại 5 màn hình (Danh sách / Bộ lọc / Xem chi tiết / Tạo mới / Sửa) lấy nguyên theo Excel. Quy ước cột Bắt buộc: **Có*** = bắt buộc khi Gửi phê duyệt. Điểm khác biệt của F-015 so với F-014: `berthCode` và `orgUnitId` là **read-only trên màn Sửa** (Excel: cột Sửa vẫn hiển thị nhưng điều khiển `Text (read-only)`); nếu đổi `portId` → sinh lại mã bến. Các trường ~~length, width, berthType, channelDepth~~ đã loại bỏ (thuộc Cầu cảng, không thuộc Bến cảng — theo Excel).

| STT | Tên trường (theo Excel) | Loại điều khiển (theo Excel) | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| | **Thông tin chung** | | | | | | | | |
| 1 | Đơn vị quản lý (bắt buộc) | Select | Có | Có | Có | Có | Có | Có | `orgUnitId` — **read-only, bất biến tuyệt đối**; backend từ chối payload đổi đơn vị |
| 2 | Thuộc cảng biển (bắt buộc) | Select | Có | Có | Có | Có | Có | Có | `portId` — đổi cảng → sinh lại mã bến + cảnh báo |
| 3 | Mã bến cảng | Text (read-only, tự sinh {mã-cảng-mẹ}-B{XX}) | Có (hệ thống tự sinh) | Có | Có | Có | Có | Có | `berthCode` — **read-only, bất biến** |
| 4 | Tên bến cảng (bắt buộc) | Text | Có | Có | Có | Có | Có | Có | `berthName` |
| 5 | Thuộc luồng hàng hải | Select | Không | Có | Có | Có | Có | Có | `waterway` / `waterwayId` |
| 6 | Đơn vị khai thác | Text | Không | Không | Không | Có | Có | Có | `operator` |
| 7 | Địa điểm (Tỉnh/TP) (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `provinceId` |
| 8 | Địa điểm chi tiết | Text | Không | Không | Không | Có | Có | Có | `detailedLocation` |
| 9 | Loại kết cấu bến cảng | Select | Không | Có | Có | Có | Có | Có | `structureType` |
| 10 | Công năng khai thác | Text | Không | Có | Có | Có | Có | Có | `operationalFunction` |
| 11 | Tổng diện tích (ha) | Number | Không | Không | Không | Có | Có | Có | `totalArea` |
| 12 | Năng lực thông qua thiết kế | Number | Không | Không | Không | Có | Có | Có | `designThroughput` |
| 13 | Năng lực thông qua hiện trạng | Number | Không | Không | Không | Có | Có | Có | `currentThroughput` |
| 14 | Cỡ tàu tiếp nhận lớn nhất (DWT) | Number | Không | Không | Không | Có | Có | Có | `maxVesselSize` |
| 15 | Quy hoạch năng lực thông qua | Number | Không | Không | Không | Có | Có | Có | `plannedThroughput` |
| 16 | Sản lượng thực tế năm gần nhất | Number | Không | Không | Không | Có | Có | Có | `latestCargoVolume` |
| 17 | Tình trạng (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `operationalStatus` |
| | **Thông tin công bố** | | | | | | | | |
| 18 | Thời điểm công bố | Date | Không | Không | Không | Có | Có | Có | `openingAnnouncementDate` |
| 19 | Quyết định công bố | Text | Không | Không | Không | Có | Có | Có | `openingDecision` |
| 20 | Văn bản thỏa thuận | Text | Không | Không | Không | Có | Có | Có | `investmentAgreement` |
| | **Thông tin vị trí (GIS + tọa độ)** | | | | | | | | |
| 21 | Loại đối tượng (GIS) | Select | Không | Không | Không | Có | Có | Có | `coordinateSystem`/`displayRule`/`mapSymbolId`/`spatialId` |
| 22 | Biểu tượng (GIS) | Select | Không | Không | Không | Có | Có | Có | (GIS) |
| 23 | Hệ quy chiếu (GIS) | Select | Không | Không | Không | Có | Có | Có | (GIS) |
| 24 | Quy tắc hiển thị (GIS) | Text | Không | Không | Không | Có | Có | Có | (GIS) |
| 25 | Tọa độ GPS (bắt buộc ≥1 khi gửi duyệt) | Bảng con (Vĩ độ, Kinh độ) | Có* | Không | Không | Có | Có | Có | `coordinates[]` — ≥ 1 tọa độ khi Gửi phê duyệt lại |
| | **File đính kèm** | | | | | | | | |
| 26 | File đính kèm | Upload | Không | Không | Không | Có | Có | Có | `attachments[]` — quản lý tại F-014/F-018; màn Sửa hiển thị danh sách |
| | **Trạng thái & Kiểm toán (chỉ ở trang Chi tiết/Danh sách)** | | | | | | | | |
| 27 | Trạng thái phê duyệt | Badge (read-only) | Không (read-only) | Có | Có | Có | Không | Không | `approvalStatus` |
| | **Thông tin log cập nhật** | | | | | | | | |
| 28 | Ngày cập nhật | DatePicker | Không (read-only) | Có | Có | Có | Không | Không | Chỉ Danh sách/Chi tiết — Admin Cục / admin-operation |
| 29 | Cán bộ cập nhật | Text (read-only) | Không (read-only) | Có | Không | Có | Không | Không | Chỉ Danh sách/Chi tiết — Admin Cục / admin-operation |
| 30 | Ngày gửi phê duyệt | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `submittedForApprovalAt` |
| 31 | Cán bộ gửi phê duyệt | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `submittedForApprovalBy` |
| 32 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `portAuthorityApprovedAt` |
| 33 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `portAuthorityApprovedBy` |
| 34 | Nội dung phê duyệt | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `portAuthorityApprovalContent` |
| 35 | Ngày phê duyệt cấp Cục | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `departmentApprovedAt` |
| 36 | Cán bộ phê duyệt cấp Cục | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `departmentApprovedBy` |
| 37 | Nội dung phê duyệt | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `departmentApprovalContent` |
| | **Kết cấu hạ tầng thuộc cầu cảng** | | | | | | | | |
| 38 | Tên kết cấu hạ tầng | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 39 | Loại kết cấu hạ tầng | Dropdown (bộ lọc) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin vận hành khai thác** | | | | | | | | |
| 40 | Mã kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 41 | Tên kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 42 | Ngày bắt đầu | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 43 | Ngày kết thúc | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin bảo trì** | | | | | | | | |
| 44 | Mã kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 45 | Tên kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 46 | Thời gian bắt đầu | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 47 | Thời gian kết thúc | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin sự cố** | | | | | | | | |
| 48 | Mã sự cố | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 49 | Loại sự cố | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 50 | Địa điểm | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 51 | Thời gian | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`) và quy trình 2 cấp tại `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.
- **Lưu tạm:** giữ nguyên trạng thái hiện tại.
- **Gửi phê duyệt:** reset về đầu quy trình — chờ duyệt cấp Cảng vụ/Chi cục; **xóa các dấu phê duyệt cũ** (`portAuthorityApprovedAt/By` + content, `departmentApprovedAt/By` + content, `rejectionReason` về NULL — tương ứng entity `Berth`); ghi nhận `submittedForApprovalAt`/`submittedForApprovalBy`; phải duyệt lại từ vòng 1.
- **Lưu và phê duyệt** (admin-operation / system-admin): đạt trạng thái đã duyệt ngay + PheDuyetLog cấp Cục.
- Mọi cập nhật: ghi change log (bản cũ trước khi cập nhật) + thông tin kiểm toán (operatorId, updatedBy, updatedAt).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-015-01 | Mã bến bất biến (read-only); đổi Cảng biển → tự sinh lại mã | Update |
| BR-015-02 | Đơn vị QL bất biến tuyệt đối — mọi trạng thái, mọi vai trò | Update |
| BR-015-03 | Gửi phê duyệt → reset về trạng thái chờ duyệt cấp Cảng vụ/Chi cục + xóa toàn bộ dấu phê duyệt cũ (vòng 1 + vòng 2 + lý do từ chối) | Update (submit) |
| BR-015-04 | Lưu nhật ký gửi phê duyệt (`submittedForApprovalAt`/`By`) | Update (submit) |
| BR-015-05 | Lưu tạm không reset trạng thái — giữ nguyên | Update (draft) |
| BR-015-06 | Change log bắt buộc cho mọi lần cập nhật (fieldChanged, oldValue, newValue, changedBy, changedAt) | Update |
| BR-015-07 | GPS hợp lệ, số liệu ≥ 0, ràng buộc file — giống F-014 | Update |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem bến để cập nhật (pre-fill) | `berth:read` |
| Cập nhật Bến cảng | `berth:update` |
| Lưu và phê duyệt | `berth:update` + quyền phê duyệt nhanh (admin-operation / system-admin — SA chốt) |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền (kể cả Lưu và phê duyệt) |
| admin-operation | Cập nhật, Lưu tạm, Gửi PD, Lưu và phê duyệt |
| admin | Cập nhật, Lưu tạm (không Gửi PD) |
| Chuyên viên / Lãnh đạo đơn vị | Cập nhật, Lưu tạm (ĐVQL auto-fill) |
| Lãnh đạo (cấp Cục) | Không cập nhật — chỉ duyệt từ F-017 |
| Cá nhân | Không |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — full quyền + xem người sửa, thời gian sửa, lịch sử phê duyệt.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung; cập nhật reset về đầu quy trình duyệt |
| 2 | Có bước phê duyệt không | Có — mọi cập nhật phải duyệt lại từ vòng 1 (trừ Lưu và phê duyệt) |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + theo Cảng biển cha (portId) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — berthCode + orgUnitId read-only; nút "Lưu và phê duyệt" chỉ với admin-operation/system-admin |
| 5 | Quyền riêng | `berth:update` (kèm `berth:read`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không (đính kèm quản lý tại F-014/F-018) |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/berths/{id}` | Pre-fill form | `berth:read` |
| GET | `/api/v1/berths/generate-code?portId=` | Sinh lại mã khi đổi Cảng biển | `berth:update` |
| PUT | `/api/v1/berths/{id}` | Cập nhật (body: action `draft`/`submit`/`approve` + trường + coordinates[]) | `berth:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `berths`:** cấu trúc giống F-014 (mục 7) — F-015 không thêm trường; sử dụng các cột phê duyệt có sẵn (submittedForApprovalAt/By, portAuthorityApprovedAt/By, portAuthorityApprovalContent, departmentApprovedAt/By, departmentApprovalContent, rejectionReason) — khi Gửi phê duyệt: reset các cột vòng 1/vòng 2 về NULL.

**Bảng `change_log` (nhật ký thay đổi — dùng chung module):** id (UUID PK), entityType, entityId (UUID), changeType (UPDATE), changedField, oldValue, newValue, changedBy (UUID), changedAt — ghi tự động mỗi lần cập nhật.
