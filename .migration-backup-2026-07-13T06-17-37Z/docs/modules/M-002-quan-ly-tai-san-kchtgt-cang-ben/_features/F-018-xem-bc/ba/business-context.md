---
feature-id: F-018
document: business-context
output-mode: lean
last-updated: 2026-06-27
---
# Business Context: Xem chi tiết Bến cảng (F-018)

## BA → Handoff Summary

**Verdict:** Ready for solution architecture
**Phases completed:** BA only
**Triage rationale:** F-018 is a read-only view feature — no new domain aggregates or events are created (BenCang entity owned by F-014). However, non-trivial architectural decisions are required: field-level RBAC projection at API layer, GeoServer integration with graceful fallback, cross-entity navigation permission guard (BenCang → CangBien), and performance SLA enforcement.
**Business goal:** Enable port management staff and operators to quickly look up detailed technical information of a Bến cảng to support vessel allocation, berth planning, and infrastructure capacity assessment.
**Scope in:**
- Search/filter list by mã bến, tên bến, Cảng mẹ, loại bến, trạng thái
- Paginated result list (50/page) with sorting
- Detail page with all BenCang technical fields
- GPS map integration (GeoServer) with null fallback
- Cross-entity navigation link to parent CangBien (F-012)
- Field-level visibility control by role (RBAC)

**Key business rules:**
- BR-001: Default search excludes cho_phe_duyet and da_xoa statuses
- BR-003: Nhân viên vận hành sees only 5 basic fields (maBen, tenBen, cangMe name, loaiBen, trangThai)
- BR-004: Technical fields (dimensions, depth, coordinates, audit) restricted to Quản lý cảng and above
- BR-007: CangBien link is hyperlink only when viewer has VIEW_CANG_BIEN permission

**Actors:** A-001 (Quản trị), A-002 (Lãnh đạo), A-003 (Chuyên viên), A-004 (Người dùng tại Cảng)
**Domain highlights:** No new domain elements. Reads BenCang aggregate (F-014) and references CangBien aggregate (F-008).
**UI/UX impact:** Yes — designer required (search/filter UI, detail page layout, map component, cross-link navigation pattern)
**Screen types:** Search/filter list screen; Detail view screen with map widget
**Open items:** None blocking. Assumption: GeoServer already available in platform (same as F-012).
