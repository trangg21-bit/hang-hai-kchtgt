---
id: AM-10ba0db1a1cee8db
kind: gotcha
topic: unpaged-page-serialization-500
tags: []
importance: 0.75
agent: 
created: 2026-08-20T07:17:50.435Z
updated: 2026-08-20T07:17:50.435Z
---

Lỗi 500 'Could not write JSON: UnsupportedOperationException' (Unpaged.getOffset) = controller trả PageImpl có pageable=Unpaged rồi Jackson serialize trực tiếp. Nguồn Unpaged trong code: Page.empty() KHÔNG tham số tại DocumentService:111 (listByEntity rỗng), BeaconHistoryService:65, BeaconHistoryController:47. Page.empty(pageable) có tham số thì an toàn. Spring Data 3.3+ resolve tham số Pageable trần (thiếu cả page lẫn size) thành Pageable.unpaged() thay vì PageRequest(0,20) — SpatialObjectCategoryController:27 là điểm trần duy nhất.
