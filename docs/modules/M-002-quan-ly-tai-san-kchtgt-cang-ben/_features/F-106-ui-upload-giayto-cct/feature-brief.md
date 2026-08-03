---
id: F-106
name: Upload Giấy tờ Cảng cạn
slug: ui-upload-giayto-cct
module-id: M-002
status: proposed
classification: local
priority: medium
created: 2026-07-01T04:09:20Z
last-updated: 2026-08-03
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Upload Giấy tờ Cảng cạn

**Tài liệu:** BA Feature Brief
**Feature:** F-106 — Upload Giấy tờ Cảng cạn
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-03

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cho phép upload file đính kèm (giấy phép thành lập, quyết định chủ trương, tài liệu pháp lý) cho Cảng cạn. Tích hợp trong form Tạo mới (F-026) và Cập nhật (F-027) qua **tab "File đính kèm"**. File được lưu vào bảng `dry_port_attachments`.

### 1.2. Thông số

| Tham số | Giá trị |
|---------|--------|
| Định dạng | PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF |
| Kích thước tối đa | 20MB / file |
| Số lượng tối đa | 10 files / Cảng cạn |
| Lưu trữ | Server filesystem hoặc object storage |

### 1.3. Tại sao cần?

- Lưu trữ hồ sơ pháp lý gắn liền với Cảng cạn
- Hỗ trợ quy trình phê duyệt: Lãnh đạo xem giấy tờ trước khi duyệt
- Truy xuất tài liệu nhanh — không cần tìm trong hồ sơ giấy

### 1.4. Luồng chính

F-026/F-027 → tab "File đính kèm" → [Upload] → chọn file → upload → hiển thị trong danh sách. Mỗi file có nút [Tải xuống] [Xóa]. File upload trong phiên NHAP/PENDING có thể xóa. File của bản ghi APPROVED: chỉ đọc.

---

## 2. Ai dùng? Dùng như thế nào?

| Permission | Hành động |
|---|---|
| `dryport:create` | Upload khi tạo mới (F-026) |
| `dryport:update` | Upload / Xóa khi cập nhật (F-027) |
| `dryport:read` | Xem danh sách file + tải xuống (F-030) |

> M-001 quản lý. Admin Cục không giới hạn.

---

## 3. User Stories

### Must
- **US-106-01:** Upload file từ máy, hiển thị tiến trình upload.
- **US-106-02:** Xem danh sách file: tên, kích thước, ngày upload.
- **US-106-03:** Tải xuống file.

### Should
- **US-106-04:** Xóa file đã upload (khi chưa APPROVED).
- **US-106-05:** Validation: sai định dạng → thông báo; quá dung lượng → thông báo; vượt số lượng → thông báo.

### Could
- **US-106-06:** Kéo thả file vào vùng upload.
- **US-106-07:** Xem trước ảnh (JPG/PNG) ngay trên trình duyệt.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Upload

**AC-106-01:** Bấm [Upload] → chọn file → progress bar → upload xong → hiển thị trong danh sách: tên file, kích thước (KB/MB), ngày upload.
**AC-106-02:** Hỗ trợ chọn nhiều file cùng lúc (≤10 files tổng cộng).

### Nhóm 2: Validation

**AC-106-03:** File sai định dạng → toast "Định dạng không được hỗ trợ. Chấp nhận: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF."
**AC-106-04:** File >20MB → toast "File vượt quá 20MB."
**AC-106-05:** Tổng >10 files → toast "Đã đạt giới hạn 10 file."

### Nhóm 3: Quản lý file

**AC-106-06:** Click file → tải xuống (mở tab mới hoặc download).
**AC-106-07:** Nút [Xóa] cạnh mỗi file → confirm → `DELETE /api/v1/dry-ports/{id}/attachments/{attId}` → file biến mất.
**AC-106-08:** Bản ghi APPROVED → ẩn nút [Xóa], chỉ hiển thị [Tải xuống].

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Nguồn |
|---|---|---|
| BR-106-01 | Định dạng: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. | Hạ tầng |
| BR-106-02 | ≤20MB/file, ≤10 files/Cảng cạn. | Hạ tầng |
| BR-106-03 | File của bản ghi NHAP/PENDING: có thể xóa. File của APPROVED: chỉ đọc, không xóa được. | Nghiệp vụ |
| BR-106-04 | File tồn tại vĩnh viễn — không bị xóa khi xóa mềm Cảng cạn. | Thiết kế |
| BR-106-05 | Tên file giữ nguyên (không rename), hiển thị tên gốc. | UX |

---

## 6. Mô hình dữ liệu

### `dry_port_attachments` (🔴 mới)

| Tên trường | Kiểu | Mô tả |
|---|---|---|
| id | UUID | PK |
| dry_port_id | UUID | FK → dry_ports.id |
| ten_file | NVARCHAR(255) | Tên file gốc |
| loai_file | NVARCHAR(50) | MIME type |
| kich_thuoc | BIGINT | Dung lượng (bytes) |
| duong_dan | NVARCHAR(500) | Đường dẫn lưu trữ |
| created_by | UUID | Người upload |
| created_at | TIMESTAMP | Thời điểm upload |

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/dry-ports/{id}/attachments` | Upload file (multipart/form-data) | `dryport:create` / `update` |
| GET | `/api/v1/dry-ports/{id}/attachments` | Danh sách file | `dryport:read` |
| GET | `/api/v1/dry-ports/{id}/attachments/{attId}/download` | Tải xuống | `dryport:read` |
| DELETE | `/api/v1/dry-ports/{id}/attachments/{attId}` | Xóa file | `dryport:update` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Upload

Tab "File đính kèm" trong F-026/F-027 → khu vực upload (có thể kéo thả) → chọn file → progress bar từng file → danh sách cập nhật realtime.

### 8.2. Quản lý

Danh sách file dạng bảng: Tên file | Kích thước | Ngày upload | Hành động [Tải xuống] [Xóa]. Nút [Xóa] chỉ hiển thị khi bản ghi chưa APPROVED.

### 8.3. Lưu cùng form

File upload trong phiên tạo mới/cập nhật được lưu cùng transaction với form. Nếu người dùng hủy form → file đã upload vẫn được giữ (đã lưu vào DB).

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** Upload ≤5s/file (20MB); download ≤3s; hỗ trợ upload đồng thời
- **Bảo mật:** Giới hạn MIME type; scan virus (nếu có); HTTPS
- **UX:** Progress bar; drag & drop; preview ảnh

---

## 10. Yêu cầu giao diện

> Token từ `theme.ts` + `tokens.ts`.

- **Tab "File đính kèm":** Vùng upload (dashed border, icon upload, text "Kéo thả file vào đây hoặc bấm để chọn") + danh sách file bên dưới
- **Danh sách file:** Mỗi dòng: icon file type | tên file | kích thước | ngày | [Tải xuống] [Xóa]
- **Nút:** `borderRadius: radiusPill`, `height:40`
- **Progress bar:** `statusOperational` (xanh)

---

## Implementation Status

| Layer | Status |
|-------|--------|
| Backend | Partial — cần bảng `dry_port_attachments` + API |
| Frontend | Pending |
