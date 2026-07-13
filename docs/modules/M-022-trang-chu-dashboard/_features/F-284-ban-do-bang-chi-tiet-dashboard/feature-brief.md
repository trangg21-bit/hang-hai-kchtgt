---
id: F-284
name: Bản đồ & Bảng chi tiết Dashboard
slug: ban-do-bang-chi-tiet-dashboard
module-id: M-022
status: done
priority: medium
created: 2026-07-09T00:00:00Z
last-updated: 2026-07-13T00:00:00Z
stage: closed
---
# Feature: Bản đồ & Bảng chi tiết Dashboard

## Description

Bản đồ Leaflet thực (DashboardMap.tsx) + Bảng chi tiết 10 dòng KCHT. Không phải placeholder — Leaflet map với Google Maps tiles, center [16.0, 108.0] zoom 6. Chưa có GIS overlay data layer (pending backend GeoJSON endpoint).

Bảng 6 cột: Loại KCHT (bỏ tiêu đề cột 1), Tổng số lượng, Chưa khai thác/vận hành (header 2 dòng, bỏ chấm tròn), Đang khai thác/vận hành (2 dòng, bỏ chấm tròn), Dừng khai thác/vận hành (2 dòng, bỏ chấm tròn), action (eye icon). Pill badge sea-blue palette. Scroll Y 340px, không phân trang.

## Acceptance Criteria

1. Bản đồ Leaflet 380px cao, Google Maps tiles, zoom 6 — không phải placeholder
2. Bảng Ant Design scroll Y 340px, không phân trang
3. Cột 3-5: header 2 dòng không chấm tròn, pill badge sea-blue palette (dataSea0/dataSea2/dataSea3)
4. Cột 1: bỏ tiêu đề (để trống)
5. Cột 6: EyeOutlined icon
6. Mock data 10 dòng mẫu
7. Loading/Empty/Error states

## Dependencies

- F-280 (FilterBar)
- tokens-dashboard.ts: dataSea0/2/3, pill badge styling
- Leaflet 1.9.4 (CDN): bản đồ nền
