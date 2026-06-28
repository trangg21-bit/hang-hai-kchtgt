---
id: F-162
name: "Bieu 11B-T: Bao cao chi tiet phuong tien thuy noi dia"
slug: bieu-11b-t-phuong-tien-thuy-noi-dia
module-id: M-017
status: proposed
classification: local
priority: high
created: "2026-06-16T04:42:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Bieu 11B-T: Bao cao chi tiet phuong tien thuy noi dia

## Description

Chuc nang hien thi va xuat bao cao chi tiet phuong tien thuy noi dia theo Bieu 11B-T, ho tro hai dinh dang xuat la PDF va Excel. Bao cao bao gom thong tin tong hop ve so luong, kich thuoc, loai hinh va trang thai hoat dong cua cac phuong tien thuy noi dia duoc dieu khiet tren cac con duong thuy tre tren dia ban thanh pho. He thong tu dong lay du lieu tu co so du lieu thuy viен, chon loc theo khoang thoi gian va khu vuc cuc bo, sau do trinh bay thanh bang du lieu co the tong hop va xuat ra tai lieu.

## Business Intent

Bo Mon Giao Thong V Van Tai co yeu cau bao cao dinh ky va khong dinh ky ve tinh hinh phuong tien thuy noi dia de phuc vu cong tac quan ly, dieu khiet va quy hoach tai nguyen thuy. Bao cao nay giup quan ly nang cao hieu sua giam sat, xu ly vu vi pham giao thong duong thuy, va ho tro ra quyet dinh dau tu cap nhat, thay the phuong tien. Viec tong hop tu dong giup giam thoi gian lap bao cao tu 3 ngay xuong con 30 phut, nang cao do chinh xac thong qua kha nang kiem chung du lieu tu dong.

## Flow Summary

Nguoi dung dang nhap he thong, chon menu Thong ke -> Bieu 11B-T, nhap cac tieu chi loc bao gom khoang thoi gian, tinh thanh, loai phuong tien, va co the chon muc chi tiet (tong hop hoac chi tiet tung phuong tien). He thong truy van du lieu tu co so, tinh toan cac tong so theo tung loai va co the chon hien thi tren man hinh de xem truoc. Sau do nguoi dung co the xuat thanh dang PDF (co dinh dang in, co dai header va footer) hoac Excel (de tiep tuc xu ly, lap ban do). He thong ghi log thao tac xuat bao cao, bao gom ngay gio, ten nguoi dung, so luong ban ghi duoc xuat, de phuc vu kiem toan va kiem tra su dung dung quyen.

## Acceptance Criteria

- He thong hien thi dung 100% du lieu phuong tien thuy noi dia trong khoang thoi gian do, khong bot hoac trung lap ban ghi
- Chung nang xuat PDF co dinh dang in hop le, bao gom tieu de, thoi gian xuat, ban dau cua to chuc, va danh sach chi tiet phuong tien
- Chung nang xuat Excel chua cac cot du lieu day du (ma phuong tien, ten, loai, tong doi, nang suat, trang thai, tinh/thanh, ngay dang ky)
- Hien thi truoc bao cao tren man hinh cho thay du lieu chinh xac duoi dang bang co the sap xep theo cot va phan trang

## In Scope

- Hien thi danh sach phuong tien thuy noi dia theo Bieu 11B-T voi cac tieu chi loc theo thoi gian, tinh thanh, loai phuong tien
- Xuat bao cao ra hai dinh dang PDF va Excel voi dinh dang duoc kha chuyen
- Tinh toan va hien thi cac tong so theo tong quan (tong so phuong tien, tong doi, so phuong tien dang hoat dong/ngung hoat dong)
- Co the xem truoc bao cao tren man hinh truoc khi xuat
- Ghi log thao tac xuat bao cao de phuc vu kiem toan

## Out of Scope

- Cap nhat, them, sua, xoa du lieu phuong tien thuy noi dia (thuc hien o module quan ly phuong tien)
- Bieu do pho hoa (thong ke bieu do do thuoc ve F-163, F-164)
- Tu dong cap nhat du lieu tu cac nguon ben ngoai (GPS, AIS)
- Phan tich xu huong hoac du bao theo thoi gian

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem bao cao |
| Chuyen vien | Xem, xuat PDF/Excel |
| Admin | Xem, xuat, cai dat tieu chi mac dinh |

## Entities

- **PhuongTienThuyNoiDia**: maPhuongTien, tenPhuongTien, loaiPhuongTien, tongDoi, nangSuat, trangThaiHoatDong, tinhThanh, ngayDangKy, ngayCapNhat
- **ThongKePhuongTien**: maBaoCao, thoiGianBatDau, thoiGianKetThuc, tongSoLuong, tongDoi, soLuongHoatDong, soLuongNgungHoatDong, nguoiTao, ngayTao
- **LogXuatBaoCao**: maLog, tenDangNhap, thoiGianXuat, dinhDang, soBanGhi, donViYeuCau

## Business Rules

1. Du lieu bao cao phai phuc hoi chinh xac theo khoang thoi gian duoc chon, bat dau tu 00:00:00 den 23:59:59 cua ngay ket thuc
2. Chi tieu loai phuong tien phai lay tu du lieu muc luc (catalog) loai phuong tien thuy, khong cho phep nhap tu do
3. Bao cao xuat ra phai bao gom day du 8 cot du lieu co ban theo quydinh Bieu 11B-T
4. Chi co role Chuyen vien tro len moi duoc quyen xuat bao cao; role User chi duoc xem hien thi tren man hinh
5. Moi thao tac xuat bao cao phai duoc ghi log voi thoi gian, nguoi dung, dinh dang va so luong ban ghi

## Testing Strategy

Kiem thu don vi: kiem tra ham truy van du lieu theo tieu chi loc, kiem tra cong thuc tinh tong so theo tung loai va trang thai
Kiem thu he thong: kiem tra luong xu ly tu khi chon loc den hien thi truoc, xuat PDF/Excel, kiem tra dinh dang dau ra
Kiem thu hieu nang: danh gia thoi gian hien thi va xuat bao cao voi 10.000, 50.000 va 100.000 ban ghi
Kiem thu quyen: xac thuc each role chi co quyen theo dinh kenh, kham pha quyen han qua token
