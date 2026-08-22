# Tổng kết các loại Kết Cấu Hạ Tầng Hàng Hải (KCHT)

> **Đã review & cross-check kỹ** — đối chiếu 3 nguồn: `KchtType.java` (enum chính thức), entity backend, frontend `LOAI_KCHT_OPTIONS`.
> Cập nhật: 07/08/2026

---

## 🎯 Nguồn sự thật: `KchtType` enum

File: `src/main/java/com/hanghai/kchtg/gis/search/dto/KchtType.java`

Đây là enum **chính thức** định nghĩa toàn bộ 23 loại KCHT được backend công nhận.
Dùng enum này để rà soát — nếu một loại KCHT tồn tại trong `hh.csdl` mà KHÔNG có trong enum này, đó là gap.

---

## 📊 Bảng đối chiếu đầy đủ: Enum → Entity → Frontend

| # | `KchtType` enum | Entity backend | Bảng DB | Frontend label | Trạng thái |
|---|-----------------|----------------|---------|----------------|------------|
| 1 | `CANGBIEN` | `port.entity.Port` | `ports` | Cảng biển | ✅ |
| 2 | `BENCANG` | `port.entity.Berth` | `berths` | Bến cảng | ✅ |
| 3 | `CAUCANG` | `port.entity.Pier` | `piers` | Cầu cảng | ✅ |
| 4 | `CANGCAN` | `port.entity.DryPort` | `dry_ports` | Cảng cạn | ✅ |
| 5 | `VUNGNUOC` | `port.entity.WaterZone` | `water_zones` | Vùng nước (chung) | ✅ |
| 6 | `DIKE_REVETMENT` | `dikerevetment.entity.DikeRevetment` | `dike_revetment` | Đê chắn sóng, đê chắn cát, kè... | ✅ |
| 7 | `NAVIGATION_CHANNEL` | `navigationchannel.entity.NavigationChannel` | `navigation_channel` | Luồng hàng hải | ✅ |
| 8 | `COSO_SUACHUA` | `shiprepairfacility.entity.ShipRepairFacility` | `ship_repair_facility` | Cơ sở sửa chữa, đóng tàu | ✅ |
| 9 | `DENBIEN` | `beacon.entity.BeaconStation` | `beacon_light` | Đèn biển và nhà trạm | ✅ |
| 10 | `PHAOTIEU` | `beacon.entity.Buoy` | `buoy` | Phao, tiêu | ✅ |
| 11 | `HE_THONG_VTS` | `vtssystem.entity.VtsSystem` | `vts_system` | Hệ thống VTS | ✅ |
| 12 | `TRAM_RADAR` | `radarstation.entity.RadarStation` | `radar_station` | Trạm radar | ⚠️ Trùng #13 |
| 13 | `RADAR_STATION` | `radarstation.entity.RadarStation` | `radar_station` | — | ⚠️ Trùng #12 |
| 14 | `BENPHAO` | `port.entity.WaterZone` (type=MOORING_BUOY) | `water_zones` | Bến phao | ✅ (sub-type) |
| 15 | `KHUNEO_DAU` | `port.entity.WaterZone` (type=ANCHORAGE) | `water_zones` | Khu neo đậu | ✅ (sub-type) |
| 16 | `KHUCHUYEN_TAI` | `port.entity.WaterZone` (type=TRANSSHIPMENT) | `water_zones` | Khu chuyển tải | ✅ (sub-type) |
| 17 | `KHUTRANH_TRU_BAO` | `port.entity.WaterZone` (type=STORM_SHELTER) | `water_zones` | Khu tránh, trú bão | ✅ (sub-type) |
| 18 | `DAI_TTDH` | `station.entity.CoastalStationVTS` (?) | `coastal_station_vts` | Đài TTDH | ⚠️ Map chưa rõ ràng |
| 19 | `DAI_INMARSAT` | `station.entity.CoastalStationInmarsat` | `coastal_station_inmarsat` | Đài Inmarsat | ✅ |
| 20 | `DAI_COSPAS_SARSAT` | `station.entity.CoastalStationCospasSarsat` | `coastal_station_cospas_sarsat` | Đài Cospas-Sarsat | ✅ |
| 21 | `DAI_LRIT` | `station.entity.CoastalStationLRIT` | `coastal_station_lrit` | Đài LRIT | ✅ |
| 22 | `DAI_HANOI` | **KHÔNG CÓ** | — | Đài Trung tâm xử lý TT HH Hà Nội | ❌ **GAP** |
| 23 | `NHATRAM_PHAO` | `station.entity.BuoyStation` | `buoy_station` | Nhà trạm quản lý vận hành phao tiêu | ✅ |

---

## 🚨 Phát hiện GAP

### GAP-1: `DAI_HANOI` — không có entity backend

Enum `KchtType` có `DAI_HANOI` ("Đài Trung tâm xử lý thông tin hàng hải Hà Nội") và frontend cũng hiển thị trong filter, nhưng **không có entity/table riêng** trong backend.

- **Frontend**: có trong `LOAI_KCHT_OPTIONS` và GIS filter
- **Backend**: chỉ tồn tại dưới dạng string trong `KchtType` enum, không có JPA `@Entity` tương ứng
- **Kiến nghị**: Tạo entity mới (vd: `CoastalStationHanoi`) hoặc map vào một station entity có sẵn

### GAP-2: `TRAM_RADAR` / `RADAR_STATION` — trùng lặp trong enum

Cả 2 giá trị đều map về cùng một entity `RadarStation`. Có thể là legacy duplicate cần clean up.

### GAP-3: Entity tồn tại nhưng KHÔNG có trong `KchtType` enum

| Entity | Table | Ghi chú |
|--------|-------|---------|
| `LighthouseStation` | `lighthouse_station` | Trạm hải đăng — chưa được map vào enum, có thể gộp với `DENBIEN` hoặc cần enum riêng |
| `CoastalStationHaiphong` | `coastal_station_haiphong` | Đài Hải Phòng — có entity + table nhưng không có trong KchtType enum |
| `PortInfrastructure` | `port_infrastructures` | Công trình KCHT thuộc cảng — entity phụ thuộc Port, không phải loại KCHT độc lập |

### GAP-4: Mapping `DAI_TTDH` chưa rõ ràng

`DAI_TTDH` ("Đài TTDH" - Đài Thông tin Duyên hải) hiện tại không có entity riêng. Có thể đang được hiểu là `CoastalStationVTS`, nhưng không có mapping rõ ràng trong code.

---

## 🏗️ Phân loại chi tiết từng entity

### 1. Cảng biển & Phụ trợ — `port` package

| Entity | Table | Mô tả |
|--------|-------|-------|
| `Port` | `ports` | Cảng biển |
| `Berth` | `berths` | Bến cảng (FK → ports) |
| `Pier` | `piers` | Cầu cảng (FK → berths) |
| `DryPort` | `dry_ports` | Cảng cạn / ICD |
| `WaterZone` | `water_zones` | Vùng nước (FK → ports) |
| `PortInfrastructure` | `port_infrastructures` | Công trình KCHT thuộc cảng |

**WaterZoneType** — 6 loại vùng nước:
| Mã | Enum | Sub-type của KchtType |
|----|------|----------------------|
| 1 | ANCHORAGE | `KHUNEO_DAU` |
| 2 | PILOT_BOARDING | (không có enum riêng, chỉ có frontend label) |
| 3 | TURNING_BASIN | (không có enum riêng, chỉ có frontend label) |
| 4 | MOORING_BUOY | `BENPHAO` |
| 5 | TRANSSHIPMENT | `KHUCHUYEN_TAI` |
| 6 | STORM_SHELTER | `KHUTRANH_TRU_BAO` |

> ⚠️ 2 loại WaterZone (PILOT_BOARDING, TURNING_BASIN) có trong entity + frontend label nhưng KHÔNG có trong `KchtType` enum.

**BerthType**:
| Mã | Enum | Tên |
|----|------|-----|
| 1 | CONTAINER | Bến container |
| 2 | GENERAL_CARGO | Bến hàng tổng hợp |
| 3 | SPECIALIZED | Bến chuyên dụng |
| 4 | PASSENGER | Bến hành khách |
| 5 | MOORING_BUOY | Bến phao |
| 6 | INLAND_WATERWAY | Bến thủy nội địa |

**PierType**:
| Mã | Enum | Tên |
|----|------|-----|
| 1 | CONTAINER | Cầu container |
| 2 | TONG_HOP | Cầu tổng hợp |
| 3 | HANH_KHACH | Cầu hành khách |
| 4 | CHUYEN_DUNG_XANG_DAU | Cầu chuyên dụng xăng dầu |
| 5 | CHUYEN_DUNG_ROI_QUANG | Cầu chuyên dụng rời quặng |
| 6 | KHAC | Khác |

### 2. Báo hiệu hàng hải — `beacon` package

| Entity | Table | KchtType |
|--------|-------|----------|
| `BeaconStation` | `beacon_light` | `DENBIEN` |
| `Buoy` | `buoy` | `PHAOTIEU` |

**BeaconLightType**: LIGHTHOUSE(1), BEACON_LIGHT(2), BEACON_MARK(3)
**BuoyType**: CARDINAL(1), SECTOR(2), SPECIAL(3), SAFE_WATER(4), ISOLATED_DANGER(5)

### 3. Trạm — `station` package (7 entity)

| Entity | Table | KchtType |
|--------|-------|----------|
| `LighthouseStation` | `lighthouse_station` | ❌ Không có |
| `BuoyStation` | `buoy_station` | `NHATRAM_PHAO` |
| `CoastalStationVTS` | `coastal_station_vts` | `DAI_TTDH` (?) |
| `CoastalStationLRIT` | `coastal_station_lrit` | `DAI_LRIT` |
| `CoastalStationInmarsat` | `coastal_station_inmarsat` | `DAI_INMARSAT` |
| `CoastalStationHaiphong` | `coastal_station_haiphong` | ❌ Không có |
| `CoastalStationCospasSarsat` | `coastal_station_cospas_sarsat` | `DAI_COSPAS_SARSAT` |

### 4. Luồng hàng hải

| Entity | Table | KchtType |
|--------|-------|----------|
| `NavigationChannel` | `navigation_channel` | `NAVIGATION_CHANNEL` |
| `ChannelRouteDetail` | (embedded) | — |

### 5. Đê kè

| Entity | Table | KchtType |
|--------|-------|----------|
| `DikeRevetment` | `dike_revetment` | `DIKE_REVETMENT` |

**DikeRevetmentType**: RIVER_DIKE(1), SAND_DIKE(2), FLOW_GUIDE_REVETMENT(3), BANK_PROTECTION_REVETMENT(4), TRAFFIC(5), WAVE_BREAK_REVETMENT(6), SAND_BREAK_REVETMENT(7)

### 6. Radar & VTS

| Entity | Table | KchtType |
|--------|-------|----------|
| `RadarStation` | `radar_station` | `TRAM_RADAR` / `RADAR_STATION` |
| `VtsSystem` | `vts_system` | `HE_THONG_VTS` |

### 7. Cơ sở sửa chữa đóng tàu

| Entity | Table | KchtType |
|--------|-------|----------|
| `ShipRepairFacility` | `ship_repair_facility` | `COSO_SUACHUA` |

**FacilityType**: REPAIR(1), SHIPBUILDING(2), REPAIR_AND_SHIPBUILDING(3), KHAC(4)

### 8. GIS — Bảng `gis_spatial_objects` (dùng chung spatial_id)

| Entity | Geometry Type | ObjectType |
|--------|--------------|------------|
| `PointObject` | 1 (Point) | PORT(10), LIGHTHOUSE(11), BUOY(12), BEACON(13), OTHER(14) |
| `LineObject` | 2 (Line) | COASTLINE(20), SHIPPING_ROUTE(21), WATERWAY(22), OTHER(23) |
| `PolygonObject` | 3 (Polygon) | WATER_ZONE(30), ANCHORAGE(31), STORM_SHELTER(32), RESTRICTED_AREA(33), LIMITED_ZONE(34), OTHER(35) |
| `GisSpatialObject` | All | Entity tổng quát |

### 9. Tài sản

| Entity | Table | Mô tả |
|--------|-------|-------|
| `ManagedAsset` | `ts_ql` | Tài sản quản lý — 13 nhóm (`nhom`: CB, BC, CC, BP, TTB, CT, ND, CSSCDT, LHH, DBNT, NT, PT, VTS) |
| `InfraAsset` | `infra_assets` | Tài sản KCHTGT — 4 loại (BUOY, RADAR_STATION, LIGHTHOUSE, AUXILIARY_EQUIPMENT) |

---

## 📋 Checklist rà soát với `hh.csdl`

Đánh dấu từng loại KCHT từ dự án gốc:

- [ ] Cảng biển → `Port` / `CANGBIEN`
- [ ] Bến cảng → `Berth` / `BENCANG`
- [ ] Cầu cảng → `Pier` / `CAUCANG`
- [ ] Cảng cạn / ICD → `DryPort` / `CANGCAN`
- [ ] Vùng nước cảng biển → `WaterZone` / `VUNGNUOC`
- [ ] Bến phao → WaterZone MOORING_BUOY / `BENPHAO`
- [ ] Khu neo đậu → WaterZone ANCHORAGE / `KHUNEO_DAU`
- [ ] Khu chuyển tải → WaterZone TRANSSHIPMENT / `KHUCHUYEN_TAI`
- [ ] Khu tránh trú bão → WaterZone STORM_SHELTER / `KHUTRANH_TRU_BAO`
- [ ] Khu đón trả hoa tiêu → WaterZone PILOT_BOARDING (⚠️ không có enum)
- [ ] Khu quay trở tàu → WaterZone TURNING_BASIN (⚠️ không có enum)
- [ ] Đèn biển / Hải đăng → `BeaconStation` / `DENBIEN`
- [ ] Cọc tiêu → BeaconLight BEACON_MARK
- [ ] Phao tiêu → `Buoy` / `PHAOTIEU`
- [ ] Luồng hàng hải → `NavigationChannel` / `NAVIGATION_CHANNEL`
- [ ] Đê kè → `DikeRevetment` / `DIKE_REVETMENT`
- [ ] Trạm radar → `RadarStation` / `TRAM_RADAR`
- [ ] Hệ thống VTS → `VtsSystem` / `HE_THONG_VTS`
- [ ] Cơ sở sửa chữa đóng tàu → `ShipRepairFacility` / `COSO_SUACHUA`
- [ ] Đài TTDH → `CoastalStationVTS`? / `DAI_TTDH` ⚠️
- [ ] Đài Inmarsat → `CoastalStationInmarsat` / `DAI_INMARSAT`
- [ ] Đài LRIT → `CoastalStationLRIT` / `DAI_LRIT`
- [ ] Đài Cospas-Sarsat → `CoastalStationCospasSarsat` / `DAI_COSPAS_SARSAT`
- [ ] Đài Hải Phòng → `CoastalStationHaiphong` (⚠️ không có enum)
- [ ] Đài Hà Nội → ❌ **KHÔNG CÓ ENTITY** / `DAI_HANOI`
- [ ] Trạm hải đăng → `LighthouseStation` (⚠️ không có enum)
- [ ] Nhà trạm phao tiêu → `BuoyStation` / `NHATRAM_PHAO`

---

## 📊 Tổng kết số lượng

| Nhóm | Entity chính | GAP |
|------|-------------|-----|
| Enum `KchtType` | 23 giá trị (2 trùng, 1 thiếu entity) | `DAI_HANOI` |
| Entity KCHT chính | 21 entity | 3 entity không có enum |
| Entity phụ trợ (attachment, history, audit) | ~20 entity | — |
| Tổng `@Entity` toàn dự án | 159 | — |
