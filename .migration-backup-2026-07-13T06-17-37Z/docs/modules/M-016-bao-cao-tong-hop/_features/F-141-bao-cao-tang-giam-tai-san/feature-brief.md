---
id: F-141
name: "Bao cao tang giam tai san"
slug: bao-cao-tang-giam-tai-san
module-id: M-016
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:03Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bao cao tang giam tai san

## Description

Hien thi bao cao tang giam tai san theo thoi ky, bao gom chi tiet cac tai san tang them, giam di hoac chuyen giao, xuat PDF/Excel de bao cao co quan quan ly.

## Business Intent

Tang cuong nang luc quan ly, bao cao tai san KCHTGT theo dinh ky, giup quan ly co du lieu phan tich xu huong tang giam tai san, lam co so de quy hoach dau tu va phan bo nguon luc hieu qua.

## Flow Summary

Chuyen vien chon thoi ky bao cao (thang/quy/nam) he thong lay du lieu tu cac tai san dang quan ly, tinh toan so lieu tang giam, hien thi tren man hinh, chuyen vien xac nhan va xuat bao cao PDF/Excel de bao cao so quan.

## Acceptance Criteria

1. Hien thi bao cao tang giam tai san thanh cong theo thoi ky chon
2. Xuat PDF/Excel thanh cong voi du lieu chinh xac
3. Bao cao hien thi du cac tai san tang, giam va thong ke tong hop

## In Scope

- Hien thi danh sach tai san tang giam theo thoi ky
- Xuat bao cao PDF/Excel
- Loc theo loai tai san va khu vuc
- Tinh toan so lieu thong ke tong hop
- Hien thi thong tin tai san chi tiet

## Out of Scope

- Cap nhap du lieu tai san (thuoc module quan ly tai san)
- Phan tich xu huong nang cao
- Tu dong bao cao theo dinh ky

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem, Xuat bao cao |
| Admin | Xem, Xuat, Doi tuong bao cao |

## API Endpoints

- `GET /api/reports/asset-change` - Lay danh sach bao cao tang giam tai san theo thoi ky
- `GET /api/reports/asset-change/{id}` - Xem chi tiet bao cao tang giam tai san
- `GET /api/reports/asset-change/export-pdf` - Xuat bao cao tang giam tai san dang PDF
- `GET /api/reports/asset-change/export-excel` - Xuat bao cao tang giam tai san dang Excel

## Architecture Notes

Su dung REST API GET /api/reports/asset-change de lay du lieu tu co so du lieu. Tich hop thu vien Apache POI de xuat Excel va iText de xuat PDF. Du lieu duoc truy xuat tu bang Asset voi truong status va transaction_log de tinh toan so lieu.

## Entities

- **AssetReport**: id, assetName, assetType, changeType[increase/decrease/transfer], quantity, date, createdBy, createdAt
- **ChangeCategory**: id, categoryName, description, totalAssets

## Business Rules

1. Bao cao chi hien thi tai san da duoc xac thuc va o trang thai hoat dong
2. So lieu tang giam duoc tinh theo thoi ky doan thoi gian chon
3. Moi thay doi tai san (tang/giam/chuyen giao) phai duoc ghi nhan trong logs
4. Bao cao phai bao gom du 3 loai: tai tang, tai giam, va thong ke tong hop
5. Ban chi thich duoc xuat sau khi du lieu da duoc xac thuc

## Testing Strategy

Test don vi cho logic tinh toan so lieu tang giam. Test tich hop de kiem tra lay du lieu tu CSDL va xuat file PDF/Excel. Test E2E voi ca quy trinh chon thoi ky, hien thi, xuat bao cao.
