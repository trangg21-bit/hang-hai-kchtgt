---
id: F-177
name: "Bieu 28-T: Khoi luong hang hoa theo thang"
slug: bieu-28-t-khoi-luong-hang-hoa-theo-thang
module-id: M-016
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:24Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 28-T: Khoi luong hang hoa theo thang

## Description

Hien thi bao cao Bieu 28-T tong hop khoi luong hang hoa theo tung thang, bao gom tong luong, loai hang, khu vuc cang, so phuong thuyen, xuat PDF/Excel de bao cao thong ke hang tuan.

## Business Intent

Ho tro quan ly theo doi luong luong hang hoa theo thang, phan tich xu huong tang giam theo tung thang, lam co so de quy hoach nang cap cang, phan bo nguon luc va bao cao so quan theo dinh ky thang.

## Flow Summary

Chuyen vien chon nam bao cao, don vi cang, loai hang, he thong lay du lieu luong hang tung thang tu CSDL, hien thi theo Bieu 28-T voi thong ke theo thang, chuyen vien xac nhan du lieu, kiem tra so lieu va xuat bao cao PDF/Excel.

## Acceptance Criteria

1. Hien thi bao cao Bieu 28-T voi tong luong hang hoa theo tung thang chinh xac
2. Bao cao hien thi du so luong theo loai hang, khu vuc cang
3. Xuat PDF/Excel thanh cong voi dinh dang Bieu 28-T theo quy dinh

## In Scope

- Hien thi tong luong hang hoa theo tung thang trong nam
- Xuat bao cao PDF/Excel theo dinh dang Bieu 28-T
- Loc theo cang, loai hang, khu vuc
- Hien thi so sanh theo thang trong nam

## Out of Scope

- Cap nhap thong tin luong hang theo ca
- Theo doi chi tiet tong tai container
- Bao cao chi tieu nang cao theo ngay

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao khoi luong hang theo thang |
| Admin | Xem, Xuat, Xac nhan bao cao |

## API Endpoints

- `GET /api/v1/reports/form-28t` — Lay bao cao khoi luong hang hoa theo thang
- `GET /api/v1/reports/form-28t/export-pdf` — Xuat bao cao dang PDF
- `GET /api/v1/reports/form-28t/export-excel` — Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API GET /api/v1/reports/form-28t de lay du lieu luong hang tung thang tu CSDL Cargo va Ship. Tich hop Apache POI de xuat Excel va iText de xuat PDF. Du lieu duoc gom theo thang, loai hang, khu vuc cang. Luong hang duoc tinh theo don vi tan cho hang dot va kg cho hang le, tong ke theo tung thang.

## Entities

- **MonthlyCargoVolume**: id, year, month, portCode, cargoType, totalWeight, vesselCount, containerCount
- **MonthlySummaryReport**: id, reportYear, totalAnnualVolume, byMonth, byPort, generatedBy, generatedAt

## Business Rules

1. Bao cao bao gom toan bo hang hoa thong qua trong nam doan thoi gian chon
2. Luong hang duoc tinh theo don vi tan cho hang dot va kg cho hang le
3. Bao cao hien thi du 12 thang trong nam
4. So lieu duoc cap nhat cuoi thang duoi 24h sau thao tac thay doi
5. Ban quan ly can xac nhan truoc khi xuat bao cao chinh thuc

## Testing Strategy

Test don vi cho logic gom khoi luong hang theo thang. Test tich hop de xac nhan du lieu tu CSDL va xuat file PDF/Excel. Test E2E quy trinh chon nam, hien thi, xac nhan, xuat bao cao Bieu 28-T.
