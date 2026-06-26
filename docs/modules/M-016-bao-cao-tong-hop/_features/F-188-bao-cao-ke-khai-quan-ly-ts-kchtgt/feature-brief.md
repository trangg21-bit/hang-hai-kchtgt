---
id: F-188
name: "Bao cao ke khai, tinh hinh quan ly TS KCHTGT hang hai"
slug: bao-cao-ke-khai-quan-ly-ts-kchtgt
module-id: M-016
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:49Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bao cao ke khai, tinh hinh quan ly TS KCHTGT hang hai

## Description

Hien thi bao cao ke khai tinh hinh quan ly tai san KCHTGT hang hai, bao gom thong tin tong hop ve tai san, cong trinh, thiet bi theo don vi, loai tai san, tinh trang quan ly, xuat PDF/Excel de bao cao so quan.

## Business Intent

Ho tro ban quan ly theo doi tinh hinh ke khai va quan ly tai san KCHTGT hang hai theo don vi, loai tai san, lam co so de quy hoach dau tu, phan bo nguon luc, bao tri nang cap va bao cao so quan theo dinh ky.

## Flow Summary

Chuyen vien chon don vi quan ly, loai tai san, thoi ky bao cao, he thong lay du lieu ke khai tai san tu CSDL, hien thi bao cao ke khai tinh hinh quan ly TS KCHTGT hang hai, chuyen vien xac nhan du lieu, kiem tra so lieu va xuat bao cao PDF/Excel.

## Acceptance Criteria

1. Hien thi bao cao ke khai tinh hinh quan ly TS KCHTGT hang hai voi du lieu chinh xac theo don vi
2. Bao cao hien thi du loai tai san, tinh trang quan ly, don vi quan ly
3. Xuat PDF/Excel thanh cong voi dinh dang bao cao quy dinh

## In Scope

- Hien thi ke khai tai san KCHTGT hang hai theo don vi, loai tai san, tinh trang
- Xuat bao cao PDF/Excel theo dinh dang quy dinh
- Loc theo don vi, loai tai san, tinh trang, thoi ky
- Hien thi thong tin tong hop theo don vi quan ly

## Out of Scope

- Cap nhap thong tin ke khai tai san
- Kiem toan tai san ke khai
- Bao cao chi tieu nang cao theo don vi con

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao ke khai quan ly |
| Admin | Xem, Xuat, Xac nhan ke khai quan ly |

## API Endpoints

- `GET /api/v1/reports/registration-management` — Lay bao cao ke khai, tinh hinh quan ly TS KCHTGT hang hai theo thoi ky
- `GET /api/v1/reports/registration-management/export-pdf` — Xuat bao cao dang PDF
- `GET /api/v1/reports/registration-management/export-excel` — Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API GET /api/v1/reports/registration-management de lay du lieu ke khai tai san tu CSDL Asset va Infrastructure. Tich hop Apache POI de xuat Excel va iText de xuat PDF. Du lieu duoc gom theo don vi quan ly, loai tai san (cong trinh, thiet bi, tai san dang ky), tinh trang quan ly (hoat dong, nghi, can sua chua). Bao cao hien thi tong hop so luong, gia tri, tinh trang cua moi loai tai san.

## Entities

- **AssetRegistration**: id, assetCode, assetName, assetType, status, department, location, registrationDate, lastInspectionDate
- **RegistrationManagementReport**: id, reportPeriod, totalAssets, byType, byStatus, byDepartment, generatedBy, generatedAt

## Business Rules

1. Bao cao bao gom toan bo tai san KCHTGT hang hai dang quan ly trong thoi ky doan thoi gian chon
2. Tai san duoc phan loai theo loai: cong trinh, thiet bi, tai san dang ky
3. Tinh trang quan ly duoc phan loai: hoat dong, nghi, can sua chua
4. Bao cao hien thi so sanh theo don vi quan ly
5. Ban quan ly can xac nhan truoc khi xuat bao cao chinh thuc

## Testing Strategy

Test don vi cho logic gom thong tin ke khai tai san theo don vi, loai tai san, tinh trang. Test tich hop de xac nhan du lieu tu CSDL va xuat file PDF/Excel. Test E2E quy trinh chon thoi ky, hien thi, xac nhan, xuat bao cao ke khai tinh hinh quan ly TS KCHTGT hang hai.
