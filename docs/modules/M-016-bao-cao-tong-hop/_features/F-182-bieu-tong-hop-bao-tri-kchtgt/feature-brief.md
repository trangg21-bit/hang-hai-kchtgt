---
id: F-182
name: "Bieu Tong hop thong tin bao tri KCHTGT"
slug: bieu-tong-hop-bao-tri-kchtgt
module-id: M-016
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:49Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu Tong hop thong tin bao tri KCHTGT

## Description

Hien thi bao cao Bieu Tong hop thong tin bao tri KCHTGT, bao gom tong hop cac hoat dong bao tri theo loai cong trinh, don vi, tinh trang, chi phi, ke hoach va tieu doan, xuat PDF/Excel de bao cao so quan.

## Business Intent

Ho tro ban quan ly theo doi cac hoat dong bao tri KCHTGT theo don vi, loai cong trinh, tinh trang, lam co so de quy hoach ke hoach bao tri, phan bo nguyen te va bao cao so quan theo dinh ky.

## Flow Summary

Chuyen vien chon thoi ky bao cao, don vi quan ly, loai cong trinh, he thong lay du lieu bao tri tu CSDL, hien thi theo Bieu Tong hop thong tin bao tri KCHTGT, chuyen vien xac nhan du lieu, kiem tra so lieu va xuat bao cao PDF/Excel.

## Acceptance Criteria

1. Hien thi bao cao Tong hop thong tin bao tri KCHTGT voi du lieu chinh xac theo don vi
2. Bao cao hien thi du loai cong trinh, tinh trang, chi phi, ke hoach bao tri
3. Xuat PDF/Excel thanh cong voi dinh dang Bieu Tong hop bao tri KCHTGT

## In Scope

- Hien thi tong hop hoat dong bao tri KCHTGT theo don vi, loai cong trinh, tinh trang
- Xuat bao cao PDF/Excel theo dinh dang Bieu Tong hop bao tri KCHTGT
- Loc theo don vi, loai cong trinh, tinh trang, ke hoach bao tri
- Hien thi chi phi va ke hoach bao tri

## Out of Scope

- Cap nhap chi tiet ke hoach bao tri
- Tinh toan chi phi thuc te
- Bao cao chi tieu nang cao theo don vi con

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao tong hop bao tri KCHTGT |
| Admin | Xem, Xuat, Xac nhan bao cao tong hop |

## API Endpoints

- `GET /api/v1/reports/summary-maintenance` — Lay bao cao tong hop thong tin bao tri KCHTGT theo thoi ky
- `GET /api/v1/reports/summary-maintenance/export-pdf` — Xuat bao cao dang PDF
- `GET /api/v1/reports/summary-maintenance/export-excel` — Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API GET /api/v1/reports/summary-maintenance de lay du lieu bao tri tu CSDL Asset va Infrastructure. Tich hop Apache POI de xuat Excel va iText de xuat PDF. Du lieu duoc gom theo loai cong trinh (cau cang, luong hang hai, den bien, de ke), don vi quan ly, tinh trang (ke hoach, dang thuc hien, hoan thanh, qua han). Chi phi bao tri duoc tinh theo don vi VND.

## Entities

- **MaintenanceRecord**: id, assetCode, structureType, maintenanceType, status[scheduled/in-progress/completed/overdue], cost, plannedDate, completedDate, department
- **MaintenanceSummaryReport**: id, reportPeriod, totalMaintenance, byType, byStatus, totalCost, completedRate, generatedBy, generatedAt

## Business Rules

1. Bao cao bao gom toan bo hoat dong bao tri KCHTGT trong thoi ky doan thoi gian chon
2. Tinh trang bao tri duoc phan loai: ke hoach, dang thuc hien, hoan thanh, qua han
3. Bao cao hien thi so sanh theo don vi va loai cong trinh
4. Chi phi bao tri duoc tinh theo don vi VND
5. Ban quan ly can xac nhan truoc khi xuat bao cao chinh thuc

## Testing Strategy

Test don vi cho logic gom hoat dong bao tri theo don vi, loai cong trinh, tinh trang. Test tich hop de xac nhan du lieu tu CSDL va xuat file PDF/Excel. Test E2E quy trinh chon thoi ky, hien thi, xac nhan, xuat bao cao Bieu Tong hop thong tin bao tri KCHTGT.
