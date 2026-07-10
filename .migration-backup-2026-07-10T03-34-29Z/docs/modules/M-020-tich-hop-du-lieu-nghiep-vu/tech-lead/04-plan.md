# Technical Plan — M-020 Tích hợp dữ liệu nghiệp vụ

## Overview
Module M-020 tích hợp dữ liệu nghiệp vụ hàng hải và cảng biển. Bao gồm tích hợp thông tin tàu biển ra vào cảng, phương tiện thủy nội địa, tàu biển nước ngoài, tàu biển VN vận tải quốc tế, khối lượng hàng hóa/hành khách, lượt tàu thuyền, thuyền viên/hoa tiêu, tàu thuyền lai dắt, cơ sở đóng mới sửa chữa, năng lực thông qua bến/cảng, khối lượng hàng hóa theo tháng/năm, và sản lượng dịch vụ vận tải.

## Source Code Summary
- **Total source files**: 18
- **Entity**: BusinessDataIntegrationRecord (14 fields, JPA @Entity)
- **Enum**: IntegrationType (17 constants), IntegrationStatus (5 constants)
- **Repository**: BusinessDataIntegrationRecordRepository (7 derived + 2 @Query methods)
- **DTOs**: BusinessDataIntegrationRequest, BusinessDataIntegrationResponse, BusinessIntegrationFilter, BusinessIntegrationStatistics, BusinessIntegrationSummary (5 files)
- **Services**: BusinessIntegrationService, BusinessDataSchedulingService, VesselIntegrationService, CargoStatisticsIntegrationService, PortOperationsIntegrationService (5 files)
- **Controllers**: BusinessIntegrationController, VesselIntegrationController, CargoStatisticsIntegrationController, PortOperationsIntegrationController (4 files, 23 endpoints)

## Test Summary
- **Total test files**: 4
- **Total test methods**: 25
- BusinessIntegrationServiceTest: 8 methods
- BusinessDataSchedulingServiceTest: 4 methods
- BusinessIntegrationControllerTest: 9 methods
- VesselIntegrationControllerTest: 4 methods

## Package Structure
- `com.hanghai.kchtg.businessintegration.entity.BusinessDataIntegrationRecord`
- `com.hanghai.kchtg.businessintegration.enums.IntegrationType` (17 constants)
- `com.hanghai.kchtg.businessintegration.enums.IntegrationStatus` (5 constants)
- `com.hanghai.kchtg.businessintegration.repository.BusinessDataIntegrationRecordRepository`
- `com.hanghai.kchtg.businessintegration.dto.*` (5 DTOs)
- `com.hanghai.kchtg.businessintegration.service.*` (5 Services)
- `com.hanghai.kchtg.businessintegration.controller.*` (4 Controllers, 23 endpoints)

## Wave Tracker
| Wave | Tasks | Status |
|---|---|---|
| Wave 1 | Entity, Enum, Repository | ✅ Done |
| Wave 2 | DTOs, Services | ✅ Done |
| Wave 3 | Controllers | ✅ Done |
| Wave 4 | Tests | ✅ Done |
| Wave 5 | Docs, Seal | ✅ Done |

## Sealing Status
Module M-020 sealed — all waves complete.
