---
id: F-152
name: "Bieu 04-6T/N: Thong ke vung do/tra hieu, vung quay tro"
slug: bieu-04-6t-n-thong-ke-vung-do
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:33Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 04-6T/N: Thong ke vung do/tra hieu, vung quay tro

## Description
Bieu 04-6T/N bao gom thong ke vung do, tra hieu, va vung quay tro cua tau bien, bao gom thong tin ve dia diem, so luong tau, thoi gian neo, va hien trang su dung. He thong cho phep loc theo khoang thoi gian, dia diem, loai vung, va xuat ket qua ra PDF hoac Excel de bao cao.

## Business Intent
Chuyen vien thong ke giao thong duong bien can theo doi vung do, tra hieu, va vung quay tro theo quy dinh de lam co so quy hoach, quan ly va dieu chinh hoat dong van tai duong bien, bao ve an toan giao thong duong bien.

## Flow Summary
Nguoi dung dang nhap vao he thong, chon Bieu 04-6T/N, nhap cac tieu chi loc (nam, quy, thang, dia diem), he thong truy van du lieu ve vung do/tra hieu tu co so du lieu, hien thi ket qua tren man hinh dang bang va bieu do, nguoi dung co the xuat ra PDF hoac Excel theo yeu cau.

## Acceptance Criteria
- He thong hien thi duoc tat ca cac chi so thong ke vung do/tra hieu, vung quay tro theo Bieu 04-6T/N dung theo dinh dang quy dinh.
- Cho phep loc theo khoang thoi gian (nam/quy/thang), dia diem, loai vung.
- Xuat PDF va Excel hien thi du du lieu, dinh dang dung, co chu thich de tai va nguon du lieu.
- Hien thi bieu do minh hoa phan bo vung do/tra hieu theo vung bien.

## In Scope
- Thong ke vung do/tra hieu, vung quay tro theo Bieu 04-6T/N
- Loc theo thoi gian, dia diem, loai vung
- Xuat PDF/Excel
- Hien thi bieu do minh hoa
- Cap nhat thong tin hien trang

## Out of Scope
- Quan ly thong tin cang cap nhat theo thoi gian thuc
- Xac thuc nguoi dung (da co he thong xac thuc chung)
- Tu dong nhap du lieu tu nguon ben ngoai
- Bao cao so sanh chi tiet giua cac khu vuc khac nhau

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyen vien | Xem, Loc, Xuat PDF/Excel |
| Quan ly | Xem, Loc, Xuat, Xu ly phê duyêt |
| Quan tri he thong | Xem, Loc, Xuat, Cau hinh |

## API Endpoints
- `GET /api/v1/statistics/vung-do-04-6t-n` — Danh sach thong ke vung do/tra hieu, vung quay tro
- `GET /api/v1/statistics/vung-do-04-6t-n/export` — Xuat ket qua thong ke PDF/Excel
- `GET /api/v1/statistics/vung-do-04-6t-n/charts` — Lay du lieu bieu do thong ke
- `GET /api/v1/statistics/vung-do-04-6t-n/config` — Lay cau hinh bieu

## Architecture Notes
Du lieu thong ke duoc tinh toan tu cac bang vung_do, vung_quay_tro, va neo_dau. He thong su dung cau hoi SQL tinh toan truoc de tich chon, chi tra ve ket qua duoc chet. De xu ly luong du lieu lon, he thong pha split ket qua theo khoang thoi gian va dia diem, de hien thi phan trang. Cau hinh bieu duoc luu trong bang thiet lap_bieu, cho phep cap nhat dinh dang ma khong can sua code.

## Entities
- **VungDo**: id, ten_vung, dia_chi, toa_do, dien_tich, cap_vung, tinh_trang, created_at, updated_at
- **VungQuayTro**: id, ten_vung, dia_chi, toa_do, dien_tich, kha_nang_chua, created_at, updated_at
- **ThongKeVungDo04**: id, thang_nam, vung_id, so_tau_dung, thoi_gian_chinh_binh, created_at, updated_at

## Business Rules
1. Chi hien thi thong ke cho nhung khoang thoi gian co du lieu day du (tu thang/co_nuoc_den_thang/hien_tai).
2. Vung do/tra hieu co tinh_trang = 'hoat_dong' se duoc tinh vao tong vung hien co.
3. Ket qua xuat PDF/Excel phai theo dinh dang quy dinh bo cong thuong ban hanh.
4. Chi chuyen vien va quan ly moi co quyen xuat du lieu, nguoi xem chi co quyen hien thi.

## Testing Strategy
Test bang cach chay thuc don voi du lieu mau da xay dung truoc, kiem tra cac truong hop loc theo thoi gian khac nhau, xuat PDF/Excel voi du lieu nhieu/nhanh, hien thi bieu do voi day du lieu khac nhau, kiem tra quyen truy cap theo role, kiem tra dinh dang xuat theo quy dinh.
