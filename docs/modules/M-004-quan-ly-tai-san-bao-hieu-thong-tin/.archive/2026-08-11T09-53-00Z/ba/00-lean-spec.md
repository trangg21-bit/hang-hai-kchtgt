---
feature-id: M-004
document: lean-spec
output-mode: lean
last-updated: 2026-08-10
---

# Lean Spec: Quản lý tài sản Báo hiệu & Thông tin (M-004)

## 1. Summary

Module M-004 quản lý các tài sản báo hiệu hàng hải và đài thông tin duyên hải, phục vụ công tác quản lý nhà nước về hàng hải. Phạm vi bao gồm: Đèn biển (BeaconLight), Phao tiêu (Buoy), Nhà trạm (NhaTramPhao, NhaTramDen), và 5 loại Đài Thông tin Duyên hải (CoastalStationVTS, Inmarsat, COSPAS-SARSAT, LRIT, Hải Phòng). Mỗi loại tài sản có quy trình CRUD và phê duyệt riêng, tuân thủ quy chuẩn kỹ thuật hàng hải (IALA, WGS84).

## 2. Scope

### In Scope
- CRUD 9 loại tài sản: BeaconLight, Buoy, NhaTramPhao, NhaTramDen, CoastalStationVTS, CoastalStationInmarsat, CoastalStationCospasSarsat, CoastalStationLRIT, CoastalStationHaiphong
- Quy trình phê duyệt (Beacon: 2 cấp; CoastalStation: simplified APPROVED/REJECTED)
- Soft-delete toàn bộ tài sản
- Lịch sử thay đổi (audit log) cho mọi thao tác CRUD + phê duyệt
- Đồng bộ GIS (Beacon + Buoy → M-007; Nhà trạm → M-007)
- Phân quyền RBAC: admin, operator, approver_L1, approver_L2, viewer

### Out of Scope
- Tích hợp thiết bị IoT / real-time monitoring
- Quy trình bảo trì, sửa chữa hiện trường
- Xuất báo cáo PDF/Excel nâng cao (thuộc M-008)
- Batch import / export

## 3. Enums

| Enum | Values | Used By |
|------|--------|---------|
| BeaconLightType | LIGHTHOUSE, BEACON_LIGHT, BEACON_MARK | BeaconLight.type |
| BuoyType | CARDINAL, SECTOR, SPECIAL, SAFE_WATER, ISOLATED_DANGER | Buoy.type, NhaTramPhao.type |
| BeaconStatus | DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED | BeaconLight.status, Buoy.status |
| NhaTramStatus | DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED | NhaTramPhao.status, NhaTramDen.status |
| StationStatus | DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, DELETED, REJECTED | All CoastalStation*.status (code-level Java enum) |
| CoastalStationVTSStatus | Lưu tạm, Chờ duyệt cấp Cảng vụ/Chi cục, Từ chối cấp Cảng vụ/Chi cục, Chờ duyệt cấp Cục, Từ chối cấp Cục, Đã phê duyệt | CoastalStationVTS F-092→F-097 (6 trạng thái, KHÔNG có HISTORY). Handoff Section 3. |
| ApprovalStatus | DRAFT(0), PROPOSED(1), PENDING_APPROVAL(2), APPROVED_LEVEL1(3), APPROVED_LEVEL2(4), APPROVED(5), REJECTED(6) | All station approval flows |
| ApprovalLevel | LEVEL_0(0), LEVEL_1(1), LEVEL_2(2) | Tracks which level performed approval |
| **PhanLoaiDai** | **LOAI_I, LOAI_II, LOAI_III, LOAI_IV, LOAI_V** | **CoastalStationVTS.stationLevel** |
| **GisGeometryType** | **POINT(1), LINE(2), POLYGON(3)** | **All GIS-enabled entities (NavigationChannel, VtsSystem, CoastalStationVTS, etc.)** |
| **UsageStatus** | **Không sử dụng(0), Đang sử dụng(1)** | **CoastalStationVTS (tình trạng vận hành thực tế, KHÔNG phải trạng thái phê duyệt). Default: Đang sử dụng.** |

## 4. Domain Glossary — Entities

### CoastalStationVTS (extends BaseStation)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | Kế thừa BaseEntity |
| **code** | **String** | **@NotBlank, @Size(max=50), unique** | **🔴 Sửa: tự sinh format DTTDH-xxxxx, immutable sau khi tạo (R1-R3).** |
| name | String | @NotBlank, @Size(max=255) | |
| description | String | @Size(max=1000) | |
| **stationLevel** | **PhanLoaiDai enum** | **@NotNull** | **🔴 Loại I → Loại V. Bắt buộc khi tạo. Lưu ORDINAL (SMALLINT).** |
| provinceId | Integer | | |
| unitId | UUID | | Đơn vị quản lý |
| **operatingUnitId** | **UUID** | | **🔴 Đơn vị khai thác (tách biệt unitId). Pattern: NavigationChannel.operatingUnitId.** |
| **coverageArea** | **String** | **@Size(max=500)** | **🔴 Vùng phủ sóng. VD: Hải Phòng, Cospas-Sarsat.** |
| **servicesProvided** | **JSON Array / Bitmask** | | **🔴 Multi-select từ 9 dịch vụ cố định (INMARSAT, COSPAS-SARSAT, DSC, RTP, MSI RTP, MSI NAVTEX, MSI EGC, LRIT, Kết nối TT hàng hải). Handoff 2.2.** |
| **usageStatus** | **Integer** | **Default: 1** | **🔴 Tình trạng vận hành: 0=Không sử dụng, 1=Đang sử dụng. KHÔNG liên quan đến trạng thái phê duyệt.** |
| spatialId | UUID | | |
| **geometryType** | **GisGeometryType enum** | | **🔴 Loại đối tượng GIS: POINT(1), LINE(2), POLYGON(3). Lưu ORDINAL. Pattern: NavigationChannel, VtsSystem.** |
| **mapSymbolId** | **UUID** | | **🔴 Biểu tượng bản đồ. Pattern: Port, DryPort.** |
| **coordinateSystem** | **Integer** | | **🔴 Hệ quy chiếu. Pattern: Port, DryPort, Berth.** |
| **displayRule** | **Integer** | | **🔴 Quy tắc hiển thị. Pattern: Port, DryPort, Berth.** |
| **latitude** | **Double** | **@DecimalMin(-90) @DecimalMax(90)** | **🔴 Vĩ độ (WGS84). DTO đã có nhưng entity thiếu.** |
| **longitude** | **Double** | **@DecimalMin(-180) @DecimalMax(180)** | **🔴 Kinh độ (WGS84). DTO đã có nhưng entity thiếu.** |
| isActive | Boolean | Default: true | |
| status | StationStatus | Default: PENDING_APPROVAL | Xem ghi chú StationStatus (VTS logical) ở trên |
| approvalStatus | ApprovalStatus | Default: PROPOSED(0) | |
| approvalLevel | ApprovalLevel | | LEVEL_1 or LEVEL_2 |
| approvedBy | String | | |
| approvedDate | LocalDateTime | | |
| rejectionReason | String | @Size(max=1000) | |
| frequencyBand | String | | Dải tần hoạt động |
| transmitPower | Double | | Công suất phát |
| equipmentType | String | | Loại thiết bị |
| locationAddress | String | @Size(max=1000) | Địa chỉ trạm |
| contactPerson | String | | Người liên hệ |
| contactPhone | String | | SĐT liên hệ |
| createdAt, updatedAt | Timestamp | Auto | Kế thừa BaseEntity |

### CoastalStationVTSAttachment (bảng coastal_station_vts_attachments)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| **id** | **UUID** | **PK** | **🔴 Bảng mới** |
| **stationId** | **UUID** | **FK → coastal_station_vts.id, NOT NULL** | **🔴** |
| **fileName** | **String** | **@NotBlank, @Size(max=255)** | **🔴 Tên file gốc** |
| **filePath** | **String** | **@NotBlank, @Size(max=500)** | **🔴 Đường dẫn lưu trữ** |
| **fileSize** | **Long** | **@NotNull** | **🔴 Dung lượng (bytes)** |
| **contentType** | **String** | **@Size(max=100)** | **🔴 MIME type** |
| **uploadedBy** | **UUID** | | **🔴 Người upload** |
| **uploadedAt** | **LocalDateTime** | **NOT NULL** | **🔴 Thời điểm upload** |
| **updatedAt** | **LocalDateTime** | **NOT NULL** | **🔴 Thời điểm cập nhật cuối** |

### Other Entities (summary)

| Entity | Table | Distinct Fields |
|--------|-------|-----------------|
| BeaconLight | beacon_light | type, latitude, longitude, lightRange, lightColor, lightCharacteristic, range, lastMaintenanceDate, nextMaintenanceDate |
| Buoy | buoy | type, latitude, longitude, color, shape, lightCharacteristic, range, lastInspectionDate, nextInspectionDate |
| NhaTramPhao | nha_tram_phao | extends BaseNhaTram + BuoyType-specific fields |
| NhaTramDen | nha_tram_den | extends BaseNhaTram + BeaconLightType-specific fields |
| CoastalStationInmarsat | coastal_station_inmarsat | deviceCode, modemType, frequency, coverageZone, sarCode |
| CoastalStationCospasSarsat | coastal_station_cospas_sarsat | frequency, coverageArea, beaconProtocol, emergencyChannel, antennaType, signalRange, operatingMode |
| CoastalStationLRIT | coastal_station_lrit | terminalId, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, dataFormat, communicationChannel, coverageArea |
| CoastalStationHaiphong | coastal_station_haiphong | portName, district, ward, operationalLicense, licenseExpiry, inspectorName, inspectorPhone, lastInspectionDate, nextInspectionDate, coverageArea, equipmentType, communicationFrequency |

## 5. ERD — CoastalStationVTS

```mermaid
classDiagram
    class BaseEntity {
        +UUID id
        +DateTime createdAt
        +DateTime updatedAt
    }
    class BaseStation {
        +String code
        +String name
        +String description
        +Integer provinceId
        +UUID unitId
        +UUID operatingUnitId
        +String coverageArea
        +String servicesProvided
        +OperationalStatus operationalStatus
        +UUID spatialId
        +GisGeometryType geometryType
        +UUID mapSymbolId
        +Integer coordinateSystem
        +Integer displayRule
        +Double latitude
        +Double longitude
        +Boolean isActive
        +StationStatus status
        +ApprovalStatus approvalStatus
        +ApprovalLevel approvalLevel
        +String approvedBy
        +LocalDateTime approvedDate
        +String rejectionReason
    }
    class CoastalStationVTS {
        +PhanLoaiDai stationLevel
        +String frequencyBand
        +Double transmitPower
        +String equipmentType
        +String locationAddress
        +String contactPerson
        +String contactPhone
    }
    class CoastalStationVTSAttachment {
        +UUID id
        +UUID stationId
        +String fileName
        +String filePath
        +Long fileSize
        +String contentType
        +UUID uploadedBy
        +LocalDateTime uploadedAt
        +LocalDateTime updatedAt
    }
    BaseEntity <|-- BaseStation
    BaseStation <|-- CoastalStationVTS
    CoastalStationVTS "1" --> "*" CoastalStationVTSAttachment : has
```

## 6. Approval Workflow

### Beacon & NhaTram (2-level approval)
```
DRAFT → submitForApproval → PENDING_APPROVAL → approve L1 → APPROVED_L1 → approve L2 → PUBLISHED (→ GIS sync)
                                              ↘ reject (any level) → REJECTED → DRAFT (re-edit)
```

### CoastalStationVTS (2 cấp phê duyệt, F-092→F-097)
```
Lưu tạm → Gửi phê duyệt → Chờ duyệt cấp Cảng vụ/Chi cục → Duyệt C1 → Chờ duyệt cấp Cục → Duyệt C2 → Đã phê duyệt
   │                         ↘ Từ chối C1 → Từ chối cấp Cảng vụ/Chi cục      ↘ Từ chối C2 → Từ chối cấp Cục
   │                              │ (sửa & gửi lại → Chờ duyệt CC)                │ (sửa & gửi lại → Chờ duyệt CC)
   └── Lưu và phê duyệt (chỉ Cấp Cục, R14) ──→ Đã phê duyệt
```

- 6 trạng thái: Lưu tạm, Chờ duyệt CC, Từ chối CC, Chờ duyệt Cục, Từ chối Cục, Đã phê duyệt
- **KHÔNG có trạng thái HISTORY** — Từ chối là trạng thái hiện tại, không phải lịch sử (R16)
- Duyệt/Từ chối phải nhập nội dung (lý do)
- Gửi duyệt lại từ Từ chối → luôn về Chờ duyệt CC (R17)
- Sửa Đã phê duyệt → tự về Lưu tạm (R10)
- Chỉ Cấp Cục được phê duyệt trực tiếp (R14)

## 7. Soft-Delete Pattern

### Beacon & Buoy & NhaTram
- Soft delete via `deletedAt` timestamp
- `@SQLRestriction("deleted_at IS NULL")` hides from normal queries
- DELETE action recorded in history as `SOFT_DELETE`
- Status set to `DELETED`

### CoastalStationVTS (F-094)
- **Chỉ xóa khi trạng thái = Lưu tạm** (R8)
- Soft-delete: đặt `deletedAt`, `deletedBy`
- `@SQLRestriction("deleted_at IS NULL")` ẩn khỏi truy vấn thường
- DELETE ghi lịch sử DELETE

## 8. Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Code unique, required, max 50 chars | All entities | @Column(unique=true), @NotBlank |
| BR-002 | Name required, max varies by entity | All entities | @NotBlank |
| BR-003 | Latitude -90..90 | Beacon, Buoy, NhaTram | @DecimalMin/Max |
| BR-004 | Longitude -180..180 | Beacon, Buoy, NhaTram | @DecimalMin/Max |
| BR-005 | LightRange 0.01–60.0 | BeaconLight | @DecimalMin/Max |
| BR-006 | Range 0.01–100.0 | BeaconLight, Buoy | @DecimalMin/Max |
| BR-007 | Description max 1000 chars | All entities | @Size(max=1000) |
| BR-008 | Code immutable after create | All entities | Service layer |
| BR-009 | No hard delete — soft-delete only | Beacon, Buoy, NhaTram | softDelete(), @SQLRestriction |
| BR-010 | Approve L1 requires PENDING_APPROVAL | Beacon, Buoy, NhaTram | Service validation |
| BR-011 | Approve L2 requires APPROVED_L1 | Beacon, Buoy, NhaTram | Service validation |
| BR-012 | Rejection requires rejectionReason | All entities | @NotNull |
| BR-013 | PUBLISHED → sync to GIS M-007 | Beacon, Buoy, NhaTram | PointObjectSyncService |
| BR-014 | Self-approval prevention | Beacon, Buoy | creatorId != approverId |
| BR-015 | Default status = DRAFT on create | Beacon, Buoy | @Builder.Default |
| BR-016 | Name max 255 chars | CoastalStationVTS | @Size(max=255) |
| BR-017 | stationLevel required (PhanLoaiDai) | CoastalStationVTS | @NotNull |
| BR-018 | LightCharacteristic max 100 chars | BeaconLight | @Size(max=100) |
| BR-019 | LightColor max 50 chars | BeaconLight | @Size(max=50) |
| **BR-020** | **Chỉ xóa Đài TTDH khi trạng thái = Lưu tạm, soft-delete với deletedAt** | **CoastalStationVTS** | **R8, F-094** |
| **BR-021** | **stationLevel là trường bắt buộc khi tạo Đài TTDH** | **CoastalStationVTS** | **F-092 form validation** |
| **BR-022** | **Code tự sinh format DTTDH-xxxxx, immutable sau khi tạo (R1-R3)** | **CoastalStationVTS.code** | **Handoff R1-R3** |
| **BR-023** | **Đơn vị quản lý mặc định theo user, khóa khi sửa (R4-R5)** | **CoastalStationVTS.unitId** | **Handoff R4-R5** |
| **BR-024** | **6 trạng thái: Lưu tạm, Chờ duyệt CC, Từ chối CC, Chờ duyệt Cục, Từ chối Cục, Đã phê duyệt. KHÔNG có HISTORY.** | **CoastalStationVTS.status** | **Handoff Section 3** |
| **BR-025** | **Chỉ Sửa khi: Lưu tạm, Từ chối CC, Từ chối Cục, Đã phê duyệt. Chờ duyệt bị khóa (R7, R11).** | **CoastalStationVTS** | **Handoff R7, R11** |
| **BR-026** | **Sửa Đã phê duyệt → tự về Lưu tạm (R10)** | **CoastalStationVTS** | **Handoff R10** |
| **BR-027** | **Duyệt 2 cấp: CC → Cục. Duyệt/Từ chối phải nhập nội dung. Phê duyệt trực tiếp chỉ Cục (R14).** | **CoastalStationVTS** | **Handoff Section 4** |
| **BR-028** | **Từ chối không phải lịch sử. Gửi duyệt lại → về Chờ duyệt CC (R16-R17).** | **CoastalStationVTS** | **Handoff R16-R17** |
| **BR-029** | **Dịch vụ: multi-select 9 dịch vụ cố định (Handoff 2.2)** | **CoastalStationVTS.servicesProvided** | **Handoff 2.2** |
| **BR-030** | **Tình trạng: 2 giá trị Đang sử dụng/Không sử dụng, mặc định Đang sử dụng. KHÔNG liên quan trạng thái phê duyệt.** | **CoastalStationVTS.usageStatus** | **Handoff 2.1#10, 3.3** |
| **BR-031** | **Các trường tần số liên lạc, transmitPower, equipmentType bị ẩn với Đài TTDH** | **CoastalStationVTS** | **Handoff 2.5** |

## 9. Feature Table — CoastalStationVTS (F-092→F-097)

| Feature | Name | Description | Endpoint |
|---------|------|-------------|----------|
| F-092 | Tạo mới | Tạo mới Đài TTDH với đầy đủ 12 trường mới (tự sinh code, stationLevel, operatingUnitId, coverageArea, servicesProvided, operationalStatus, geometryType, mapSymbolId, coordinateSystem, displayRule, lat/lng, attachments). **3 nút Lưu**: Lưu tạm (DRAFT), Lưu và gửi phê duyệt (PENDING_APPROVAL), Lưu và phê duyệt (APPROVED — chỉ Admin/Lãnh đạo). stationLevel là trường bắt buộc. | POST /api/v1/stations/coastal |
| F-093 | Cập nhật | Cập nhật thông tin Đài TTDH (trừ code immutable). Phụ thuộc trạng thái: DRAFT (sửa tất cả), APPROVED (sửa, ẩn Lưu tạm), REJECTED (sửa + gửi lại), PENDING_APPROVAL/HISTORY (chỉ đọc). | PUT /api/v1/stations/coastal/{id} |
| F-094 | Xóa | Xóa Đài TTDH — chỉ được xóa bản ghi DRAFT, chuyển status → HISTORY (giữ trong danh sách). Không đặt deletedAt. | DELETE /api/v1/stations/coastal/{id} |
| F-095 | Phê duyệt | Phê duyệt C1/C2, chuyển status sang APPROVED/REJECTED. approvalLevel tracks cấp đã duyệt. Từ chối yêu cầu rejectionReason. | POST /api/v1/stations/coastal/{id}/approve, /{id}/reject |
| F-096 | Xem chi tiết | Xem toàn bộ thông tin Đài TTDH, hiển thị stationLevel badge (Loại I→V), status badge màu, approvalLevel badge. | GET /api/v1/stations/coastal/{id} |
| F-097 | Lịch sử | Lịch sử thay đổi — cả UI timeline và BE audit log. Action types: CREATE, UPDATE, DELETE, APPROVE, REJECT. changedField/previousValue/newValue. | GET /api/v1/stations/coastal/{id}/history |

## 10. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| Performance | API response < 500ms for list (paginated 20/page), < 200ms for single entity GET |
| Scalability | Support up to 10,000 stations per type; pagination at 20/50/100 per page |
| Security | RBAC via @PreAuthorize on all endpoints; input sanitization (XSS, SQL injection); CORS configured |
| Reliability | Soft-delete preserves audit trail; @SQLRestriction for automatic filtering; idempotent DELETE |
| UX | Responsive UI; loading skeletons; empty states; Vietnamese error messages; WCAG 2.1 AA |
| Legal | Tuân thủ Nghị định về quản lý tài sản công; dữ liệu tọa độ theo WGS84; lịch sử kiểm toán đầy đủ |

## 11. Pipeline Triage

| Question | Answer | Rationale |
|----------|--------|-----------|
| Q1: Creates new domain elements? | Yes | PhanLoaiDai enum mới; 12 trường mới trên CoastalStationVTS (operatingUnitId, coverageArea, servicesProvided, operationalStatus, geometryType, mapSymbolId, coordinateSystem, displayRule, lat/lng, attachments); CoastalStationVTSAttachment entity + bảng mới; HISTORY status pattern; code tự sinh |
| Q2: Affects system architecture? | Yes | Simplified approval flow for VTS; HISTORY status instead of deletedAt for soft-delete; dual audit log (UI + BE); OperationalStatus pattern từ Port/DryPort; attachment storage pattern |
| Q3: Approach clear from existing architecture? | Yes | Follows existing CoastalStation* patterns; extends BaseStation; reuses ApprovalStatus/ApprovalLevel enums |

**Triage verdict:** Route to `engineering-system-architect` at **full design depth** — new enum, simplified approval model, and HISTORY pattern are material architectural decisions requiring aggregate design review.
