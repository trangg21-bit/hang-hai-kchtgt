---
module-id: M-015
document: lean-spec-index
output-mode: lean
last-updated: 2026-08-28
---
# M-015 Quản lý Đài thông tin duyên hải — Index Lean Spec

## Tổng quan

Module M-015 quản lý 5 nhóm Đài thông tin duyên hải, mỗi nhóm 6 feature (tao-moi / cap-nhat / xoa / phe-duyet / xem-chi-tiet / lich-su) = 30 feature (F-092..F-121). Toàn bộ code nằm trong package `com.hanghai.kchtg.station` (BaseStation + 5 entity coastal, controller dưới `/api/v1/stations/...`, `StationHistoryController` cho lịch sử tập trung).

## Entity → Feature → Sheet → Auto-code map

| Nhóm | Features | Entity / Table | Controller (base path) | Excel sheet | Auto-code |
|---|---|---|---|---|---|
| Đài TTDH | F-092..F-097 | `CoastalStationVTS` / `coastal_station_vts` | `/api/v1/stations/coastal` | "Đài TTDH" (~1510) | `DTTDH-{seq}` — **DRIFT #2: code không có generateCode, nhận từ request** |
| Đài Inmarsat | F-098..F-103 | `CoastalStationInmarsat` / `coastal_station_inmarsat` | `/api/v1/stations/inmarsat` | "Đài Inmarsat" (~1622) | `INMARSAT-%04d` — có generateCode |
| Đài Cospas-Sarsat | F-104..F-109 | `CoastalStationCospasSarsat` / `coastal_station_cospas_sarsat` | `/api/v1/stations/cospas-sarsat` | "Đài Cospas-Sarsat" (~1725) | `SARSAT-{seq}` — **DRIFT #2: code không có generateCode, nhận từ request** |
| Đài LRIT | F-110..F-115 | `CoastalStationLRIT` / `coastal_station_lrit` | `/api/v1/stations/lrit` | "Đài LRIT" (~1674) | `LRIT-%04d` — có generateCode |
| Đài TTXLTT Hà Nội | F-116..F-121 | `CoastalStationHaiphong` / `coastal_station_haiphong` | `/api/v1/stations/haiphong` | "Đài TTXLTT Hà Nội" (~1777) | `TTXLTT-%04d` — có generateCode |

> KHÔNG dùng sheet "Hệ thống VHF" (~1562) — thuộc M-013.

## Danh sách 30 feature + lean-spec

| Feature | Tên | Lean-spec |
|---|---|---|
| F-092 | Quản lý Đài TTDH - Tạo mới | `_features/F-092-quan-ly-dai-ttdh-tao-moi/ba/00-lean-spec.md` |
| F-093 | Quản lý Đài TTDH - Cập nhật | `_features/F-093-quan-ly-dai-ttdh-cap-nhat/ba/00-lean-spec.md` |
| F-094 | Quản lý Đài TTDH - Xóa | `_features/F-094-quan-ly-dai-ttdh-xoa/ba/00-lean-spec.md` |
| F-095 | Phê duyệt Đài TTDH | `_features/F-095-phe-duyet-dai-ttdh/ba/00-lean-spec.md` |
| F-096 | Xem chi tiết Đài TTDH | `_features/F-096-xem-chi-tiet-dai-ttdh/ba/00-lean-spec.md` |
| F-097 | Quản lý Đài TTDH - Lịch sử | `_features/F-097-quan-ly-dai-ttdh-lich-su/ba/00-lean-spec.md` |
| F-098 | Quản lý Đài Inmarsat - Tạo mới | `_features/F-098-quan-ly-dai-inmarsat-tao-moi/ba/00-lean-spec.md` |
| F-099 | Quản lý Đài Inmarsat - Cập nhật | `_features/F-099-quan-ly-dai-inmarsat-cap-nhat/ba/00-lean-spec.md` |
| F-100 | Quản lý Đài Inmarsat - Xóa | `_features/F-100-quan-ly-dai-inmarsat-xoa/ba/00-lean-spec.md` |
| F-101 | Phê duyệt Đài Inmarsat | `_features/F-101-phe-duyet-dai-inmarsat/ba/00-lean-spec.md` |
| F-102 | Xem chi tiết Đài Inmarsat | `_features/F-102-xem-chi-tiet-dai-inmarsat/ba/00-lean-spec.md` |
| F-103 | Quản lý Đài Inmarsat - Lịch sử | `_features/F-103-quan-ly-dai-inmarsat-lich-su/ba/00-lean-spec.md` |
| F-104 | Quản lý Đài Cospas-Sarsat - Tạo mới | `_features/F-104-quan-ly-dai-cospas-sarsat-tao-moi/ba/00-lean-spec.md` |
| F-105 | Quản lý Đài Cospas-Sarsat - Cập nhật | `_features/F-105-quan-ly-dai-cospas-sarsat-cap-nhat/ba/00-lean-spec.md` |
| F-106 | Quản lý Đài Cospas-Sarsat - Xóa | `_features/F-106-quan-ly-dai-cospas-sarsat-xoa/ba/00-lean-spec.md` |
| F-107 | Phê duyệt Đài Cospas-Sarsat | `_features/F-107-phe-duyet-dai-cospas-sarsat/ba/00-lean-spec.md` |
| F-108 | Xem chi tiết Đài Cospas-Sarsat | `_features/F-108-xem-chi-tiet-dai-cospas-sarsat/ba/00-lean-spec.md` |
| F-109 | Quản lý Đài Cospas-Sarsat - Lịch sử | `_features/F-109-quan-ly-dai-cospas-sarsat-lich-su/ba/00-lean-spec.md` |
| F-110 | Quản lý Đài LRIT - Tạo mới | `_features/F-110-quan-ly-dai-lrit-tao-moi/ba/00-lean-spec.md` |
| F-111 | Quản lý Đài LRIT - Cập nhật | `_features/F-111-quan-ly-dai-lrit-cap-nhat/ba/00-lean-spec.md` |
| F-112 | Quản lý Đài LRIT - Xóa | `_features/F-112-quan-ly-dai-lrit-xoa/ba/00-lean-spec.md` |
| F-113 | Phê duyệt Đài LRIT | `_features/F-113-phe-duyet-dai-lrit/ba/00-lean-spec.md` |
| F-114 | Xem chi tiết Đài LRIT | `_features/F-114-xem-chi-tiet-dai-lrit/ba/00-lean-spec.md` |
| F-115 | Quản lý Đài LRIT - Lịch sử | `_features/F-115-quan-ly-dai-lrit-lich-su/ba/00-lean-spec.md` |
| F-116 | Quản lý Đài TT hang hai HN - Tạo mới | `_features/F-116-quan-ly-dai-tt-hang-hai-hn-tao-moi/ba/00-lean-spec.md` |
| F-117 | Quản lý Đài TT hang hai HN - Cập nhật | `_features/F-117-quan-ly-dai-tt-hang-hai-hn-cap-nhat/ba/00-lean-spec.md` |
| F-118 | Quản lý Đài TT hang hai HN - Xóa | `_features/F-118-quan-ly-dai-tt-hang-hai-hn-xoa/ba/00-lean-spec.md` |
| F-119 | Phê duyệt Đài TT hang hai HN | `_features/F-119-phe-duyet-dai-tt-hang-hai-hn/ba/00-lean-spec.md` |
| F-120 | Xem chi tiết Đài TT hang hai HN | `_features/F-120-xem-chi-tiet-dai-tt-hang-hai-hn/ba/00-lean-spec.md` |
| F-121 | Quản lý Đài TT hang hai HN - Lịch sử | `_features/F-121-quan-ly-dai-tt-hang-hai-hn-lich-su/ba/00-lean-spec.md` |

## Cấu trúc mỗi lean-spec

Use Cases · Scope · Field Coverage Matrix (từ Excel, 8 cột chính xác) · Business Rules BR-XXX-NN · Domain Model · Approval flow 2 cấp C1→C2 · Validation Rules · Acceptance Criteria (observable) · Pipeline Triage.

## Quy trình phê duyệt 2 cấp C1→C2 (dùng chung cả 5 nhóm)

Nguồn: `docs/conventions/approval-2-level-spec.md` §3 + `InfrastructureApprovalService`. 7 trạng thái: `DRAFT`(0) Lưu tạm → `PENDING_APPROVAL`(2) Chờ Cảng vụ/Chi cục duyệt → `APPROVED_LEVEL1`(3) Chờ Cục duyệt → `APPROVED`(5) Đã duyệt; nhánh từ chối `REJECTED_LEVEL1`(8) / `REJECTED_LEVEL2`(9); `ARCHIVED`(7) Đã xóa. 4-eyes chống tự duyệt (người duyệt ≠ người tạo; C2 ≠ C1). Reject bắt buộc lý do ≥10 ký tự. Submit từ cấp Cục → thẳng APPROVED_LEVEL1. Sửa theo trạng thái (§3.9): DRAFT/REJECTED_* sửa được; PENDING/APPROVED_LEVEL1 đóng băng; APPROVED sửa qua "Lưu và phê duyệt" (quyền approvec2). Xóa mềm chỉ ở DRAFT (`deleteDraft`/`assertDeletable`). Hiển thị trạng thái qua `ApprovalStatusBadge`/`normalizeApprovalStatus`.

## Drift đã ghi nhận (không sửa code, không sửa brief)

| # | Drift | Bằng chứng | Ảnh hưởng |
|---|---|---|---|
| 1 | Enum `status`/`approvalStatus`: 5 entity coastal dùng `@Enumerated(ORDINAL)` smallint (ĐÚNG convention INT); `conditionStatus` là String ("OPERATIONAL") không phải enum; `BaseStation` (cha BuoyStation) dùng STRING | entity/*.java | Ghi nhận: ORDINAL đúng; String conditionStatus là lựa chọn hiện tại |
| 2 | Auto-code: VTS (DTTDH-) và Cospas (SARSAT-) **không có generateCode()** — mã nhận từ request; Inmarsat/LRIT/Haiphong có generateCode() | CoastalStationVTSService/CospasSarsatService vs Inmarsat/LRIT/HaiphongService | F-092/F-104 cần SA chốt: bổ sung generateCode hay chấp nhận client truyền |
| 3 | Tên endpoint duyệt: VTS/Inmarsat/Cospas dùng `approve-l1`/`approve-l2`; LRIT/Haiphong dùng `approve-c1`/`approve-c2` (chuẩn) | controllers | Thống nhất tên hoặc alias; SA chốt |
| 4 | Entity `CoastalStationHaiphong` / bảng `coastal_station_haiphong` / type history "HAIPHONG" vs nhãn feature "Đài TTXLTT Hà Nội" | entity + StationHistoryService map | Ghi nhận tên code vs nhãn nghiệp vụ |
| 5 | Feature-brief ghi "trạng thái pending/Chờ phê duyệt sau khi tạo" — code thực tế `DRAFT` (chỉ submit mới sang PENDING_APPROVAL) | @PrePersist setDefaultStatus + approvalService.submit | Brief sai — lean-spec là nguồn đúng; KHÔNG sửa brief |
| 6 | Prefix auto-code biến thể: DTTDH-/SARSAT- (Excel, chưa code) vs INMARSAT-/LRIT-/TTXLTT- (code, %04d) | Excel vs services | Liên quan drift #2 |

## Ghi chú kiến trúc khác

- **Permission (observation):** VTS + Cospas controller chỉ có `@PreAuthorize` cho nhóm submit/approve/reject; CRUD-read (GET/POST/PUT/DELETE) không có @PreAuthorize method-level — chính sách quyền CRUD cần SA xác nhận. Inmarsat/LRIT/Haiphong có đầy đủ (read/create/update/delete).
- **Data scope:** VTS/Cospas filter theo `unit_id`; Inmarsat/LRIT/Haiphong filter theo `org_unit_id` (entity có cả 2 cột, `getOrgUnitId()` = orgUnitId ?? unitId). Tất cả controller `@DataScope`.
- **History:** tập trung qua `station_history`; type string: VTS/COASTAL_VTS/DAI_DUYEN_HAI, INMARSAT, COSPAS_SARSAT/COSPAS-SARSAT, LRIT, HAIPHONG.
- **Điểm khác biệt ma trận Excel giữa 5 nhóm:** TTDH Sửa=F toàn TAB1 (chỉ GIS+file); Inmarsat/Cospas có "Tần số liên lạc"; LRIT/TTXLTT không có; TTXLTT HN "Địa điểm chi tiết" có Bộ lọc=T; TTDH có "Phân loại đài".

## Nguồn

- Excel: `HH_Tính năng & danh sách các trường thông tin.xlsx` (repo root), sheets "Đài TTDH" (~1510), "Đài Inmarsat" (~1622), "Đài LRIT" (~1674), "Đài Cospas-Sarsat" (~1725), "Đài TTXLTT Hà Nội" (~1777). KHÔNG dùng "Hệ thống VHF" (M-013).
- Code: `src/main/java/com/hanghai/kchtg/station/**` (entity, controller, service, dto).
- Conventions: `docs/conventions/approval-2-level-spec.md`, `docs/conventions/infrastructure-feature-standard-architecture.md`.
- 30 lean-spec feature-level: đường dẫn trong bảng trên; mỗi file là nguồn chi tiết cho feature đó.
