---
id: AM-443752dd64dc2624
kind: gotcha
topic: detail-grid-2col-layout
tags: []
importance: 0.75
agent: 
created: 2026-08-22T07:17:46.965Z
updated: 2026-08-22T07:17:46.965Z
---

Detail screens (DryPortDetailContent, PierDetailContent, BerthDetailContent...) dùng .detail-grid = CSS grid 2 cột (grid-template-columns: 1fr 1fr), mỗi phần tử mảng [label,value] chiếm 1 cell và auto-placement chảy theo cột: item1→(1,1), item2→(2,1), item3→(1,2)... Muốn 2 field nằm CÙNG hàng dưới một dòng khác, phải đặt chúng ở vị trí 2k+1/2k+2 của mảng (sau item chẵn), KHÔNG phải liền kề sau item lẻ — đặt sai sẽ làm field nằm bên phải thay vì bên dưới.
