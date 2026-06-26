---
id: F-153
name: "Bieu 04B-N: Thong ke khu chuyen tai, khu neo dau"
slug: bieu-04b-n-thong-ke-khu-chuyen-tai
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:33Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 04B-N: Thong ke khu chuyen tai, khu neo dau

## Description
Bieu 04B-N bao gom thong ke khu chuyen tai, khu neo dau, bao gom thong tin ve dia diem, so luong tau, kha nang xu ly, va hien trang su dung. He thong cho phep loc theo khoang thoi gian, dia diem, loai khu, va xuat ket qua ra PDF hoac Excel de bao cao.

## Business Intent
Chuyen vien thong ke giao thong duong bien can theo doi khu chuyen tai, khu neo dau theo quy dinh de lam co so quy hoach, quan ly va dieu chinh hoat dong van tai duong bien, bao ve an toan giao thong duong bien.

## Flow Summary
Nguoi dung dang nhap vao he thong, chon Bieu 04B-N, nhap cac tieu chi loc (nam, quy, thang, dia diem), he thong truy van du lieu ve khu chuyen tai, khu neo dau tu co so du lieu, hien thi ket qua tren man hinh dang bang va bieu do, nguoi dung co the xuat ra PDF hoac Excel theo yeu cau.

## Acceptance Criteria
- He thong hien thi duoc tat ca cac chi so thong ke khu chuyen tai, khu neo dau theo Bieu 04B-N dung theo dinh dang quy dinh.
- Cho phep loc theo khoang thoi gian (nam/quy/thang), dia diem, loai khu.
- Xuat PDF va Excel hien thi du du lieu, dinh dang dung, co chu thich de tai va nguon du lieu.
- Hien thi bieu do minh hoa phan bo khu chuyen tai, khu neo dau theo vung.

## In Scope
- Thong ke khu chuyen tai, khu neo dau theo Bieu 04B-N
- Loc theo thoi gian, dia diem, loai khu
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
- `GET /api/v1/statistics/khu-chuyen-tai-04b-n` — Danh sach thong ke khu chuyen tai, khu neo dau
- `GET /api/v1/statistics/khu-chuyen-tai-04b-n/export` — Xuat ket qua thong ke PDF/Excel
- `GET /api/v1/statistics/khu-chuyen-tai-04b-n/charts` — Lay du lieu bieu do thong ke
- `GET /api/v1/statistics/khu-chuyen-tai-04b-n/config` — Lay cau hinh bieu

## Architecture Notes
Du lieu thong ke duoc tinh toan tu cac bang khu_chuyen_tai, khu_neo_dau, va neo_dau_thoi_gian. He thong su dung cau hoi SQL tinh toan truoc de tich chon, chi tra ve ket qua duoc chet. De xu ly luong du lieu lon, he thong pha split ket qua theo khoang thoi gian va dia diem, de hien thi phan trang. Cau hinh bieu duoc luu trong bang thiet lap_bieu, cho phep cap nhat dinh dang ma khong can sua code.

## Entities
- **KhuChuyenTai**: id, ten_khu, dia_chi, toa_do, dien_tich, kha_nang_chua, tinh_trang, created_at, updated_at
- **KhuNeoDau**: id, ten_khu, dia_chi, toa_do, dien_tich, do_sau, created_at, updated_at
- **ThongKeKhuChuyenTai04B**: id, thang_nam, vung, tong_khu, khu_hoat_dong, khu_ngung_hoat_dong, created_at, updated_at

## Business Rules
1. Chi hien thi thong ke cho nhung khoang thoi gian co du lieu day du (tu thang/co_nuoc_den_thang/hien_tai).
2. Khu chuyen tai, khu neo dau co tinh_trang = 'hoat_dong' se duoc tinh vao tong khu hien co.
3. Ket qua xuat PDF/Excel phai theo dinh dang quy dinh bo cong thuong ban hanh.
4. Chi chuyen vien va quan ly moi co quyen xuat du lieu, nguoi xem chi co quyen hien thi.

## Testing Strategy
Test bang cach chay thuc don voi du lieu mau da xay dung truoc, kiem tra cac truong hop loc theo thoi gian khac nhau, xuat PDF/Excel voi du lieu nhieu/nhanh, hien thi bieu do voi day du lieu khac nhau, kiem tra quyen truy cap theo role, kiem tra dinh dang xuat theo quy dinh.
