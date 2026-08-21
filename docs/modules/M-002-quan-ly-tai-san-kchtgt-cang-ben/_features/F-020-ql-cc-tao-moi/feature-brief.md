---
id: F-020
name: Tạo mới Cầu cảng
slug: ql-cc-tao-moi
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:41:01Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Tạo mới Cầu cảng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-020 — Tạo mới Cầu cảng
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (luồng Lưu tạm / Gửi phê duyệt / Lưu và phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`pier:create`) đăng ký một Cầu cảng mới thuộc Bến cảng (cha) và Cảng biển. Người dùng nhập đầy đủ thông tin kỹ thuật theo 7 nhóm trường (cơ bản, kỹ thuật, thời điểm & kiểm định, số lượng & sản lượng, phương án bảo đảm ATHH, công bố mở & đưa vào sử dụng, GIS & file đính kèm). Mã cầu cảng nhập tay theo chuẩn VN-614 (6–10 ký tự), duy nhất toàn hệ thống, bất biến sau khi tạo. Ba lựa chọn lưu: **Lưu tạm**, **Lưu và gửi phê duyệt**, **Lưu và phê duyệt** (Admin/Lãnh đạo). Cầu cảng chưa được duyệt thì chưa được tham chiếu bởi module khác.

## 2. Trường dữ liệu

Cấu trúc theo entity `Pier` (`src/main/java/com/hanghai/kchtg/port/entity/Pier.java`, bảng `piers`) + bảng con tọa độ GIS và file đính kèm. Các trường từ `BaseEntity` không liệt kê lại.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | orgUnitId | Có | TreeSelect (UUID) | Đơn vị quản lý — mặc định đơn vị user; đổi → lọc lại các dropdown cha |
| 2 | portId | Có | TreeSelect (UUID) | Thuộc Cảng biển (đã duyệt, filter theo đơn vị); read-only sau khi tạo |
| 3 | berthId | Có | TreeSelect (UUID) | Thuộc Bến cảng (đã duyệt, filter theo cảng biển); read-only sau khi tạo |
| 4 | navigationChannelId | Không | Select (UUID) | Thuộc luồng hàng hải (filter theo cảng biển) |
| 5 | pierCode | Có | Text (VARCHAR 50) | Nhập tay, chuẩn VN-614, 6–10 ký tự, duy nhất toàn hệ thống (kiểm tra real-time), bất biến |
| 6 | pierName | Có | Text (VARCHAR 255) | Tên cầu cảng |
| 7 | province | Có | Select (Integer) | Tỉnh/TP |
| 8 | detailedLocation | Không | Text (VARCHAR 500) | Địa điểm chi tiết |
| 9 | constructionGrade | Không | Number (Integer) | Phân cấp công trình |
| 10 | structureType | Có | Number (Integer) | Loại kết cấu (danh mục LOAI_KET_CAU) |
| 11 | operationalFunction | Không | Multi-select | Công năng khai thác |
| 12 | conditionStatus | Có | Number (Integer), default 1 | Tình trạng (1 = Sử dụng) |
| 13 | length, width | Có | Number (DECIMAL 15,2) | Chiều dài/rộng (m): thập phân > 0, ≤ 500m |
| 14 | currentWaterDepth | Không | Text (VARCHAR 20) | Độ sâu khu nước hiện tại |
| 15 | designBedElevation | Không | Text (VARCHAR 20) | Cao độ đáy bến thiết kế |
| 16 | publishedVesselDWT | Không | Text (VARCHAR 20) | Cỡ tàu khai thác theo công bố |
| 17 | maintenanceApprovalDate, safetyAssessmentDate, lastInspectionDate | Không | Text (MM/YYYY, 7 ký tự) | Thời điểm phê duyệt bảo trì / chấp thuận ATCT / kiểm định |
| 18 | operatingPierCount, publishedPierCount, investmentAgreementPierCount | Không | Number (Integer) | Số lượng CC (tối đa 5 chữ số) |
| 19 | cargoThroughput | Không | Number (DECIMAL 15,2) | Sản lượng hàng thông qua |
| 20 | receivesLargeVessel | Không | Select Có/Không (Boolean), default false | Tiếp nhận tàu > QĐ công bố |
| 21 | documentNumber, documentDate | Có khi receivesLargeVessel = true | Text (200) / Date | Số văn bản + ngày văn bản — bắt buộc khi #20 = Có |
| 22 | openingAnnouncementDate, openingDecision, investmentAgreementDoc | Không | Date / Text (200) / Text (2000) | Công bố mở, đưa vào sử dụng |
| 23 | waterAreaNeutralScope | Không | TextArea (VARCHAR 2000) | Phạm vi khu nước neo buộc tàu |
| 24 | coordinateSystem, displayRule | Không (disabled) | Text | Hệ quy chiếu = WGS_84, quy tắc = Độ/Phút/Giây — không sửa |
| 25 | coordinates[] (GIS) | Không | Danh sách (latitude/longitude) | Bảng tọa độ |
| 26 | attachments[] | Không | File (PDF, ảnh...) | Upload file đính kèm |
| 27 | approvalStatus | Có (hệ thống) | Enum `ApprovalStatus` (lưu số 0..6) | Theo tài liệu nền mục 3.5 |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`) và quy trình 2 cấp tại `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.
- **Lưu tạm:** lưu hồ sơ ở trạng thái nháp (`DRAFT`) — có thể sửa tiếp (F-021).
- **Lưu và gửi phê duyệt:** đưa hồ sơ vào quy trình phê duyệt 2 cấp (vòng 1: Cảng vụ/Chi cục; vòng 2: Cục — theo file chuẩn); duyệt thuộc F-023.
- **Lưu và phê duyệt** (chỉ Admin/Lãnh đạo): đạt trạng thái đã duyệt ngay — ngoại lệ "lưu thẳng Đã duyệt" theo file chuẩn.
- **Ràng buộc vòng đời:** cầu cảng chưa được duyệt → **chưa được tham chiếu** bởi bất kỳ module nào khác (không xuất hiện trong dropdown chọn cầu cảng); phải đạt trạng thái đã duyệt mới khả dụng.
- Thứ tự tạo bắt buộc: Cảng biển → Bến cảng → Cầu cảng (cả cha đều phải đã duyệt).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-020-01 | Mã cầu cảng duy nhất toàn hệ thống, bất biến; chuẩn VN-614, 6–10 ký tự; kiểm tra real-time, trùng → chặn submit | Create |
| BR-020-02 | Cảng biển và Bến cảng cha phải ở trạng thái đã duyệt và đang hoạt động — không chọn cảng/bến chờ duyệt, tạm ngừng hoặc đã xóa | Create |
| BR-020-03 | Thứ tự tạo bắt buộc: Cảng biển → Bến cảng → Cầu cảng | Create |
| BR-020-04 | Cầu cảng chưa duyệt thì chưa được tham chiếu ở module khác | Lifecycle |
| BR-020-05 | Kích thước: chiều dài/rộng > 0 và ≤ 500m; số lượng ≤ 5 chữ số; số liệu ≥ 0 | Create |
| BR-020-06 | Validation điều kiện ATHH: receivesLargeVessel = Có → documentNumber + documentDate bắt buộc; = Không → clear validation | Create |
| BR-020-07 | Ghi nhật ký tự động (TAO_MOI) cho mọi thao tác tạo | Audit |
| BR-020-08 | Đơn vị QL gán theo tài liệu nền mục 3.3 — không để NULL; dropdown cha lọc theo đơn vị | Create |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới, Lưu tạm, Gửi phê duyệt | `pier:create` |
| Lưu và phê duyệt | `pier:create` + `pier:approve` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Admin | Tạo mới, Lưu tạm, Gửi PD, Lưu và phê duyệt |
| Quản lý tài sản | Tạo mới, Lưu tạm, Gửi PD |
| Lãnh đạo | Lưu và phê duyệt (không tạo mới thường) |
| Nhân viên vận hành | Không tạo mới |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — full quyền + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung (tài liệu nền mục 3.5) |
| 2 | Có bước phê duyệt không | Có — Gửi phê duyệt 2 cấp (duyệt tại F-023); Lưu và phê duyệt (Admin/Lãnh đạo) |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + theo Cảng biển → Bến cảng (cha-con 2 cấp) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — documentNumber/documentDate bắt buộc khi receivesLargeVessel = Có |
| 5 | Quyền riêng | `pier:create` (kèm `pier:approve` cho Lưu và phê duyệt) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — file đính kèm (PDF, ảnh...) |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/pier` | Tạo mới (body: thông tin + coordinates[] + action `draft`/`submit`/`approve`) | `pier:create` |
| GET | `/api/v1/ports?status=APPROVED&orgUnitId=` | Danh sách Cảng biển đã duyệt (dropdown) | `pier:create` |
| GET | `/api/v1/berths?portId={id}&status=APPROVED` | Danh sách Bến cảng đã duyệt theo cảng biển (dropdown) | `pier:create` |
| GET | `/api/v1/navigation-channels?portId={id}` | Danh sách luồng hàng hải theo cảng biển | `pier:create` |
| POST | `/api/v1/pier/{id}/attachments` | Upload file đính kèm | `pier:create` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `piers`** (Cầu cảng — cấu trúc theo entity `Pier`): id (UUID PK), pierCode (VARCHAR 50, UNIQUE, NOT NULL), pierName (VARCHAR 255, NOT NULL), berthId (UUID, NOT NULL FK → berths), portId (UUID), navigationChannelId (UUID), length (DECIMAL 15,2), width (DECIMAL 15,2), designLoad (DECIMAL 15,2), pierType (SMALLINT — enum `PierType`), operationalStatus (SMALLINT — enum `OperationalStatus`), approvalStatus (SMALLINT, NOT NULL), orgUnitId (UUID, NOT NULL), securityLevel (SMALLINT, default NORMAL), operationalFunction (VARCHAR 255), conditionStatus (INT, default 1), constructionGrade (INT), structureType (INT), province (VARCHAR 100), detailedLocation (VARCHAR 500), currentWaterDepth (VARCHAR 20), designBedElevation (VARCHAR 20), publishedVesselDWT (VARCHAR 20), maintenanceApprovalDate (VARCHAR 7), safetyAssessmentDate (VARCHAR 7), lastInspectionDate (VARCHAR 7), operatingPierCount (INT), publishedPierCount (INT), investmentAgreementPierCount (INT), cargoThroughput (DECIMAL 15,2), receivesLargeVessel (BOOLEAN), documentNumber (VARCHAR 200), documentDate (DATE), openingAnnouncementDate (DATE), openingDecision (VARCHAR 200), investmentAgreementDoc (VARCHAR 2000), waterAreaNeutralScope (VARCHAR 2000), coordinateSystem (INT), displayRule (VARCHAR 255), mapSymbolId (UUID), spatialId (UUID) + audit từ `BaseEntity`; filter `orgUnitFilter` + `recordSecurityLevelFilter`.

**Bảng con:** bảng tọa độ GIS (pierId, latitude, longitude) + bảng file đính kèm (pierId, fileName, filePath, fileSize, contentType, uploadedBy, uploadedAt).
