---
id: F-169
name: "Bieu 15-T: Khoi luong hang hoa trong khu quan ly"
slug: bieu-15-t-khoi-luong-hang-hoa-trong-khu-quan-ly
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:42:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 15-T: Khoi luong hang hoa trong khu quan ly

## Description

Chuc nang hien thi va xuat bao cao khoi luong hang hoa trong khu quan ly theo Bieu 15-T, ho tro xuat ra PDF va Excel. Bao cao trinh bay thong tin ve khoi luong hang hoa duoc chuyen tai, chuyen kho, luu tr tru trong cac khu quan ly cua ca, khu kinh te bien, khu cong nghiep hoat dong duong thuy theo thang. He thong tu dong hoi tu du lieu tu co so du lieu quan ly ca, ghi nhan van tai, kho cuu, va thong quan de tong hop thanh bao cao.

## Business Intent

Cap quan ly Bo Giao Thong Van Tai, Ban Quan Ly Ca, Khu Kinh Te Can can bao cao theo thang de kiem soat luong hang hoa trong khu quan ly, dat doan hieu sua giam sat, xu ly van de an toan, bao mat hang hoa, ho tro bao cao thue, va quy hoach nang luc luu tr. Bao cao nay cung cap thong tin tin cay ve muc do su dung nang luc luu tr, dieu chuyen, ho tro quyet dinh dau tu kho cuu, cong vien logisitcs, va phat trien khu kinh te.

## Flow Summary

Nguoi dung dang nhap, chon menu Thong ke -> Bieu 15-T, chon khoang thoi gian (1-12 thang), khu quan ly hoac toan bo he thong. He thong truy van du lieu tu co so du lieu quan ly ca, kho cuu, van tai, tinh toan tong khoi luong hang hoa (tung) theo tung khu quan ly, loai hang hoa, thoi gian. Ket qua duoc hien thi tren man hinh dang bang co the chon loc, sap xep, sau do nguoi dung co the xuat ra PDF hoac Excel. He thong ghi log thao tac xuat.

## Acceptance Criteria

- He thong hien thi dung 100% du lieu khoi luong hang hoa trong khu quan ly theo thang, khong thieu hoac vuot qua
- Bao cao xuat PDF co dinh dang in hop le, bao gom tieu de, thoi gian xuat, tong so theo thang, danh sach chi tiet theo khu quan ly
- Bao cao xuat Excel chua cac cot: thang, nam, khuQuanLy, khoiLuongHangHoaTon, loaiHangHoa, soLuotTau, nguoiTao, ngayTao, co the sap xep va tinh tong
- Hien thi truoc tren man hinh cho thay so sanh nhanh theo khu quan ly, theo loai hang hoa

## In Scope

- Hien thi khoi luong hang hoa trong khu quan ly theo thang theo Bieu 15-T
- Loc theo thoi gian, khu quan ly, loai hang hoa
- Hien thi tong so theo thang, khu quan ly, loai hang hoa
- Xuat bao cao ra PDF va Excel
- Xem truoc bao cao tren man hinh

## Out of Scope

- Cap nhat du lieu quan ly ca (thuc hien o module khac)
- Bieu do pho hoa (F-165)
- Phan tich xu huong, du bao
- Tach chi tiet tung loai hang hoa theo loai kho

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao |
| Chuyen vien | Xem, xuat PDF/Excel, loc theo tieu chi |
| Admin | Xem, xuat, cai dat tieu chi mac dinh, quan ly quyen |

## Entities

- **HangHoaTrongKhuQuanLy**: maRecord, thang, nam, khuQuanLy, khoiLuongHangHoaTon, loaiHangHoa, soLuotTau, trangThai, nguoiTao, ngayTao
- **ThongKeKhuQuanLy**: maBaoCao, thangBatDau, thangKetThuc, tongKhoiLuong, tongLuotTau, soKhuQuanLy, nguoiTao, ngayTao
- **LogXuatBaoCao**: maLog, tenDangNhap, thoiGianXuat, dinhDang, soBanGhi, donViYeuCau

## Business Rules

1. Khoi luong hang hoa phai duoc tinh theo tung (metric ton)
2. Du lieu phai chon loc theo thang nam, khong bot ban ghi trong khoang thoi gian da chon
3. Khu quan ly phai lay tu muc luc, khong cho phep nhap tu do
4. Loai hang hoa phai lay tu muc luc, khong cho phep nhap tu do
5. Moi thao tac xuat phai duoc ghi log

## Testing Strategy

Kiem thu don vi: kiem tra truy van theo thang, tinh tong khoi luong theo khu quan ly, loai hang hoa
Kiem thu he thong: kiem tra luong tu chon loc, hien thi, xuat PDF/Excel, kiem tra dinh dang
Kiem thu hieu nang: danh gia thoi gian xu ly voi 200.000, 500.000 ban ghi
Kiem thu quyen: xac thuc quyen xem, xuat theo tung role
