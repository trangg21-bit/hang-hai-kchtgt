---
id: F-165
name: "Bieu 12-T: Khoi luong hang hoa, hanh khach theo thang"
slug: bieu-12-t-khoi-luong-hang-hoa-hanh-khach
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:42:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 12-T: Khoi luong hang hoa, hanh khach theo thang

## Description

Chuc nang hien thi va xuat bao cao khoi luong hang hoa, hanh khach theo thang theo Bieu 12-T, ho tro xuat ra PDF va Excel. Bao cao trinh bay thong tin tong hop ve khoi luong hang hoa xuat, nhap, chuyen tai trong cac cai va tren cac duong thuy theo tung thang, bao gom ca so luong hanh khach di lai. He thong tu dong lay du lieu tu co so du lieu thuy vien, thong quan bien, va cap tin hanh khach, chon loc theo khoang thoi gian (12 thang) va cau cai, sau do tong hop thanh bao cao.

## Business Intent

Bo Giao Thong Van Tai va Bo Cong Thuong can bao cao thang de theo doi, danh gia va quy hoach hoat dong giao thuong, van tai bien. Bao cao nay cung cap nhin tong quan ve quy mo van tai hang hoa, luot hanh khach theo thoi gian, giup cap quan ly dat doan hieu sua giam sat, phat hien xu huong tang/giam, ho tro quy hoach nang luc cai, va ra quyet dinh dau tu phat trien ngon van tai thuy.

## Flow Summary

Nguoi dung dang nhap, chon menu Thong ke -> Bieu 12-T, chon khoang thoi gian (tu 1-12 thang), cau cai hoac khu vuc muon thong ke. He thong truy van du lieu tu co so du lieu van tai, thong quan, hanh khach, tinh toan tong khoi luong hang hoa (tung), so luong hanh khach, tong so luot tau theo tung thang. Ket qua duoc hien thi tren man hinh dang bang co the sap xep, sau do nguoi dung co the xuat ra PDF hoac Excel. He thong ghi log thao tac xuat de kiem toan.

## Acceptance Criteria

- He thong hien thi dung 100% du lieu khoi luong hang hoa, hanh khach theo thang trong khoang thoi gian chon, khong co thieu hay vuot qua
- Bao cao xuat PDF co dinh dang in hop le, bao gom tieu de, thoi gian xuat, tong so theo thang, danh sach chi tiet
- Bao cao xuat Excel chua cac cot: thang, so luot tau, khoi luong hang hoa (tung), so luong hanh khach, cau cai, co the sap xep va tinh tong
- Hien thi truoc tren man hinh cho thay bieu do so sanh nhanh giua cac thang va tong so theo tung thang

## In Scope

- Hien thi khoi luong hang hoa, so luong hanh khach theo thang theo Bieu 12-T
- Loc theo khoang thoi gian (1-12 thang), cau cai, loai hang hoa
- Hien thi tong so theo thang, theo loai hang hoa
- Xuat bao cao ra PDF va Excel
- Xem truoc bao cao tren man hinh

## Out of Scope

- Cap nhat du lieu van tai, hanh khach (thuc hien o module khac)
- Bieu do pho hoa chuyen sau (F-166)
- Phan tich xu huong, du bao theo thoi gian
- Tu dong cap nhat du lieu tu GPS, AIS

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao |
| Chuyen vien | Xem, xuat PDF/Excel, loc theo tieu chi |
| Admin | Xem, xuat, cai dat tieu chi mac dinh, quan ly quyen |

## Entities

- **KhoiLuongHangHoa**: maRecord, thang, nam, soLuotTau, khoiLuongHangHoaTon, loaiHangHoa, cauCai, trangThai, nguoiTao, ngayTao
- **SoLuongHanhKhach**: maRecord, thang, nam, soLuotTau, soLuongHanhKhach, loaiDuongDi, cauCaiDen, cauCaiRoi, nguoiTao, ngayTao
- **ThongKeThang**: maBaoCao, thangBatDau, thangKetThuc, tongKhoiLuong, tongHanhKhach, soLuotTauTong, nguoiTao, ngayTao

## Business Rules

1. Khoi luong hang hoa phai duoc tinh theo tung (metric ton), chuyen doi tuong tu cac don vi khac (kg, nghin kg)
2. Du lieu phai chon loc theo thang nam, khong bot ban ghi trong khoang thoi gian da chon
3. So luong hanh khach phai tinh tong qua cac loai duong di (di trong nuoc, di quoc te)
4. Cau cai phai lay tu muc luc cau cai, khong cho phep nhap tu do
5. Moi thao tac xuat phai duoc ghi log

## Testing Strategy

Kiem thu don vi: kiem tra truy van theo thang nam, tinh tong khoi luong, so luong hanh khach
Kiem thu he thong: kiem tra luong tu chon loc, hien thi, xuat PDF/Excel, kiem tra dinh dang
Kiem thu hieu nang: danh gia thoi gian xu ly voi 100.000, 500.000 ban ghi
Kiem thu quyen: xac thuc quyen xem, xuat theo tung role
