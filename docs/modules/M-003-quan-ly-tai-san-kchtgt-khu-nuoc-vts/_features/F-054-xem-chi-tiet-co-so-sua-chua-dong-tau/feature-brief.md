---
id: F-054
name: "Xem chi tiet Co so sua chua, dong tau"
slug: xem-chi-tiet-co-so-sua-chua-dong-tau
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-29T00:00:00Z"
last-updated: "2026-06-29T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiet Co so sua chua, dong tau

## Description
Tat ca roles co the xem chi tiet co so sua chua, dong tau, bao gom tat ca cac truong thong tin va van ban dinh kem. Chuc nang nay cho phep tra cuu, xem chi tiet, va xu ly van ban dinh kem (tai lieu, anh, phong) lien quan toi co so sua chua, dong tau. Muc dich la hien thi toan bo thong tin co so sua chua, dong tau cho nguoi dung khac nhau theo vai tro cua minh.

## Business Intent
Tra cuu, xem chi tiet, van ban dinh kem — cho phep tat ca roles (chuyen vien, lanh dao phong, lanh dao cuc) xem thong tin chi tiet cua co so sua chua, dong tau, kiem tra tai lieu dinh kem, thong tin phe duyet, va lich su thay doi.

## Flow Summary
1. Nguoi dung (tat ca roles) truy cap module Co so sua chua, dong tau
2. Nguoi dung chon co so sua chua, dong tau can xem (theo danh sach hoac tim kiem)
3. He thong hien thi trang chi tiet voi tat ca cac truong: ten_co_so, dia_chi, loai_hinh_dv, nang_luc_tiep_nhan, trang_bi_chinh, dien_tich, so_dien_thoai, email, ghi_chu
4. He thong hien thi trang thai hien tai (PROPOSED/UNDER_REVIEW/APPROVED/REJECTED)
5. He thong hien thi thong tin phe duyet: nguoi phe duyet C1/C2, ngay phe duyet, ly do tu tuyen (neu co)
6. He thong hien thi danh sach van ban dinh kem (tai lieu tu MinIO)
7. Nguoi dung co the xem/download tai lieu dinh kem

## Acceptance Criteria
- [x] Xem chi tiet Co so sua chua, dong tau thanh cong
- [x] Tra cuu, xem chi tiet, van ban dinh kem
- [x] Tat ca roles co the xem chi tiet (A-003, A-002, A-004)
- [x] Hien thi toan bo thong tin co so sua chua, dong tau (16 fields)
- [x] Hien thi trang thai hien tai (PROPOSED/UNDER_REVIEW/APPROVED/REJECTED)
- [x] Hien thi thong tin phe duyet (nguoi, ngay, ly do tu tuyen)
- [x] Hien thi danh sach van ban dinh kem (tai lieu tu MinIO)
- [x] Nguoi dung co the xem/download tai lieu dinh kem

## In Scope
- Tao moi co so sua chua, dong tau (F-050)
- Cap nhat co so sua chua, dong tau (F-051)
- Xoa co so sua chua, dong tau (F-052)
- Phe duyet co so sua chua, dong tau (F-053, 2 cap: phong → Cuc)
- Xem chi tiet (F-054)
- Lich su thay doi (F-055)

## Out of Scope
- Phuc vu thong ke, bao cao
- Tich hop voi he thong khac (Phase 1)
- Email/SMS notification
- Export Excel/PDF
- Tim kiem nang cao (filter theo nhieu truong)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Xem | Xem chi tiet du lieu minh tao + du lieu phe duyet |
| A-002 (Lanh dao) | Xem | Xem chi tiet du lieu phe duyet + tai lieu dinh kem |
| A-004 (Lanh dao Cuc) | Xem | Xem chi tiet tat ca du lieu co so sua chua, dong tau |

## Entities

| Entity | Table | Primary Key | Description |
|---|---|---|---|
| CoSoSuaChuaDongTau | co_sua_chua_dong_tau | id | Entity chinh, 16 fields |
| CoSoSuaChuaDongTauAttachment | co_sua_chua_dong_tau_attachment | id | Tai lieu dinh kem (MinIO) |
| PheDuyetLichSu | phe_duyet_lich_su | id | History log |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-054-01 | Tra cuu, xem chi tiet, van ban dinh kem | View | UC-3304 |
| BR-054-02 | Tat ca roles co the xem chi tiet | View | DESIGN.md |
| BR-054-03 | Hien thi toan bo thong tin co so sua chua, dong tau (16 fields) | View | DESIGN.md |
| BR-054-04 | Hien thi thong tin phe duyet (nguoi, ngay, ly do tu tuyen) | View | DESIGN.md |
| BR-054-05 | Hien thi danh sach van ban dinh kem (tai lieu tu MinIO) | View | DESIGN.md |

## Technical Details

### REST Endpoints
- `GET /api/v1/co-sua-chua-dong-tau/{id}` — Xem chi tiet co so sua chua, dong tau
- Response: `CoSoSuaChuaDongTauDTO` (toan bo 16 fields, bao gom thong tin phe duyet va attachment)
- `GET /api/v1/co-sua-chua-dong-tau/{id}/attachments` — Danh sach van ban dinh kem
- Response: `List<AttachmentDTO>` (file_name, file_url, upload_date, uploader_name)

### DTO Fields (View DTO)
- `id`, `ten_co_so`, `dia_chi`, `loai_hinh_dv`, `nang_luc_tiep_nhan`, `trang_bi_chinh`, `dien_tich`, `so_dien_thoai`, `email`, `ghi_chu`
- `trangThai` (PROPOSED/UNDER_REVIEW/APPROVED/REJECTED)
- `pheDuyetC1`, `nguoiPheDuyetC1`, `ngayPheDuyetC1`
- `pheDuyetC2`, `nguoiPheDuyetC2`, `ngayPheDuyetC2`
- `lyDoTuChoi`
- `attachments`: List<AttachmentDTO>

## Testing Strategy
- Unit tests: Entity builder, getters/setters, JPA lifecycle callbacks
- Service tests: Get co so sua chua, dong tau by id → tra ve toan bo thong tin + attachments
- Controller tests: GET /api/v1/co-sua-chua-dong-tau/{id}, auth filters, 404 handling
- Integration: Xem chi tiet → hien thi toan bo 16 fields + thong tin phe duyet + attachments
- Negative tests: Xem co so sua chua, dong tau khong ton tai → 404, Xem soft-deleted → 404
- All unit tests must pass before feature seal

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Tech-Lead Plan: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/tech-lead/04-plan.md
- Source: UC-3304
