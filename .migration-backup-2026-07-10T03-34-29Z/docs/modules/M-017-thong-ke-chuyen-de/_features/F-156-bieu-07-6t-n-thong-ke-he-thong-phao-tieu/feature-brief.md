---
id: F-156
name: "Bieu 07-6T/N: Thong ke he thong phao tieu"
slug: bieu-07-6t-n-thong-ke-he-thong-phao-tieu
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:33Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 07-6T/N: Thong ke he thong phao tieu

## Description
Bieu 07-6T/N bao gom thong ke he thong phao tieu, bao gom thong tin ve so luong phao tieu, dia diem, loai phao, trang thai hoat dong, va hien trang su dung. He thong cho phep loc theo khoang thoi gian, dia diem, loai phao, va xuat ket qua ra PDF hoac Excel de bao cao.

## Business Intent
Chuyen vien thong ke giao thong duong bien can theo doi he thong phao tieu theo quy dinh de lam co so quy hoach, quan ly, dau tu va nang caap he thong bao hieu an toan giao thong duong bien.

## Flow Summary
Nguoi dung dang nhap vao he thong, chon Bieu 07-6T/N, nhap cac tieu chi loc (nam, quy, thang, dia diem), he thong truy van du lieu ve he thong phao tieu tu co so du lieu, hien thi ket qua tren man hinh dang bang va bieu do, nguoi dung co the xuat ra PDF hoac Excel theo yeu cau.

## Acceptance Criteria
- He thong hien thi duoc tat ca cac chi so thong ke he thong phao tieu theo Bieu 07-6T/N dung theo dinh dang quy dinh.
- Cho phep loc theo khoang thoi gian (nam/quy/thang), dia diem, loai phao tieu.
- Xuat PDF va Excel hien thi du du lieu, dinh dang dung, co chu thich de tai va nguon du lieu.
- Hien thi bieu do minh hoa phan bo he thong phao tieu theo vung.

## In Scope
- Thong ke he thong phao tieu theo Bieu 07-6T/N
- Loc theo thoi gian, dia diem, loai phao tieu
- Xuat PDF/Excel
- Hien thi bieu do minh hoa
- Cap nhat thong tin hien trang

## Out of Scope
- Quan ly thong tin cang cap nhat theo thoi gian thuc
- Xac thuc nguoi dung (da co he thong xac thuc chung)
- Tu dong nhap du lieu tu nguon ben ngoai
- Bao cao so sanh chi tiet giua cac loai phao tieu rieng le

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyen vien | Xem, Loc, Xuat PDF/Excel |
| Quan ly | Xem, Loc, Xuat, Xu ly phê duyêt |
| Quan tri he thong | Xem, Loc, Xuat, Cau hinh |

## API Endpoints
- `GET /api/v1/statistics/phao-tieu-07-6t-n` — Danh sach thong ke he thong phao tieu
- `GET /api/v1/statistics/phao-tieu-07-6t-n/export` — Xuat ket qua thong ke PDF/Excel
- `GET /api/v1/statistics/phao-tieu-07-6t-n/charts` — Lay du lieu bieu do thong ke
- `GET /api/v1/statistics/phao-tieu-07-6t-n/config` — Lay cau hinh bieu

## Architecture Notes
Du lieu thong ke duoc tinh toan tu cac bang phao_tieu, vung_phao, va hien_trang_phao. He thong su dung cau hoi SQL tinh toan truoc de tich chon, chi tra ve ket qua duoc chet. De xu ly luong du lieu lon, he thong pha split ket qua theo khoang thoi gian va dia diem, de hien thi phan trang. Cau hinh bieu duoc luu trong bang thiet lap_bieu, cho phep cap nhat dinh dang ma khong can sua code.

## Entities
- **PhaoTieu**: id, ten_phao, dia_chi, toa_do, loai_phao, kich_thuoc, trang_thai, created_at, updated_at
- **VungPhao**: id, ten_vung, dia_chi, dien_tich, so_phao_trong_vung, created_at, updated_at
- **ThongKePhaoTieu07**: id, thang_nam, vung, tong_phao, phao_hoat_dong, phao_huong_dan, created_at, updated_at

## Business Rules
1. Chi hien thi thong ke cho nhung khoang thoi gian co du lieu day du (tu thang/co_nuoc_den_thang/hien_tai).
2. Phao tieu co trang_thai = 'hoat_dong' se duoc tinh vao tong phao hien co.
3. Ket qua xuat PDF/Excel phai theo dinh dang quy dinh bo cong thuong ban hanh.
4. Chi chuyen vien va quan ly moi co quyen xuat du lieu, nguoi xem chi co quyen hien thi.

## Testing Strategy
Test bang cach chay thuc don voi du lieu mau da xay dung truoc, kiem tra cac truong hop loc theo thoi gian khac nhau, xuat PDF/Excel voi du lieu nhieu/nhanh, hien thi bieu do voi day du lieu khac nhau, kiem tra quyen truy cap theo role, kiem tra dinh dang xuat theo quy dinh.
