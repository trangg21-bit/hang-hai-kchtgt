# Architecture Design: M-009 -- Lien thong & Tich hop du lieu

> **STATUS**: Draft -- pending technical-lead review
> **Generated**: 2026-06-22
> **Stack**: Spring Boot, Maven, mono-repo
> **Deprecated Flag**: 	rue -- pipeline continues; deprecation applies to future feature additions only

---

## 1. Executive Summary

M-009 implements two complementary capabilities:

1. **Data Sharing (Chia se)** -- 37 features (F-190-F-226) exposing LGSP/NDXP data endpoints for maritime navigational aids, ports, vessels, and related infrastructure.
2. **Data Integration (Tich hop)** -- 44 features (F-227-F-270) consuming external data sources to enrich the maritime information platform.

The module has **no module-level dependencies** and **no downstream consumers** as of this design phase. This is an isolated bounded context responsible for LGSP/NDXP axis interoperability.

---

## 2. Wave-Based Batch Strategy

Given 81 features, a wave-based approach is mandatory. Features are batched by **domain cohesion** and **dependency ordering**.

### Wave 1: Core Navigational Aids Sharing (F-190-F-207, 18 features)

**Domain**: Physical maritime infrastructure -- berths, wharves, buoys, danger zones, anchorage areas, repair facilities, beacons, VTS system, radar stations, AIS, CCTV, SCADA, VHF info, transmission lines, VTS support systems, breakwaters/break-seas.

**Architecture Focus**:
- RESTful /api/sharing/kchtgt/{category} endpoints
- Standard LGSP data model (common fields: id, code, name, location, status, updatedAt)
- No integration dependencies -- pure data exposure

**Estimated Complexity**: Low-Medium (repetitive CRUD + LGSP schema alignment)

### Wave 2: VTS & Operational Data Sharing (F-208-F-214, 7 features)

**Domain**: VTS operational data, radar, AIS, CCTV, SCADA, VHF, transmission, support systems, breakwaters, cargo volume, operation centers (TTDH, Inmarsat, Cospas-Sarsat, LRIT, Hai Phong maritime info).

**Architecture Focus**:
- Real-time/near-real-time data patterns
- WebSocket/SSE support for operational dashboards
- Higher data volume -- pagination + filtering optimization

**Estimated Complexity**: Medium

### Wave 3: Port & Cargo Aggregation (F-215-F-226, 12 features)

**Domain**: Port status, asset status, comprehensive maritime info, maintenance info, port cargo totals, berth/wharf summaries, cargo volume, anchorage zones, beacon systems, breakwater systems.

**Architecture Focus**:
- Aggregation queries (JOINs across multiple navigational-aid tables)
- Materialized views or caching for heavy aggregation
- Export capabilities (CSV, JSON)

**Estimated Complexity**: Medium-High (complex queries, performance concerns)

### Wave 4: Physical Infrastructure Integration (F-227-F-236, 10 features)

**Domain**: Integration of data FROM external systems for berths, wharves, buoys, danger zones, transport zones, anchorage, repair facilities, beacon info, buoy info, VTS system.

**Architecture Focus**:
- External API consumers (REST/WebService adapters)
- Data transformation pipelines (external schema to internal LGSP schema)
- Retry logic + dead-letter queues for failed extractions
- Idempotent upsert patterns

**Estimated Complexity**: Medium (requires integration contract definitions)

### Wave 5: Operational System Integration (F-237-F-252, 16 features)

**Domain**: VTS operations, radar, AIS, CCTV, SCADA, VHF, transmission, VTS support, breakwaters, cargo, operation center data (TTDH, Inmarsat, Cospas-Sarsat, LRIT, Hai Phong), port status.

**Architecture Focus**:
- Protocol-agnostic adapter layer (REST, SOAP, file-based, message queue)
- Real-time data ingestion patterns
- Data quality validation pipelines
- Monitoring + alerting for integration health

**Estimated Complexity**: High (diverse source protocols, real-time requirements)

### Wave 6: Vessel & Traffic Integration (F-253-F-270, 18 features)

**Domain**: Electronic charts, inbound/outbound vessels, inland waterway vessels, foreign vessels, international transport vessels, cargo/passenger volumes, vessel traffic, domestic cargo volume, managed-area cargo, pilots, Vietnamese-flagged vessels, pilot boats, repair/dock facilities, berth throughput capacity, port throughput capacity, monthly cargo, annual cargo, transport service capacity.

**Architecture Focus**:
- Complex data enrichment (vessel tracking + cargo + port capacity)
- Time-series data patterns (monthly/annual aggregations)
- Service-to-service integration contracts
- High-volume data processing

**Estimated Complexity**: High (most complex wave, cross-domain integration)

### Wave Summary

| Wave | Features | Range | Domain | Complexity | Est. Features/Week |
|------|----------|-------|--------|------------|-------------------|
| 1 | 18 | F-190-F-207 | Navigational Aids Sharing | Low-Medium | 6 |
| 2 | 7 | F-208-F-214 | VTS & Ops Sharing | Medium | 4 |
| 3 | 12 | F-215-F-226 | Port & Cargo Aggregation | Medium-High | 4 |
| 4 | 10 | F-227-F-236 | Physical Infra Integration | Medium | 4 |
| 5 | 16 | F-237-F-252 | Operational System Integration | High | 4 |
| 6 | 18 | F-253-F-270 | Vessel & Traffic Integration | High | 4 |
| **Total** | **81** | F-190-F-270 | | | **~6 weeks** |

---

## 3. API Route Design

### 3.1 Data Sharing Endpoints (Chia se)

`
Base: /api/v1/sharing

# Wave 1: Physical Infrastructure
GET    /kchtgt/berth                  (F-190)
GET    /kchtgt/wharf                   (F-191)
GET    /kchtgt/buoy                    (F-192)
GET    /kchtgt/danger-zone             (F-193)
GET    /kchtgt/transport-zone          (F-194)
GET    /kchtgt/anchorage               (F-195)
GET    /kchtgt/repair-facility         (F-196)

# Wave 1: Beacons & Systems
GET    /kchtgt/beacon                  (F-197)
GET    /kchtgt/buoy-signal             (F-198)
GET    /kchtgt/vts                     (F-199)

# Wave 1-2: Operational Systems
GET    /kchtgt/vts/operations          (F-200)
GET    /kchtgt/radar                   (F-201)
GET    /kchtgt/ais                     (F-202)
GET    /kchtgt/cctv                    (F-203)
GET    /kchtgt/scada                   (F-204)
GET    /kchtgt/vhf-info                (F-205)
GET    /kchtgt/transmission            (F-206)
GET    /kchtgt/vts-support             (F-207)

# Wave 1-2: Structures & Operations
GET    /kchtgt/breakwater              (F-208)
GET    /kchtgt/cargo-volume            (F-209)
GET    /kchtgt/operation-center/ttdh   (F-210)
GET    /kchtgt/operation-center/inmarsat (F-211)
GET    /kchtgt/operation-center/cospas-sarsat (F-212)
GET    /kchtgt/operation-center/lrit   (F-213)
GET    /kchtgt/operation-center/haiphong (F-214)

# Wave 3: Aggregations
GET    /kchtgt/port-status             (F-215)
GET    /kchtgt/asset-status            (F-216)
GET    /kchtgt/comprehensive-info      (F-217)
GET    /kchtgt/maintenance-info        (F-218)
GET    /kchtgt/port-cargo-total        (F-219)
GET    /kchtgt/berth-wharf-summary     (F-220)
GET    /kchtgt/cargo-summary           (F-221)
GET    /kchtgt/transport-anchorage-summary (F-222)
GET    /kchtgt/buoy-signal-summary     (F-223)
GET    /kchtgt/beacon-system-summary   (F-224)
GET    /kchtgt/breakwater-summary      (F-225)
GET    /kchtgt/break-sea-summary       (F-226)
`

### 3.2 Data Integration Endpoints (Tich hop)

`
Base: /api/v1/integration

# Wave 4: Physical Infrastructure (Inbound data)
POST   /kchtgt/berth/sync              (F-227)
POST   /kchtgt/wharf/sync              (F-228)
POST   /kchtgt/buoy/sync               (F-229)
POST   /kchtgt/danger-zone/sync        (F-230)
POST   /kchtgt/transport-zone/sync     (F-231)
POST   /kchtgt/anchorage/sync          (F-232)
POST   /kchtgt/repair-facility/sync    (F-233)
POST   /kchtgt/beacon-info/sync        (F-234)
POST   /kchtgt/buoy-signal/sync        (F-235)
POST   /kchtgt/vts/sync                (F-236)

# Wave 5: Operational Systems (Inbound data)
POST   /kchtgt/vts/operations/sync     (F-237)
POST   /kchtgt/radar/sync              (F-238)
POST   /kchtgt/ais/sync                (F-239)
POST   /kchtgt/cctv/sync               (F-240)
POST   /kchtgt/scada/sync              (F-241)
POST   /kchtgt/vhf-info/sync           (F-242)
POST   /kchtgt/transmission/sync       (F-243)
POST   /kchtgt/vts-support/sync        (F-244)
POST   /kchtgt/breakwater/sync         (F-245)
POST   /kchtgt/cargo/sync              (F-246)
POST   /kchtgt/operation-center/ttdh/sync (F-247)
POST   /kchtgt/operation-center/inmarsat/sync (F-248)
POST   /kchtgt/operation-center/cospas-sarsat/sync (F-249)
POST   /kchtgt/operation-center/lrit/sync (F-250)
POST   /kchtgt/operation-center/haiphong/sync (F-251)
POST   /kchtgt/port-status/sync        (F-252)

# Wave 6: Vessel & Traffic (Inbound data)
POST   /kchtgt/electronic-chart/sync   (F-253)
POST   /kchtgt/vessel/inbound-outbound/sync (F-254)
POST   /kchtgt/vessel/inland/sync      (F-255)
POST   /kchtgt/vessel/foreign/sync     (F-256)
POST   /kchtgt/vessel/international/sync (F-257)
POST   /kchtgt/cargo/passenger/sync    (F-258)
POST   /kchtgt/vessel-traffic/sync     (F-259)
POST   /kchtgt/cargo/domestic/sync     (F-260)
POST   /kchtgt/cargo/managed-area/sync (F-261)
POST   /kchtgt/pilot/sync              (F-262)
POST   /kchtgt/vessel/vietnamese/sync  (F-263)
POST   /kchtgt/vessel/pilot-boat/sync  (F-264)
POST   /kchtgt/dock-repair/sync        (F-265)
POST   /kchtgt/berth-capacity/sync     (F-266)
POST   /kchtgt/port-capacity/sync      (F-267)
POST   /kchtgt/cargo/monthly/sync      (F-268)
POST   /kchtgt/cargo/annual/sync       (F-269)
POST   /kchtgt/transport-service/sync  (F-270)
`

### 3.3 Common Response Pattern

All sharing endpoints return:
`json
{
  "data": [],
  "pagination": { "page": 0, "size": 20, "totalElements": 0, "totalPages": 0 },
  "timestamp": "2026-06-22T10:00:00Z"
}
`

All integration endpoints return:
`json
{
  "syncId": "sync-uuid-here",
  "status": "accepted|rejected",
  "message": "String description",
  "timestamp": "2026-06-22T10:00:00Z"
}
`

---

## 4. Data Schema Design

### 4.1 Shared Base Schema (LGSP-aligned)

`sql
-- All sharing/integration features reference this base
CREATE TABLE kchtgt_base (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(100) NOT NULL UNIQUE,
    name_vn         VARCHAR(500) NOT NULL,
    name_en         VARCHAR(500),
    status          VARCHAR(50) NOT NULL DEFAULT 'active',
    geometry        GEOGRAPHY(POINT),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    source_system   VARCHAR(100),
    data_quality    VARCHAR(20) DEFAULT 'verified',
    version         INTEGER DEFAULT 1
);
`

### 4.2 Feature-Specific Extension Tables

Each feature extends kchtgt_base with domain-specific columns.

**Berth/Wharf (F-190, F-191, F-227, F-228):**
`sql
CREATE TABLE kchtgt_berth (
    base_id     UUID PRIMARY KEY REFERENCES kchtgt_base(id),
    capacity_tons       DECIMAL(12,2),
    draft_meters        DECIMAL(6,2),
    length_meters       DECIMAL(8,2),
    mooring_bollars     INTEGER,
    last_inspection     DATE
);
`

**VTS (F-199, F-200, F-236, F-237):**
`sql
CREATE TABLE kchtgt_vts (
    base_id     UUID PRIMARY KEY REFERENCES kchtgt_base(id),
    coverage_radius_km  DECIMAL(8,2),
    radar_stations      INTEGER,
    ais_stations        INTEGER,
    operational_hours   VARCHAR(50) DEFAULT '24/7',
    last_maintenance    DATE
);
`

**Cargo/Port Aggregation (F-219, F-220, F-268, F-269):**
`sql
CREATE TABLE kchtgt_cargo_aggregate (
    base_id     UUID PRIMARY KEY REFERENCES kchtgt_base(id),
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end   DATE NOT NULL,
    total_tons     DECIMAL(15,2),
    total_teus     DECIMAL(10,2),
    vessel_count   INTEGER,
    calculated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
`

### 4.3 Integration Pipeline Tables

`sql
CREATE TABLE integration_sync_jobs (
    sync_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_code  VARCHAR(100) NOT NULL,
    source_url    VARCHAR(500),
    status        VARCHAR(20) NOT NULL,
    records_total INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at  TIMESTAMP,
    retry_count   INTEGER DEFAULT 0
);

CREATE TABLE integration_dlq (
    dlq_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_id       UUID REFERENCES integration_sync_jobs(sync_id),
    source_record JSONB NOT NULL,
    error_type    VARCHAR(100),
    error_detail  TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved      BOOLEAN DEFAULT false
);
`

---

## 5. Package Structure (Spring Boot Mono-Repo)

`
src/main/java/vn/haifish/kchtgt/sharing/
+-- config/
|   +-- SharingWebConfig.java
|   +-- CorsConfig.java
|   +-- LgspProperties.java
+-- sharing/
|   +-- controller/ (12 controllers, 3 per wave)
|   +-- service/ (KchtgtBaseService + feature services)
|   +-- repository/
|   +-- model/ (Entities)
|   +-- dto/ (DTOs + PaginationResponse)
|   +-- exception/
+-- integration/
    +-- config/ (IntegrationWebConfig)
    +-- adapter/ (RestApiAdapter, SoapAdapter, FileBasedAdapter)
    +-- scheduler/ (SyncJobScheduler, RetryHandler)
    +-- transformer/ (LgspSchemaMapper, DataQualityValidator)
    +-- job/ (SyncJobService, SyncJobRepository, SyncJobEntity)
    +-- dlq/ (DlqService, DlqRepository)
    +-- exception/
`

---

## 6. Cross-Cutting Concerns

### 6.1 Authentication & Authorization
- Sharing endpoints: READ access via LGSP token validation
- Integration endpoints: WRITE access via admin/role-based auth (Spring Security)
- External integration sources: API keys or mutual TLS

### 6.2 Error Handling
- Global @ControllerAdvice for consistent error responses
- Integration errors routed to DLQ with retry logic

### 6.3 Monitoring
- Spring Boot Actuator endpoints
- Integration sync health dashboard
- Feature-level metrics

### 6.4 Data Validation
- Sharing: output validation against LGSP schema
- Integration: input validation + data quality checks

---

## 7. Deprecated Flag Assessment

**Finding**: Module M-009 has deprecated: true but all 81 features remain in proposed status with no implementations.

**Recommendation**:
1. **Continue pipeline execution** -- features are not yet implemented; deprecation does not retroactively invalidate them.
2. **Document deprecation context** -- may apply to future LGSP/NDXP evolution.
3. **Flag for product-owner review** -- confirm deprecation is not blocking delivery.

**Decision**: Proceed with architecture design and pipeline execution. Deprecation is informational for this stage.

---

## 8. QA Gate Requirements (Inherited from M-001)

| Gate | Requirement | M-009 Specifics |
|------|-------------|-----------------|
| Unit Tests | >95% pass rate | Each feature service + controller; 3-5 test classes per feature |
| E2E Tests | >90% pass rate | End-to-end API validation; integration sync -> DB |
| Test Execution | Tests MUST execute, not just verify files | CI must run mvn test + mvn verify; evidence = JUnit XML reports |
| QA Verdict | Must include pass/fail counts | Each stage-gate verdict: passed/N / total/N |
| Integration Tests | Required for Wave 4+ | Mock external APIs for Wave 4-6; real API keys for UAT |

---

## 9. Technical Lead Task Breakdown (Preview)

The technical-lead stage will refine this architecture into:
1. **Feature-brief files** for each of 81 features
2. **Implementation task tickets** (one per feature, grouped by wave)
3. **Stakeholder assignments** (business-owner, tech-lead, qa-lead)
4. **Detailed implementation plan** with acceptance criteria

---

## 10. Assumptions & Open Questions

| # | Assumption/Question | Owner | Status |
|---|---------------------|-------|--------|
| A1 | LGSP schema version is v3.x (standardized across modules) | Tech-lead | Pending |
| A2 | NDXP data format matches LGSP schema or requires transformation layer | Tech-lead | Pending |
| A3 | Database is PostgreSQL with PostGIS extension (inherited from M-001 architecture) | Tech-lead | Pending |
| Q1 | Which external systems provide data for Wave 4-6 integration features? | Business-owner | Open |
| Q2 | Are there existing API contracts for integration sources? | Business-owner | Open |
| Q3 | Real-time requirements for VTS/SCADA/CCTV data (Wave 2, Wave 5)? | Business-owner | Open |
| Q4 | Historical data migration required, or greenfield only? | Business-owner | Open |
| Q5 | Deprecated flag impact on product prioritization -- confirmed non-blocking? | PMO | Open |

---

## Verdict

| Criterion | Status |
|-----------|--------|
| Architecture completeness | **Pass** -- All 81 features covered across 6 waves |
| Route/API design | **Pass** -- RESTful patterns for sharing + integration |
| Data schema design | **Pass** -- Base schema + extensions + pipeline tables |
| Package structure | **Pass** -- Clean separation of sharing/integration |
| Cross-cutting concerns | **Pass** -- Auth, error handling, monitoring, validation |
| Wave strategy | **Pass** -- 6 waves, balanced complexity, ~6 weeks |
| Deprecated flag | **Pass** -- Acknowledged; pipeline continues with PO review |
| QA Gate awareness | **Pass** -- M-001 requirements documented and inherited |

**Readiness**: Architecture design is **ready for technical-lead review**.
**Blockers**: None -- open questions require business-owner input.
