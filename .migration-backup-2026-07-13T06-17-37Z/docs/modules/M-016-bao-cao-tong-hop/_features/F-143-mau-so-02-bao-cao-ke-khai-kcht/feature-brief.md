---
id: F-143
name: "Mau so 02: Bao cao ke khai tai san KCHT"
slug: mau-so-02-bao-cao-ke-khai-kcht
module-id: M-016
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:03Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Mau so 02: Bao cao ke khai tai san KCHT

## Description

Hien thi bao cao Mau so 02 de ke khai toan bo tai san KCHT dang quan ly, bao gom thong tin chi tiet ve loai, vi tri, tinh trang va so luong, xuat PDF/Excel de bao cao dinh ky.

## Business Intent

Ho tro chuyen vien ke khai toan bo tai san KCHT theo Mau so 02 quy dinh, lam co so de bao cao so quan ve tinh trang tai san, lam co so de quy hoach dau tu va phan bo nguyen lieu hieu qua.

## Flow Summary

Chuyen vien chon thoi ky va don vi ke khai, he thong lay toan bo danh sach tai san tu CSDL, hien thi theo Mau so 02, chuyen vien kiem tra xac nhan, xu ly cac truong hop dac biet va xuat bao cao PDF/Excel.

## Acceptance Criteria

1. Hien thi danh sach tai san theo Mau so 02 thanh cong
2. Bao cao hien thi du cac thong tin loai, vi tri, tinh trang, so luong
3. Xuat PDF/Excel thanh cong voi dinh dang Mau so 02

## In Scope

- Hien thi danh sach tai san theo Mau so 02
- Xuat bao cao PDF/Excel theo dinh dang quy dinh
- Loc theo don vi, loai tai san, tinh trang, thoi ky
- Ke khai cac tai san moi da dang ky trong thoi ky

## Out of Scope

- Cap nhap thong tin tai san ke khai
- Kiem toan tai san ke khai
- Tu dong ke khai theo dinh ky

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao ke khai |
| Admin | Xem, Xuat, Chinh sua, Xac nhan ke khai |

## API Endpoints

- `GET /api/reports/form-02` - Lay danh sach tai san theo Mau so 02
- `GET /api/reports/form-02/export-pdf` - Xuat bao cao dang PDF
- `GET /api/reports/form-02/export-excel` - Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API GET /api/reports/form-02 de lay du lieu tai san tu CSDL. Tich hop thu vien xuat PDF/Excel de tao file theo dinh dang Mau so 02. Du lieu truy xuat tu bang Asset voi du cac truong thong tin loai, vi tri, tinh trang.

## Entities

- **AssetRegistration**: id, assetCode, assetName, assetType, location, status, quantity, registrationDate, department, reporter
- **Form02Report**: id, reportPeriod, totalAssets, byType, byLocation, generatedAt

## Business Rules

1. Mau so 02 bao gom toan bo tai san dang quan ly, bao cao tai san da ghi nhan
2. Moi tai san phai co ma tai san duy nhat
3. Bao cao bao gom tai san da dang ky trong thoi ky bao cao va tai san con lai
4. Don vi ke khai phai xac nhan truoc khi xuat bao cao
5. Du lieu phai chinh xac theo thuc te tai san

## Testing Strategy

Test don vi cho logic lay danh sach tai san theo thoi ky. Test tich hop de kiem tra xuat file PDF/Excel. Test E2E quy trinh ke khai, xac nhan, xuat bao cao.
