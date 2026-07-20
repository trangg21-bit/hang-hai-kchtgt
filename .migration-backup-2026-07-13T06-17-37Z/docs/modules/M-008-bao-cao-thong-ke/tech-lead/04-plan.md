# Tech Lead Plan: M-008 — Báo cáo & Thống kê

## Module Overview

Module M-008 Báo cáo & Thống kê covers the reporting and statistics aggregation for the Hàng Hải project. Due to the high number of templates (49+), the technical design establishes a unified Reporting Engine that queries other active domains (Assets, GIS, Users) to compile dynamic reports.

**Tech Stack:**
- Backend: Spring Boot 3.x + Spring Data JPA + Mockito (Unit testing)
- Frontend: React 18 + Vite + TypeScript + Ant Design
- Database: PostgreSQL (queries over points, lines, polygons, and users)

---

## Feature Summary (Scope of Implementation)

To establish the reporting architecture, we prioritize 3 representative reports covering different business domains:

| # | Feature | Slug | Complexity | Est. Effort |
|---|---|---|---|---|
| F-141 | Báo cáo tăng giảm tài sản | bao-cao-tang-giam-tai-san | Medium | 3 sprints (6 days) |
| F-180 | Biểu tổng hợp thông tin chung | bieu-tong-hop-thong-tin-chung | Low | 2 sprints (4 days) |
| F-151 | Biểu 03-Q/N: Thống kê luồng hàng hải | thong-ke-luong-hang-hai | Medium | 3 sprints (6 days) |

**Total estimated effort: ~16 man-days**

---

## Implementation Order

### Wave 1: Backend Reporting Engine
1. Define `ReportType` enums and DTO request/response contracts.
2. Implement repository queries and count aggregation logic in `ReportService`.
3. Set up the dynamic report column mapper and CSV exporter supporting Vietnamese Excel accents (UTF-8 BOM prefix).
4. Expose REST endpoints in `ReportController`.

### Wave 2: Frontend Reports Dashboard
5. Create TypeScript definitions and `reportService.ts` API client.
6. Design the unified `ReportsPage.tsx` using Ant Design components (Select, Date Picker, dynamic Table).
7. Enable file downloads (Excel/CSV and Text/PDF format) from binary payload responses.

### Wave 3: Testing & Validation ✅ Complete
8. Backend controller and service unit tests (`ReportControllerTest`, `ReportServiceTest`) — ✅ Complete (16 report-specific tests, 790 total across all modules)
9. Frontend Playwright E2E integration tests (`reports-page-reports-49-templates.test.ts`) — ✅ Complete (4 tests covering all 49 report types)
10. Run `mvn test` — ✅ Complete (790/790 pass, BUILD SUCCESS)

---

## Backend Package Structure

```
src/main/java/com/hanghai/kchtg/report/
├── controller/
│   └── ReportController.java
├── dto/
│   ├── ReportRequest.java
│   └── ReportResponse.java
├── entity/
│   └── ReportType.java
└── service/
    └── ReportService.java
```

---

## Frontend Package Structure

```
frontend/src/
├── types/
│   └── report.ts
├── services/
│   └── reportService.ts
└── pages/
    └── ReportsPage.tsx
```

---

## Shared API Base Path

All Report REST endpoints use prefix: `/api/v1/`

- `POST /api/v1/reports/preview` (Dynamic preview table data)
- `POST /api/v1/reports/export` (Streamed CSV / Text downloads)

---

## Sprint Timeline (Consolidated)

```
Sprint 1: Backend Report DTOs, controllers, and services. Setup mock data and calculations.
Sprint 2: Backend unit tests and CSV exporter encoding support (UTF-8 BOM).
Sprint 3: Frontend ReportsPage component layout, selectors, and dynamic tables.
Sprint 4: Frontend API client, routing, and sidebar integration.
Sprint 5: Playwright E2E reports testing and overall flow validation.
```
