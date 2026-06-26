---
id: F-151
name: "Bieu 03-Q/N: Thong ke luong hang hai"
slug: bieu-03-q-n-thong-ke-luong-hang-hai
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:33Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 03-Q/N: Thong ke luong hang hai

## Description
Bieu 03-Q/N bao gom thong ke luong hang hai duoc van tai theo duong bien, bao gom thong tin ve so luong, khoi luong, loai hang hoa, va duong di. He thong cho phep loc theo khoang thoi gian, dia diem, loai hang hoa, va xuat ket qua ra PDF hoac Excel de bao cao.

## Business Intent
Chuyen vien thong ke giao thong duong bien can theo doi luong hang hai duoc van tai theo duong bien theo quy dinh de lam co so dua ra quyet dinh chieu chinh sach phat trian caisang, dau tu va quy hoach hoat dong van tai duong bien.

## Flow Summary
Nguoi dung dang nhap vao he thong, chon Bieu 03-Q/N, nhap cac tieu chi loc (nam, quy, thang, dia diem), he thong truy van du lieu luong hang hai tu co so du lieu, tinh toan cac chi so thong ke, hien thi ket qua tren man hinh dang bang va bieu do, nguoi dung co the xuat ra PDF hoac Excel theo yeu cau.

## Acceptance Criteria
- He thong hien thi duoc tat ca cac chi so thong ke luong hang hai theo Bieu 03-Q/N dung theo dinh dang quy dinh.
- Cho phep loc theo khoang thoi gian (nam/quy/thang), dia diem, loai hang hoa.
- Xuat PDF va Excel hien thi du du lieu, dinh dang dung, co chu thich de tai va nguon du lieu.
- Hien thi bieu do minh hoa xu thuong luong hang hai theo thoi gian.

## In Scope
- Thong ke luong hang hai duong bien theo Bieu 03-Q/N
- Loc theo thoi gian, dia diem, loai hang hoa
- Xuat PDF/Excel
- Hien thi bieu do minh hoa
- Ghi nhan xu thuong van tai

## Out of Scope
- Quan ly thong tin cang cap nhat theo thoi gian thuc
- Xac thuc nguoi dung (da co he thong xac thuc chung)
- Tu dong nhap du lieu tu nguon ben ngoai
- Bao cao so sanh chi tiet giua cac loai hang hoa rieng le

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyen vien | Xem, Loc, Xuat PDF/Excel |
| Quan ly | Xem, Loc, Xuat, Xu ly phê duyêt |
| Quan tri he thong | Xem, Loc, Xuat, Cau hinh |

## API Endpoints
- `GET /api/v1/statistics/luong-hang-hai-03` — Danh sach thong ke luong hang hai duong bien
- `GET /api/v1/statistics/luong-hang-hai-03/export` — Xuat ket qua thong ke PDF/Excel
- `GET /api/v1/statistics/luong-hang-hai-03/charts` — Lay du lieu bieu do thong ke
- `GET /api/v1/statistics/luong-hang-hai-03/config` — Lay cau hinh bieu

## Architecture Notes
Du lieu thong ke duoc tinh toan tu cac bang luong_hang_hai, tau_van_tai, va duong_di. He thong su dung cau hoi SQL tinh toan truoc de tich chon, chi tra ve ket qua duoc chet. De xu ly luong du lieu lon, he thong pha split ket qua theo khoang thoi gian va dia diem, de hien thi phan trang. Cau hinh bieu duoc luu trong bang thiet lap_bieu, cho phep cap nhat dinh dang ma khong can sua code.

## Entities
- **LuongHangHai**: id, loai_hang_hoa, khoi_luong, don_vi_tinh, ngay_van_tai, nguon, dich_den, created_at, updated_at
- **TauVanTai**: id, ma_tau, loai_tau, kha_nang_xu_ly, hang_so_huu, created_at, updated_at
- **ThongKeLuongHangHai03**: id, thang_nam, loai_hang_hoa, tong_khoi_luong, so_luot_tau, created_at, updated_at

## Business Rules
1. Chi hien thi thong ke cho nhung khoang thoi gian co du lieu day du (tu thang/co_nuoc_den_thang/hien_tai).
2. Khoi luong duoc chuyen doi sang don vi tan khi xuat thong ke.
3. Ket qua xuat PDF/Excel phai theo dinh dang quy dinh bo cong thuong ban hanh.
4. Chi chuyen vien va quan ly moi co quyen xuat du lieu, nguoi xem chi co quyen hien thi.

## Testing Strategy
Test bang cach chay thuc don voi du lieu mau da xay dung truoc, kiem tra cac truong hop loc theo thoi gian khac nhau, xuat PDF/Excel voi du lieu nhieu/nhanh, hien thi bieu do voi day du lieu khac nhau, kiem tra quyen truy cap theo role, kiem tra dinh dang xuat theo quy dinh.
