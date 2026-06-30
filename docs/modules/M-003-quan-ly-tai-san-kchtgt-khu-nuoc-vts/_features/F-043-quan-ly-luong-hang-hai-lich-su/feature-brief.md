---
id: F-043
name: "Quan ly Luong hang hai - Lich su"
slug: quan-ly-luong-hang-hai-lich-su
module-id: M-003
status: proposed
classification: local
priority: P1
created: "2026-06-29T00:00:00Z"
last-updated: "2026-06-29T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly Luong hang hai - Lich su

## Description
Chuyen vien (va cac role khac) co the xem lich su thay doi cua luong hang hai. He thong ghi nhan toan bo cac thao tac: tao moi, cap nhat, phe duyet C1/C2, tu tuyen C1/C2, xoa co che (soft delete). Lich su duoc luu vao bang phe_duyet_lich_su, bao gom: thoi gian, nguoi thuc hien, loai thao tac, du lieu cu, du lieu moi, va ghi chu/ly do.

## Business Intent
Theo doi lich su thay doi — cho phep nguoi dung xem lai toan bo lich su cua luong hang hai, tu khi tao moi den khi xoa (neu co), bao gom lich su phe duyet va cac thao tac cap nhat. Phuc vu kiem tra, audit, va theo doi tang toc van de.

## Flow Summary
1. Chuyen vien (hay role khac) truy cap module Luong hang hai
2. Chuyen vien chon luong hang hai can xem lich su
3. He thong hien thi danh sach cac su kien theo thu tu thoi gian:
   - Su kien CREATE: chuyen vien tao moi luong hang hai (thoi gian, nguoi tao)
   - Su kien UPDATE: chuyen vien cap nhat du lieu (thoi gian, nguoi sua, du lieu cu, du lieu moi)
   - Su kien APPROVE_C1: truong phong phe duyet cap 1 (thoi gian, nguoi phe duyet)
   - Su kien APPROVE_C2: cuc truong phe duyet cap 2 (thoi gian, nguoi phe duyet)
   - Su kien REJECT_C1: truong phong tu tuyen cap 1 (thoi gian, nguoi tu tuyen, ly do)
   - Su kien REJECT_C2: cuc truong tu tuyen cap 2 (thoi gian, nguoi tu tuyen, ly do)
   - Su kien DELETE: chuyen vien xoa co che (thoi gian, nguoi xoa)
4. Muc dich: theo doi lich su thay doi cua tung luong hang hai

## Acceptance Criteria
- [x] Xem lich su Luong hang hai thanh cong
- [x] Theo doi lich su thay doi
- [x] Hien thi toan bo lich su theo thu tu thoi gian
- [x] Bao gom: CREATE, UPDATE, APPROVE C1/C2, REJECT C1/C2, DELETE
- [x] Hien thi: thoi gian, nguoi thuc hien, loai thao tac, ghi chu/ly do

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
- So sánh so sanh chi tiet du lieu cu/moi theo truong

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Xem | Xem lich su du lieu minh tao |
| A-002 (Lanh dao) | Xem | Xem lich su du lieu phe duyet |
| A-004 (Lanh dao Cuc) | Xem | Xem lich su du lieu phe duyet C2 |

## Entities

| Entity | Table | Primary Key | Description |
|---|---|---|---|
| LuongHangHai | luong_hang_hai | id | Entity chinh, 32 fields |
| LuongHangHaiAttachment | luong_hang_hai_attachment | id | Tai lieu dinh kem (MinIO) |
| PheDuyetLichSu | phe_duyet_lich_su | id | History log |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-043-01 | Theo doi lich su thay doi | View History | UC-3350 |
| BR-043-02 | Ghi nhan CREATE sau khi tao moi | History | DESIGN.md |
| BR-043-03 | Ghi nhan UPDATE sau khi cap nhat | History | DESIGN.md |
| BR-043-04 | Ghi nhan APPROVE/REJECT sau phe duyet | History | DESIGN.md |
| BR-043-05 | Ghi nhan DELETE sau soft delete | History | DESIGN.md |
| BR-043-06 | Hien thi lich su theo thu tu thoi gian | History | DESIGN.md |

## Technical Details

### REST Endpoints
- `GET /api/v1/luong-hang-hai/{id}/history` — Xem lich su luong hang hai
- Response: `List<HistoryEventDTO>`

### HistoryEventDTO Fields
- `eventId` (Long) — id su kien
- `luongHangHaiId` (Long) — id luong hang hai
- `actionType` (Enum): CREATE, UPDATE, APPROVE_C1, APPROVE_C2, REJECT_C1, REJECT_C2, DELETE
- `userId` (String) — nguoi thuc hien
- `userName` (String) — ten nguoi thuc hien
- `actionDate` (LocalDateTime) — thoi gian thao tac
- `oldValues` (Map<String, Object>) — du lieu cu (neu UPDATE)
- `newValues` (Map<String, Object>) — du lieu moi (neu UPDATE)
- `reason` (String) — ly do (neu REJECT)
- `notes` (String) — ghi chu

### History Actions
- CREATE: sau khi tao moi luong hang hai (F-038)
- UPDATE: sau khi cap nhat luong hang hai (F-039)
- APPROVE_C1: sau phe duyet cap 1 (F-041)
- APPROVE_C2: sau phe duyet cap 2 (F-041)
- REJECT_C1: sau tu tuyen cap 1 (F-041)
- REJECT_C2: sau tu tuyen cap 2 (F-041)
- DELETE: sau soft delete (F-040)

## Testing Strategy
- Unit tests: Entity builder, getters/setters, JPA lifecycle callbacks
- Service tests: Get history → tra ve danh sach su kien theo thu tu thoi gian
- Controller tests: GET /api/v1/luong-hang-hai/{id}/history, auth filters
- Integration: Tao moi → cap nhat → phe duyet C1 → phe duyet C2 → xem history → kiem tra 6 su kien
- Negative tests: Xem history du lieu khong ton tai → 404, Xem history soft-deleted → 404
- All unit tests must pass before feature seal

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Tech-Lead Plan: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/tech-lead/04-plan.md
- Source: UC-3350 (line ~3350)
