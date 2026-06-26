---
id: F-189
name: "Bao cao tinh hinh hoat dong bao hieu hang hai va de, ke"
slug: bao-cao-tinh-hinh-hoat-dong-bao-hieu
module-id: M-016
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:49Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bao cao tinh hinh hoat dong bao hieu hang hai va de, ke

## Description

Hien thi bao cao tinh hinh hoat dong bao hieu hang hai va de, ke, bao gom tong hop cac thiet bi bao hieu theo don vi, tinh trang hoat dong, hoat dong bao tri, xuat PDF/Excel de bao cao so quan.

## Business Intent

Ho tro ban quan ly theo doi tinh hinh hoat dong cua cac thiet bi bao hieu hang hai va de, ke theo don vi, lam co so de quy hoach chinh sach bao tri, phan bo nguon luc, nang cap thiet bi va bao cao so quan theo dinh ky.

## Flow Summary

Chuyen vien chon don vi quan ly, thoi ky bao cao, loai thiet bi, he thong lay du lieu hoat dong bao hieu tu CSDL, hien thi tinh hinh hoat dong bao hieu hang hai va de, ke, chuyen vien xac nhan du lieu, kiem tra so lieu va xuat bao cao PDF/Excel.

## Acceptance Criteria

1. Hien thi bao cao tinh hinh hoat dong bao hieu hang hai va de, ke voi du lieu chinh xac theo don vi
2. Bao cao hien thi du loai thiet bi bao hieu, tinh trang hoat dong, don vi quan ly
3. Xuat PDF/Excel thanh cong voi dinh dang bao cao quy dinh

## In Scope

- Hien thi tinh hinh hoat dong bao hieu hang hai va de, ke theo don vi, loai thiet bi
- Xuat bao cao PDF/Excel theo dinh dang quy dinh
- Loc theo don vi, loai thiet bi, tinh trang hoat dong
- Hien thi thong tin tong hop theo don vi quan ly

## Out of Scope

- Cap nhap tinh trang hoat dong cua thiet bi bao hieu
- Kiem toan thiet bi bao hieu
- Bao cao chi tieu nang cao theo thiet bi rieng

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao tinh hinh hoat dong bao hieu |
| Admin | Xem, Xuat, Xac nhan bao cao tinh hinh |

## API Endpoints

- `GET /api/v1/reports/navigation-activity` — Lay bao cao tinh hinh hoat dong bao hieu hang hai va de, ke theo thoi ky
- `GET /api/v1/reports/navigation-activity/export-pdf` — Xuat bao cao dang PDF
- `GET /api/v1/reports/navigation-activity/export-excel` — Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API GET /api/v1/reports/navigation-activity de lay du lieu hoat dong bao hieu tu CSDL NavigationAid voi cac thiet bi bao hieu (den bien, phao tieu, de, ke, thap den...). Tich hop Apache POI de xuat Excel va iText de xuat PDF. Du lieu duoc loc theo loai thiet bi, don vi quan ly, tinh trang hoat dong (hoat dong binh thuong, co co, dang sua chua, nghi hoat dong). Thong ke theo don vi va tinh trang hoat dong.

## Entities

- **NavigationActivity**: id, aidCode, aidType, status[operational/faulty/under-maintenance/out-of-service], department, location, lastInspectionDate, nextInspectionDate
- **NavigationActivityReport**: id, reportPeriod, totalAids, operationalCount, faultyCount, underMaintenanceCount, outOfServiceCount, generatedBy, generatedAt

## Business Rules

1. Bao cao bao gom toan bo thiet bi bao hieu dang quan ly trong don vi doan thoi gian chon
2. Tinh trang hoat dong duoc phan loai: hoat dong binh thuong, co co, dang sua chua, nghi hoat dong
3. Bao cao hien thi so sanh theo don vi quan ly
4. So lieu duoc cap nhat duoi 24h sau thao tac thay doi
5. Ban quan ly can xac nhan truoc khi xuat bao cao chinh thuc

## Testing Strategy

Test don vi cho logic gom tinh hinh hoat dong bao hieu theo don vi, loai thiet bi, tinh trang. Test tich hop de xac nhan du lieu tu CSDL va xuat file PDF/Excel. Test E2E quy trinh chon thoi ky, hien thi, xac nhan, xuat bao cao tinh hinh hoat dong bao hieu hang hai va de, ke.
