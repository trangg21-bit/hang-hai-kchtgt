---
id: F-161
name: "Bieu 11-T: Bao cao chi tiet tau bien ra vao cang"
slug: bieu-11-t-bao-cao-chi-tiet-tau-bien
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:42:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 11-T: Bao cao chi tiet tau bien ra vao cang

## Description
Bieu 11-T bao gom bao cao chi tiet tau bien ra vao cang, bao gom thong tin ve ma tau, ten tau, loai tau, ngay vao/ra, kha nang tai, hang hoa van chuyen, va dia diem den. He thong cho phep loc theo khoang thoi gian, dia diem, loai tau, va xuat ket qua ra PDF hoac Excel de bao cao.

## Business Intent
Chuyen vien thong ke giao thong duong bien can theo doi tau bien ra vao cang theo quy dinh de lam co so quan ly, dieu khien va dua ra quyet dinh chieu chinh sach van tai duong bien.

## Flow Summary
Nguoi dung dang nhap vao he thong, chon Bieu 11-T, nhap cac tieu chi loc (nam, quy, thang, dia diem cang), he thong truy van du lieu ve tau bien ra vao cang tu co so du lieu, hien thi ket qua chi tiet tren man hinh dang bang, nguoi dung co the xuat ra PDF hoac Excel theo yeu cau.

## Acceptance Criteria
- He thong hien thi duoc bao cao chi tiet tau bien ra vao cang theo Bieu 11-T dung theo dinh dang quy dinh.
- Cho phep loc theo khoang thoi gian (nam/quy/thang), dia diem cang, loai tau.
- Xuat PDF va Excel hien thi du du lieu, dinh dang dung, co chu thich de tai va nguon du lieu.
- Hien thi bieu do minh hoa xu thuong tau bien ra vao cang theo thoi gian.

## In Scope
- Bao cao chi tiet tau bien ra vao cang theo Bieu 11-T
- Loc theo thoi gian, dia diem cang, loai tau
- Xuat PDF/Excel
- Hien thi bieu do minh hoa
- Chi tiet thong tin tau bien

## Out of Scope
- Quan ly thong tin cang cap nhat theo thoi gian thuc
- Xac thuc nguoi dung (da co he thong xac thuc chung)
- Tu dong nhap du lieu tu nguon ben ngoai
- Bao cao so sanh chi tiet giua cac loai tau rieng le

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyen vien | Xem, Loc, Xuat PDF/Excel |
| Quan ly | Xem, Loc, Xuat, Xu ly phê duyêt |
| Quan tri he thong | Xem, Loc, Xuat, Cau hinh |

## API Endpoints
- `GET /api/v1/statistics/tau-ra-vao-11-t` — Danh sach bao cao chi tiet tau bien ra vao cang
- `GET /api/v1/statistics/tau-ra-vao-11-t/export` — Xuat ket qua thong ke PDF/Excel
- `GET /api/v1/statistics/tau-ra-vao-11-t/charts` — Lay du lieu bieu do thong ke
- `GET /api/v1/statistics/tau-ra-vao-11-t/config` — Lay cau hinh bieu

## Architecture Notes
Du lieu thong ke duoc tinh toan tu cac bang tau_bien, luot_tau_vao_ra, hang_hoa_xu_ly, va cang_bien. He thong su dung cau hoi SQL tinh toan truoc de tich chon, chi tra ve ket qua duoc chet. De xu ly luong du lieu lon, he thong pha split ket qua theo khoang thoi gian va dia diem, de hien thi phan trang. Cau hinh bieu duoc luu trong bang thiet lap_bieu, cho phep cap nhat dinh dang ma khong can sua code.

## Entities
- **TauBien**: id, ma_tau, ten_tau, loai_tau, kha_nang_tai, hang_so_huu, quoc_tich, created_at, updated_at
- **LuotTauVaoRa**: id, tau_id, cang_id, ngay_vao, ngay_ra, loai_tau, khoi_luong, trang_thai, created_at, updated_at
- **BaoCaoTauRaVao11T**: id, thang_nam, cang_id, tong_tau_vao, tong_tau_ra, tong_khoi_luong, created_at, updated_at

## Business Rules
1. Chi hien thi thong ke cho nhung khoang thoi gian co du lieu day du (tu thang/co_nuoc_den_thang/hien_tai).
2. Luot tau duoc tinh khi co du ngay_vao va ngay_ra trong khoang thoi gian chon.
3. Ket qua xuat PDF/Excel phai theo dinh dang quy dinh bo cong thuong ban hanh.
4. Chi chuyen vien va quan ly moi co quyen xuat du lieu, nguoi xem chi co quyen hien thi.

## Testing Strategy
Test bang cach chay thuc don voi du lieu mau da xay dung truoc, kiem tra cac truong hop loc theo thoi gian khac nhau, xuat PDF/Excel voi du lieu nhieu/nhanh, hien thi bieu do voi day du lieu khac nhau, kiem tra quyen truy cap theo role, kiem tra dinh dang xuat theo quy dinh.
