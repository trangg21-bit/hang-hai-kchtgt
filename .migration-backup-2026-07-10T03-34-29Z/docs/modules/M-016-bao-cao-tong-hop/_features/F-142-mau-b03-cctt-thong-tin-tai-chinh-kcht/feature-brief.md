---
id: F-142
name: "Mau B03/CCTT: Thong tin tai chinh tai san KCHT"
slug: mau-b03-cctt-thong-tin-tai-chinh-kcht
module-id: M-016
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:03Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Mau B03/CCTT: Thong tin tai chinh tai san KCHT

## Description

Hien thi bao cao Mau B03/CCTT de phan tich thong tin tai chinh tai san KCHT bao gom tri gia tai san, gia tri amortization, so du con lai theo dinh ky, xuat PDF/Excel de bao cao.

## Business Intent

Ho tro chuyen vien phan tich tinh hinh tai chinh tai san KCHT, theo doi gia tri tai san theo thoi gian, lam co so de bao cao tai chinh voi ban quan ly va co quan thanh ly.

## Flow Summary

Chuyen vien chon thoi ky bao cao va don vi quan ly, he thong lay du lieu tai chinh tu CSDL, hien thi thong tin tai san theo Mau B03/CCTT, chuyen vien xac nhan du lieu, kiem tra so lieu va xuat bao cao PDF/Excel.

## Acceptance Criteria

1. Hien thi du lieu thong tin tai chinh theo Mau B03/CCTT thanh cong
2. Bao cao hien thi du tri gia tai san, gia tri amortization, so du con lai
3. Xuat PDF/Excel thanh cong voi dinh dang Mau B03/CCTT

## In Scope

- Hien thi thong tin tai chinh tai san theo Mau B03/CCTT
- Xuat bao cao PDF/Excel theo dinh dang quy dinh
- Loc theo don vi quan ly, loai tai san, thoi ky
- Tinh toan va hien thi so lieu tai chinh theo quy che

## Out of Scope

- Cap nhap thong tin tai chinh tai san
- Kiem toan tai chinh
- Phat sinh bao cao tai chinh ngoai Mau B03/CCTT

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao |
| Admin | Xem, Xuat, Chinh sua Mau B03/CCTT |

## API Endpoints

- `GET /api/reports/form-b03` - Lay thong tin tai chinh tai san theo Mau B03/CCTT
- `GET /api/reports/form-b03/export-pdf` - Xuat bao cao dang PDF
- `GET /api/reports/form-b03/export-excel` - Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API de truy xuat du lieu tai chinh tu CSDL tai san. Tich hop Apache POi cho xuat Excel, iText cho xuat PDF. Truycap vao bang FinancialAsset voi cac truong tri gia, gia tri amortization, ngay mua, ngay de xuat.

## Entities

- **FinancialAsset**: id, assetName, assetType, acquisitionValue, amortizationValue, netBookValue, acquisitionDate, reportingPeriod, department
- **AssetFinancialReport**: id, reportName, period, totalValue, totalAmortization, totalNetValue, generatedBy, generatedAt

## Business Rules

1. Tri gia tai san phai lay theo quy che ke toan hien hanh
2. Gia tri amortization duoc tinh theo phuong phap thang de don gian
3. So du con lai = Tri gia goc - Gia tri amortization
4. Bao cao chi hien thi tai san dang hoat dong
5. Moi truong bao cao phai co thoi ky va don vi quan ly duoc chon

## Testing Strategy

Test don vi cho logic tinh toan gia tri tai san va amortization. Test tich hop de xac nhan du lieu tu CSDL chinh xac. Test E2E quy trinh chon thoi ky, hien thi, xuat PDF/Excel. Test dinh dang Mau B03/CCTT sau khi xuat.
