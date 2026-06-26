---
id: F-180
name: "Bieu Tong hop thong tin chung"
slug: bieu-tong-hop-thong-tin-chung
module-id: M-016
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:24Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu Tong hop thong tin chung

## Description

Hien thi bao cao Bieu Tong hop thong tin chung, bao gom toan bo thong tin tong hop ve tai san, cong trinh, dich vu van tai, hoat dong bao hieu, luong hang hoa theo don vi, thoi ky, xuat PDF/Excel de bao cao so quan.

## Business Intent

Ho tro ban quan ly xem toan Canh tinh hinh hoat dong cua don vi trong mot bao cao tong hop duy nhat, lam co so de phat hien van de, quy hoach dau tu, phan bo nguon luc va bao cao so quan theo dinh ky.

## Flow Summary

Chuyen vien chon thoi ky bao cao (thang/quy/nam), don vi quan ly, he thong lay du lieu tong hop tu cac module tai san, cong trinh, dich vu van tai, hoat dong bao hieu, hien thi theo Bieu Tong hop, chuyen vien xac nhan du lieu, kiem tra so lieu va xuat bao cao PDF/Excel.

## Acceptance Criteria

1. Hien thi bao cao Tong hop thong tin chung voi du lieu chinh xac tu cac module lien quan
2. Bao cao hien thi du cac phan: tai san, cong trinh, dich vu van tai, hoat dong bao hieu
3. Xuat PDF/Excel thanh cong voi dinh dang Bieu Tong hop theo quy dinh

## In Scope

- Hien thi tong hop thong tin tu cac module: tai san, cong trinh, dich vu van tai, hoat dong bao hieu
- Xuat bao cao PDF/Excel theo dinh dang Bieu Tong hop
- Loc theo don vi quan ly, thoi ky, phan loai thong tin
- Hien thi so lieu tong hop theo don vi va thoi ky

## Out of Scope

- Cap nhap thong tin chi tiet tu tung module
- Theo doi chi tiet tung co so du lieu
- Bao cao chi tieu nang cao theo don vi con

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao tong hop |
| Admin | Xem, Xuat, Xac nhan bao cao tong hop |

## API Endpoints

- `GET /api/v1/reports/summary-general` — Lay bao cao tong hop thong tin chung theo thoi ky
- `GET /api/v1/reports/summary-general/export-pdf` — Xuat bao cao dang PDF
- `GET /api/v1/reports/summary-general/export-excel` — Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API GET /api/v1/reports/summary-general de lay du lieu tong hop tu nhieu module: Asset, Infrastructure, TransportService, NavigationAid. Tich hop Apache POI de xuat Excel va iText de xuat PDF. Du lieu duoc truy xuat tu nhieu bang CSDL, gom nhom theo don vi quan ly, thoi ky bao cao, phan loai thong tin. Hien thi he so thong ke toan bo trong mot bang tong hop duy nhat.

## Entities

- **GeneralSummary**: id, period, department, assetCount, projectCount, transportVolume, navigationAidCount, reportGeneratedAt
- **DepartmentSummary**: id, departmentCode, totalAssets, activeProjects, transportServices, navigationAids, lastUpdated

## Business Rules

1. Bao cao bao gom thong tin tu tat ca cac module: tai san, cong trinh, dich vu van tai, hoat dong bao hieu
2. Thoi ky bao cao phai duoc chon truoc khi hien thi
3. Don vi quan ly phai co du liee de bao cao trong thoi ky doan thoi gian chon
4. So lieu duoc cap nhat duoi 24h sau thao tac thay doi
5. Ban quan ly can xac nhan truoc khi xuat bao cao chinh thuc

## Testing Strategy

Test don vi cho logic gom thong tin tu nhieu module. Test tich hop de xac nhan du lieu tu CSDL va xuat file PDF/Excel. Test E2E quy trinh chon thoi ky, hien thi, xac nhan, xuat bao cao Bieu Tong hop thong tin chung.
