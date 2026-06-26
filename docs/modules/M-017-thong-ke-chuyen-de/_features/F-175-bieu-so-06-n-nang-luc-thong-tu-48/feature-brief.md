---
id: F-175
name: "Bieu so 06-N: Nang luc thong qua ben cang thong tu 48"
slug: bieu-so-06-n-nang-luc-thong-tu-48
module-id: M-017
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:23Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu so 06-N: Nang luc thong qua ben cang thong tu 48

## Description

Chuc nang hien thi va xuat bao cao nang luc thong qua ben cang theo Bieu so 06-N (thong tu 48), ho tro xuat ra PDF va Excel. Bao cao trinh bay thong tin tong hop ve nang luc thong qua ben cang duoc quet dinh theo Thong tu 48/2014/TT-BGTVT, bao gom tong doi, nang suat nam, loai ben cang, tinh thanh, vung bien, nam danh gia. He thong hoi tu du lieu tu co so du lieu quan ly ca, danh muc ben cang, de tong hop thanh bao cao nam.

## Business Intent

Bo Giao Thong Van Tai can bao cao nam ve nang luc thong qua ben cang de quy hoach phat trien ngon ca, dat doan hieu sua giam sat, kiem toan du dau tu ben cang, hoan chinh chinh sach dau tu, va bao cao tong hop len cap tren. Bao cao nay cung cap co so tin cay cho viec ra quyet dinh dau tu cap nhat, mo rong ben cang, quy hoach nang luc thong qua, va nang cao hieu sua van tai bien.

## Flow Summary

Nguoi dung dang nhap, chon menu Thong ke -> Bieu so 06-N, chon khoang thoi gian (1-5 nam), tinh thanh hoac toan quoc. He thong truy van du lieu tu co so du lieu quan ly ca, tinh toan tong nang luc thong qua ben cang theo loai, tinh thanh, vung bien, nam. Ket qua duoc hien thi tren man hinh dang bang co the chon loc, sap xep, sau do nguoi dung co the xuat ra PDF hoac Excel. He thong ghi log thao tac xuat.

## Acceptance Criteria

- He thong hien thi dung 100% du lieu nang luc thong qua ben cang theo Thong tu 48 trong khoang thoi gian chon, khong thieu hoac vuot qua
- Bao cao xuat PDF co dinh dang in hop le, bao gom tieu de, thoi gian xuat, tong so theo nam, danh sach chi tiet theo tinh thanh
- Bao cao xuat Excel chua cac cot: nam, tinhThanh, loaiBenCang, nangLucThongQuaTon, nangSuatNam, nguoiTao, ngayTao, co the sap xep va tinh tong
- Hien thi truoc tren man hinh cho thay so sanh nhanh theo tinh thanh, theo loai ben cang

## In Scope

- Hien thi nang luc thong qua ben cang theo Thong tu 48 theo nam theo Bieu so 06-N
- Loc theo thoi gian, tinh thanh, loai ben cang, vung bien
- Hien thi tong so theo nam, tinh thanh, loai ben cang
- Xuat bao cao ra PDF va Excel
- Xem chi tiet tung ben cang

## Out of Scope

- Cap nhat du lieu ben cang (thuc hien o module khac)
- Bieu do pho hoa (F-163)
- Tu dong cap nhat du lieu tu nguon ben ngoai
- Phan tich xu huong da chuyen sau

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao |
| Chuyen vien | Xem, xuat PDF/Excel, loc theo tieu chi |
| Admin | Xem, xuat, cai dat tieu chi mac dinh, quan ly quyen |

## Entities

- **BenCang**: maRecord, tenBenCang, tinhThanh, loaiBenCang, nangLucThongQuaTon, nangSuatNam, namDanhGia, trangThai, donViQuanLy, nguoiTao, ngayTao
- **ThongKeNangLuc**: maBaoCao, namBatDau, namKetThuc, tongNangLuc, soBenCang, loaiBenCangTieuBieu, nguoiTao, ngayTao
- **LogXuatBaoCao**: maLog, tenDangNhap, thoiGianXuat, dinhDang, soBanGhi, donViYeuCau

## Business Rules

1. Chi bao gom ben cang da duoc danh gia nang luc theo Thong tu 48/2014/TT-BGTVT
2. Du lieu phai chon loc theo nam, khong bot ban ghi trong khoang thoi gian da chon
3. Loai ben cang phai lay tu muc luc, khong cho phep nhap tu do
4. Tinh thanh phai lay tu muc luc, khong cho phep nhap tu do
5. Moi thao tac xuat phai duoc ghi log

## Testing Strategy

Kiem thu don vi: kiem tra truy van theo nam, tinh tong nang luc theo loai ben cang, tinh thanh
Kiem thu he thong: kiem tra luong tu chon loc, hien thi, xuat PDF/Excel, kiem tra dinh dang
Kiem thu hieu nang: danh gia thoi gian xu ly voi 200.000, 500.000 ban ghi
Kiem thu quyen: xac thuc quyen xem, xuat theo tung role
