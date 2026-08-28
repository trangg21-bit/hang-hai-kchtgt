---
id: AM-8d2f282bb06f7b5d
kind: gotcha
topic: kcht-search-name-code
tags: []
importance: 0.8
agent: 
created: 2026-08-22T03:04:08.226Z
updated: 2026-08-22T03:04:08.226Z
---

Tìm kiếm tên/mã trên các màn KCHT: PortListPage (cảng biển), BerthListPage (bến cảng), PierListPage (cầu cảng), BuoyStationList (nhà trạm phao tiêu), BuoyListPage (phao tiêu) đang GỘP 'tên hoặc mã' thành 1 ô (param search/keyword gửi vào cả name+code). Backend Port/Berth/BuoyStation/Buoy ĐÃ hỗ trợ name/code riêng (portCode+portName, berthCode+berthName, name+code); RIÊNG PierRepository.searchPiers + PierController CHỈ có param search gộp pierCode/pierName — muốn tách tìm phải thêm pierName/pierCode xuyên controller→service→repository.
