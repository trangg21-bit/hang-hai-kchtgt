---
id: AM-5be953c54cdbfb75
kind: gotcha
topic: buoy-form-char-counters
tags: []
importance: 0.6
agent: 
created: 2026-08-22T08:46:10.353Z
updated: 2026-08-22T08:52:42.831Z
---

BuoyFormContent (form phao tiêu, M-013): chặn nhập quá giới hạn bằng maxLength (6 ô InputNumber dùng maxLength=20 — antd v6 hỗ trợ). Khi đạt max: Form.Item validateStatus='error' + help='Đã đạt tối đa X ký tự' (đỏ viền ô nhập + message đỏ dưới), theo dõi bằng Form.useWatch qua hook useMaxReached(name, max) — KHÔNG hiển thị counter 0/X. Giới hạn: name 255, locationDetail/shape/towerColor/powerSupply 500, structure 2000, lightModel 100, lightColor/flashType/period 50, area/bodyHeight/diameter/towerHeight/lightHeight/range 20.
