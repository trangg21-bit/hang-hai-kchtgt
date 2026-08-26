---
id: AM-2e1ef804b08d06f9
kind: decision
topic: anchorage-form-required-province-status
tags: []
importance: 0.8
agent: 
created: 2026-08-26T04:07:20.659Z
updated: 2026-08-26T04:07:20.659Z
---

Anchorage form (2026-08-26, user chốt theo CSV): Địa điểm (Tỉnh/TP) và Tình trạng giờ BẮT BUỘC trong Thêm mới + Chỉnh sửa. AnchorageForm.tsx: thêm rules required cho provinceId (msg 'Địa điểm (Tỉnh/Thành phố) là bắt buộc') và operationalStatus (msg 'Tình trạng là bắt buộc'); đã xóa block toast 'bắt buộc khi gửi duyệt' cũ. CreateAnchorageRequest.java: thêm @NotNull cho provinceId + operationalStatus. UpdateAnchorageRequest KHÔNG thêm @NotNull vì AnchorageService.update là partial-update (if x != null).
