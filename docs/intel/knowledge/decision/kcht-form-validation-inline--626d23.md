---
id: AM-626d23e9ec9eceeb
kind: decision
topic: kcht-form-validation-inline
tags: []
importance: 0.7
agent: 
created: 2026-08-14T04:14:41.919Z
updated: 2026-08-14T04:14:41.919Z
---

Validation form KCHT (cảng biển/bến/cầu/cảng cạn) đã chuyển từ toast thủ công sang cơ chế AntD: submit handler gọi form.validateFields() (PierForm/BerthForm/DryPortForm qua ref.submit) hoặc onFinish (PortListPage 2 modal). PortListPage handleFormFailed giờ rỗng (không toast lỗi validate nữa); orgUnitId/province/portClass chỉ bắt buộc khi submit/approve → dùng createForm.setFields([{name, errors}]) để hiện viền đỏ. GPS coordinates là state ngoài Form nên vẫn toast khi thiếu tọa độ.
