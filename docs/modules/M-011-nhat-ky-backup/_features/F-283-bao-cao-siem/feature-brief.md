---
id: F-283
name: "Báo cáo SIEM"
slug: bao-cao-siem
module-id: M-011
status: proposed
classification: local
priority: low
created: "2026-06-16T04:42:24Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Báo cáo SIEM

## Description

Hệ thống quản lý và xuất bản báo cáo SIEM với đa dạng định dạng (WORD, EXCEL, PDF, HTML, XML). Mỗi báo cáo được lưu trữ dưới dạng entity `SiemReport` trên bảng `siem_reports`, kèm versioning tự động tăng, trạng thái lifecycle (PENDING → COMPLETED/FAILED), thông tin người tạo và thời gian tạo. Dịch vụ hỗ trợ tạo báo cáo ad-hoc hoặc lên lịch tự động (cron), với cơ chế phiên bản để theo dõi lịch sử xuất bản.

## Business Intent

- Cung cấp báo cáo an ninh định kỳ hoặc theo yêu cầu phục vụ kiểm toán, báo cáo quản lý và phân tích xu hướng bảo mật hệ thống.
- Hỗ trợ đa dạng định dạng file để tương thích với các công cụ khác nhau (MS Word, Excel, PDF cho in ấn, HTML cho trình duyệt, XML cho tích hợp hệ thống).
- Đảm bảo tính truy vết và audit trail cho từng báo cáo được tạo ra — ai tạo, khi nào, phiên bản nào — phục vụ yêu cầu tuân thủ.

## Flow Summary

1. **Tạo báo cáo mới**: Người dùng gửi `POST /api/siem/reports` với `SiemReportRequest` (format, scheduled flag, cronExpression, createdBy). Service tạo bản ghi mới với status = `PENDING`, version = 1.
2. **Tăng version tự động**: Khi tạo báo cáo mới cho cùng một format và status, hệ thống tự động tăng version dựa trên `SiemReportRepository.findByFormatAndStatus()`.
3. **Hoàn thành báo cáo**: Sau khi quá trình tạo báo cáo hoàn tất (có thể đồng bộ hoặc bất đồng bộ), `finalizeReport()` cập nhật `content` (byte array), `contentType` (MIME), `fileSizeBytes`, `generatedAt` và chuyển status sang `COMPLETED`.
4. **Xử lý lỗi**: Nếu quá trình tạo báo cáo thất bại, `markReportFailed()` chuyển status sang `FAILED` và ghi log lý do.
5. **Tra cứu báo cáo**: `GET /api/siem/reports` cho phép lọc theo format và status; `GET /api/siem/reports/{id}` trả về metadata của báo cáo (không bao gồm nội dung byte).
6. **Hỗ trợ lên lịch**: Khi `scheduled = true` trong request, hệ thống lưu `cronExpression` để scheduler có thể trigger tạo báo cáo tự động (chức năng scheduler execution là future work).

## Acceptance Criteria

- **Tạo báo cáo PENDING**: `POST /api/siem/reports` với format hợp lệ tạo bản ghi `SiemReport` với status = `PENDING`, version = 1, createdBy được ghi nhận.
- **Tăng version đúng**: Báo cáo thứ 2 cùng format và status có version = 2, báo cáo thứ 3 có version = 3, v.v.
- **Hoàn thành báo cáo thành công**: `finalizeReport()` chuyển status từ `PENDING` sang `COMPLETED`, lưu content byte array, contentType và fileSizeBytes chính xác.
- **Từ chối finalize khi không PENDING**: Ném `IllegalStateException` nếu gọi `finalizeReport()` cho báo cáo có status khác `PENDING`.
- **Lọc báo cáo theo format/status**: `GET /api/siem/reports?format=WORD&status=COMPLETED` trả về danh sách báo cáo khớp cả hai điều kiện lọc.

## In Scope

- Tạo báo cáo SIEM với 5 định dạng: WORD (POI XWPFDocument), EXCEL (POI XSSFWorkbook), PDF (iText7), HTML (StringBuilder CSS grid), XML (với escapeXML).
- Versioning tự động tăng per format + status.
- Lifecycle management: PENDING → COMPLETED / FAILED.
- Metadata tracking: createdBy, generatedAt, scheduled, cronExpression.
- REST API: POST /api/siem/reports (tạo), GET /api/siem/reports/{id} (chi tiết), GET /api/siem/reports (danh sách có lọc).
- Bảo vệ bằng `@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")`.
- Xuất báo cáo từ SiemService.metrics data: metrics summary + 20 recent logs (WORD/PDF/HTML/XML) hoặc 50 recent logs (EXCEL).

## Out of Scope

- Quản lý template báo cáo (không có hệ thống template — format cố định).
- Thực thi lên lịch báo cáo tự động (entity hỗ trợ scheduled/cronExpression nhưng scheduler execution là future work).
- So sánh lịch sử trong báo cáo (chỉ có metrics thời gian thực, không có dữ liệu so sánh quá khứ).
- Gửi báo cáo qua email (future enhancement).
- Truy cập báo cáo theo vai trò chi tiết (v1 dùng cùng auth như metrics).
- Lưu trữ nội dung báo cáo ra S3 hoặc hệ thống file bên ngoài (hiện tại lưu trong DB LONGBLOB).

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Admin | Tạo báo cáo SIEM, xem danh sách báo cáo, xem metadata báo cáo |
| System Admin | Tạo báo cáo SIEM, xem danh sách báo cáo, xem metadata báo cáo |
| User | Không có quyền truy cập API báo cáo SIEM |

## Entities

- **SiemReport**: id (UUID), format (varchar 10), status (SiemReportStatus), version (int), content (LONGBLOB), contentType (varchar 100), fileSizeBytes (Long), createdBy (varchar 100), generatedAt (LocalDateTime), scheduled (boolean), cronExpression (varchar 50)
- **SiemReportStatus**: enum { PENDING, COMPLETED, FAILED }
- **SiemReportRequest**: format, scheduled (boolean), cronExpression (String), createdBy (String)
- **SiemReportResponse**: id, format, status, version, fileSizeBytes, createdBy, generatedAt, scheduled, contentType

## Business Rules

1. Mỗi báo cáo được tạo với trạng thái ban đầu `PENDING` — trạng thái chỉ chuyển sang `COMPLETED` khi `finalizeReport()` được gọi, hoặc sang `FAILED` nếu quá trình tạo thất bại.
2. Version tự động tăng mỗi khi tạo báo cáo mới cho cùng một format — không cho phép tạo hai báo cáo có cùng format và cùng version.
3. Chỉ báo cáo có status `PENDING` mới được phép finalize; gọi finalize trên báo cáo `COMPLETED` hoặc `FAILED` bị từ chối với `IllegalStateException`.
4. Báo cáo được tạo cho các định format hợp lệ: WORD, EXCEL, PDF, HTML, XML (không phân biệt hoa thường).
5. Tất cả các endpoint báo cáo đều yêu cầu xác thực qua `@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")`.
6. Báo cáo lên lịch (`scheduled = true`) lưu `cronExpression` để scheduler thực thi — tuy nhiên việc thực thi thực tế là future work.

## Testing Strategy

- **Unit test (SiemReportService)**: 10 test cases bao gồm generateReport (tạo mới + increment version), finalizeReport (chuyển trạng thái + validation), getReportById, markReportFailed, listReportsByFormat, createFilename.
- **Integration test (SiemController)**: 8 test cases bao gồm POST generate (success/error/400), GET by ID (success/404), GET list (default filter + filter by format/status).
- Tổng cộng 18 test cases (10 service + 8 controller), tất cả đều pass.
