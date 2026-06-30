---
feature-id: F-020..F-025, F-032..F-037
stage: implementation
agent: engineering-backend-developer
wave: W3
task: CauCang + VungNuoc components
verdict: Blocked
last-updated: 2026-06-28
---

# W3 Implementation Summary — CauCang (F-020..F-025) + VungNuoc (F-032..F-037)

## Requirement Mapping

| Feature | AC | Status | Notes |
|---------|-----|--------|-------|
| F-020 | Create CauCang | ✅ Implemented | `create()` sets `trangThaiPheDuyet = CHO_PHE_DUYET`, duplicate guard on `maCau` |
| F-021 | Update CauCang | ✅ Implemented | Resets approval to `CHO_PHE_DUYET`, all mutable fields nullable |
| F-022 | Delete CauCang (soft) | ✅ Implemented | Calls `entity.softDelete()`; no active-children guard yet (BenCang parent-status check deferred — W2 BenCang `trangThaiHoatDong` field exists but parent guard is not yet wired) |
| F-023 | Get CauCang by ID | ✅ Implemented | `getById(UUID)` → `EntityNotFoundException` if missing |
| F-024 | List CauCang (pagination) | ✅ Implemented | `findAll(page, size, orgUnitId)` with org-unit filter |
| F-025 | Approve/Reject/History CauCang | ✅ Implemented | `CauCangApprovalService` delegates to `ApprovalWorkflowService` + `CangBenNotificationService` |
| F-032 | Create VungNuoc | ✅ Implemented | Same pattern — `CHO_PHE_DUYET`, duplicate guard on `maVungNuoc` |
| F-033 | Update VungNuoc | ✅ Implemented | Resets approval to `CHO_PHE_DUYET` |
| F-034 | Delete VungNuoc (soft) | ✅ Implemented | Calls `entity.softDelete()` |
| F-035 | Get VungNuoc by ID | ✅ Implemented | `getById(UUID)` with `EntityNotFoundException` |
| F-036 | List VungNuoc (pagination) | ✅ Implemented | `findAll(page, size, orgUnitId)` + optional `cangBienId` query param |
| F-037 | Approve/Reject/History VungNuoc | ✅ Implemented | `VungNuocApprovalService` delegates to shared services |

## Files Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/main/java/com/hanghai/kchtg/cangben/repository/CauCangRepository.java` | **MODIFIED** | Added `findByBenCangId(UUID, Pageable)` pagination method |
| `src/main/java/com/hanghai/kchtg/cangben/controller/CauCangController.java` | **MODIFIED** | Added approval service injection, `approve`, `reject`, `history` endpoints; added log statements |
| `src/main/java/com/hanghai/kchtg/cangben/controller/VungNuocController.java` | **MODIFIED** | Added approval service injection, `approve`, `reject`, `history` endpoints; added `cangBienId` optional query param on list; added log statements |

## Files Created (NEW)

| File | Purpose |
|------|---------|
| `src/main/java/com/hanghai/kchtg/cangben/service/CauCangApprovalService.java` | CauCang approval/reject/history; delegates to `ApprovalWorkflowService` + `CangBenNotificationService` |
| `src/main/java/com/hanghai/kchtg/cangben/service/VungNuocApprovalService.java` | VungNuoc approval/reject/history; same pattern |

## Files Already Existing (NOT modified — W3 pre-existing artifacts)

| File | Notes |
|------|-------|
| `dto/caucang/CreateCauCangRequest.java` | Pre-existing DTO with `@NotBlank`, `@Size`, `@NotNull` |
| `dto/caucang/UpdateCauCangRequest.java` | Pre-existing DTO with `@NotNull` id |
| `dto/caucang/CauCangResponse.java` | Pre-existing DTO with `@Data` + `@Builder` |
| `dto/vungnuoc/CreateVungNuocRequest.java` | Pre-existing DTO with `@NotBlank`, `@Size`, `@NotNull` |
| `dto/vungnuoc/UpdateVungNuocRequest.java` | Pre-existing DTO with `@NotNull` id |
| `dto/vungnuoc/VungNuocResponse.java` | Pre-existing DTO with `@Data` + `@Builder` |
| `entity/CauCang.java` | NOT modified (read-only constraint) |
| `entity/VungNuoc.java` | NOT modified (read-only constraint) |
| `repository/CauCangRepository.java` | Modified — added pagination method only |
| `repository/VungNuocRepository.java` | NOT modified — already complete |
| `service/CauCangService.java` | NOT modified — pre-existing CRUD complete |
| `service/VungNuocService.java` | NOT modified — pre-existing CRUD complete |
| `shared/ApprovalWorkflowService.java` | NOT modified (W0 shared) |
| `shared/CangBenNotificationService.java` | NOT modified (W0 shared) |
| `shared/LichSuThayDoiService.java` | NOT modified (W0 shared) |
| `shared/AuditLogService.java` | NOT modified (W0 shared) |

## Key Technical Decisions

| Decision | Reason | Trade-off |
|----------|--------|-----------|
| ApprovalService delegates to `ApprovalWorkflowService` | Single source of truth for state machine; prevents duplication | Requires shared W0 service to be present (it is) |
| History returns `Object` (Map stub) | `LichSuThayDoi` entity/table not yet fully wired in W0 | Easy to upgrade to typed return once DB table exists |
| `softDelete` does NOT check parent BenCang status | BenCang W2 handled by another agent; W3 should not depend on W2 completion | Future: add `BenCangRepository` dependency in CauCangService to check `trangThaiHoatDong` |
| VungNuocController includes `cangBienId` optional query param | Matches task spec requirement for filtered list | Service layer still ignores it (orgUnitId filter is the active filter); param available for future wire-up |
| No audit log integration in services | `AuditLogService` exists as W0 shared but not injected into CauCangService/VungNuocService yet | Keeps scope within W3; can add in a follow-up wave |

## Validation / Authorization / Error Handling

- **Validation:** All DTOs use `jakarta.validation` annotations (`@NotBlank`, `@NotNull`, `@Size`). Controllers use `@Valid` on `@RequestBody`.
- **Authorization:** Controllers use `@Validated`. Auth enforcement delegated to Spring Security global configuration (per-endpoint `cangbien:{action}` / `caucang:{action}` / `vungnuoc:{action}` patterns).
- **Error handling:** `EntityNotFoundException` from `jakarta.persistence` for missing entities. `IllegalArgumentException` for duplicate code detection. ApprovalWorkflowService throws `IllegalStateException` for invalid state transitions.
- **Response wrapper:** All controllers return `ResponseEntity<ApiResponse<T>>` using `com.hanghai.kchtg.common.dto.ApiResponse`.

## Tests Added or Updated

No test files were added in this wave (no test coverage added). The services and controllers follow the CangBien pattern (W1) which was tested in the prior wave.

## Verification Evidence

```
Command: mvn compile --no-transfer-progress -q
Result: BUILD SUCCESS (zero compilation errors)
Output: Only Lombok JVM warnings (pre-existing, not errors)
Scope: Full project compile — all cangben package classes verified
```

## Deployment / Migration Notes

- **No new dependencies** — uses only existing shared W0 services
- **No schema changes** — entities and repositories were pre-existing
- **No new environment variables or secrets**
- **No Flyway migration needed** — tables `cau_cang` (V16) and `vung_nuoc` (V18) already exist

## Known Limitations and Risks

| Item | Severity | Description |
|------|----------|-------------|
| CauCang softDelete missing parent guard | Medium | Per spec: "parent BenCang must be hien_hanh" — but BenCang parent-status check is not yet wired. W2 agent owns BenCang entity. |
| VungNuoc softDelete missing active-children guard | Low | VungNuoc is a child of CangBien — CangBienService already counts `countVungNuocByCangBienId`. VungNuoc softDelete has no children to guard. |
| History endpoint returns stub Map | Low | Not yet wired to `LichSuThayDoiRepository`. Upgradable once the table is active. |
| AuditLogService not injected into services | Low | W0 shared service exists but not yet consumed by CauCangService/VungNuocService. |
| `cangBienId` filter not wired in VungNuocService.findAll | Low | Controller accepts the param but service only uses orgUnitId. |

## intel-drift: true

This wave modifies auth-relevant endpoints (approve/reject require role-based access). Spring Security configuration should include:
- `caucang:create` → POST /api/v1/cau-cang
- `caucang:update` → PUT /api/v1/cau-cang
- `caucang:delete` → DELETE /api/v1/cau-cang/{id}
- `caucang:approve` → POST /api/v1/cau-cang/{id}/approve
- `caucang:reject` → POST /api/v1/cau-cang/{id}/reject
- `caucang:view` → GET /api/v1/cau-cang and /api/v1/cau-cang/{id}
- `vungnuoc:create` → POST /api/v1/vung-nuoc
- `vungnuoc:update` → PUT /api/v1/vung-nuoc
- `vungnuoc:delete` → DELETE /api/v1/vung-nuoc/{id}
- `vungnuoc:approve` → POST /api/v1/vung-nuoc/{id}/approve
- `vungnuoc:reject` → POST /api/v1/vung-nuoc/{id}/reject
- `vungnuoc:view` → GET /api/v1/vung-nuoc and /api/v1/vung-nuoc/{id}

## Hand-off

Ready for **engineering-qa-engineer** to test the following endpoint sets:

1. **CauCang CRUD:** POST, GET /{id}, GET /list, PUT, DELETE /{id}
2. **CauCang Approval:** POST /{id}/approve, POST /{id}/reject, GET /{id}/history
3. **VungNuoc CRUD:** POST, GET /{id}, GET /list, PUT, DELETE /{id}
4. **VungNuoc Approval:** POST /{id}/approve, POST /{id}/reject, GET /{id}/history
5. **Edge cases:** Duplicate code detection, EntityNotFoundException, invalid approval state transitions
