---
id: F-053
name: "Phe duyet Co so sua chua, dong tau"
slug: phe-duyet-co-so-sua-chua-dong-tau
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-29T00:00:00Z"
last-updated: "2026-06-29T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phe duyet Co so sua chua, dong tau

## Description
Quy trinh phe duyet hai cap cho co so sua chua, dong tau: truong phong phe duyet cap 1 (C1), sau do cuc truong phe duyet cap 2 (C2). Sau khi hoan tat ca hai cap phe duyet, co so sua chua, dong tau duoc chinh thuc ghi nhan trong he thong. Trong quy trinh, nguoi phe duyet co the phe duyet hoac tu tuyen (phai nhap ly do). Phe duyet 2 cap: phong → Cuc.

## Business Intent
Dam bao chat luong va tinh chinh xac cua du lieu co so sua chua, dong tau truoc khi dua vao he thong thong ke chinh thuc. Co che phe duyet hai cap giup kiem soat thong tin, giam thiểu sai sót và đảm bảo trách nhiệm giải trình trong quản lý tài sản hạ tầng hàng hải khu nước VTS. Quy trinh phe duyet 2 cap: phong (C1) → Cuc (C2).

## Flow Summary
1. Chuyen vien tao moi hoac cap nhat co so sua chua, dong tau → he thong dat trang thai PROPOSED
2. Chuyen vien gui cho phe duyet → ban ghi chuyen vao danh sach cho phe duyet cap 1
3. Truong phong (A-002) xem danh sach co so sua chua, dong tau cho phe duyet → phe duyet hoac tu tuyen
4. Phe duyet C1 thanh cong → trang thai chuyen thanh UNDER_REVIEW, chuyen vao danh sach cho phe duyet cap 2
5. Cuc truong (A-004) xem danh sach co so sua chua, dong tau cho phe duyet cap 2 → phe duyet hoac tu tuyen
6. Phe duyet C2 thanh cong → trang thai chuyen thanh APPROVED, chinh thuc ghi nhan
7. Neu tu tuyen → trang thai = REJECTED, gui ve cho chuyen vien, chuyen vien co the sua va gui lai

## Acceptance Criteria
- [x] Phe duyet Co so sua chua, dong tau thanh cong
- [x] Phe duyet 2 cap: phong (C1) → Cuc (C2)
- [x] Phe duyet C1: PROPOSED → UNDER_REVIEW
- [x] Phe duyet C2: UNDER_REVIEW → APPROVED
- [x] Tu tuyen → trang thai = REJECTED, gui ve cho chuyen vien
- [x] Ly do tu tuyen la buoc khi tu tuyen
- [x] Ghi nhan phe duyet lich su sau moi quyet dinh

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
- Auto-approve theo quy tac
- Export Excel/PDF

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Tao/Cap nhat/Xoa | Chi du lieu PROPOSED/UNDER_REVIEW/REJECTED |
| A-002 (Lanh dao) | Phe duyet C1 (Phong) | PROPOSED → UNDER_REVIEW |
| A-004 (Lanh dao Cuc) | Phe duyet C2 (Cuc) | UNDER_REVIEW → APPROVED |

## Entities

| Entity | Table | Primary Key | Description |
|---|---|---|---|
| CoSoSuaChuaDongTau | co_sua_chua_dong_tau | id | Entity chinh, 16 fields |
| CoSoSuaChuaDongTauAttachment | co_sua_chua_dong_tau_attachment | id | Tai lieu dinh kem (MinIO) |
| PheDuyetLichSu | phe_duyet_lich_su | id | History log |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-053-01 | 2 cap duyet: phong → Cuc | Approve | UC-3303 |
| BR-053-02 | Phe duyet C1: PROPOSED → UNDER_REVIEW | Approve C1 | DESIGN.md |
| BR-053-03 | Phe duyet C2: UNDER_REVIEW → APPROVED | Approve C2 | DESIGN.md |
| BR-053-04 | Ly do tu tuyen la buoc khi tu tuyen | Reject | DESIGN.md |
| BR-053-05 | Ghi nhan phe duyet lich su sau moi quyet dinh | Approve | DESIGN.md |
| BR-053-06 | Khong duoc phe duyet cap 2 neu dang PROPOSED | Approve | DESIGN.md |

## Technical Details

### REST Endpoints
- `GET /api/v1/co-sua-chua-dong-tau/pending/c1` — Danh sach co so sua chua, dong tau cho phe duyet cap 1 (A-002)
- `POST /api/v1/co-sua-chua-dong-tau/{id}/approve/c1` — Phe duyet cap 1
- `POST /api/v1/co-sua-chua-dong-tau/{id}/reject/c1` — Tu tuyen cap 1
- `GET /api/v1/co-sua-chua-dong-tau/pending/c2` — Danh sach co so sua chua, dong tau cho phe duyet cap 2 (A-004)
- `POST /api/v1/co-sua-chua-dong-tau/{id}/approve/c2` — Phe duyet cap 2
- `POST /api/v1/co-sua-chua-dong-tau/{id}/reject/c2` — Tu tuyen cap 2

### DTO Fields
- Approve C1: `approverId` (nguoi phe duyet C1), `approvedAt` (thoi gian phe duyet)
- Reject C1: `approverId`, `rejectedAt`, `reason` (ly do, buoc)
- Approve C2: `approverId` (nguoi phe duyet C2), `approvedAt` (thoi gian phe duyet)
- Reject C2: `approverId`, `rejectedAt`, `reason` (ly do, buoc)

### State Machine
- PROPOSED --[C1 approve]→ UNDER_REVIEW --[C2 approve]→ APPROVED
- UNDER_REVIEW --[C1 reject]→ REJECTED
- PROPOSED --[C1 reject]→ REJECTED
- REJECTED --[C2 reject]→ REJECTED (gui ve chuyen vien)

## Testing Strategy
- Unit tests: State machine transitions (PROPOSED→UNDER_REVIEW→APPROVED, PROPOSED→REJECTED, etc.)
- Service tests: Approve C1 → validate → update state → ghi history; Reject C1 → validate reason → update state
- Controller tests: POST /api/v1/co-sua-chua-dong-tau/{id}/approve/c1, auth filters, role-based access
- Integration: Tao moi → gui phe duyet → C1 approve → C2 approve (end-to-end); Reject at any stage
- Negative tests: C2 approve du lieu PROPOSED → 400; Reject without reason → 400
- All unit tests must pass before feature seal

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Tech-Lead Plan: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/tech-lead/04-plan.md
- Source: UC-3303
