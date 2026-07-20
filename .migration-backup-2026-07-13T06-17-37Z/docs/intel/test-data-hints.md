# TEST DATA HINTS - TKCT Layer 1

> **Nguon:** TKCT_CucHH_KetCauHaTangGiaoThong.docx
> **Ngay:** 2026-06-16
> **Phan:** Layer 1 - TKCT Extract

---

## 1. TEST DATA — Users & Auth

| Field | Value | Ghi chu |
|---|---|---|
| role | admin | Quan tri he thong |
| role | leader | Lanh dao |
| role | specialist | Chuyen vien |
| role | port | Nguoi dung tai Cang |
| role | public | Ca nhan ben ngoai |
| totp_secret | base32-encoded | MFA |
| jwt_expiry | 3600s (1h) | Estimated |
| password_min_length | 8 | Estimated |
| password_complexity | Upper+Lower+Digit+Special | Estimated |

## 2. TEST DATA — KCHTGT Objects

### Cang bien (36 objects)
| Field | Example |
|---|---|
| code | CB-HA-001 |
| name | Cang Hai Phong |
| type | commercial |
| status | active |
| area_sqm | 50000 |
| depth_m | 12.5 |

### Ben cang (301 objects)
| Field | Example |
|---|---|
| code | BC-HA-001 |
| name | Ben cang A1 |
| cang_id | CB-HA-001 |
| length_m | 200 |
| max_depth_m | 10 |

### Cau cang (614 objects)
| Field | Example |
|---|---|
| code | CC-HA-001 |
| name | Cau cang 01 |
| length_m | 150 |
| width_m | 12 |

### Den bien (94 objects)
| Field | Example |
|---|---|
| code | DB-HA-001 |
| name | Den Bien Haiphong |
| latitude | 20.8449 |
| longitude | 106.6881 |
| light_range_nm | 15 |
| type | tower/beacon |

### Phao tieu (1452 objects)
| Field | Example |
|---|---|
| code | PT-HA-001 |
| type | navigation/anchorage |
| latitude | 20.5000 |
| longitude | 106.8000 |

## 3. TEST DATA — Reports

| Report | Format | Source |
|---|---|---|
| Mau 02 | PDF/Excel | Ke khai tai san |
| Mau 03 | PDF/Excel | Quan ly tai san |
| Mau 04 | PDF/Excel | Xu ly tai san |
| Bieu 01-N | PDF/Excel | Nang luc thong qua |
| Bieu 06-N | PDF/Excel | Thong ke den bien |

## 4. TEST DATA — Integration

| Endpoint | Type | Source |
|---|---|---|
| LGSP | RESTful JSON | Bo GTVT |
| NDXP | RESTful JSON | Quoc gia tai san |
| TCT BDTa | API/VPN | 2 TCT |
| VISHIPEL | API/VPN | CTHHH |

## 5. TEST DATA — GIS

| Field | Value | Ghi chu |
|---|---|---|
| coordinate_system | WGS84 | EPSG:4326 |
| base_chart | S-57 | IHO standard |
| encryption | S-63 | IHO standard |
| display | S-52 | IHO standard |
| geo_format | GeoJSON | For API |
| storage | MSSQL spatial + Shapefile | |
