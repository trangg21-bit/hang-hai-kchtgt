---
id: F-145
name: "Mau so 04: Bao cao tinh hinh xu ly tai san KCHT"
slug: mau-so-04-xu-ly-kcht
module-id: M-016
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:03Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Mau so 04: Bao cao tinh hinh xu ly tai san KCHT

## Description

Hien thi bao cao Mau so 04 ve tinh hinh xu ly tai san KCHT, bao gom cac tai san dang duoc xu ly, da xu ly, dang trong quy trinh xu ly theo cac muc phuc tap khac nhau.

## Business Intent

Ho tro quan ly theo doi tinh hinh xu ly tai san KCHT, bao cao co quan thanh ly, lam co so de quy hoach dau tu thay the tai san da xu ly, bao dam tinh trong sat cua quy trinh xu ly.

## Flow Summary

Chuyen vien chon thoi ky xu ly va don vi, he thong lay danh sach tai san dang xu ly tu CSDL, hien thi theo Mau so 04 voi tinh trang xu ly, chuyen vien xac nhan, xuat bao cao PDF/Excel de bao cao.

## Acceptance Criteria

1. Hien thi danh sach tai san theo tinh hinh xu ly theo Mau so 04
2. Bao cao hien thi du muc xu ly: dang xu ly, da xu ly, dang duyet
3. Xuat PDF/Excel thanh cong theo dinh dang quy dinh

## In Scope

- Hien thi danh sach tai san theo tinh hinh xu ly
- Xuat bao cao PDF/Excel theo dinh dang Mau so 04
- Loc theo don vi, loai xu ly, thoi ky
- Theo doi quy trinh xu ly tu khi de nghi den khi hoan thanh

## Out of Scope

- Khoi tao quy trinh xu ly tai san
- Duyet quy trinh xu ly
- Bao cao chi tieu nang cao ve xu ly

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem tinh hinh xu ly |
| Admin | Xem, Xuat, Xu ly, Xac nhan xu ly |

## API Endpoints

- `GET /api/reports/form-04` - Lay tinh hinh xu ly tai san theo Mau so 04
- `GET /api/reports/form-04/export-pdf` - Xuat bao cao dang PDF
- `GET /api/reports/form-04/export-excel` - Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API de lay du lieu xu ly tai san tu CSDL. Tich hop thu vien xuat PDF/Excel. Truycap vao bang Asset voi truong xu ly, tinh trang xu ly, thoi gian xu ly, nguoi xu ly.

## Entities

- **AssetDisposal**: id, assetCode, assetName, disposalType, status, reason, startDate, completionDate, processedBy
- **DisposalReport**: id, reportPeriod, pendingCount, completedCount, cancelledCount, totalProcessed

## Business Rules

1. Bao cao bao gom toan bo tai san da de nghi xu ly trong thoi ky
2. Tinh hinh xu ly bao gom 3 muc: dang xu ly, da xu ly, da huy
3. Tai san dang quy trinh duyet phai hien thi trang thai dang cho duyet
4. Quy trinh xu ly phai theo duong dan duyet quyen
5. Du lieu xu ly phai duoc cap nhat real-time

## Testing Strategy

Test don vi cho logic theo doi tinh hinh xu ly. Test tich hop xuat file PDF/Excel. Test E2E quy trinh xem, xac nhan, xuat bao cao tinh hinh xu ly tai san.
