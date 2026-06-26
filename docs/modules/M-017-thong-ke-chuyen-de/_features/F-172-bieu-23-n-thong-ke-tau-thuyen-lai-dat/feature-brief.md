---
id: F-172
name: "Bieu 23-N: Thong ke tau thuyen hoat dong lai dat"
slug: bieu-23-n-thong-ke-tau-thuyen-lai-dat
module-id: M-017
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:23Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 23-N: Thong ke tau thuyen hoat dong lai dat

## Description

Chuc nang hien thi va xuat bao cao thong ke tau thuyen hoat dong lai dat theo Bieu 23-N, ho tro xuat ra PDF va Excel. Bao cao trinh bay thong tin tong hop ve so luong tau thuyen dang hoat dong lai dat (thuyen chuyen hoan, thuyen danh ca, thuyen van tai ngoai dao) theo tung nam, tinh thanh, loai tau. He thong hoi tu du lieu tu co so du lieu quan ly tau thuyen, hieu bien, va bao cao tai lieu de tong hop thanh bao cao nam.

## Business Intent

Bo Giao Thong Van Tai, Bo Nong Nghiep va Phat Trien Nong Thon can bao cao nam ve tau thuyen hoat dong lai dat de quy hoach phat trien nganh thuy san, quan ly nguon luyen thuy san, dat doan hieu sua giam sat, bao ve moi truong bien, ho tro chinh sach ho tro nganh thuy san, va bao cao tong hop len cap tren.

## Flow Summary

Nguoi dung dang nhap, chon menu Thong ke -> Bieu 23-N, chon khoang thoi gian (1-5 nam), tinh thanh hoac toan quoc, loai tau. He thong truy van du lieu tu co so du lieu quan ly tau thuyen, tinh toan tong so luong tau theo loai, tinh thanh, trang thai hoat dong, nam. Ket qua duoc hien thi tren man hinh dang bang co the chon loc, sap xep, sau do nguoi dung co the xuat ra PDF hoac Excel. He thong ghi log thao tac xuat.

## Acceptance Criteria

- He thong hien thi dung 100% du lieu tau thuyen hoat dong lai dat theo nam trong khoang thoi gian chon, khong thieu hoac vuot qua
- Bao cao xuat PDF co dinh dang in hop le, bao gom tieu de, thoi gian xuat, tong so theo nam, danh sach chi tiet theo tinh thanh
- Bao cao xuat Excel chua cac cot: nam, tinhThanh, soLuongTau, loaiTau, trangThai, nguoiTao, ngayTao, co the sap xep va tinh tong
- Hien thi truoc tren man hinh cho thay so sanh nhanh theo tinh thanh, theo loai tau

## In Scope

- Hien thi thong ke tau thuyen hoat dong lai dat theo nam theo Bieu 23-N
- Loc theo thoi gian, tinh thanh, loai tau, trang thai
- Hien thi tong so theo nam, tinh thanh, loai tau
- Xuat bao cao ra PDF va Excel
- Xem chi tiet tung tau

## Out of Scope

- Cap nhat du lieu tau thuyen (thuc hien o module khac)
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

- **TauThuyenLaiDat**: maRecord, tenTau, tinhThanh, loaiTau, tongDoi, trangThai, namSanXuat, nguoiLaiDat, donViQuanLy, nguoiTao, ngayTao
- **ThongKeTauThuyen**: maBaoCao, namBatDau, namKetThuc, tongSoLuongTau, loaiTauTieuBieu, tinhThanhTieuBieu, nguoiTao, ngayTao
- **LogXuatBaoCao**: maLog, tenDangNhap, thoiGianXuat, dinhDang, soBanGhi, donViYeuCau

## Business Rules

1. Chi bao gom tau thuyen dang hoat dong lai dat (trang thai = Dang hoat dong)
2. Du lieu phai chon loc theo nam, khong bot ban ghi trong khoang thoi gian da chon
3. Loai tau phai lay tu muc luc loai tau, khong cho phep nhap tu do
4. Tinh thanh phai lay tu muc luc, khong cho phep nhap tu do
5. Moi thao tac xuat phai duoc ghi log

## Testing Strategy

Kiem thu don vi: kiem tra truy van theo nam, tinh tong so luong theo tinh thanh, loai tau
Kiem thu he thong: kiem tra luong tu chon loc, hien thi, xuat PDF/Excel, kiem tra dinh dang
Kiem thu hieu nang: danh gia thoi gian xu ly voi 200.000, 500.000 ban ghi
Kiem thu quyen: xac thuc quyen xem, xuat theo tung role
