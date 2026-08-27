---
id: AM-6fac694d0ecd0965
kind: gotcha
topic: maven-command-windows
tags: []
importance: 0.9
agent: 
created: 2026-08-21T07:40:33.204Z
updated: 2026-08-21T07:40:33.204Z
---

Shell bash trên máy này là cmd.exe (không PowerShell: Get-Command/Select-Object không tồn tại). Maven KHÔNG có trong PATH; phải dùng Maven bundled: "C:\Program Files\JetBrains\IntelliJ IDEA 2026.1.4\plugins\maven\lib\maven3\bin\mvn.cmd". JAVA_HOME = Eclipse Adoptium JDK 17.
