---
id: F-128
name: Quản lý văn bản pháp lý
slug: quan-ly-van-ban-phap-ly
module-id: M-006
status: implemented
classification: local
priority: high
created: 2026-06-16T04:40:21Z
last-updated: 2026-09-05
locked-fields: []
consumed_by_modules: []
source-paths:
  - src/main/java/com/hanghai/kchtg/document/entity/LegalDocument.java
  - src/main/java/com/hanghai/kchtg/document/controller/LegalDocumentController.java
  - src/main/java/com/hanghai/kchtg/document/service/LegalDocumentService.java
  - src/main/java/com/hanghai/kchtg/document/repository/LegalDocumentRepository.java
  - src/main/java/com/hanghai/kchtg/document/dto/LegalDocumentResponse.java
  - src/main/java/com/hanghai/kchtg/document/dto/LegalDocumentCreateRequest.java
  - src/test/java/com/hanghai/kchtg/document/LegalDocumentControllerTest.java
---

# Đặc tả nghiệp vụ: Quản lý văn bản pháp lý

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-128
**Module:** M-006 — Quản lý văn bản & thông tin nghiệp vụ
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền chung của module (chưa có `ba/01-base-pattern.md` cho M-006) + TKCT + nguồn sự thật Excel `HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` sheet `30->43` cụm #31 "Văn bản pháp lý".

> **⚠️ Data Scope:** Excel cụm #31 **không khai báo** trường "Đơn vị quản lý" (ma trận cụm này không có cột trường đơn vị). Entity `LegalDocument` kế thừa `BaseEntity` (có `org_unit_id`) — việc có áp bộ lọc `orgUnitFilter` theo Data Scope Convention hay không là quyết định kỹ thuật, **SA chốt** (xem mục 5 dòng 3).

---

## 1. Mô tả ngắn

Hệ thống quản lý tập trung toàn bộ văn bản pháp lý liên quan đến kết cấu hạ tầng hàng hải (cảng biển, luồng, đèn biển, phao tiêu...): tiếp nhận, lưu trữ, phân loại, theo dõi hiệu lực và truy xuất các văn bản quy phạm pháp luật, nghị định, thông tư, quyết định liên quan đến hoạt động quản lý và khai thác KCHT. Văn bản pháp lý được F-135 (tìm kiếm văn bản) và các module quản lý KCHT khác tham chiếu để hiển thị read-only.

**Actor chính:** A-003 (Chuyên viên/Cán bộ đơn vị quản lý KCHT), A-002 (Lãnh đạo/Cục), A-001 (Admin Cục).

## 2. Trường dữ liệu

Nguồn: ma trận Excel cụm #31 "Văn bản pháp lý" (sheet `30->43`). Cờ: ✓ = có, — = không. Cột **Bắt buộc** không có trong Excel → **không xác định ở cấp Excel** (mục 4.1 đặt ràng buộc nghiệp vụ BR-128-01/02).

| # | Nhóm (TAB) | Trường | Loại điều khiển | DS | Lọc | Xem | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|
| 1 | Thông tin chung | Tên văn bản | InputTextArea | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2 | Thông tin chung | Số hiệu văn bản | InputTextArea | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3 | Thông tin chung | Cơ quan ban hành văn bản | InputTextArea | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4 | Thông tin chung | Ngày ban hành | DatePicker | ✓ | ✓ | ✓ | ✓ | ✓ |
| 5 | Thông tin chung | Ngày bắt đầu hiệu lực | DatePicker (tự tính trạng thái hiệu lực) | ✓ | ✓ | ✓ | ✓ | ✓ |
| 6 | Thông tin chung | Ngày kết thúc hiệu lực | DatePicker (tự tính trạng thái hiệu lực) | ✓ | ✓ | ✓ | ✓ | ✓ |
| 7 | Thông tin chung | Trạng thái hiệu lực | Select (tự đặt theo ngày hiệu lực) | ✓ | ✓ | ✓ | — | — |
| 8 | Thông tin chung | Người ký | InputTextArea | ✓ | — | ✓ | ✓ | ✓ |
| 9 | Thông tin chung | Mức độ bảo mật | Select | — | — | ✓ | ✓ | ✓ |
| 10 | Thông tin chung | Phạm vi áp dụng | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 11 | Thông tin chung | Nội dung/Trích yếu | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 12 | File văn bản pháp lý | Tên file | Upload/Attachment | — | — | ✓ | ✓ | ✓ |
| 13 | Thông tin cập nhật | Cán bộ cập nhật | Text (hiển thị, không nhập) | ✓ | — | ✓ | — | — |
| 14 | Thông tin cập nhật | Ngày cập nhật | DatePicker (hiển thị, không nhập) | ✓ | — | ✓ | — | — |

> Ghi chú đối chiếu: khung cột của cụm #31 khớp entity đang chạy `LegalDocument` tại package `com.hanghai.kchtg.document` (`documentName`, `documentNumber`, `issuingAuthority`, `issueDate`, `effectiveDate`, `expirationDate`, `validityStatus`, `signer`, `securityLevel`, `applicationArea`, `description`); dòng 12 = `AttachedDocument`; dòng 13-14 = trường audit `updatedBy`/`updatedAt` hiển thị read-only. Tên cột/tên field ở bảng này là đề xuất của BA — SA chốt.

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt** C1/C2: Excel cụm #31 không khai báo luồng duyệt; văn bản pháp lý do cán bộ có quyền ghi nhận trực tiếp.
- Trạng thái nghiệp vụ là **trạng thái hiệu lực** (Còn hiệu lực / Sắp hết hiệu lực / Đã hết hiệu lực) — tự tính từ ngày bắt đầu/ngày kết thúc hiệu lực so với ngày hiện tại, không nhập tay.
- Văn bản **Đã hết hiệu lực**: không được phép sửa nội dung chính (chỉ xem); tệp đính kèm vẫn xem/tải được.
- Hệ thống tự động cảnh báo văn bản sắp hết hiệu lực (hằng ngày theo lịch scheduler, xem `LegalDocumentExpiryScheduler`) để người phụ trách cập nhật hoặc thay thế.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ riêng (chưa có trong tài liệu nền)

| ID | Quy tắc | Chiều áp dụng |
|---|---|---|
| BR-128-01 | Văn bản phải có đầy đủ Tên văn bản, Số hiệu văn bản và Cơ quan ban hành trước khi lưu vào hệ thống | Create |
| BR-128-02 | Ngày bắt đầu hiệu lực phải lớn hơn hoặc bằng Ngày ban hành; Ngày kết thúc hiệu lực phải sau Ngày bắt đầu hiệu lực | Create / Update |
| BR-128-03 | Văn bản có trạng thái "Đã hết hiệu lực" không được phép chỉnh sửa nội dung chính | Update |
| BR-128-04 | Mọi thay đổi (tạo mới, cập nhật, tải lên/xóa tệp, đổi trạng thái, xóa) được tự động ghi vào bảng lịch sử dùng chung `approval_history` với `ref_type = LEGAL_DOCUMENT` | Create / Update / Delete |
| BR-128-05 | Thao tác chỉ tải lên hoặc xóa tệp đính kèm sinh đúng 1 bản ghi lịch sử tương ứng (Tải lên tệp / Xóa tệp), không sinh bản ghi "Cập nhật" trống khi nội dung văn bản không đổi | Update |
| BR-128-06 | Giá trị các ô nhập liệu được loại bỏ khoảng trắng đầu/cuối (`.trim()`) trước khi lưu và trước khi đưa vào tìm kiếm | Create / Update / Filter |

### 4.2. Phân quyền riêng

| Thao tác | Quyền |
|---|---|
| Xem danh sách / chi tiết văn bản pháp lý | `legaldocument:read` |
| Tạo mới văn bản pháp lý | `legaldocument:create` |
| Cập nhật văn bản pháp lý (kể cả tải lên/xóa tệp đính kèm) | `legaldocument:update` |
| Xóa văn bản / vô hiệu hóa | `legaldocument:delete` |

**Admin Cục (A-001):** quyền `legaldocument:delete` và thao tác nhạy cảm (xóa, vô hiệu hóa, xem metadata tạo/sửa cuối) — chỉ Admin Cục / ROLE_SYSTEM_ADMIN được xóa hoặc thay đổi trạng thái cơ bản của văn bản.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — trạng thái hiệu lực (Còn hiệu lực / Sắp hết hiệu lực / Đã hết hiệu lực), tự tính theo ngày, không nhập tay |
| 2 | Có bước phê duyệt không | Không — Excel cụm #31 không khai báo luồng phê duyệt C1/C2 |
| 3 | Lọc cha-con / theo đơn vị | Không ở cấp Excel (cụm #31 không có trường đơn vị); entity kế thừa `BaseEntity` có `org_unit_id` — **SA chốt** có áp `orgUnitFilter`/`@DataScope` hay không |
| 4 | Trường chỉ hiện trong điều kiện nào | Không có nhánh điều kiện động theo giá trị trường; TAB "File văn bản pháp lý" luôn hiển thị trong drawer |
| 5 | Quyền riêng | `legaldocument:read/create/update/delete` — cần seed trong `PermissionSeeder` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — Upload/Attachment (tệp văn bản pháp lý, nhiều file) |
| 8 | Giao diện khác mẫu chung | Không — theo list-screen + form/drawer convention |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Package nguồn thực tế: `com.hanghai.kchtg.document` (không còn `com.hanghai.kchtg.vanban`). Đường dẫn dưới đây là đề xuất BA — SA chốt.

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/legal-documents` | Danh sách văn bản pháp lý (phân trang, lọc theo từ khóa, trạng thái hiệu lực) | `legaldocument:read` |
| GET | `/api/legal-documents/{id}` | Chi tiết văn bản + danh sách tệp đính kèm | `legaldocument:read` |
| POST | `/api/legal-documents` | Tạo mới văn bản pháp lý | `legaldocument:create` |
| PUT | `/api/legal-documents/{id}` | Cập nhật văn bản pháp lý | `legaldocument:update` |
| DELETE | `/api/legal-documents/{id}` | Xóa mềm văn bản pháp lý | `legaldocument:delete` |
| POST | `/api/legal-documents/{id}/attachments` | Tải lên tệp đính kèm | `legaldocument:update` |
| DELETE | `/api/legal-documents/attachments/{attachmentId}` | Xóa tệp đính kèm | `legaldocument:update` |
| GET | `/api/legal-documents/expiring` | Văn bản sắp hết hiệu lực (cho cảnh báo) | `legaldocument:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `legal_documents` (đang chạy tại `com.hanghai.kchtg.document.entity.LegalDocument`):** `id`, `org_unit_id` (từ `BaseEntity`), `document_name` (Tên văn bản), `document_number` (Số hiệu văn bản), `issuing_authority` (Cơ quan ban hành văn bản), `issue_date` (Ngày ban hành), `effective_date` (Ngày bắt đầu hiệu lực), `expiration_date` (Ngày kết thúc hiệu lực), `validity_status` (Trạng thái hiệu lực), `document_type`, `application_area` (Phạm vi áp dụng), `signer` (Người ký), `security_level` (Mức độ bảo mật), `description` (Nội dung/Trích yếu), `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_at`.

**Bảng con `attached_documents` (tệp đính kèm):** 🔴 `id`, 🔴 `legal_document_id` (FK → `legal_documents.id`), 🔴 `document_name`, 🔴 `file_path`, 🔴 `file_size`, 🔴 `uploaded_at`.

**Lịch sử dùng chung:** bảng `approval_history` (`ref_type = LEGAL_DOCUMENT`, `ref_id = legal_document_id`) ghi nhận mọi hành động; không tạo bảng log riêng cho F-128.
