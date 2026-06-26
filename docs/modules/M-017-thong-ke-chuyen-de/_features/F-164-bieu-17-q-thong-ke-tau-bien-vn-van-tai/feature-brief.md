---
id: F-164
name: "Bieu 17-Q: Thong ke tau bien VN van tai quoc te"
slug: bieu-17-q-thong-ke-tau-bien-vn-van-tai
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:42:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 17-Q: Thong ke tau bien VN van tai quoc te

## Description

Chuc nang thong ke tau bien Vietnam van tai quoc te theo Bieu 17-Q, ho tro xuat bao cao ra PDF va Excel. Bao cao trinh bay thong tin ve so luong tau bien Vietnam tham gia van tai quoc te, bao gom loai tau, tong doi, luot chuyen, luong hang hoa xuat nhap, cac duong van tai va cau cai hoat dong. He thong hoi tu du lieu tu cap tin tau bien, co so du lieu ghi nhan van tai, va thong tin doan van tai quoc te de tong hop thanh bao cao quy, phuc vu cong tac quan ly va quy hoach van tai bien.

## Business Intent

Bo Giao Thong Van Tai yeu cau bao cao quy ve tong quan hoat dong van tai quoc te cua tau bien Vietnam de lam co so cho viec quy hoach phat trien ngon van tai bien, kiem toan cong tac van tai, va xac thuc doanh thu thue tu van tai. Bao cao nay cung cap thong tin tin cay ve muc do tham gia cua tau bien Vietnam tren cac duong van tai quoc te, ho tro viec ra quyet dinh dau tu cap nhat don vi tau va phat trien ngon van tai.

## Flow Summary

Nguoi dung dang nhap he thong, chon menu Thong ke -> Bieu 17-Q, chon ky thong ke (quy nam), cau cai hoat dong, loai tau van tai va duong van tai. He thong truy van du lieu tu co so du lieu van tai quoc te, tinh toan tong so luong tau, tong doi, luot chuyen den/roi, luong hang hoa theo loai va duong di. Sau khi hien thi tren man hinh, nguoi dung co the xem chi tiet tung tau, tung chuyen, xuat bao cao ra PDF hoac Excel de bam vao tiep tuc phan tich. He thong ghi log thao tac xuat.

## Acceptance Criteria

- He thong hien thi dung 100% du lieu tau bien Vietnam van tai quoc te trong ky thong ke, khong bot hoac thieu ban ghi
- Bao cao xuat PDF bao gom day du thong tin: so luong tau theo loai, tong doi, luot chuyen, luong hang hoa, duong van tai, cau cai den/roi
- Bao cao xuat Excel chua cac cot du lieu theo dung cuc Bieu 17-Q, co the sap xep, loc, tinh tong cong va bo loc
- Hien thi truoc bao cao tren man hinh cho thay tong so theo loai tau, duong van tai, va tinh toan chinh xac ty le phan tram

## In Scope

- Thong ke tau bien Vietnam van tai quoc te theo quy, nam theo Bieu 17-Q
- Loc theo thoi gian, cau cai, loai tau, duong van tai
- Hien thi tong so theo loai tau, duong van tai, luong hang hoa
- Xuat bao cao ra PDF va Excel theo dinh dang quy dinh
- Xem chi tiet tung tau, tung chuyen van tai

## Out of Scope

- Cap nhat du lieu van tai (thuc hien o module quan ly van tai)
- Bieu do pho hoa chi tiet (F-165, F-166)
- Tinh toan doanh thu thue tu van tai
- Tu dong cap nhat du lieu tu GIS/GPS

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao |
| Chuyen vien | Xem, xuat PDF/Excel, loc theo tieu chi |
| Admin | Xem, xuat, cai dat tieu chi mac dinh, quan ly quyen |

## Entities

- **TauBienVNVanTai**: maTau, tenTau, loaiTau, tongDoi, quocTich, ngayDangKy, duongVanTai, cauCaiHoatDong, trangThai, donViQuanLy
- **ChuyenVanTai**: maChuyen, tenTau, ngayDen, ngayRoi, hangHoaTon, loaiHangHoa, duongDi, nguoiTao, ngayTao
- **ThongKeVanTai**: maBaoCao, quy, nam, soLuongTau, tongDoi, soLuotChuyen, tongHangHoaTon, nguoiTao, ngayTao

## Business Rules

1. Chi bao gom tau bien co quoc tich Vietnam va da dang ki hoat dong van tai quoc te
2. Du lieu thong ke phai chon loc theo quy nam, tu ngay dau den ngay cuoi cua quy
3. Don vi luong hang hoa phai la tung (metric ton), chuyen doi tuong tu cac don vi khac neu can
4. Duong van tai phai lay tu muc luc, khong cho phep nhap tu do
5. Moi thao tac xuat bao cao phai duoc ghi log voi thoi gian, nguoi dung, dinh dang, so ban ghi

## Testing Strategy

Kiem thu don vi: kiem tra truy van loc theo quy nam, tinh tong so theo loai tau, chuyen doi don vi
Kiem thu he thong: kiem tra luong tu chon loc, hien thi, xem chi tiet, xuat PDF/Excel, kiem tra dinh dang
Kiem thu hieu nang: danh gia thoi gian xu ly voi 50.000, 100.000 va 500.000 ban ghi
Kiem thu quyen: xac thuc quyen xem, xuat theo tung role
