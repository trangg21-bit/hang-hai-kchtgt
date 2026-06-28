---
id: F-148
name: "Bieu 01-N: Nang luc thong qua ben cang, cau cang"
slug: bieu-01-n-nang-luc-ben-cang-cau-cang
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:03Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 01-N: Nang luc thong qua ben cang, cau cang

## Description
Bieu 01-N bao gom thong ke nang luc thong qua tai ben cang va cau cang, bao gom cong sua, kha nang xu ly hang hoa va hanh khach theo don vi thoi gian. He thong cho phep loc theo khoang thoi gian, dia diem, loai ben cang, va xuat ket qua ra PDF hoac Excel de bao cao.

## Business Intent
Chuyen vien thong ke giao thong duong bien can theo doi nang luc thong qua tai ben cang, cau cang theo quy dinh de lam co so dua ra quyet dinh chieu chinh sach phat trian caisang, dau tu va quy hoach hoat dong van tai duong bien.

## Flow Summary
Nguoi dung dang nhap vao he thong, chon Bieu 01-N, nhap cac tieu chi loc (nam, quy, thang, dia diem cang), he thong truy van du lieu tu co so du lieu, tinh toan cac chi so thong ke nang luc thong qua, hien thi ket qua tren man hinh dang bang va bieu do, nguoi dung co the xuat ra PDF hoac Excel theo yeu cau.

## Acceptance Criteria
- He thong hien thi duoc tat ca cac chi so thong ke nang luc thong qua tai ben cang theo Bieu 01-N dung theo dinh dang quy dinh.
- Cho phep loc theo khoang thoi gian (nam/quy/thang), dia diem cang, loai ben cang, va loai hang hoa.
- Xuat PDF va Excel hien thi du du lieu, dinh dang dung, co chu thich de tai va nguon du lieu.
- Hien thi bieu do minh hoa xu thuong nang luc thong qua theo thoi gian.

## In Scope
- Thong ke nang luc thong qua ben cang theo Bieu 01-N
- Loc theo thoi gian, dia diem, loai cang
- Xuat PDF/Excel
- Hien thi bieu do minh hoa
- Ghi nhan thay doi thong ke theo quy

## Out of Scope
- Quan ly thong tin cang cap nhat theo thoi gian thuc
- Xac thuc nguoi dung (da co he thong xac thuc chung)
- Tu dong nhap du lieu tu nguon ben ngoai
- Bao cao so sanh giua cac khu vuc khac nhau

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyen vien | Xem, Loc, Xuat PDF/Excel |
| Quan ly | Xem, Loc, Xuat, Xu ly phê duyêt |
| Quan tri he thong | Xem, Loc, Xuat, Cau hinh |

## API Endpoints
- `GET /api/v1/statistics/bien-cap-01-n` — Danh sach thong ke nang luc thong qua ben cang, cau cang
- `GET /api/v1/statistics/bien-cap-01-n/export` — Xuat ket qua thong ke PDF/Excel
- `GET /api/v1/statistics/bien-cap-01-n/charts` — Lay du lieu bieu do thong ke
- `GET /api/v1/statistics/bien-cap-01-n/config` — Lay cau hinh bieu

## Architecture Notes
Du lieu thong ke duoc tinh toan tu cac bang cau_cang, ben_phao, va luot_tau_vao_ra. He thong su dung cau hoi SQL tinh toan truoc de tich chon, chi tra ve ket qua duoc chet. De xu ly luong du lieu lon, he thong pha split ket qua theo khoang thoi gian va dia diem, de hien thi phan trang. Cau hinh bieu duoc luu trong bang thiet lap_bieu, cho phep cap nhat dinh dang ma khong can sua code.

## Entities
- **CauCang**: id, ten_cang, dia_chi, kich_thuoc, so_ca_lam_viec, tinh_trang, created_at, updated_at
- **BenCang**: id, ten_ben, cap_ben, chieu_dai, do_sau, kha_nang_xu_ly, created_at, updated_at
- **LuotTauVaoRa**: id, ma_tau, ngay_vao, ngay_ra, loai_tau, khoi_luong, created_at, updated_at
- **ThongKeBienCap01N**: id, thang_nam, dia_diem, tong_nang_luc, thuc_te_thong qua, ty_le_su_dung, created_at, updated_at

## Business Rules
1. Chi hien thi thong ke cho nhung khoang thoi gian co du lieu day du (tu thang/co_nuoc_den_thang/hien_tai).
2. Ky hiêu thong ke duoc tinh theo cong thuc: thuc_te_thong_qua / nang_luc_dai_suat * 100%.
3. Ket qua xuat PDF/Excel phai theo dinh dang quy dinh bo cong thuong ban hanh.
4. Chi chuyen vien va quan ly moi co quyen xuat du lieu, nguoi xem chi co quyen hien thi.

## Testing Strategy
Test bang cach chay thuc don voi du lieu mau da xay dung truoc, kiem tra cac truong hop loc theo thoi gian khac nhau, xuat PDF/Excel voi du lieu nhieu/nhanh, hien thi bieu do voi day du lieu khac nhau, kiem tra quyen truy cap theo role, kiem tra dinh dang xuat theo quy dinh.
