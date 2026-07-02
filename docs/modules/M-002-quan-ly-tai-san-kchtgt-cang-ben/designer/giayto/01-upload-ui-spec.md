# UI Specification: GiayTo — Upload Page

## Page: Upload Attachment (Đính kèm Giấy tờ/Tài liệu)

### 1. Component Structure
```
GiayToUploadModal
├── ModalHeader (title: "Đính kèm tài liệu", subtitle: "Entity: [entityType] — Entity ID: [entityId]")
├── UploadArea (drag-and-drop zone + file picker button)
│   ├── DropZone (full-width drag area with dashed border)
│   ├── FilePickerButton (Browse files)
│   └── Supported formats hint: "Mọi định dạng file được chấp nhận (PDF, DOCX, JPEG, PNG, v.v.)"
├── FilePreviewCard (shows selected file info)
│   ├── fileName (display)
│   ├── fileSize (display, formatted: KB/MB)
│   ├── mimeType (display, e.g., "application/pdf")
│   └── removeBtn (X button to clear selection)
├── UploadProgress (hidden until uploading)
│   ├── progressBar (animated)
│   └── status text: "Đang tải lên..." / "Đã tải lên thành công" / "Tải lên thất bại"
├── UploadedFilesList (existing attachments for this entity)
│   ├── Table columns: fileName, fileSize, mimeType, uploadedBy, createdAt, download, delete
│   └── Pagination for the list (page, size, max 100)
└── ModalFooter (Cancel, Upload)
```

### 2. Field Mapping (BE → React)
| BE Field | Type | React Component | Validation |
|---|---|---|---|
| entityType | string (path variable) | Modal subtitle (read-only) | Must be one of: cang-bien, ben-cang, cau-cang, cang-can, vung-nuoc |
| entityId | string (path variable, NOT UUID) | Modal subtitle (read-only) | Must be a valid string ID of the parent entity |
| file | MultipartFile | FileInput (drag-drop + browse) | Not empty, max 10MB |
| uploadedBy | string (from auth session) | (internal, from auth) | Extracted from Authentication object |
| fileName | string | TextCell | From file upload, display-only |
| fileSize | Long (bytes) | TextCell (formatted) | From file upload, display-only |
| mimeType | string (any MIME type) | TextCell | From file upload, display-only — **NOT restricted to PDF/DOCX/JPEG** |
| minioKey | string | TextCell | From BE response, used for download link — display-only |
| createdAt | LocalDateTime | DateTimeCell | From BE response, display-only |

### 3. Zod Schema
```typescript
const uploadSchema = z.object({
  file: z.instanceof(File).refine(file => file.size > 0, {
    message: "File upload không được để trống",
  }),
});

// File size validation (10MB limit):
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const fileSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= MAX_FILE_SIZE, {
      message: "Kích thước file tối đa 10MB",
    })
    .refine(file => file.size > 0, {
      message: "File upload không được để trống",
    }),
});
```

### 4. Form/Table Layout
- **Modal**: Centered overlay, max-width 720px, scrollable body.
- **UploadArea** (top): Full-width drag-and-drop zone with dashed border. Center icon (📎) + text "Kéo thả file vào đây hoặc nhấn để chọn file". Below: hint "Mọi định dạng file được chấp nhận — không có giới hạn MIME type."
- **FilePreviewCard** (below upload area): 3-column grid showing selected file details: fileName (bold), fileSize (formatted: e.g., "2.5 MB"), mimeType (e.g., "application/pdf"). Remove button (red X) on the right.
- **UploadProgress** (below preview, hidden until active): Animated progress bar + status text.
- **UploadedFilesList** (below, takes remaining space): Table with columns `Tài liệu` (fileName, clickable download) | `Kích thước` (formatted) | `Loại` (mimeType) | `Người upload` (uploadedBy) | `Ngày upload` (createdAt) | `Hành động` (download icon + delete icon).
  - Pagination at bottom: `page=0, size=20, max=100`.
- **ModalFooter**: Cancel (left, gray), Upload (right, green, disabled until file selected and valid).

### 5. API Integration
| Operation | Endpoint | Method | Request Shape |
|---|---|---|---|
| Upload File | /api/v1/giay-to/upload/{entityType}/{entityId} | POST | `multipart/form-data`: file (MultipartFile), entityId (path var), entityType (path var), userId (from session) |
| List by Entity | /api/v1/giay-to/entity/{entityType}/{entityId} | GET | `?page=0&size=20` |
| Get by ID | /api/v1/giay-to/{id} | GET | - |
| Delete | /api/v1/giay-to/{id} | DELETE | - |

### 6. RBAC Rules
| Role | Upload | Read | Delete |
|---|---|---|---|
| Admin | ✅ | ✅ | ✅ |
| Lãnh đạo | ✅ | ✅ | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ | ✅ | ✅ |
| Doanh nghiệp cảng | ✅ | ✅ | ✅ |
| Nhân viên vận hành | ✅ | ✅ | ✅ |

### 7. Error Handling
- **Empty file upload**: Toast "File upload không được để trống" + keep modal open.
- **File too large (>10MB)**: Toast "Kích thước file vượt quá 10MB." + keep modal open.
- **403 Forbidden**: "Bạn không có quyền đính kèm tài liệu."
- **404 Not Found**: "Không tìm thấy entity để đính kèm."
- **MIME type validation**: The BE validates MIME type (comment says "PDF, DOCX, JPEG, JPG, PNG" in controller docblock), but the spec says mimeType is ANY string — frontend does not restrict. If BE rejects, show toast with BE error message.
- **Upload success**: Toast "Đính kèm file thành công" + refresh files list + close modal after brief delay.
- **Upload failure**: Toast "Tải lên file thất bại. Vui lòng thử lại." + keep modal open + retry button.
- **Delete attachment**: Confirm modal → DELETE /api/v1/giay-to/{id} → Toast "Xóa tài liệu đính kèm thành công" + refresh.

### 8. Accessibility
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` + `aria-describedby`.
- Drop zone: `role="button"`, `tabindex="0"`, Enter/Space to trigger file picker, `aria-label="Kéo thả file hoặc nhấn để chọn"`.
- File picker: Proper `<label>` with `for` attribute, `aria-required="true"` for upload validation.
- Progress bar: `role="progressbar"`, `aria-valuenow` (animated), `aria-label="Tiến trình tải lên"`.
- File list: `role="grid"` with `role="row"` per row, `aria-sort` if sortable.
- Keyboard: Tab through Upload area → Preview → Uploaded list → Footer buttons. Focus trap within modal. Esc closes (with confirm if file selected but not uploaded).
- Screen reader: File selection announced via `aria-live="polite"`, upload progress via `aria-live="polite"`, errors via `aria-live="assertive"`.
