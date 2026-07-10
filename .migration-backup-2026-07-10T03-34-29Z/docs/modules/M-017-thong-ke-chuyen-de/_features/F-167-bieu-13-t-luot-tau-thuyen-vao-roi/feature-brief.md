---
id: F-167
name: "Bieu 13-T: Luot tau thuyen vao roi cang bien"
slug: bieu-13-t-luot-tau-thuyen-vao-roi
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:42:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 13-T: Luot tau thuyen vao roi cang bien

## Description

Chuc nang hien thi va xuat bao cao luot tau thuyen vao roi cang bien theo Bieu 13-T, ho tro xuat ra PDF va Excel. Bao cao trinh bay so luong luot tau, thuyen vao roi (den, roi, dang boi luyen, tang bien) tai cac cai bien theo thang, bao gom thong tin ve loai tau, tong doi, trang thai hoat dong, cau cai den/roi, quoc tich. He thong tu dong hoi tu du lieu tu cap tin tau bien, ghi nhan cau cai, va thong quan bien de tong hop thanh bao cao thang.

## Business Intent

Bo Giao Thong Van Tai, Truong CainBien yeu cau bao cao thang ve luot tau thuyen vao roi de phuc vu cong tac dieu khiet, giam sat an toan giao thong bien, quy hoach nang luc cai, va bao cao tong hop len Bo. Bao cao nay giup nang cao hieu sua dieu khiet luong tau tai cac cai, phat hien dot tang luong tau bat thuong, ho tro quy hoach cap nhat, mo rong cai, va can ho thiet bi quan ly giao thong bien.

## Flow Summary

Nguoi dung dang nhap, chon menu Thong ke -> Bieu 13-T, chon thoi gian (1-12 thang), cau cai hoac toan bo he thong cai bien. He thong truy van du lieu tu cap tin tau bien, ghi nhan cau cai, tinh toan tong luot tau den, tau roi, tau dang boi luyen theo tung thang, theo loai tau, theo cau cai. Ket qua duoc hien thi tren man hinh dang bang co the chon loc, sap xep, sau do nguoi dung co the xuat ra PDF hoac Excel. He thong ghi log thao tac xuat.

## Acceptance Criteria

- He thong hien thi dung 100% du lieu luot tau thuyen vao roi trong khoang thoi gian chon, khong thieu hoac vuot qua
- Bao cao xuat PDF co dinh dang in hop le, bao gom tieu de, thoi gian xuat, tong so theo thang, danh sach chi tiet theo loai tau va cau cai
- Bao cao xuat Excel chua cac cot: thang, so luot tau den, so luot tau roi, so luot tau tang bien, loai tau, cau cai, quoc tich, co the sap xep va tinh tong
- Hien thi truoc tren man hinh cho thay bieu do so sanh luot tau den/roi theo thang

## In Scope

- Hien thi luot tau thuyen vao roi cang bien theo thang theo Bieu 13-T
- Loc theo thoi gian, cau cai, loai tau, quoc tich
- Hien thi tong so theo thang, loai tau, cau cai
- Xuat bao cao ra PDF va Excel
- Xem chi tiet tung luot tau

## Out of Scope

- Cap nhat du lieu cap tin tau bien (thuc hien o module khac)
- Bieu do pho hoa (F-168)
- Tu dong thong bao khi vuot nguong an toan
- Phan tich xu huong da chuyen sau

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao |
| Chuyen vien | Xem, xuat PDF/Excel, loc theo tieu chi |
| Admin | Xem, xuat, cai dat tieu chi mac dinh, quan ly quyen |

## Entities

- **LuotTauThuyen**: maRecord, ngayDen, ngayRoi, tenTau, loaiTau, tongDoi, quocTich, cauCai, trangThai, trangThaiTau, nguoiTao, ngayTao
- **ThongKeTauThuyen**: maBaoCao, thangBatDau, thangKetThuc, tongLuotDen, tongLuotRoi, tongLuotTangBien, soLuotTau, nguoiTao, ngayTao
- **LogXuatBaoCao**: maLog, tenDangNhap, thoiGianXuat, dinhDang, soBanGhi, donViYeuCau

## Business Rules

1. Du lieu phai chon loc theo thang nam, bao gom tat ca luot tau den/roi trong khoang thoi gian
2. Trang thai tau (den, roi, tang bien, boi luyen) phai lay tu muc luc, khong cho phep nhap tu do
3. Loai tau phai lay tu muc luc loai tau, khong cho phep nhap tu do
4. Quoc tich phai lay tu muc luc quoc gia (ISO 3166)
5. Moi thao tac xuat phai duoc ghi log

## Testing Strategy

Kiem thu don vi: kiem tra truy van theo thang, tinh tong luot tau den/roi, phan loai theo trang thai
Kiem thu he thong: kiem tra luong tu chon loc, hien thi, xuat PDF/Excel, kiem tra dinh dang
Kiem thu hieu nang: danh gia thoi gian xu ly voi 50.000, 200.000 ban ghi
Kiem thu quyen: xac thuc quyen xem, xuat theo tung role
