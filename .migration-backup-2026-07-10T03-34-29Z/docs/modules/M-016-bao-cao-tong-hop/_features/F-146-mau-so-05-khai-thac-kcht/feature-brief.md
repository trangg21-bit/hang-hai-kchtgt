---
id: F-146
name: "Mau so 05: Bao cao tinh hinh khai thac tai san KCHT"
slug: mau-so-05-khai-thac-kcht
module-id: M-016
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:03Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Mau so 05: Bao cao tinh hinh khai thac tai san KCHT

## Description

Hien thi bao cao Mau so 05 ve tinh hinh khai thac tai san KCHT, bao gom so luong tai san dang khai thac, tai san nghi khai thac, tai san cho sua chua theo don vi, loai tai san va khu vuc, xuat PDF/Excel de bao cao co quan thanh ly.

## Business Intent

Ho tro ban quan ly theo doi tinh hinh khai thac tai san KCHT theo thoi gian, phan tich ty le khai thac, xac dinh tai san nghi hoat dong de co bien phap xu ly, lam co so de bao cao tai chinh va quy hoach dau tu thay the.

## Flow Summary

Chuyen vien chon don vi quan ly, thoi ky bao cao va khu vuc, he thong lay du lieu khai thac tu CSDL tai san, hien thi thong ke theo loai, tinh trang, don vi theo Mau so 05, chuyen vien xac nhan du lieu, kiem tra so lieu va xuat bao cao PDF/Excel.

## Acceptance Criteria

1. Hien thi bao cao Mau so 05 voi so lieu thong ke chinh xac theo don vi va thoi ky
2. Bao cao hien thi du so luong tai san theo tinh trang: dang khai thac, nghi, cho sua chua
3. Xuat PDF/Excel thanh cong voi dinh dang Mau so 05 theo quy dinh

## In Scope

- Hien thi thong ke tai san theo tinh trang khai thac theo don vi, loai tai san
- Xuat bao cao PDF/Excel theo dinh dang Mau so 05
- Loc theo don vi quan ly, loai tai san, khu vuc, tinh trang khai thac
- Hien thi so lieu so sanh theo thoi ky

## Out of Scope

- Cap nhap thong tin khai thac tai san
- Xu ly tai san nghi khai thac
- Bao cao chi tieu nang cao ve khai thac

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao khai thac |
| Admin | Xem, Xuat, Xac nhan bao cao |

## API Endpoints

- `GET /api/v1/reports/form-05` — Lay danh sach bao cao khai thac theo thoi ky
- `GET /api/v1/reports/form-05/export-pdf` — Xuat bao cao dang PDF
- `GET /api/v1/reports/form-05/export-excel` — Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API GET /api/v1/reports/form-05 de lay du lieu thong ke khai thac tu CSDL Asset. Tich hop Apache POI de xuat Excel va iText de xuat PDF. Du lieu truy xuat tu bang Asset voi cac truong tinh trang, don vi quan ly, loai tai san, khu vuc. Ket qua duoc gom nhom theo don vi va tinh trang thong ke.

## Entities

- **AssetOperation**: id, assetCode, assetName, assetType, operationStatus[active/idle/maintenance], department, location, lastOperationDate
- **OperationReport**: id, reportPeriod, totalAssets, activeCount, idleCount, maintenanceCount, generatedBy, generatedAt

## Business Rules

1. Bao cao bao gom toan bo tai san dang quan ly trong thoi ky doan thoi gian chon
2. Tai san duoc phan loai theo tinh trang: dang khai thac, nghi khai thac, cho sua chua
3. So lieu duoc gom theo don vi quan ly, loai tai san, khu vuc
4. Bao cao phai bao gom so sanh voi thoi ky truoc
5. Ban quan ly can xac nhan truoc khi xuat bao cao chinh thuc

## Testing Strategy

Test don vi cho logic gom thong ke theo don vi, loai tai san, tinh trang. Test tich hop de xac nhan du lieu tu CSDL va xuat file PDF/Excel. Test E2E quy trinh chon thoi ky, hien thi, xac nhan, xuat bao cao.
