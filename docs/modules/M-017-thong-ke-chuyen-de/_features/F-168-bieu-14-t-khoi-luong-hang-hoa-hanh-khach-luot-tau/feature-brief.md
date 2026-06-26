---
id: F-168
name: "Bieu 14-T: Khoi luong hang hoa, hanh khach, luot tau"
slug: bieu-14-t-khoi-luong-hang-hoa-hanh-khach-luot-tau
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:42:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 14-T: Khoi luong hang hoa, hanh khach, luot tau

## Description

Chuc nang hien thi va xuat bao cao tong hop khoi luong hang hoa, so luong hanh khach, so luot tau theo thang theo Bieu 14-T, ho tro xuat ra PDF va Excel. Bao cao trinh bay ket qua tong hop theo thang ve toan bo cac chieu luong van tai, cho phep so sanh, danh gia muc do su dung nang luc cai va ngon van tai theo thoi gian. He thong tu dong hoi tu du lieu tu co so du lieu thuy vien, thong quan bien, va cap tin hanh khach de tong hop thanh bao cao.

## Business Intent

Cap quan ly Bo Giao Thong Van Tai can bao cao tong hop theo thang de danh gia muc do van tai, su dung nang luc cai, ho tro quy hoach phat trien, xay dung ke hoach nam, va dat doan hieu sua giam sat. Bao cao nay cho thay cuc dung nang luc van tai, phat hien cac giai doan cao diem, thap diem, ho tro quyet dinh mo rong, chuyen doi ngon, va cap nhat nang luc cai.

## Flow Summary

Nguoi dung dang nhap, chon menu Thong ke -> Bieu 14-T, chon khoang thoi gian (1-12 thang), cau cai hoac toan bo he thong. He thong truy van du lieu tu co so du lieu van tai, thong quan, hanh khach, tinh toan tong khoi luong hang hoa (tung), so luong hanh khach, so luot tau theo tung thang. Ket qua duoc hien thi tren man hinh dang bang co the sap xep, so sanh, sau do nguoi dung co the xuat ra PDF hoac Excel. He thong ghi log thao tac xuat.

## Acceptance Criteria

- He thong hien thi dung 100% du lieu khoi luong hang hoa, hanh khach, luot tau theo thang, khong thieu hoac vuot qua
- Bao cao xuat PDF co dinh dang in hop le, bao gom tieu de, thoi gian xuat, tong so theo thang, danh sach chi tiet
- Bao cao xuat Excel chua cac cot: thang, nam, so luot tau, khoi luong hang hoa (tung), so luong hanh khach, cau cai, co the sap xep va tinh tong
- Hien thi truoc tren man hinh cho thay so sanh nhanh theo thang, theo loai, theo cau cai

## In Scope

- Hien thi tong hop khoi luong hang hoa, hanh khach, luot tau theo thang theo Bieu 14-T
- Loc theo thoi gian, cau cai, loai hang hoa
- Hien thi tong so theo thang, theo loai, theo cau cai
- Xuat bao cao ra PDF va Excel
- Xem truoc bao cao tren man hinh

## Out of Scope

- Cap nhat du lieu van tai (thuc hien o module khac)
- Bieu do pho hoa (F-165, F-166)
- Phan tich xu huong, du bao
- Tach chi tiet tung loai hang hoa

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao |
| Chuyen vien | Xem, xuat PDF/Excel, loc theo tieu chi |
| Admin | Xem, xuat, cai dat tieu chi mac dinh, quan ly quyen |

## Entities

- **ThongKeVanTaiThang**: maRecord, thang, nam, soLuotTau, khoiLuongHangHoaTon, soLuongHanhKhach, loaiHangHoa, cauCai, trangThai, nguoiTao, ngayTao
- **ThongKeThangTongHop**: maBaoCao, thangBatDau, thangKetThuc, tongKhoiLuong, tongHanhKhach, tongLuotTau, nguoiTao, ngayTao
- **LogXuatBaoCao**: maLog, tenDangNhap, thoiGianXuat, dinhDang, soBanGhi, donViYeuCau

## Business Rules

1. Khoi luong hang hoa phai duoc tinh theo tung (metric ton)
2. Du lieu phai chon loc theo thang nam, khong bot ban ghi trong khoang thoi gian da chon
3. So sanh nhieu thang phai dung cuc, khong co so voi thang co so lieu khong du
4. Cau cai phai lay tu muc luc, khong cho phep nhap tu do
5. Moi thao tac xuat phai duoc ghi log

## Testing Strategy

Kiem thu don vi: kiem tra truy van theo thang, tinh tong khoi luong, luot tau, hanh khach
Kiem thu he thong: kiem tra luong tu chon loc, hien thi, xuat PDF/Excel, kiem tra dinh dang
Kiem thu hieu nang: danh gia thoi gian xu ly voi 500.000, 1.000.000 ban ghi
Kiem thu quyen: xac thuc quyen xem, xuat theo tung role
