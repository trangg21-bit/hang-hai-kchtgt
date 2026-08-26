---
id: AM-33a34e25b685c749
kind: gotcha
topic: backend-compile-command
tags: []
importance: 0.9
agent: 
created: 2026-08-25T10:22:03.788Z
updated: 2026-08-25T10:22:03.788Z
---

Bash tool trên Windows chạy qua cmd.exe (KHÔNG phải PowerShell): cú pháp `$env:X=`/`& 'path'` hỏng, và `set VAR=x && cmd` KHÔNG lan biến (tool escape % thành %%). Cách compile backend ĐÚNG: không cần set JAVA_HOME — global đã trỏ C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot; gọi thẳng "C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd" clean compile (mvn không có trên PATH).
