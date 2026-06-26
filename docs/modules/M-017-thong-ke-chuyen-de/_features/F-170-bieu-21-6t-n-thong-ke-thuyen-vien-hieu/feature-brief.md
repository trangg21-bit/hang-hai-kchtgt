---
id: F-170
name: "Bieu 21-6T/N: Thong ke thuyen vien, hieu"
slug: bieu-21-6t-n-thong-ke-thuyen-vien-hieu
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:42:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 21-6T/N: Thong ke thuyen vien, hieu

## Description

Chuc nang hien thi va xuat bao cao thong ke thuyen vien, hieu theo Bieu 21-6T/N, ho tro xuat ra PDF va Excel. Bao cao trinh bay thong tin tong hop ve so luong thuyen vien dang hoat dong, co chung chi, he so, loai chung chi, theo tung nam, tinh thanh, loai hieu. He thong hoi tu du lieu tu co so du lieu quan ly thuyen vien, hieu, cap chung chi de tong hop thanh bao cao nam.

## Business Intent

Bo Giao Thong Van Tai can bao cao nam ve thuyen vien, hieu de quy hoach phat trieu nhan luc, danh gia chat luong doi ngu, xay dung ke hoach dao tao, cap chung chi, va bao cao tong hop len cap tren. Bao cao nay cung cap nhin tong quan ve muc do dam bao nhan su cho hoat dong van tai bien, ho tro quyet dinh dau tu dao tao, va nang cao chat luong dieu khiet an toan giao thong bien.

## Flow Summary

Nguoi dung dang nhap, chon menu Thong ke -> Bieu 21-6T/N, chon khoang thoi gian (1-5 nam), tinh thanh hoac toan quoc. He thong truy van du lieu tu co so du lieu quan ly thuyen vien, tinh toan tong so luong thuyen vien dang hoat dong, so luong co chung chi theo loai, he so, tinh thanh, nam. Ket qua duoc hien thi tren man hinh dang bang co the chon loc, sap xep, sau do nguoi dung co the xuat ra PDF hoac Excel. He thong ghi log thao tac xuat.

## Acceptance Criteria

- He thong hien thi dung 100% du lieu thuyen vien, hieu theo nam trong khoang thoi gian chon, khong thieu hoac vuot qua
- Bao cao xuat PDF co dinh dang in hop le, bao gom tieu de, thoi gian xuat, tong so theo nam, danh sach chi tiet theo tinh thanh
- Bao cao xuat Excel chua cac cot: nam, tinhThanh, soLuongThuyenVien, soLuongCoChungChi, loaiChungChi, heSo, nguoiTao, ngayTao, co the sap xep va tinh tong
- Hien thi truoc tren man hinh cho thay so sanh nhanh theo tinh thanh, theo loai chung chi

## In Scope

- Hien thi thong ke thuyen vien, hieu theo nam theo Bieu 21-6T/N
- Loc theo thoi gian, tinh thanh, loai chung chi, he so
- Hien thi tong so theo nam, tinh thanh, loai chung chi
- Xuat bao cao ra PDF va Excel
- Xem chi tiet tung thuyen vien

## Out of Scope

- Cap nhat du lieu thuyen vien (thuc hien o module khac)
- Bieu do pho hoa (F-171)
- Tu dong cap nhat du lieu tu nguon ben ngoai
- Phan tich xu huong da chuyen sau

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao |
| Chuyen vien | Xem, xuat PDF/Excel, loc theo tieu chi |
| Admin | Xem, xuat, cai dat tieu chi mac dinh, quan ly quyen |

## Entities

- **ThuyenVien**: maRecord, tenThuyenVien, tinhThanh, loaiChungChi, heSo, ngayCap, ngayHetHan, trangThai, donVi, nguoiTao, ngayTao
- **ThongKeThuyenVien**: maBaoCao, namBatDau, namKetThuc, tongSoLuong, soLuongCoChungChi, loaiChungChiTieuBieu, nguoiTao, ngayTao
- **LogXuatBaoCao**: maLog, tenDangNhap, thoiGianXuat, dinhDang, soBanGhi, donViYeuCau

## Business Rules

1. Chi bao gom thuyen vien dang hoat dong (trang thai = Dang hoat dong)
2. Du lieu phai chon loc theo nam, khong bot ban ghi trong khoang thoi gian da chon
3. Loai chung chi va he so phai lay tu muc luc, khong cho phep nhap tu do
4. Tinh thanh phai lay tu muc luc, khong cho phep nhap tu do
5. Moi thao tac xuat phai duoc ghi log

## Testing Strategy

Kiem thu don vi: kiem tra truy van theo nam, tinh tong so luong theo tinh thanh, loai chung chi
Kiem thu he thong: kiem tra luong tu chon loc, hien thi, xuat PDF/Excel, kiem tra dinh dang
Kiem thu hieu nang: danh gia thoi gian xu ly voi 200.000, 500.000 ban ghi
Kiem thu quyen: xac thuc quyen xem, xuat theo tung role
