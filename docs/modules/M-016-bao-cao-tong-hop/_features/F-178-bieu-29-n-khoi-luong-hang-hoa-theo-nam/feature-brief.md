---
id: F-178
name: "Bieu 29-N: Khoi luong hang hoa theo nam"
slug: bieu-29-n-khoi-luong-hang-hoa-theo-nam
module-id: M-016
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:24Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 29-N: Khoi luong hang hoa theo nam

## Description

Hien thi bao cao Bieu 29-N tong hop khoi luong hang hoa theo nam, bao gom tong luong, loai hang, khu vuc cang, so phuong thuyen trong nam va xu huong theo cac nam gan day, xuat PDF/Excel de bao cao so quan.

## Business Intent

Ho tro quan ly theo doi luong luong hang hoa theo nam, phan tich xu huong tang giam dai hạn, lam co so de quy hoach dau tu nang cap cang, phan bo nguon luc va bao cao so quan theo dinh ky nam.

## Flow Summary

Chuyen vien chon khoang thoi gian bao cao (1-5 nam), don vi cang, loai hang, he thong lay du lieu luong hang theo nam tu CSDL, hien thi theo Bieu 29-N voi xu huong theo nam, chuyen vien xac nhan du lieu, kiem tra so lieu va xuat bao cao PDF/Excel.

## Acceptance Criteria

1. Hien thi bao cao Bieu 29-N voi tong luong hang hoa theo nam chinh xac
2. Bao cao hien thi xu huong tang giam theo cac nam gan day
3. Xuat PDF/Excel thanh cong voi dinh dang Bieu 29-N theo quy dinh

## In Scope

- Hien thi tong luong hang hoa theo tung nam trong khoang thoi gian chon
- Xuat bao cao PDF/Excel theo dinh dang Bieu 29-N
- Loc theo cang, loai hang, khoang thoi gian
- Hien thi xu huong tang giam theo nam

## Out of Scope

- Cap nhap thong tin luong hang theo ca
- Theo doi chi tiet tong tai container
- Bao cao chi tieu nang cao theo thang

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao khoi luong hang theo nam |
| Admin | Xem, Xuat, Xac nhan bao cao |

## API Endpoints

- `GET /api/v1/reports/form-29n` — Lay bao cao khoi luong hang hoa theo nam
- `GET /api/v1/reports/form-29n/export-pdf` — Xuat bao cao dang PDF
- `GET /api/v1/reports/form-29n/export-excel` — Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API GET /api/v1/reports/form-29n de lay du lieu luong hang theo nam tu CSDL Cargo va Ship. Tich hop Apache POI de xuat Excel va iText de xuat PDF. Du lieu duoc gom theo nam, loai hang, khu vuc cang, xu huong tang giam duoc tinh theo phuong phap trung binh dong de xac dinh xu huong dai hạn. Luong hang duoc tinh theo don vi tan cho hang dot va kg cho hang le.

## Entities

- **YearlyCargoVolume**: id, year, portCode, cargoType, totalWeight, vesselCount, containerCount, growthRate
- **YearlySummaryReport**: id, reportYears, totalVolume, byYear, byPort, growthTrend, generatedBy, generatedAt

## Business Rules

1. Bao cao bao gom toan bo hang hoa thong qua trong khoang thoi gian doan thoi gian chon
2. Luong hang duoc tinh theo don vi tan cho hang dot va kg cho hang le
3. Bao cao hien thi xu huong tang giam theo cac nam gan day
4. So lieu duoc cap nhat cuoi nam duoi 24h sau thao tac thay doi
5. Ban quan ly can xac nhan truoc khi xuat bao cao chinh thuc

## Testing Strategy

Test don vi cho logic gom khoi luong hang theo nam va tinh toan xu huong. Test tich hop de xac nhan du lieu tu CSDL va xuat file PDF/Excel. Test E2E quy trinh chon khoang thoi gian, hien thi, xac nhan, xuat bao cao Bieu 29-N.
