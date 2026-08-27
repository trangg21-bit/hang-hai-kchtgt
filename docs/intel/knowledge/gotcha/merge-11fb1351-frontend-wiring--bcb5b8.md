---
id: AM-bcb5b81d4a89b785
kind: gotcha
topic: merge-11fb1351-frontend-wiring
tags: []
importance: 0.8
agent: 
created: 2026-08-20T05:06:51.771Z
updated: 2026-08-20T05:10:00.097Z
---

Sau merge company/main → main, frontend bị hỏng wiring: App.tsx lazy BuoyStationList trỏ nhầm pages/beacons/BeaconList (trang /buoy-station hiện thành Đèn biển), GISChartView.tsx import fetchBuoyStationById từ services/station/beacon/api (module cũ chỉ export LighthouseStation*) — đã fix trỏ về services/buoy-station/api. BuoyStationList.tsx conflict (Updated upstream vs Stashed changes) đã resolve giữ bản incoming (kiến trúc BuoyStationDetailContent, 1056 dòng). LƯU Ý verify: vite build PASS nhưng npx tsc --noEmit exit 2 — project có ~600 lỗi type sẵn có trên ~90 file (App.tsx 0 lỗi; GISChartView 55 lỗi sẵn có, lỗi đầu ở dòng 44 import vtsSystemService — không phải do fix).
