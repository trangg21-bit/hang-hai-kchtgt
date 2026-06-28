---
id: F-174
name: "Bieu 45-6T/N: Bao cao tong hop hang hoa thong qua cang"
slug: bieu-45-6t-n-tong-hop-hang-hoa-thong-qua
module-id: M-016
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:23Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 45-6T/N: Bao cao tong hop hang hoa thong qua cang

## Description

Hien thi bao cao Bieu 45-6T/N tong hop hang hoa thong qua cang theo thoi ky, bao gom tong luong hang, loai hang, thiet ke cang, thong tin phuong thuyen di den, xuat PDF/Excel de bao cao so quan.

## Business Intent

Ho tro quan ly theo doi luong luong hang hoa thong qua cang theo thoi gian, phan tich xu huong tang giam luong hang, lam co so de quy hoach nang cap cang, phan bo nguon luc va bao cao so quan theo dinh ky.

## Flow Summary

Chuyen vien chon thoi ky bao cao (thang/quy/nam), don vi cang, loai hang, he thong lay du lieu phuong thuyen di den va luong hang thong qua tu CSDL, hien thi theo Bieu 45-6T/N, chuyen vien xac nhan du lieu, kiem tra so lieu va xuat bao cao PDF/Excel.

## Acceptance Criteria

1. Hien thi bao cao Bieu 45-6T/N voi tong luong hang thong qua cang chinh xac
2. Bao cao hien thi du loai hang, thiet ke cang, so phuong thuyen di den
3. Xuat PDF/Excel thanh cong voi dinh dang Bieu 45-6T/N theo quy dinh

## In Scope

- Hien thi tong luong hang hoa thong qua cang theo thoi ky
- Xuat bao cao PDF/Excel theo dinh dang Bieu 45-6T/N
- Loc theo cang, loai hang, thoi ky, phuong thuyen
- Hien thi so lieu thong ke theo thiet ke cang

## Out of Scope

- Cap nhap thong tin phuong thuyen di den
- Theo doi chi tiet chuyen hang theo ca
- Bao cao chi tieu nang cao ve thong quan

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao hang hoa thong qua cang |
| Admin | Xem, Xuat, Xac nhan bao cao |

## API Endpoints

- `GET /api/v1/reports/form-45-6t` — Lay bao cao hang hoa thong qua cang theo thoi ky
- `GET /api/v1/reports/form-45-6t/export-pdf` — Xuat bao cao dang PDF
- `GET /api/v1/reports/form-45-6t/export-excel` — Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API GET /api/v1/reports/form-45-6t de lay du lieu phuong thuyen di den, loai hang va luong hang tu CSDL Ship và Cargo. Tich hop Apache POI de xuat Excel va iText de xuat PDF. Du lieu duoc gom nhom theo cang, loai hang, thoi ky. Luong hang duoc tinh theo don vi tan, kg hoac container theo thiet ke cang.

## Entities

- **CargoTransit**: id, vesselName, portCode, cargoType, weight, volume, arrivalDate, departureDate, route
- **PortSummaryReport**: id, reportPeriod, totalTransit, byCargoType, byVesselType, byPort, generatedBy, generatedAt

## Business Rules

1. Bao cao bao gom toan bo hang hoa thong qua cang trong thoi ky doan thoi gian chon
2. Luong hang duoc tinh bang don vi tan cho hang dot va kg cho hang le
3. Bao cao phai bao gom so sanh voi thoi ky truoc
4. Thoi ky bao cao phai duoc chon truoc khi hien thi
5. Ban quan ly can xac nhan truoc khi xuat bao cao chinh thuc

## Testing Strategy

Test don vi cho logic gom luong hang theo cang, loai hang, thoi ky. Test tich hop de xac nhan du lieu tu CSDL va xuat file PDF/Excel. Test E2E quy trinh chon thoi ky, hien thi, xac nhan, xuat bao cao Bieu 45-6T/N.
