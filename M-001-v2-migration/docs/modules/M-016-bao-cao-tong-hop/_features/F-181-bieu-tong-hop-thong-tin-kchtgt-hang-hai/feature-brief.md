---
id: F-181
name: "Bieu Tong hop thong tin KCHTGT hang hai"
slug: bieu-tong-hop-thong-tin-kchtgt-hang-hai
module-id: M-016
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:49Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu Tong hop thong tin KCHTGT hang hai

## Description

Hien thi bao cao Bieu Tong hop thong tin KCHTGT hang hai, bao gom thong tin tong hop ve he thong KCHTGT hang hai theo don vi, khu vuc, loai cong trinh, tinh trang va hoat dong, xuat PDF/Excel de bao cao so quan.

## Business Intent

Ho tro ban quan ly theo doi tinh hinh KCHTGT hang hai theo don vi va khu vuc, phan tich xu huong hoat dong, quy hoach dau tu nang cap, phan bo nguon luc va bao cao so quan theo dinh ky.

## Flow Summary

Chuyen vien chon don vi quan ly, khu vuc, thoi ky bao cao, he thong lay du lieu tong hop KCHTGT hang hai tu CSDL, hien thi theo Bieu Tong hop thong tin KCHTGT hang hai, chuyen vien xac nhan du lieu, kiem tra so lieu va xuat bao cao PDF/Excel.

## Acceptance Criteria

1. Hien thi bao cao Tong hop thong tin KCHTGT hang hai voi du lieu chinh xac theo don vi
2. Bao cao hien thi du loai cong trinh, tinh trang, khu vuc KCHTGT hang hai
3. Xuat PDF/Excel thanh cong voi dinh dang Bieu Tong hop KCHTGT hang hai

## In Scope

- Hien thi tong hop thong tin KCHTGT hang hai theo don vi, khu vuc, loai cong trinh
- Xuat bao cao PDF/Excel theo dinh dang Bieu Tong hop KCHTGT hang hai
- Loc theo don vi, khu vuc, loai cong trinh, tinh trang
- Hien thi so sanh theo don vi va khu vuc

## Out of Scope

- Cap nhap thong tin chi tiet tung cong trinh KCHTGT
- Theo doi chi tiet hoat dong bao hieu theo ngay
- Bao cao chi tieu nang cao theo don vi con

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao tong hop KCHTGT hang hai |
| Admin | Xem, Xuat, Xac nhan bao cao tong hop |

## API Endpoints

- `GET /api/v1/reports/summary-marine` — Lay bao cao tong hop thong tin KCHTGT hang hai theo thoi ky
- `GET /api/v1/reports/summary-marine/export-pdf` — Xuat bao cao dang PDF
- `GET /api/v1/reports/summary-marine/export-excel` — Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API GET /api/v1/reports/summary-marine de lay du lieu tong hop KCHTGT hang hai tu CSDL Infrastructure va NavigationAid. Tich hop Apache POI de xuat Excel va iText de xuat PDF. Du lieu duoc gom theo don vi quan ly, khu vuc, loai cong trinh (cau cang, luong hang hai, den bien, de ke). Tinh trang duoc phan loai: tot, trung binh, kem, can sua chua.

## Entities

- **MarineInfo**: id, period, department, zone, structureType, status, operationalStatus, lastInspectionDate
- **MarineSummaryReport**: id, reportPeriod, totalStructures, byType, byStatus, byZone, generatedBy, generatedAt

## Business Rules

1. Bao cao bao gom toan bo KCHTGT hang hai trong don vi va khu vuc doan thoi gian chon
2. Tinh trang cong trinh duoc phan loai: tot, trung binh, kem, can sua chua
3. Bao cao hien thi so sanh theo don vi va khu vuc
4. So lieu duoc cap nhat duoi 24h sau thao tac thay doi
5. Ban quan ly can xac nhan truoc khi xuat bao cao chinh thuc

## Testing Strategy

Test don vi cho logic gom thong tin KCHTGT hang hai theo don vi, khu vuc, loai cong trinh. Test tich hop de xac nhan du lieu tu CSDL va xuat file PDF/Excel. Test E2E quy trinh chon thoi ky, hien thi, xac nhan, xuat bao cao Bieu Tong hop thong tin KCHTGT hang hai.
