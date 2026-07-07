---
id: F-042
name: "Xem chi tiet Luong hang hai"
slug: xem-chi-tiet-luong-hang-hai
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-29T00:00:00Z"
last-updated: "2026-06-29T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiet Luong hang hai

## Description
Tat ca roles co the xem chi tiet luong hang hai, bao gom tat ca cac truong thong tin va van ban dinh kem. Chuc nang nay cho phep tra cuu, xem chi tiet, va xu ly van ban dinh kem (tai lieu, anh, phong) lien quan toi luong hang hai. Muc dich la hien thi toan bo thong tin luong hang hai cho nguoi dung khac nhau theo vai tro cua minh.

## Business Intent
Tra cuu, xem chi tiet, van ban dinh kem — cho phep tat ca roles (chuyen vien, lanh dao phong, lanh dao cuc) xem thong tin chi tiet cua luong hang hai, kiem tra tai lieu dinh kem, thong tin phe duyet, va lich su thay doi.

## Flow Summary
1. Nguoi dung (tat ca roles) truy cap module Luong hang hai
2. Nguoi dung chon luong hang hai can xem (theo danh sach hoac tim kiem)
3. He thong hien thi trang chi tiet voi tat ca cac truong: loai_tau, so_luong, ngay_ghi_nhan, gio_dien, tai_trong, dien_tich_dang_bo, ghi_chu
4. He thong hien thi trang thai hien tai (PROPOSED/UNDER_REVIEW/APPROVED/REJECTED)
5. He thong hien thi thong tin phe duyet: nguoi phe duyet C1/C2, ngay phe duyet, ly do tu tuyen (neu co)
6. He thong hien thi danh sach van ban dinh kem (tai lieu tu MinIO)
7. Nguoi dung co the xem/download tai lieu dinh kem

## Acceptance Criteria
- [x] Xem chi tiet Luong hang hai thanh cong
- [x] Tra cuu, xem chi tiet, van ban dinh kem
- [x] Tat ca roles co the xem chi tiet (A-003, A-002, A-004)
- [x] Hien thi toan bo thong tin luong hang hai (32 fields)
- [x] Hien thi trang thai hien tai (PROPOSED/UNDER_REVIEW/APPROVED/REJECTED)
- [x] Hien thi thong tin phe duyet (nguoi, ngay, ly do tu tuyen)
- [x] Hien thi danh sach van ban dinh kem (tai lieu tu MinIO)
- [x] Nguoi dung co the xem/download tai lieu dinh kem

## In Scope
- Tao moi luong hang hai (F-038)
- Cap nhat luong hang hai (F-039)
- Xoa luong hang hai (F-040)
- Phe duyet luong hang hai (F-041, 2 cap: phong → Cuc)
- Xem chi tiet (F-042)
- Lich su thay doi (F-043)

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
| A-004 (Lanh dao Cuc) | Xem | Xem chi tiet tat ca du lieu luong hang hai |

## Entities

| Entity | Table | Primary Key | Description |
|---|---|---|---|
| LuongHangHai | luong_hang_hai | id | Entity chinh, 32 fields |
| LuongHangHaiAttachment | luong_hang_hai_attachment | id | Tai lieu dinh kem (MinIO) |
| PheDuyetLichSu | phe_duyet_lich_su | id | History log |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-042-01 | Tra cuu, xem chi tiet, van ban dinh kem | View | UC-3345 |
| BR-042-02 | Tat ca roles co the xem chi tiet | View | DESIGN.md |
| BR-042-03 | Hien thi toan bo thong tin luong hang hai (32 fields) | View | DESIGN.md |
| BR-042-04 | Hien thi thong tin phe duyet (nguoi, ngay, ly do tu tuyen) | View | DESIGN.md |
| BR-042-05 | Hien thi danh sach van ban dinh kem (tai lieu tu MinIO) | View | DESIGN.md |

## Technical Details

### REST Endpoints
- `GET /api/v1/luong-hang-hai/{id}` — Xem chi tiet luong hang hai
- Response: `LuongHangHaiDTO` (toan bo 32 fields, bao gom thong tin phe duyet va attachment)
- `GET /api/v1/luong-hang-hai/{id}/attachments` — Danh sach van ban dinh kem
- Response: `List<AttachmentDTO>` (file_name, file_url, upload_date, uploader_name)

### DTO Fields (View DTO)
- `id`, `loai_tau`, `so_luong`, `ngay_ghi_nhan`, `gio_dien`, `tai_trong`, `dien_tich_dang_bo`, `ghi_chu`
- `trangThai` (PROPOSED/UNDER_REVIEW/APPROVED/REJECTED)
- `pheDuyetC1`, `nguoiPheDuyetC1`, `ngayPheDuyetC1`
- `pheDuyetC2`, `nguoiPheDuyetC2`, `ngayPheDuyetC2`
- `lyDoTuChoi`
- `attachments`: List<AttachmentDTO>

## Testing Strategy
- Unit tests: Entity builder, getters/setters, JPA lifecycle callbacks
- Service tests: Get luong hang hai by id → tra ve toan bo thong tin + attachments
- Controller tests: GET /api/v1/luong-hang-hai/{id}, auth filters, 404 handling
- Integration: Xem chi tiet → hien thi toan bo 32 fields + thong tin phe duyet + attachments
- Negative tests: Xem luong hang hai khong ton tai → 404, Xem soft-deleted → 404
- All unit tests must pass before feature seal

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Tech-Lead Plan: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/tech-lead/04-plan.md
- Source: UC-3345
