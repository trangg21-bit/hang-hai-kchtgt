---
id: AM-4589480a85dab683
kind: gotcha
topic: pier-form-limits
tags: []
importance: 0.6
agent: 
created: 2026-08-22T09:23:59.630Z
updated: 2026-08-22T09:23:59.630Z
---

PierForm.tsx (pages/port — form cầu cảng, forwardRef + form prop, render bởi PierListPage drawer): pattern useMaxReached(name,max) — 12 field: pierName 255, detailedLocation 500, documentNumber 20 (đã sửa maxLength 200→20), 6 ô số (length, width, currentWaterDepth, designBedElevation, publishedVesselDWT, cargoThroughput) maxLength 20 + giữ max giá trị cũ, 3 ô số lượng (operatingPierCount, publishedPierCount, investmentAgreementPierCount) maxLength 5. FINDING: App.tsx:193-194 route /pier/create + /pier/:id/edit render <PierForm /> THIẾU props form/onFinish (TS2739, pre-existing — có thể crash nếu truy cập route đó; luồng drawer chính OK).
