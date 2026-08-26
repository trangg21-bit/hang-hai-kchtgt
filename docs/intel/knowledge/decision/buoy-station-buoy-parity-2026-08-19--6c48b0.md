---
id: AM-6c48b00baca04ff8
kind: decision
topic: buoy-station-buoy-parity-2026-08-19
tags: []
importance: 0.85
agent: 
created: 2026-08-19T09:03:34.186Z
updated: 2026-08-19T09:03:34.186Z
---

Refactor Nhà trạm phao tiêu (/buoy-station, M-014) theo chuẩn Quản lý phao tiêu HOÀN TẤT 2026-08-19 (inline theo yêu cầu user, KHÔNG PMO, triage TRI-1787129418071-e04a C3 strict nhưng user chốt tự làm): services/buoy-station/ giờ có đủ 6 file như buoy/ — thêm schema.ts (constants gom chung + zod reject/delete) và BuoyStationDetailContent.tsx (4 tab + Thông tin hệ thống collapse); BuoyStationList.tsx viết lại sạch (bỏ dòng cực dài): 16 cột nghiệp vụ bỏ kỹ thuật, tên clickable mở detail, label 'Thuộc cảng biển' (portId), thêm Người/Ngày duyệt L1/L2, Lịch sử Drawer timeline 2 mode current/all (backend thêm GET /v1/buoy-station/history/all), filter thêm Ngày cập nhật; api.ts bỏ 'as any'; backend: entity+DTO+service thêm level1/2ApprovedBy/Date (migration V20260819120000), approveL1/L2 ghi level1/2, giữ approvedBy/approvedDate. Gate: npm run build + mvn compile exit 0.
