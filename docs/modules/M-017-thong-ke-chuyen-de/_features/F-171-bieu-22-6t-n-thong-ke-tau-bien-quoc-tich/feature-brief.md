---
id: F-171
name: "Bieu 22-6T/N: Thong ke tau bien quoc tich VN"
slug: bieu-22-6t-n-thong-ke-tau-bien-quoc-tich
module-id: M-017
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:23Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 22-6T/N: Thong ke tau bien quoc tich VN

## Description

Chuc nang hien thi va xuat bao cao thong ke tau bien quoc tich Vietnam theo Bieu 22-6T/N, ho tro xuat ra PDF va Excel. Bao cao trinh bay thong tin tong hop ve so luong tau bien quoc tich Vietnam dang hoat dong, bao gom loai tau, tong doi, nam san xuat, trang thai, cau cai hoat dong, quoc gia dang ky, de phuc vu cong tac quan ly, quy hoach phat trien ngon van tai bien.

## Business Intent

Bo Giao Thong Van Tai can bao cao nam ve so luong va dac diem tau bien quoc tich Vietnam de quy hoach phat trien ngon van tai, dieu chinh chinh sach ho tro, dan do dau tu cap nhat don vi tau, kiem toan cong tac dang ky, va bao cao tong hop len cap tren. Bao cao nay cung cap co so tin cay cho viec ra quyet dinh dau tu phat trieu ngon van tai bien quoc te.

## Flow Summary

Nguoi dung dang nhap, chon menu Thong ke -> Bieu 22-6T/N, chon khoang thoi gian (1-5 nam), quoc gia dang ky hoac toan bo he thong. He thong truy van du lieu tu co so du lieu quan ly tau bien, tinh toan tong so luong tau theo loai, quoc gia dang ky, nam san xuat, trang thai, cau cai hoat dong. Ket qua duoc hien thi tren man hinh dang bang co the chon loc, sap xep, sau do nguoi dung co the xuat ra PDF hoac Excel. He thong ghi log thao tac xuat.

## Acceptance Criteria

- He thong hien thi dung 100% du lieu tau bien quoc tich Vietnam theo nam trong khoang thoi gian chon, khong thieu hoac vuot qua
- Bao cao xuat PDF co dinh dang in hop le, bao gom tieu de, thoi gian xuat, tong so theo nam, danh sach chi tiet theo quoc gia dang ky
- Bao cao xuat Excel chua cac cot: nam, quocGiaDangKy, soLuongTau, loaiTau, tongDoiTong, namSanXuat, trangThai, cauCaiHoatDong, co the sap xep va tinh tong
- Hien thi truoc tren man hinh cho thay so sanh nhanh theo quoc gia dang ky, theo loai tau

## In Scope

- Hien thi thong ke tau bien quoc tich Vietnam theo nam theo Bieu 22-6T/N
- Loc theo thoi gian, quoc gia dang ky, loai tau, trang thai
- Hien thi tong so theo nam, quoc gia dang ky, loai tau
- Xuat bao cao ra PDF va Excel
- Xem chi tiet tung tau

## Out of Scope

- Cap nhat du lieu tau bien (thuc hien o module khac)
- Bieu do pho hoa (F-164)
- Tu dong cap nhat du lieu tu nguon ben ngoai
- Phan tich xu huong da chuyen sau

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao |
| Chuyen vien | Xem, xuat PDF/Excel, loc theo tieu chi |
| Admin | Xem, xuat, cai dat tieu chi mac dinh, quan ly quyen |

## Entities

- **TauBienQuocTichVN**: maRecord, tenTau, loaiTau, quocGiaDangKy, tongDoi, namSanXuat, trangThai, cauCaiHoatDong, donViQuanLy, nguoiTao, ngayTao
- **ThongKeTauBien**: maBaoCao, namBatDau, namKetThuc, tongSoLuongTau, loaiTauTieuBieu, quocGiaTieuBieu, nguoiTao, ngayTao
- **LogXuatBaoCao**: maLog, tenDangNhap, thoiGianXuat, dinhDang, soBanGhi, donViYeuCau

## Business Rules

1. Chi bao gom tau bien co quoc tich Vietnam
2. Du lieu phai chon loc theo nam, khong bot ban ghi trong khoang thoi gian da chon
3. Quoc gia dang ky phai lay tu muc luc quoc gia (ISO 3166)
4. Loai tau phai lay tu muc luc loai tau, khong cho phep nhap tu do
5. Moi thao tac xuat phai duoc ghi log

## Testing Strategy

Kiem thu don vi: kiem tra truy van theo nam, tinh tong so luong theo quoc gia dang ky, loai tau
Kiem thu he thong: kiem tra luong tu chon loc, hien thi, xuat PDF/Excel, kiem tra dinh dang
Kiem thu hieu nang: danh gia thoi gian xu ly voi 200.000, 500.000 ban ghi
Kiem thu quyen: xac thuc quyen xem, xuat theo tung role
