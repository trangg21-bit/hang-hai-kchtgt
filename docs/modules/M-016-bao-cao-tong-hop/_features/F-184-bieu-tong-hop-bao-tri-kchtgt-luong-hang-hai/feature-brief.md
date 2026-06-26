---
id: F-184
name: "Bieu Tong hop bao tri KCHTGT - Luong hang hai"
slug: bieu-tong-hop-bao-tri-kchtgt-luong-hang-hai
module-id: M-016
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:49Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu Tong hop bao tri KCHTGT - Luong hang hai

## Description

Hien thi bao cao Bieu Tong hop bao tri KCHTGT - Luong hang hai, bao gom thong tin tong hop ve hoat dong bao tri luong hang hai theo don vi, tinh trang, chi phi, ke hoach va tieu doan, xuat PDF/Excel de bao cao so quan.

## Business Intent

Ho tro ban quan ly theo doi cac hoat dong bao tri luong hang hai KCHTGT theo don vi, tinh trang, lam co so de quy hoach ke hoach bao tri luong hang hai, phan bo nguon luc va bao cao so quan theo dinh ky.

## Flow Summary

Chuyen vien chon thoi ky bao cao, don vi quan ly, he thong lay du lieu bao tri luong hang hai tu CSDL, hien thi theo Bieu Tong hop bao tri KCHTGT - Luong hang hai, chuyen vien xac nhan du lieu, kiem tra so lieu va xuat bao cao PDF/Excel.

## Acceptance Criteria

1. Hien thi bao cao Tong hop bao tri KCHTGT - Luong hang hai voi du lieu chinh xac theo don vi
2. Bao cao hien thi du tinh trang bao tri, chi phi, ke hoach cho moi luong hang hai
3. Xuat PDF/Excel thanh cong voi dinh dang Bieu Tong hop bao tri KCHTGT - Luong hang hai

## In Scope

- Hien thi tong hop hoat dong bao tri luong hang hai theo don vi, tinh trang
- Xuat bao cao PDF/Excel theo dinh dang Bieu Tong hop bao tri KCHTGT - Luong hang hai
- Loc theo don vi, tinh trang, ke hoach bao tri
- Hien thi chi phi va ke hoach bao tri luong hang hai

## Out of Scope

- Cap nhap chi tiet ke hoach bao tri luong hang hai
- Tinh toan chi phi thuc te
- Bao cao chi tieu nang cao theo luong hang hai rieng

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao tong hop bao tri luong hang hai |
| Admin | Xem, Xuat, Xac nhan bao cao tong hop |

## API Endpoints

- `GET /api/v1/reports/summary-maintenance-seawalls` — Lay bao cao tong hop bao tri luong hang hai theo thoi ky
- `GET /api/v1/reports/summary-maintenance-seawalls/export-pdf` — Xuat bao cao dang PDF
- `GET /api/v1/reports/summary-maintenance-seawalls/export-excel` — Xuat bao cao dang Excel

## Architecture Notes

Su dung REST API GET /api/v1/reports/summary-maintenance-seawalls de lay du lieu bao tri luong hang hai tu CSDL Infrastructure voi truong structureType='seawall'. Tich hop Apache POI de xuat Excel va iText de xuat PDF. Du lieu duoc loc theo loai cong trinh luong hang hai, gom nhom theo don vi quan ly, tinh trang (ke hoach, dang thuc hien, hoan thanh, qua han). Chi phi bao tri duoc tinh theo don vi VND.

## Entities

- **SeawallMaintenance**: id, seawallCode, seawallName, maintenanceType, status[scheduled/in-progress/completed/overdue], cost, plannedDate, completedDate, department
- **SeawallMaintenanceReport**: id, reportPeriod, totalSeawalls, underMaintenance, completedCount, totalCost, generatedBy, generatedAt

## Business Rules

1. Bao cao bao gom toan bo luong hang hai KCHTGT trong don vi doan thoi gian chon
2. Tinh trang bao tri duoc phan loai: ke hoach, dang thuc hien, hoan thanh, qua han
3. Bao cao hien thi chi phi bao tri theo don vi
4. So lieu duoc cap nhat duoi 24h sau thao tac thay doi
5. Ban quan ly can xac nhan truoc khi xuat bao cao chinh thuc

## Testing Strategy

Test don vi cho logic gom hoat dong bao tri luong hang hai theo don vi, tinh trang. Test tich hop de xac nhan du lieu tu CSDL va xuat file PDF/Excel. Test E2E quy trinh chon thoi ky, hien thi, xac nhan, xuat bao cao Bieu Tong hop bao tri KCHTGT - Luong hang hai.
