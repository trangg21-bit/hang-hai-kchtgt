---
id: AM-94999eda89fe144e
kind: gotcha
topic: antd-treeselect-labelrender
tags: []
importance: 0.9
agent: 
created: 2026-08-21T02:43:37.307Z
updated: 2026-08-21T02:43:37.307Z
---

antd v6 dùng @rc-component/tree-select KHÔNG hỗ trợ prop labelRender (chỉ tồn tại trong type, source không đọc) — label hiển thị trên thanh select của TreeSelect lấy từ treeNodeLabelProp (mặc định title). Muốn hiển thị nội dung khác với dropdown: gắn field label vào node treeData + treeNodeLabelProp='label'. OrgUnitTreeSelect đã thêm prop showPath (opt-in) làm đúng cách này.
