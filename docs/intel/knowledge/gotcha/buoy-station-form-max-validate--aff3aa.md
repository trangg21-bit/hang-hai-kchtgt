---
id: AM-aff3aa75608a2c5d
kind: gotcha
topic: buoy-station-form-max-validate
tags: []
importance: 0.6
agent: 
created: 2026-08-22T08:56:48.899Z
updated: 2026-08-22T08:56:48.899Z
---

BuoyStationFormContent (form nhà trạm, M-014): cùng pattern phao tiêu — hook useMaxReached(form, name, max) (file này nhận form qua prop, KHÔNG dùng context như BuoyFormContent) + Form.Item validateStatus='error' + help='Đã đạt tối đa X ký tự' khi chạm max. Giới hạn: name 255, address 500, totalArea/usableArea 20, staffCount 5, note 2000. Lỗi tsc pre-existing còn lại: dòng 225 displayRule không tồn tại trên BuoyStationResponse (logic prefill cũ, chưa sửa).
