---
id: AM-c0dbd53fca566b14
kind: fact
topic: anchorage-gis-mooring-backend
tags: []
importance: 0.85
agent: 
created: 2026-08-25T10:22:04.677Z
updated: 2026-08-25T10:22:04.677Z
---

Backend Anchorage trước 2026-08-25 KHÔNG lưu GIS + mooringWaterAreas: entity/DTO/service thiếu field (CreateAnchorageRequest không có geometryType/mapSymbolId/coordinateSystem/displayRule/coordinates/mooringWaterAreas) nên Jackson bỏ im lặng — tab 'Thông tin vị trí' và 'Khu nước neo buộc tàu' trên AnchorageForm chỉ là UI trang trí. Đã sửa: migration V30__anchorage_gis_mooring.sql (4 cột GIS trên anchorages + 2 bảng mooring), entity MooringWaterArea/MooringWaterAreaAnchorPoint + repository + DTO, AnchorageService persist qua GisSpatialObjectService (GisSpatialObjectType.POLYGON_ANCHORAGE, InfrastructureType.ANCHORAGE_AREA) giống BerthService.
