---
id: F-173
name: "Bieu 31-N: Thong ke co so dong moi, sua chua, pha do tau"
slug: bieu-31-n-thong-ke-co-so-dong-moi
module-id: M-017
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:23Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 31-N: Thong ke co so dong moi, sua chua, pha do tau

## Description

Chuc nang hien thi va xuat bao cao thong ke co so dong moi, sua chua, pha do tau theo Bieu 31-N, ho tro xuat ra PDF va Excel. Bao cao trinh bay thong tin tong hop ve so luong co dong moi, co so sua chua, co so pha do tau duoc thiet lap tren cac tinh thanh, vung bien, theo tung nam. He thong hoi tu du lieu tu co so du lieu quan ly co so dong moi, sua chua, pha do tau, cong nhan dang ky, de tong hop thanh bao cao nam.

## Business Intent

Bo Giao Thong Van Tai can bao cao nam ve co so dong moi, sua chua, pha do tau de quy hoach phat trien ngon dong moi, sua chua, pha do tau, dat doan hieu sua giam sat nang luc, kiem toan du dau tu, hoan dinh chinh sach ho tro, va bao cao tong hop len cap tren. Bao cao nay cung cap co so tin cay cho viec ra quyet dinh dau tu, quy hoach vung dong moi, va nang cao chat luong su dung tau bien.

## Flow Summary

Nguoi dung dang nhap, chon menu Thong ke -> Bieu 31-N, chon khoang thoi gian (1-5 nam), vung bien hoac toan quoc. He thong truy van du lieu tu co so du lieu quan ly co so dong moi, sua chua, pha do tau, tinh toan tong so luong co theo loai (dong moi, sua chua, pha do), vung bien, tinh thanh, nam. Ket qua duoc hien thi tren man hinh dang bang co the chon loc, sap xep, sau do nguoi dung co the xuat ra PDF hoac Excel. He thong ghi log thao tac xuat.

## Acceptance Criteria

- He thong hien thi dung 100% du lieu co so dong moi, sua chua, pha do tau theo nam trong khoang thoi gian chon, khong thieu hoac vuot qua
- Bao cao xuat PDF co dinh dang in hop le, bao gom tieu de, thoi gian xuat, tong so theo nam, danh sach chi tiet theo tinh thanh
- Bao cao xuat Excel chua cac cot: nam, tinhThanh, soCoDongMoi, soCoSuaChua, soCoPhaDo, nguoiTao, ngayTao, co the sap xep va tinh tong
- Hien thi truoc tren man hinh cho thay so sanh nhanh theo loai co so, theo tinh thanh

## In Scope

- Hien thi thong ke co so dong moi, sua chua, pha do tau theo nam theo Bieu 31-N
- Loc theo thoi gian, tinh thanh, vung bien, loai co so
- Hien thi tong so theo nam, tinh thanh, vung bien, loai co so
- Xuat bao cao ra PDF va Excel
- Xem chi tiet tung co so

## Out of Scope

- Cap nhat du lieu co so (thuc hien o module khac)
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

- **CoSoDongMoi**: maRecord, tenCoSo, tinhThanh, loaiCoSo, nangSuat, namThietLap, trangThai, donViQuanLy, nguoiTao, ngayTao
- **ThongKeCoSo**: maBaoCao, namBatDau, namKetThuc, tongSoCo, soCoDongMoi, soCoSuaChua, soCoPhaDo, nguoiTao, ngayTao
- **LogXuatBaoCao**: maLog, tenDangNhap, thoiGianXuat, dinhDang, soBanGhi, donViYeuCau

## Business Rules

1. Chi bao gom co so da duoc cong nhan dang ky (trang thai = Da dang ky)
2. Du lieu phai chon loc theo nam, khong bot ban ghi trong khoang thoi gian da chon
3. Loai co so (dong moi, sua chua, pha do) phai lay tu muc luc, khong cho phep nhap tu do
4. Tinh thanh phai lay tu muc luc, khong cho phep nhap tu do
5. Moi thao tac xuat phai duoc ghi log

## Testing Strategy

Kiem thu don vi: kiem tra truy van theo nam, tinh tong so luong theo loai co so, tinh thanh
Kiem thu he thong: kiem tra luong tu chon loc, hien thi, xuat PDF/Excel, kiem tra dinh dang
Kiem thu hieu nang: danh gia thoi gian xu ly voi 200.000, 500.000 ban ghi
Kiem thu quyen: xac thuc quyen xem, xuat theo tung role
