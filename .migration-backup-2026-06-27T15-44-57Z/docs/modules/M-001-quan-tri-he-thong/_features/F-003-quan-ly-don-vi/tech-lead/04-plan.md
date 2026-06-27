# Tech Lead Plan: F-003 — Quản lý đơn vị

## 1. Implementation Tasks

### Backend Tasks (Estimated: 2.5–3.5 days)

| # | Task | File Path | Complexity |
|---|---|---|---|
| 1.1 | Entity: `Unit.java` | `src/main/java/vn/eg/haihang/model/entity/Unit.java` | Medium |
| 1.2 | Entity: `UnitHistory.java` | `src/main/java/vn/eg/haihang/model/entity/UnitHistory.java` | Low |
| 1.3 | Entity: `OrganizationChart.java` | `src/main/java/vn/eg/haihang/model/entity/OrganizationChart.java` | Low |
| 1.4 | Repository: `UnitRepository.java` (custom CTE queries) | `src/main/java/vn/eg/haihang/repository/UnitRepository.java` | High |
| 1.5 | Repository: `UnitHistoryRepository.java` | `src/main/java/vn/eg/haihang/repository/UnitHistoryRepository.java` | Low |
| 1.6 | Repository: `OrganizationChartRepository.java` | `src/main/java/vn/eg/haihang/repository/OrganizationChartRepository.java` | Low |
| 1.7 | DTO: `UnitCreateDTO`, `UnitUpdateDTO`, `UnitTreeNodeDTO`, `UnitApprovalDTO` | `src/main/java/vn/eg/haihang/dto/` | Medium |
| 1.8 | Service: `UnitService.java` | `src/main/java/vn/eg/haihang/service/UnitService.java` | High |
| 1.9 | Service: `UnitTreeService.java` (CTE recursive queries) | `src/main/java/vn/eg/haihang/service/UnitTreeService.java` | High |
| 1.10 | Service: `UnitApprovalService.java` | `src/main/java/vn/eg/haihang/service/UnitApprovalService.java` | Medium |
| 1.11 | Service: `UnitHistoryService.java` | `src/main/java/vn/eg/haihang/service/UnitHistoryService.java` | Low |
| 1.12 | Builder: `UnitTreeNodeBuilder.java` | `src/main/java/vn/eg/haihang/builder/UnitTreeNodeBuilder.java` | Medium |
| 1.13 | Strategy: `ApprovalStrategy` + implementations | `src/main/java/vn/eg/haihang/strategy/` | Medium |
| 1.14 | Controller: `UnitController.java` | `src/main/java/vn/eg/haihang/controller/UnitController.java` | High |
| 1.15 | Event: `UnitAuditEventListener.java` | `src/main/java/vn/eg/haihang/event/UnitAuditEventListener.java` | Medium |
| 1.16 | Exception: Custom exceptions (UnitHasChildrenException, etc.) | `src/main/java/vn/eg/haihang/exception/` | Low |
| 1.17 | Config: Tree depth limit, approval config | `src/main/resources/application.yml` | Low |

### Frontend Tasks (Estimated: 2–3 days)

| # | Task | File Path | Complexity |
|---|---|---|---|
| 2.1 | API client: `unitApi.ts` | `src/services/api/unitApi.ts` | Medium |
| 2.2 | Type definitions: `unitTypes.ts` | `src/types/unitTypes.ts` | Medium |
| 2.3 | Hook: `useUnits.ts` (tree data, pagination) | `src/hooks/useUnits.ts` | Medium |
| 2.4 | Page: `UnitListPage.tsx` | `src/pages/admin/UnitListPage.tsx` | High |
| 2.5 | Page: `UnitTreeViewPage.tsx` | `src/pages/admin/UnitTreeViewPage.tsx` | High |
| 2.6 | Page: `UnitCreatePage.tsx` | `src/pages/admin/UnitCreatePage.tsx` | Medium |
| 2.7 | Page: `UnitApprovalPage.tsx` | `src/pages/admin/UnitApprovalPage.tsx` | Medium |
| 2.8 | Component: `UnitTreeComponent.tsx` (Ant Design Tree) | `src/components/admin/UnitTreeComponent.tsx` | High |
| 2.9 | Component: `UnitForm.tsx` | `src/components/admin/UnitForm.tsx` | Medium |
| 2.10 | Component: `UnitApprovalModal.tsx` | `src/components/admin/UnitApprovalModal.tsx` | Low |
| 2.11 | Routing: add admin routes in `App.tsx` | `src/App.tsx` | Low |

---

## 2. API Routes

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/v1/units` | `UnitController.listUnits()` | system-admin |
| GET | `/api/v1/units/tree` | `UnitController.getUnitTree()` | system-admin |
| GET | `/api/v1/units/{id}` | `UnitController.getUnitById()` | system-admin |
| POST | `/api/v1/units` | `UnitController.createUnit()` | system-admin / can_bo |
| PUT | `/api/v1/units/{id}` | `UnitController.updateUnit()` | system-admin |
| DELETE | `/api/v1/units/{id}` | `UnitController.deleteUnit()` | system-admin |
| GET | `/api/v1/units/{id}/children` | `UnitController.getChildren()` | system-admin |
| GET | `/api/v1/units/{id}/ancestors` | `UnitController.getAncestors()` | system-admin |
| GET | `/api/v1/units/{id}/descendants` | `UnitController.getDescendants()` | system-admin |
| PATCH | `/api/v1/units/{id}/approve` | `UnitController.approveUnit()` | system-admin |
| PATCH | `/api/v1/units/{id}/reject` | `UnitController.rejectUnit()` | system-admin |
| GET | `/api/v1/units?status=pending` | `UnitController.getPendingUnits()` | system-admin |
| GET | `/api/v1/units/search` | `UnitController.searchUnits()` | system-admin |
| GET | `/api/v1/units/{id}/users` | `UnitController.getUnitUsers()` | system-admin |

---

## 3. Component Structure

```
src/
├── pages/
│   └── admin/
│       ├── UnitListPage.tsx             ← Bảng đơn vị với filter type/status
│       ├── UnitTreeViewPage.tsx         ← Cây tổ chức Ant Design Tree
│       ├── UnitCreatePage.tsx           ← Form tạo đơn vị (parent, coefficient)
│       └── UnitApprovalPage.tsx         ← Danh sách chờ duyệt + approve/reject
├── components/
│   └── admin/
│       ├── UnitTreeComponent.tsx        ← Recursive tree with expand/collapse
│       ├── UnitForm.tsx                 ← Form (name, code, type, parent, coefficient)
│       └── UnitApprovalModal.tsx        ← Modal approve/reject với notes
├── hooks/
│   └── useUnits.ts                      ← React Query hook (tree, list, approval)
├── services/
│   └── api/
│       └── unitApi.ts                   ← axios instance + unit endpoints
├── types/
│   └── unitTypes.ts                     ← Unit, UnitTreeNode, UnitHistory interfaces
└── App.tsx                              ← Router thêm routes admin/units/*
```

---

## 4. Database Schema (Flyway Migrations)

### V1__F-003_init_units.sql
```sql
-- Units table (self-referencing tree)
CREATE TABLE units (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL,
    unit_type VARCHAR(30) NOT NULL CHECK (unit_type IN ('cuc', 'chi_cuc', 'cang', 'dao', 'tct')),
    description NVARCHAR(1000),
    address NVARCHAR(500),
    coefficient DECIMAL(5,2) CHECK (coefficient > 0),
    parent_id BIGINT FOREIGN KEY REFERENCES units(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
    created_by BIGINT FOREIGN KEY REFERENCES user_accounts(id),
    approved_by BIGINT FOREIGN KEY REFERENCES user_accounts(id),
    level INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    effective_date DATE NULL,
    approved_at DATETIME2 NULL,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    deleted_at DATETIME2 NULL
);
GO

CREATE UNIQUE INDEX idx_units_code ON units(code);
CREATE INDEX idx_units_name ON units(name);
CREATE INDEX idx_units_parent_id ON units(parent_id);
CREATE INDEX idx_units_type ON units(unit_type);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_units_level_sort ON units(level, sort_order);

CREATE TRIGGER trg_units_updated
ON units
AFTER UPDATE
AS
BEGIN
    UPDATE units SET updated_at = SYSUTCDATETIME()
    WHERE id IN (SELECT id FROM inserted);
END;
GO
```

### V2__F-003_init_unit_histories.sql
```sql
-- Unit History audit trail
CREATE TABLE unit_histories (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    unit_id BIGINT NOT NULL FOREIGN KEY REFERENCES units(id) ON DELETE CASCADE,
    performed_by BIGINT FOREIGN KEY REFERENCES user_accounts(id),
    action VARCHAR(30) NOT NULL CHECK (action IN ('create', 'modify', 'delete', 'approve', 'reject')),
    notes NVARCHAR(1000),
    details NVARCHAR(MAX),  -- JSON diff
    performed_at DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

CREATE INDEX idx_unit_histories_unit_id ON unit_histories(unit_id);
CREATE INDEX idx_unit_histories_performed_at ON unit_histories(performed_at);
```

### V3__F-003_init_organization_charts.sql
```sql
-- Organization chart overlay
CREATE TABLE organization_charts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    unit_id BIGINT NOT NULL FOREIGN KEY REFERENCES units(id) ON DELETE CASCADE,
    parent_id BIGINT FOREIGN KEY REFERENCES units(id),
    level INT,
    sort_order INT,
    effective_date DATE
);
GO

CREATE UNIQUE INDEX idx_org_chart_unit_id ON organization_charts(unit_id);
CREATE INDEX idx_org_chart_parent_id ON organization_charts(parent_id);
CREATE INDEX idx_org_chart_level ON organization_charts(level);
```

---

## 5. Estimated Complexity

| Area | Complexity | Notes |
|---|---|---|
| Entity + Repository | Medium | Self-referencing entity, nested set + CTE queries |
| Tree Query (CTE) | High | Recursive CTE for tree traversal, ancestor/descendant queries |
| Approval Workflow | Medium | Status machine: pending → active/rejected |
| Frontend (Tree View) | High | Recursive Ant Design Tree, expand/collapse, drag-sort |
| Frontend (CRUD) | Medium | Form with parent selector (tree dropdown), coefficient validation |
| **Overall** | **High** | Tree queries + approval workflow + tree UI = highest complexity in M-001 |

---

## 6. Sprint Breakdown (Wave 1)

| Sprint | Tasks | Deliverable |
|---|---|---|
| Sprint 1 (Days 1–2) | Entities, Repositories (incl. CTE native queries), DTOs, V1–V3 migrations | DB schema ready |
| Sprint 2 (Days 3–4) | UnitService, UnitTreeService, UnitApprovalService, UnitController | Core CRUD + tree APIs |
| Sprint 3 (Days 5) | UnitHistoryService, approval events | Audit + approval workflow |
| Sprint 4 (Days 6–7) | Frontend: UnitListPage, UnitForm, APIs | Unit CRUD UI |
| Sprint 5 (Days 8–9) | Frontend: UnitTreeViewPage, UnitTreeComponent | Tree view UI |
| Sprint 6 (Day 10) | Frontend: UnitApprovalPage, integration testing | Approval UI + QA |
