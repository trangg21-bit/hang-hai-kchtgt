---
id: F-163
name: "Bieu 16-Q: Thong ke tau bien nuoc ngoai den, roi"
slug: bieu-16-q-thong-ke-tau-bien-nuoc-ngoai
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:42:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 16-Q: Thong ke tau bien nuoc ngoai den, roi

## Description

Chuc nang thong ke tau bien nuoc ngoai den va roi theo Bieu 16-Q, ho tro xuat bao cao ra PDF va Excel. Bao cao trinh bay thong tin chi tiet ve so luong tau bien nuoc ngoai den vao cac cai, luot tau roi di, luong hang hoa chuyen tai, va quoc tich cua tau, duoc tich hop theo quy va nam. He thong tu dong hoi tu du lieu tu cac nguon ghi nhan cau cai, thong quan bien, va cap tin tau bien, chon loc theo ky thong ke, cai, loai tau, va quoc tich, sau do tong hop thanh bao cao de xem va xuat.

## Business Intent

Bo Cong Thuong va Bo Giao Thong Van Tai yeu cau bao cao dinh ky quy ve hoat dong cua tau bien nuoc ngoai de phuc vu cong tac quan ly giao thuong bien, thong ke kim ngach xuat nhap khau, va xac thuc thong quan bien. Bao cao nay giup cap quan ly nang cao hieu sua giam sat luong tau den/roi, phat hien bat thuong, va ho tro hoat dong xuat khau, nhap khau thong qua viec theo doi luong tau va hang hoa di ke.

## Flow Summary

Nguoi dung dang nhap he thong, chon menu Thong ke -> Bieu 16-Q, chon ky thong ke (quy nam), cau cai muon thong ke, loai tau va co the chon quoc tich cua tau de loc. He thong truy van du lieu tu co so du lieu lien ket voi cap tin tau bien va thong quan, tinh toan tong so luong tau den, tau roi, luong hang hoa, so ca lan den/roi theo quoc tich. Sau khi hien thi ket qua tren man hinh, nguoi dung co the xem chi tiet tung tau, xuat bao cao ra PDF hoac Excel de bam vao tiep. He thong ghi log thao tac xuat de phuc vu kiem toan.

## Acceptance Criteria

- He thong hien thi dung 100% du lieu tau bien nuoc ngoai den va roi trong ky thong ke duoc chon, khong co vuot qua hoac thieu ban ghi
- Bao cao xuat PDF bao gom day du thong tin: so luong tau den/roi theo quoc tich, luong hang hoa theo chuyen, thoi gian den/roi, ten tau, quoc tich, cau cai
- Bao cao xuat Excel chua cac cot du lieu theo dung cuc Bieu 16-Q, co the sap xep, loc va tinh tong cong cac cot so
- Co the loc theo khoang thoi gian (quy nam), cau cai, loai tau, quoc tich ma khong lam sai ket qua tong hop

## In Scope

- Thong ke tau bien nuoc ngoai den/roi theo quy, nam theo Bieu 16-Q
- Loc theo thoi gian, cau cai, loai tau, quoc tich
- Hien thi duoi dang bang voi tong so theo quoc tich, loai tau
- Xuat bao cao ra PDF va Excel theo dinh dang quy dinh
- Xem chi tiet tung tau trong bao cao

## Out of Scope

- Cap nhat du lieu tau bien (thuc hien o module quan ly tau bien)
- Bieu do pho hoa chi tiet (F-164)
- Tu dong thong bao khi so luong tau den vuot nguong
- Phan tich xu huong da chuyen sau

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao |
| Chuyen vien | Xem, xuat PDF/Excel, loc theo tieu chi |
| Admin | Xem, xuat, cai dat tieu chi mac dinh, quan ly quyen |

## Entities

- **TauBienNuocNgoai**: maTau, tenTau, quocTich, loaiTau, tongDoi, ngayDen, ngayRoi, cauCaiDen, cauCaiRoi, hangHoaTon, trangThai
- **ThongKeTauNgoai**: maBaoCao, quy, nam, soLuongTauDen, soLuongTauRoi, soLuongQuocTich, tongHangHoa, nguoiTao, ngayTao
- **LogXuatBaoCao**: maLog, tenDangNhap, thoiGianXuat, dinhDang, soBanGhi, donViYeuCau

## Business Rules

1. Du lieu thong ke phai chon loc theo quy nam, bat dau tu ngay dau tien den ngay cuoi cung cua quy duoc chon
2. Quoc tich cua tau phai lay tu du lieu muc luc quoc gia (ISO 3166), khong cho phep nhap tu do
3. Luong hang hoa phai duoc chuyen doi ve don vi tung (metric ton) cho so sanh thong nhat
4. Chi co role Chuyen vien tro len moi duoc xuat bao cao; role User chi xem hien thi
5. Moi thao tac xuat phai duoc ghi log voi thoi gian, nguoi dung, dinh dang, so ban ghi

## Testing Strategy

Kiem thu don vi: kiem tra ham truy van theo quy nam, tinh tong so theo quoc tich, chuyen doi don vi hang hoa
Kiem thu he thong: kiem tra luong tu chon loc den hien thi, xuat PDF/Excel, kiem tra dinh dang, kiem tra xem chi tiet tung tau
Kiem thu hieu nang: danh gia thoi gian xu ly voi 50.000, 100.000 va 500.000 ban ghi
Kiem thu quyen: xac thuc quyen xem, xuat theo tung role
