---
id: AM-02f2018caf501066
kind: gotcha
topic: berth-form-limits
tags: []
importance: 0.6
agent: 
created: 2026-08-22T09:20:08.674Z
updated: 2026-08-22T09:20:08.674Z
---

BerthForm.tsx (pages/port — form bến cảng, dùng chung create+update qua forwardRef + form prop, render bởi BerthListPage 2 drawer): pattern useMaxReached(name,max) dùng Form.useWatch(name, form). Các ô số (totalArea, designThroughput, currentThroughput, maxVesselSize, plannedThroughput, latestCargoVolume) ĐÃ có maxLength={20} từ trước; openingDecision đã sửa maxLength 500→2000 theo yêu cầu user (Quyết định công bố/Văn bản cho phép khai thác); investmentAgreement 2000. 5 lỗi tsc pre-existing: spaceXs/spaceMd/submitting/existingFiles unused + dòng 175 coordinateList type.
