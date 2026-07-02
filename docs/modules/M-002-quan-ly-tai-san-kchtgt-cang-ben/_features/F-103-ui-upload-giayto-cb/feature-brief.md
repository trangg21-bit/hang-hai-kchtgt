---
id: F-103
name: "Upload GiayTo Cảng biển"
slug: ui-upload-giayto-cb
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:09:33Z"
last-updated: "2026-07-01T04:09:33Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Upload GiayTo Cảng biển

## Description

Tính năng Upload GiayTo Cảng biển cho phép người dùng đính kèm các văn bản liên quan (giấy tờ, hồ sơ, chứng từ) trực tiếp từ trang chi tiết Cảng biển (F-069). Giao diện bao gồm một nút "Thêm văn bản đính kèm" nằm trên trang thông tin chi tiết của Cảng biển; khi người dùng nhấn nút này, một modal upload file hiện ra, cho phép chọn file từ thiết bị, xem trước thông tin file (tên, kích thước, định dạng) và xác nhận tải lên. Hệ thống cho phép tải lên file với bất kỳ MIME type nào, không giới hạn định dạng file cụ thể. Định danh của file (GiayTo) được lưu trữ cùng tham chiếu thực thể — entityType="cang-bien" và entityId (string) của Cảng biển tương ứng — nhằm đảm bảo mọi tài liệu đính kèm luôn gắn liền với thực thể Cảng biển mà nó mô tả. Dữ liệu binary của file không được lưu thực tế vào MinIO mà sử dụng mock console-stub (đàm phán với W4 để tích hợp Tika kiểm tra magic-byte ở giai đoạn sau). Đây là một tính năng cục bộ, phục vụ nhu cầu quản lý hồ sơ điện tử cho Cảng biển trong hệ thống cảng hải quan một cách thống nhất.

## Business Intent

Cho phép người dùng gắn các giấy tờ chứng từ liên quan trực tiếp vào từng Cảng biển, tạo lập một kho lưu trữ hồ sơ điện tử tập trung, giảm thiểu việc sử dụng giấy tờ và đảm bảo tính truy xuất, kiểm toán của các tài liệu quản lý cảng biển.

## Flow Summary

Người dùng mở trang chi tiết Cảng biển (F-069), nhấn nút "Thêm văn bản đính kèm". Modal upload file hiện ra, người dùng chọn file từ thiết bị và nhấn "Tải lên". Client-side kiểm tra thông tin file (tên, kích thước) trước khi gửi lên. File được gửi qua POST /api/v1/giay-to với FormData chứa file, entityType="cang-bien" và entityId (string của Cảng biển). Server lưu metadata vào CSDL, và gọi MinIO stub (ghi log key ra console). Sau khi hoàn tất, hệ thống hiển thị toast "Upload thành công" và cập nhật danh sách file đính kèm ngay trên trang chi tiết. Người dùng có thể xem danh sách file đã upload, nhấn nút "Tải xuống" (GET /api/v1/giay-to/:id/download) để xem lại hoặc nhấn "Xóa" (DELETE /api/v1/giay-to/:id) để xóa nếu có quyền.

## Acceptance Criteria

1. Nút "Thêm văn bản đính kèm" hiển thị trên trang chi tiết Cảng biển (F-069) và mở modal upload khi được nhấn.
2. Modal upload cho phép chọn tối đa một file mỗi lần; hiển thị thông tin file (tên, kích thước, MIME type) trước khi xác nhận.
3. Hệ thống chỉ chấp nhận file có MIME type là application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, hoặc image/jpeg — các loại khác bị từ chối với toast "File không hợp lệ".
4. File có kích thước lớn hơn 10 MB (10485760 bytes) bị từ chối với toast "File quá lớn".
5. Sau khi upload thành công, metadata được lưu vào CSDL với entityType="CangBien" và entityId đúng của Cảng biển; toast "Upload thành công" được hiển thị.
6. Người dùng có thể xem danh sách file đính kèm trên trang chi tiết, mỗi mục hiển thị tên file, kích thước, ngày upload và người upload.
7. Nút "Tải xuống" cho từng file gọi GET /api/v1/giay-to/:id/download và trả về nội dung file.
8. Nút "Xóa" cho từng file gọi DELETE /api/v1/giay-to/:id và xóa metadata khỏi CSDL sau khi xác nhận; người dùng không có quyền giayto:delete không thấy nút này.
9. GET /api/v1/giay-to?entityType=CangBien&entityId={uuid} trả về đúng danh sách các file đính kèm cho Cảng biển cụ thể.
10. RBAC: các quyền upload (giayto:upload) và delete (giayto:delete) được kiểm tra đúng theo quy định; người dùng không có quyền upload không thấy nút "Thêm văn bản đính kèm".

## In Scope

- Giao diện nút "Thêm văn bản đính kèm" trên trang chi tiết Cảng biển (F-069).
- Modal upload file với hỗ trợ kéo thả (drag-and-drop) và chọn file từ trình duyệt.
- Client-side MIME type validation (PDF, DOCX, JPEG).
- Client-side file size validation (≤ 10 MB).
- POST /api/v1/giay-to gửi FormData (file + entityType + entityId).
- Server-side MIME type validation và size validation.
- Lưu metadata GiayTo vào CSDL (fileName, mimeType, fileSize, entityRef, uploadDate, createdBy, createdAt, updatedAt).
- MinIO stub — ghi log key ra console, không lưu binary thực.
- GET /api/v1/giay-to?entityType=CangBien&entityId=uuid — liệt kê file đính kèm.
- GET /api/v1/giay-to/:id/download — tải file đã upload.
- DELETE /api/v1/giay-to/:id — xóa file đính kèm (có xác nhận).
- Toast thông báo kết quả upload (thành công / không hợp lệ / quá lớn).
- RBAC kiểm tra @auth.check(authentication, 'giayto:upload') và @auth.check(authentication, 'giayto:delete').

## Out of Scope

- Tích hợp MinIO thực tế — MinIO stub chỉ ghi log ra console.
- Kiểm tra magic-byte của file bằng Apache Tika — chức năng này được deferred (đàm phán W4).
- Upload nhiều file cùng lúc (multi-file upload).
- Preview file inline trong modal (chỉ hiển thị thông tin metadata).
- Nén, chuyển đổi định dạng hoặc phân tích nội dung file.
- Tìm kiếm nội dung bên trong file.
- Quản lý phiên bản file (versioning) — mỗi lần upload tạo một bản ghi GiayTo mới.
- Tích hợp email/notification khi upload hoặc xóa file.

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | upload + delete + view | Toàn quyền quản lý file đính kèm Cảng biển |
| Lãnh đạo | upload + delete + view | Có thể upload, xóa và xem mọi file đính kèm |
| Chuyên viên | upload + view | Có thể upload và xem file đính kèm, không có quyền xóa |
| Chuyên viên Cảng vụ | upload + view | Có thể upload và xem file đính kèm Cảng biển, không có quyền xóa |
| Doanh nghiệp cảng | upload + view | Có thể upload và xem file đính kèm liên quan đến Cảng biển của mình |
| Người dùng tại cảng | upload + view | Có thể upload và xem file đính kèm trong phạm vi Cảng biển được phân quyền |
| Nhân viên vận hành | view only | Chỉ có quyền xem, không thể upload hoặc xóa file đính kèm |

## Entities

GiayTo: id (UUID), fileName (string), mimeType (string), fileSize (integer, bytes), entityRef (string, định dạng "CangBien:{uuid}"), uploadDate (timestamp), createdBy (UUID), createdAt (timestamp), updatedAt (timestamp)

## Business Rules

1. MIME type của file phải là application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, hoặc image/jpeg — các loại MIME khác bị từ chối với mã lỗi tương ứng.
2. Kích thước file tối đa 10 MB (10485760 bytes) — file vượt quá giới hạn này bị từ chối ngay tại server trước khi lưu.
3. GiayTo phải được liên kết với một thực thể Cảng biển xác định thông qua entityType="CangBien" và entityId (UUID) — không cho phép upload file không gắn với thực thể.
4. Dữ liệu binary của file không được lưu thực tế vào MinIO — chỉ metadata được lưu vào CSDL, binary được stub bằng console logging (đàm phán với W4 cho giai đoạn tiếp theo).
5. Apache Tika magic-byte content detection được deferred — chỉ dựa vào MIME type client-declared trong header Content-Type (chủ động xác thực lại tại server).

## Testing Strategy

Kiểm thử sẽ bao gồm test đơn vị cho các service phương thức validateMime và validateFileSize, integration test cho POST /api/v1/giay-to với các trường hợp MIME hợp lệ (PDF, DOCX, JPEG) và không hợp lệ (GIF, PNG, EXE), test size boundary tại 10 MB (trước và sau), test RBAC cho từng role với các thao tác upload, delete và view, end-to-end test trên giao diện modal upload: mở trang chi tiết Cảng biển, nhấn nút upload, chọn file, kiểm tra toast thông báo, xác nhận metadata lưu đúng CSDL, liệt kê file qua endpoint list, thực hiện download và delete. MinIO stub sẽ được kiểm tra bằng cách xác nhận log console được ghi đúng khi upload. Tất cả các test được thực hiện trên môi trường CI/CD với database in-memory.
