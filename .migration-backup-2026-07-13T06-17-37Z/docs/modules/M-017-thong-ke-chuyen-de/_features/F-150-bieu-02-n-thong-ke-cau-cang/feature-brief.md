---
id: F-150
name: "Bieu 02-N: Thong ke cau cang"
slug: bieu-02-n-thong-ke-cau-cang
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:03Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 02-N: Thong ke cau cang

## Description
Bieu 02-N bao gom thong ke ve caisang va cau cang, bao gom thong tin ve so luong, kich thuoc, kha nang xu ly, va hien trang su dung. He thong cho phep loc theo khoang thoi gian, dia diem, loai cau cang, va xuat ket qua ra PDF hoac Excel de bao cao.

## Business Intent
Chuyen vien thong ke giao thong duong bien can thu thap va bao cao thong tin ve caisang cau cang theo quy dinh de lam co so quy hoach dau tu, nang caap he thong ha tang giao thong duong bien.

## Flow Summary
Nguoi dung dang nhap vao he thong, chon Bieu 02-N, nhap cac tieu chi loc (nam, quy, thang, dia diem), he thong truy van du lieu ve caisang cau cang tu co so du lieu, hien thi ket qua tren man hinh dang bang va bieu do, nguoi dung co the xuat ra PDF hoac Excel theo yeu cau.

## Acceptance Criteria
- He thong hien thi duoc tat ca cac chi so thong ke caisang cau cang theo Bieu 02-N dung theo dinh dang quy dinh.
- Cho phep loc theo khoang thoi gian (nam/quy/thang), dia diem, loai cau cang.
- Xuat PDF va Excel hien thi du du lieu, dinh dang dung, co chu thich de tai va nguon du lieu.
- Hien thi bieu do minh hoa phan bo caisang cau cang theo vung.

## In Scope
- Thong ke caisang cau cang theo Bieu 02-N
- Loc theo thoi gian, dia diem, loai cau cang
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
- `GET /api/v1/statistics/cau-cang-02-n` — Danh sach thong ke caisang cau cang
- `GET /api/v1/statistics/cau-cang-02-n/export` — Xuat ket qua thong ke PDF/Excel
- `GET /api/v1/statistics/cau-cang-02-n/charts` — Lay du lieu bieu do thong ke
- `GET /api/v1/statistics/cau-cang-02-n/config` — Lay cau hinh bieu

## Architecture Notes
Du lieu thong ke duoc tinh toan tu cac bang cau_cang, caisang_cang, va hien_trang_cang. He thong su dung cau hoi SQL tinh toan truoc de tich chon, chi tra ve ket qua duoc chet. De xu ly luong du lieu lon, he thong pha split ket qua theo khoang thoi gian va dia diem, de hien thi phan trang. Cau hinh bieu duoc luu trong bang thiet lap_bieu, cho phep cap nhat dinh dang ma khong can sua code.

## Entities
- **CauCang**: id, ten_cang, dia_chi, vung, kich_thuoc, so_ca_lam_viec, tinh_trang, created_at, updated_at
- **CaisangCang**: id, caisang_id, loai_caisang, kha_nang_xu_ly, trang_thai, created_at, updated_at
- **ThongKeCauCang02**: id, thang_nam, vung, tong_caisang, caisang_hoat_dong, caisang_dang_sua_chua, created_at, updated_at

## Business Rules
1. Chi hien thi thong ke cho nhung khoang thoi gian co du lieu day du (tu thang/co_nuoc_den_thang/hien_tai).
2. Cau cang co tinh_trang = 'hoat_dong' se duoc tinh vao tong caisang hien co.
3. Ket qua xuat PDF/Excel phai theo dinh dang quy dinh bo cong thuong ban hanh.
4. Chi chuyen vien va quan ly moi co quyen xuat du lieu, nguoi xem chi co quyen hien thi.

## Testing Strategy
Test bang cach chay thuc don voi du lieu mau da xay dung truoc, kiem tra cac truong hop loc theo thoi gian khac nhau, xuat PDF/Excel voi du lieu nhieu/nhanh, hien thi bieu do voi day du lieu khac nhau, kiem tra quyen truy cap theo role, kiem tra dinh dang xuat theo quy dinh.
