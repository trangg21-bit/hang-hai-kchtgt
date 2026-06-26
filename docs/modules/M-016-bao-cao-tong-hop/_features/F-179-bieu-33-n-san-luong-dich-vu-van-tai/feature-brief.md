---
id: F-179
name: "Bieu 33-N: San luong dich vu van tai, doanh nghiep"
slug: bieu-33-n-san-luong-dich-vu-van-tai
module-id: M-016
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:24Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 33-N: San luong dich vu van tai, doanh nghiep

## Description

Hien thi bao cao Bieu 33-N tong hop san luong dich vu van tai theo doanh nghiep, bao gom tong luong van tai, loai hinh van tai, don vi quan ly, doanh nghiep thuc hien, xuat PDF/Excel de bao cao so quan.

## Business Intent

Ho tro quan ly theo doi san luong dich vu van tai cua cac doanh nghiep theo nam, phan tich hieu qua kinh doanh, lam co so de quy hoach chinh sach phat trien van tai, phan bo nguon luc va bao cao so quan theo dinh ky nam.

## Flow Summary

Chuyen vien chon nam bao cao, loai hinh van tai, doanh nghiep, he thong lay du lieu san luong dich vu van tai tu CSDL, hien thi theo Bieu 33-N voi thong ke theo doanh nghiep, chuyen vien xac nhan du lieu, kiem tra so lieu va xuat bao cao PDF/Excel.

## Acceptance Criteria

1. Hien thi bao cao Bieu 33-N voi san luong dich vu van tai theo doanh nghiep chinh xac
2. Bao cao hien thi du loai hinh van tai, don vi quan ly, doanh nghiep thuc hien
3. Xuat PDF/Excel thanh cong voi dinh dang Bieu 33-N theo quy dinh

## In Scope

- Hien thi san luong dich vu van tai theo doanh nghiep
- Xuat bao cao PDF/Excel theo dinh dang Bieu 33-N
- Loc theo doanh nghiep, loai hinh van tai, don vi quan ly
- Hien thi so lieu thong ke theo loai hinh van tai

## Out of Scope

- Cap nhap thong tin san luong van tai
- Tinh toan chi phi van tai
- Bao cao chi tieu nang cao ve kinh doanh

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao san luong dich vu van tai |
| Admin | Xem, Xuat, Xac nhan bao cao |

## API Endpoints

- `GET /api/v1/reports/form-33n` — Lay bao cao san luong dich vu van tai theo doanh nghiep
- `GET /api/v1/reports/form-33n/export-pdf` — Xuat bao cao dang PDF
- `GET /api/v1/reports/form-33n/export-excel` — Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API GET /api/v1/reports/form-33n de lay du lieu san luong dich vu van tai theo doanh nghiep tu CSDL TransportService. Tich hop Apache POI de xuat Excel va iText de xuat PDF. Du lieu duoc gom theo doanh nghiep, loai hinh van tai, don vi quan ly. San luong duoc tinh theo don vi ton-km cho van tai duong bo va kg-km cho van tai duong thuỷ.

## Entities

- **TransportService**: id, year, enterpriseName, transportType, volume, route, revenue, operatorId
- **EnterpriseReport**: id, reportYear, totalVolume, byEnterprise, byTransportType, generatedBy, generatedAt

## Business Rules

1. Bao cao bao gom toan bo doanh nghiep thuc hien van tai trong thoi ky doan thoi gian chon
2. San luong duoc tinh theo don vi ton-km cho van tai duong bo va kg-km cho van tai duong thuỷ
3. Bao cao hien thi du loai hinh van tai: duong bo, duong thuỷ, duong sat
4. So lieu duoc cap nhat cuoi nam duoi 24h sau thao tac thay doi
5. Ban quan ly can xac nhan truoc khi xuat bao cao chinh thuc

## Testing Strategy

Test don vi cho logic gom san luong dich vu van tai theo doanh nghiep. Test tich hop de xac nhan du lieu tu CSDL va xuat file PDF/Excel. Test E2E quy trinh chon nam, hien thi, xac nhan, xuat bao cao Bieu 33-N.
