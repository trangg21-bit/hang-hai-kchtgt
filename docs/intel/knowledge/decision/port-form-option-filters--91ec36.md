---
id: AM-91ec36488bdaf361
kind: decision
topic: port-form-option-filters
tags: []
importance: 0.75
agent: 
created: 2026-08-17T07:46:48.590Z
updated: 2026-08-17T07:46:48.590Z
---

Dropdown 'Thuộc cảng biển' (BerthForm/PierForm) và 'Thuộc bến cảng' (PierForm) chỉ load approvalStatus=APPROVED (bản ghi xóa mềm tự bị loại bởi repository). portCRUD.search trong frontend/src/services/portService.ts từng khai báo sai param 'managingUnitId' (backend PortController chỉ nhận 'orgUnitId') nên lọc đơn vị bị rơi âm thầm — đã sửa thành orgUnitId (2026-08-17). Backend port/berth search đã hỗ trợ sẵn approvalStatus.
