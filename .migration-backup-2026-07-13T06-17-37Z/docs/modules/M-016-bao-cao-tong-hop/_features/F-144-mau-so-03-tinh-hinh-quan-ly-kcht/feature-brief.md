---
id: F-144
name: "Mau so 03: Bao cao tinh hinh quan ly tai san KCHT"
slug: mau-so-03-tinh-hinh-quan-ly-kcht
module-id: M-016
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:03Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Mau so 03: Bao cao tinh hinh quan ly tai san KCHT

## Description

Hien thi bao cao Mau so 03 ve tinh hinh quan ly tai san KCHT, bao gom so luong tai san theo tinh trang, theo don vi quan ly, theo loai tai san va cac so lieu thong ke quan ly khac.

## Business Intent

Giup ban quan ly theo doi tinh hinh quan ly tai san KCHT theo thoi gian, phan tich xu huong tinh trang tai san, quy hoach cong tac bao tri va nang cap tai san, lam co so bao cao so quan.

## Flow Summary

Chuyen vien chon don vi va thoi ky bao cao, he thong lay du lieu tai san tu CSDL, hien thi thong ke theo loai, tinh trang, don vi quan ly theo Mau so 03, chuyen vien xac nhan va xuat bao cao.

## Acceptance Criteria

1. Hien thi bao cao Mau so 03 voi so lieu thong ke chinh xac
2. Bao cao hien thi du so luong tai san theo loai, tinh trang, don vi
3. Xuat PDF/Excel thanh cong theo dinh dang quy dinh

## In Scope

- Hien thi thong ke tai san theo loai, tinh trang, don vi quan ly
- Xuat bao cao PDF/Excel theo dinh dang Mau so 03
- Hien thi so lieu so sanh theo thoi ky
- Hien thi so tai san hoat dong, nghi, phai bao tri

## Out of Scope

- Cap nhap thong tin quan ly tai san
- Toi uu hoa cong tac quan ly tai san
- Bao cao chi tieu nang cao

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao quan ly |
| Admin | Xem, Xuat, Xac nhan bao cao quan ly |

## API Endpoints

- `GET /api/reports/form-03` - Lay thong tin quan ly tai san theo Mau so 03
- `GET /api/reports/form-03/export-pdf` - Xuat bao cao dang PDF
- `GET /api/reports/form-03/export-excel` - Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API de truy xuat du lieu thong ke tai san tu CSDL. Tich hop Apache POi cho xuat Excel, iText cho xuat PDF. Truycap vao bang Asset voi cac truong tinh trang, don vi quan ly, loai tai san.

## Entities

- **AssetManagement**: id, assetCode, assetType, status, department, lastInspectionDate, nextInspectionDate, manager
- **ManagementReport**: id, reportPeriod, totalAssets, activeCount, inactiveCount, maintenanceCount, generatedAt

## Business Rules

1. Tinh hinh quan ly duoc tinh theo don vi quan ly va thoi ky bao cao
2. Tai san phan loai theo tinh trang: hoat dong, nghi, phai bao tri, xu ly
3. Bao cao bao gom so sanh voi thoi ky truoc de phan tich xu huong
4. Ban quan ly can xac nhan truoc khi xuat bao cao chinh thuc
5. So lieu phai duoc cap nhat duoi 24h sau thao tac thay doi

## Testing Strategy

Test don vi cho logic thong ke theo loai, tinh trang, don vi. Test tich hop xuat file PDF/Excel. Test E2E quy trinh chon thoi ky, hien thi, xac nhan, xuat bao cao.
