---
id: AM-d26d7c087e7ad466
kind: gotcha
topic: bash-wait-exitcode-tsc-baseline
tags: []
importance: 0.8
agent: 
created: 2026-08-22T06:30:59.718Z
updated: 2026-08-22T06:30:59.718Z
---

GOTCHA: bash action=wait báo 'Command exited with code 0' là exit code của THAO TÁC WAIT, không phải của job — phải đọc kết quả job được chuyển về (bash_job_result / supervised completion) để biết exit code thật. Lần đầu đọc nhầm mã 0 thành tsc PASS. Ngoài ra: npx tsc --noEmit -p tsconfig.app.json của repo này exit 2 do lỗi baseline toàn dự án (~100 file, gồm cả file test/GIS), không phải do thay đổi nhỏ; shell filter (findstr/Where-Object) bị gate chặn nên khó trích lỗi tsc theo file.
