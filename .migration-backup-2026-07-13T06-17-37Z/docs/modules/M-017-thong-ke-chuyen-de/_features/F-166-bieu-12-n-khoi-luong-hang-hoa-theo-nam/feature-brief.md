---
id: F-166
name: "Bieu 12-N: Khoi luong hang hoa theo nam"
slug: bieu-12-n-khoi-luong-hang-hoa-theo-nam
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:42:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 12-N: Khoi luong hang hoa theo nam

## Description

Chuc nang hien thi va xuat bao cao tong hop khoi luong hang hoa theo nam theo Bieu 12-N, ho tro xuat ra PDF va Excel. Bao cao trinh bay ket qua tong hop theo tung nam ve khoi luong hang hoa van tai, so luot tau, luong hanh khach, cho phep so sanh nhieu nam lien tiep. He thong hoi tu du lieu tu co so du lieu thuy vien, thong quan, cap tin hanh khach, chon loc theo khoang thoi gian (1-5 nam) va cau cai, sau do tong hop thanh bao cao nam de xem va xuat.

## Business Intent

Cap quan ly Bo Giao Thong Van Tai can bao cao tong hop theo nam de lam co so cho viec danh gia ket qua thuc hien ke hoach van tai, quy hoach phat trien ngon van tai, va xac dinh muc tieu cho nam tiep theo. Bao cao nay cung cap nhin tong quan ve quy mo van tai hang hoa trong vong nhieu nam, giup dat doan hieu sua xay dung chuong trinh phat trien, dua ra quyet dinh dau tu cap nhat cai, don vi tau, va phat trien ngon van tai.

## Flow Summary

Nguoi dung dang nhap, chon menu Thong ke -> Bieu 12-N, chon khoang thoi gian (1-5 nam lien tiep), cau cai hoac khu vuc muon thong ke. He thong truy van du lieu tu co so du lieu van tai, tinh toan tong khoi luong hang hoa (tung), so luot tau, so luong hanh khach theo tung nam. Ket qua duoc hien thi tren man hinh dang bang co the chon loc theo nam, so sanh, sau do nguoi dung co the xuat ra PDF hoac Excel. He thong ghi log thao tac xuat.

## Acceptance Criteria

- He thong hien thi dung 100% du lieu khoi luong hang hoa theo nam trong khoang thoi gian chon, khong thieu hoac bot ban ghi
- Bao cao xuat PDF co dinh dang in hop le, bao gom tieu de, thoi gian xuat, tong so theo nam, danh sach chi tiet
- Bao cao xuat Excel chua cac cot: nam, so luot tau, khoi luong hang hoa (tung), so luong hanh khach, cau cai, co the sap xep va tinh tong
- Hien thi truoc tren man hinh cho thay so sanh nhanh giua cac nam va tong so tong hop

## In Scope

- Hien thi khoi luong hang hoa theo nam theo Bieu 12-N
- Loc theo khoang thoi gian (1-5 nam), cau cai, loai hang hoa
- Hien thi tong so theo nam, theo loai hang hoa, so sanh nhieu nam
- Xuat bao cao ra PDF va Excel
- Xem truoc bao cao tren man hinh

## Out of Scope

- Cap nhat du lieu van tai (thuc hien o module khac)
- Bieu do pho hoa (F-165)
- Phan tich xu huong, du bao theo thoi gian
- Tach khoi luong theo tung loai hang chi tiet

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao |
| Chuyen vien | Xem, xuat PDF/Excel, loc theo tieu chi |
| Admin | Xem, xuat, cai dat tieu chi mac dinh, quan ly quyen |

## Entities

- **KhoiLuongNam**: maRecord, nam, soLuotTau, khoiLuongHangHoaTon, loaiHangHoa, cauCai, trangThai, nguoiTao, ngayTao
- **ThongKeNam**: maBaoCao, namBatDau, namKetThuc, tongKhoiLuong, tongLuotTau, tongHanhKhach, nguoiTao, ngayTao
- **LogXuatBaoCao**: maLog, tenDangNhap, thoiGianXuat, dinhDang, soBanGhi, donViYeuCau

## Business Rules

1. Khoi luong hang hoa phai duoc tinh theo tung (metric ton), chuyen doi tuong tu cac don vi khac
2. Du lieu phai chon loc theo nam, khong bot ban ghi trong khoang thoi gian da chon
3. So sanh nhieu nam lien tiep phai dung cuc, khong co so voi nam co so lieu khong du
4. Cau cai phai lay tu muc luc, khong cho phep nhap tu do
5. Moi thao tac xuat phai duoc ghi log

## Testing Strategy

Kiem thu don vi: kiem tra truy van theo nam, tinh tong khoi luong, so sanh nhieu nam
Kiem thu he thong: kiem tra luong tu chon loc, hien thi, xuat PDF/Excel, kiem tra dinh dang
Kiem thu hieu nang: danh gia thoi gian xu ly voi 500.000, 1.000.000 ban ghi
Kiem thu quyen: xac thuc quyen xem, xuat theo tung role
