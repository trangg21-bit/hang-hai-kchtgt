---
id: F-147
name: "Mau so 06: Tong hop danh muc TS KCHTGT de nghi xu ly"
slug: mau-so-06-tong-hop-danh-muc-kchtgt
module-id: M-016
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:03Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Mau so 06: Tong hop danh muc TS KCHTGT de nghi xu ly

## Description

Hien thi bao cao Mau so 06 tong hop danh muc tai san KCHTGT de nghi xu ly thanh ly, bao gom thong tin chi tiet ve tai san dang trong quy trinh de nghi, da duyet, da thanh ly theo don vi, loai tai san va khu vuc.

## Business Intent

Ho tro quan ly theo doi quy trinh xu ly thanh ly tai san KCHTGT, bao cao co quan thanh ly, lam co so de quy hoach dau tu thay the, bao dam tinh trong sat cua quy trinh thanh ly va su dung hieu qua tai san.

## Flow Summary

Chuyen vien chon don vi quan ly, thoi ky bao cao, hien trang xu ly, he thong lay danh sach tai san de nghi xu ly tu CSDL, hien thi theo Mau so 06 voi tinh trang xu ly, chuyen vien xac nhan du lieu, kiem tra so lieu va xuat bao cao PDF/Excel.

## Acceptance Criteria

1. Hien thi danh sach tai san de nghi xu ly theo Mau so 06 thanh cong
2. Bao cao hien thi du tinh trang: dang de nghi, dang duyet, da duyet, da thanh ly
3. Xuat PDF/Excel thanh cong voi dinh dang Mau so 06

## In Scope

- Hien thi danh sach tai san de nghi xu ly theo tinh trang
- Xuat bao cao PDF/Excel theo dinh dang Mau so 06
- Loc theo don vi, loai tai san, tinh trang xu ly, thoi ky
- Theo doi quy trinh xu ly tu khi de nghi den khi hoan thanh

## Out of Scope

- Khoi tao quy trinh de nghi thanh ly tai san
- Duyet quy trinh de nghi thanh ly
- Bao cao chi tieu nang cao ve thanh ly

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem danh sach tai san de nghi |
| Admin | Xem, Xuat, Xac nhan, Xu ly de nghi |

## API Endpoints

- `GET /api/v1/reports/form-06` — Lay danh sach tai san de nghi xu ly theo thoi ky
- `GET /api/v1/reports/form-06/export-pdf` — Xuat bao cao dang PDF
- `GET /api/v1/reports/form-06/export-excel` — Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API GET /api/v1/reports/form-06 de lay du lieu danh muc tai san de nghi xu ly tu CSDL Asset voi truong disposalStatus, disposalReason, disposalDate. Tich hop Apache POI de xuat Excel va iText de xuat PDF. Du lieu duoc loc theo tinh trang xu ly, don vi quan ly, thoi ky bao cao. Ket qua gom the tinh trang: dang de nghi, dang duyet, da duyet, da thanh ly.

## Entities

- **AssetDisposalRequest**: id, assetCode, assetName, assetType, disposalStatus[pending/approved/completed/cancelled], reason, department, location, requestDate, approvalDate
- **DisposalRequestReport**: id, reportPeriod, pendingCount, approvedCount, completedCount, cancelledCount, totalDisposal, generatedBy, generatedAt

## Business Rules

1. Bao cao bao gom toan bo tai san de nghi xu ly trong thoi ky doan thoi gian chon
2. Tinh trang xu ly bao gom 4 muc: dang de nghi, dang duyet, da duyet, da thanh ly
3. Tai san dang quy trinh duyet phai hien thi trang thai dang cho duyet
4. Quy trinh xu ly phai theo duong dan duyet quyen
5. Ban quan ly can xac nhan truoc khi xuat bao cao chinh thuc

## Testing Strategy

Test don vi cho logic theo doi tinh trang quy trinh de nghi xu ly. Test tich hop xuat file PDF/Excel. Test E2E quy trinh xem, xac nhan, xuat bao cao danh muc tai san de nghi.
