---
id: AM-3a114ec334c936bf
kind: gotcha
topic: intake-tripwire-c0-quirk
tags: []
importance: 0.75
agent: 
created: 2026-08-18T04:30:52.062Z
updated: 2026-08-18T04:30:52.062Z
---

intake_triage với footprint 1 file luôn ra C0 (LOC budget 50) dù thay đổi thực tế 100-200 dòng; re-triage cùng footprint vẫn C0 (class chỉ tính theo files/packages/one-way-door). Tripwire C0: dưới 50 dòng là notice advisory (edit vẫn áp); vượt 50 dòng lane bị breach → mọi write sau đó bị REFUSE cho tới khi re-triage arm lane mới. Luồng đúng: edit → breach → re-triage → edit tiếp.
