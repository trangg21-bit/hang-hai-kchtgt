---
id: F-055
name: "Quan ly Co so sua chua, dong tau - Lich su"
slug: quan-ly-co-so-sua-chua-dong-tau-lich-su
module-id: M-003
status: proposed
classification: local
priority: P1
created: "2026-06-29T00:00:00Z"
last-updated: "2026-06-29T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly Co so sua chua, dong tau - Lich su

## Description
Chuyen vien (va cac role khac) co the xem lich su thay doi cua co so sua chua, dong tau. He thong ghi nhan toan bo cac thao tac: tao moi, cap nhat, phe duyet C1/C2, tu tuyen C1/C2, xoa co che (soft delete). Lich su duoc luu vao bang phe_duyet_lich_su, bao gom: thoi gian, nguoi thuc hien, loai thao tac, du lieu cu, du lieu moi, va ghi chu/ly do. Theo doi lich su thay doi co so sua chua, dong tau.

## Business Intent
Theo doi lich su thay doi — cho phep nguoi dung xem lai toan bo lich su cua co so sua chua, dong tau, tu khi tao moi den khi xoa (neu co), bao gom lich su phe duyet va cac thao tac cap nhat. Phuc vu kiem tra, audit, va theo doi tang toc van de trong quan ly tai san KCHTGT khu nuoc VTS.

## Flow Summary
1. Chuyen vien (hay role khac) truy cap module Co so sua chua, dong tau
2. Chuyen vien chon co so sua chua, dong tau can xem lich su
3. He thong hien thi danh sach cac su kien theo thu tu thoi gian:
    - Su kien CREATE: chuyen vien tao moi co so sua chua, dong tau (thoi gian, nguoi tao)
    - Su kien UPDATE: chuyen vien cap nhat du lieu (thoi gian, nguoi sua, du lieu cu, du lieu moi)
    - Su kien APPROVE_C1: truong phong phe duyet cap 1 (thoi gian, nguoi phe duyet)
    - Su kien APPROVE_C2: cuc truong phe duyet cap 2 (thoi gian, nguoi phe duyet)
    - Su kien REJECT_C1: truong phong tu tuyen cap 1 (thoi gian, nguoi tu tuyen, ly do)
    - Su kien REJECT_C2: cuc truong tu tuyen cap 2 (thoi gian, nguoi tu tuyen, ly do)
    - Su kien DELETE: chuyen vien xoa co che (thoi gian, nguoi xoa)
4. Muc dich: theo doi lich su thay doi cua tung co so sua chua, dong tau

## Acceptance Criteria
- [x] Xem lich su Co so sua chua, dong tau thanh cong
- [x] Theo doi lich su thay doi
- [x] Hien thi toan bo lich su theo thu tu thoi gian
- [x] Bao gom: CREATE, UPDATE, APPROVE C1/C2, REJECT C1/C2, DELETE
- [x] Hien thi: thoi gian, nguoi thuc hien, loai thao tac, ghi chu/ly do

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
| CoSoSuaChuaDongTau | co_sua_chua_dong_tau | id | Entity chinh, 16 fields |
| CoSoSuaChuaDongTauAttachment | co_sua_chua_dong_tau_attachment | id | Tai lieu dinh kem (MinIO) |
| PheDuyetLichSu | phe_duyet_lich_su | id | History log |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-055-01 | Theo doi lich su thay doi | View History | UC-3305 |
| BR-055-02 | Ghi nhan CREATE sau khi tao moi | History | DESIGN.md |
| BR-055-03 | Ghi nhan UPDATE sau khi cap nhat | History | DESIGN.md |
| BR-055-04 | Ghi nhan APPROVE/REJECT sau phe duyet | History | DESIGN.md |
| BR-055-05 | Ghi nhan DELETE sau soft delete | History | DESIGN.md |
| BR-055-06 | Hien thi lich su theo thu tu thoi gian | History | DESIGN.md |

## Technical Details

### REST Endpoints
- `GET /api/v1/co-sua-chua-dong-tau/{id}/history` — Xem lich su co so sua chua, dong tau
- Response: `List<HistoryEventDTO>`

### HistoryEventDTO Fields
- `eventId` (Long) — id su kien
- `coSoSuaChuaDongTauId` (Long) — id co so sua chua, dong tau
- `actionType` (Enum): CREATE, UPDATE, APPROVE_C1, APPROVE_C2, REJECT_C1, REJECT_C2, DELETE
- `userId` (String) — nguoi thuc hien
- `userName` (String) — ten nguoi thuc hien
- `actionDate` (LocalDateTime) — thoi gian thao tac
- `oldValues` (Map<String, Object>) — du lieu cu (neu UPDATE)
- `newValues` (Map<String, Object>) — du lieu moi (neu UPDATE)
- `reason` (String) — ly do (neu REJECT)
- `notes` (String) — ghi chu

### History Actions
- CREATE: sau khi tao moi co so sua chua, dong tau (F-050)
- UPDATE: sau khi cap nhat co so sua chua, dong tau (F-051)
- APPROVE_C1: sau phe duyet cap 1 (F-053)
- APPROVE_C2: sau phe duyet cap 2 (F-053)
- REJECT_C1: sau tu tuyen cap 1 (F-053)
- REJECT_C2: sau tu tuyen cap 2 (F-053)
- DELETE: sau soft delete (F-052)

## Testing Strategy
- Unit tests: Entity builder, getters/setters, JPA lifecycle callbacks
- Service tests: Get history → tra ve danh sach su kien theo thu tu thoi gian
- Controller tests: GET /api/v1/co-sua-chua-dong-tau/{id}/history, auth filters
- Integration: Tao moi → cap nhat → phe duyet C1 → phe duyet C2 → xem history → kiem tra 6 su kien
- Negative tests: Xem history du lieu khong ton tai → 404, Xem history soft-deleted → 404
- All unit tests must pass before feature seal

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Tech-Lead Plan: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/tech-lead/04-plan.md
- Source: UC-3305
