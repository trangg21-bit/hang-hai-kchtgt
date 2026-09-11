---
name: kcht-spring-boot-launch
description: >-
  Quy chuẩn cấu hình và khắc phục lỗi khởi chạy / gỡ lỗi ứng dụng Spring Boot backend (KchtgApplication)
  trong Antigravity IDE / VS Code. Hướng dẫn xử lý triệt để lỗi JDWP transport error 202 (Connection refused)
  và xung đột cổng 8080 (Port already in use).
---

# KCHT Spring Boot Launch & Debugging Standard Skill

## 1. Giới thiệu & Phạm vi áp dụng

Skill này hướng dẫn AI và lập trình viên cấu hình, vận hành và khắc phục triệt để các lỗi khi khởi chạy ứng dụng **Spring Boot Backend** (`com.hanghai.kchtg.KchtgApplication`) trong môi trường Antigravity IDE / VS Code trên hệ điều hành Windows.

### Các vấn đề chính được xử lý:
1. **Lỗi JDWP Transport Error 202 (Connect failed: Connection refused)**: Khi nhấn `F5` hoặc chọn debug bằng Terminal.
2. **Lỗi Port 8080 already in use (Address already in use)**: Khi tiến trình Java cũ vẫn đang chiếm dụng port 8080.
3. **Đồng bộ hóa môi trường chạy**: Cấu hình chuẩn profile `local` hoặc `local-h2`.

---

## 2. Phân tích nguyên nhân gốc rễ (Root Causes)

### 2.1. Lỗi JDWP 202: `ERROR: transport error 202: connect failed: Connection refused`
- **Cơ chế**: Khi cấu hình `"console": "integratedTerminal"` trong `.vscode/launch.json`, extension Java debugger sinh ra lệnh PowerShell và truyền tham số:
  ```
  -agentlib:jdwp=transport=dt_socket,server=n,suspend=y,address=localhost:XXXXX
  ```
  Ở đây `server=n` nghĩa là máy ảo JVM đóng vai trò client cố gắng kết nối tới debug adapter của IDE đang mở cổng tạm thời `XXXXX`.
- **Nguyên nhân gây lỗi**:
  1. **Độ trễ khởi động PowerShell trên Windows**: Quá trình nạp profile PowerShell và gõ lệnh mất từ 1-3 giây, khiến socket server trên IDE hết thời gian chờ (handshake timeout) và đóng kết nối trước khi JVM kịp kết nối.
  2. **Bất đồng bộ IPv4 / IPv6 trên Windows**: Windows mặc định phân giải `localhost` thành `::1` (IPv6), trong khi extension debug chỉ lắng nghe trên `127.0.0.1` (IPv4). JVM kết nối tới `::1` dẫn tới lỗi ngay lập tức: `Connection refused`.

### 2.2. Lỗi xung đột Port 8080
Khi chạy backend nhiều lần hoặc tắt không dứt điểm cửa sổ debug, tiến trình `java.exe` cũ vẫn chạy ngầm chiếm cổng 8080 (TCP LISTENING). Lần khởi động tiếp theo sẽ bị crash do không thể bind socket cổng 8080.

---

## 3. Giải pháp Chuẩn mực Bắt buộc (MANDATORY)

### Quy tắc 1: Không sử dụng `"console": "integratedTerminal"` cho cấu hình chính
Bắt buộc dùng `"console": "internalConsole"` (Debug Console tích hợp) để IDE giao tiếp trực tiếp qua process pipe mà không thông qua terminal shell trung gian, loại bỏ hoàn toàn độ trễ khởi động shell.

### Quy tắc 2: Luôn bổ sung `-Djava.net.preferIPv4Stack=true`
Trong mọi cấu hình `vmArgs`, bắt buộc có `-Djava.net.preferIPv4Stack=true` để ép JVM sử dụng ngăn xếp mạng IPv4 `127.0.0.1`, tránh lỗi phân giải `localhost` sang IPv6.

### Quy tắc 3: Cung cấp cấu hình Run không debug (`"noDebug": true`)
Thêm cấu hình chạy trực tiếp với `"noDebug": true`. Khi người dùng chỉ muốn chạy backend để test frontend hoặc API mà không cần đặt breakpoint, chế độ này khởi động ngay lập tức 100% không bao giờ gặp lỗi JDWP.

### Quy tắc 4: Không gắn `preLaunchTask` trực tiếp vào `launch.json`
Extension Java debugger (`vscode-java-debug`) trong VS Code / Antigravity IDE gặp lỗi timeout / stall khi đợi callback từ `preLaunchTask`, khiến tiến trình debug bị treo lại ngay sau khi task hoàn tất và không bao giờ chuyển tiếp sang khởi động JVM. Vì vậy:
- **KHÔNG** đặt `"preLaunchTask"` trong `.vscode/launch.json`.
- Khi cần giải phóng port 8080, chạy thủ công qua script `.\scripts\free-port-8080.ps1` hoặc task `Free Port 8080` từ menu Terminal.

---

## 4. File mẫu cấu hình chuẩn

### 4.1. File `.vscode/launch.json`
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "java",
            "name": "Spring Boot - KchtgApplication (Local)",
            "request": "launch",
            "mainClass": "com.hanghai.kchtg.KchtgApplication",
            "projectName": "kchtg",
            "cwd": "${workspaceFolder}",
            "console": "internalConsole",
            "javaExec": "${userHome}/.antigravity-ide/extensions/redhat.java-1.56.0-win32-x64/jre/21.0.12.1-win32-x86_64/bin/java.exe",
            "vmArgs": "-Dspring.profiles.active=local -Dfile.encoding=UTF-8 -Djava.net.preferIPv4Stack=true -XX:ReservedCodeCacheSize=512m -XX:InitialCodeCacheSize=64m -Xms512m -Xmx2048m",
            "env": {
                "spring.profiles.active": "local"
            }
        },
        {
            "type": "java",
            "name": "Spring Boot - KchtgApplication (Local - Terminal)",
            "request": "launch",
            "mainClass": "com.hanghai.kchtg.KchtgApplication",
            "projectName": "kchtg",
            "cwd": "${workspaceFolder}",
            "console": "integratedTerminal",
            "javaExec": "${userHome}/.antigravity-ide/extensions/redhat.java-1.56.0-win32-x64/jre/21.0.12.1-win32-x86_64/bin/java.exe",
            "vmArgs": "-Dspring.profiles.active=local -Dfile.encoding=UTF-8 -Djava.net.preferIPv4Stack=true -XX:ReservedCodeCacheSize=512m -XX:InitialCodeCacheSize=64m -Xms512m -Xmx2048m",
            "env": {
                "spring.profiles.active": "local"
            }
        },
        {
            "type": "java",
            "name": "Spring Boot - KchtgApplication (Local H2)",
            "request": "launch",
            "mainClass": "com.hanghai.kchtg.KchtgApplication",
            "projectName": "kchtg",
            "cwd": "${workspaceFolder}",
            "console": "internalConsole",
            "javaExec": "${userHome}/.antigravity-ide/extensions/redhat.java-1.56.0-win32-x64/jre/21.0.12.1-win32-x86_64/bin/java.exe",
            "vmArgs": "-Dspring.profiles.active=local-h2 -Dfile.encoding=UTF-8 -Djava.net.preferIPv4Stack=true",
            "env": {
                "spring.profiles.active": "local-h2"
            }
        }
    ]
}
```

---

## 5. Lệnh hữu ích khi cần thao tác bằng dòng lệnh (CLI Reference)

### Kiểm tra cổng 8080:
```powershell
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
```

### Dừng cưỡng bức tiến trình đang giữ cổng 8080:
```powershell
$p = (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue).OwningProcess | Where-Object { $_ -gt 4 } | Select-Object -Unique; if ($p) { Stop-Process -Id $p -Force }
```

### Kiểm tra tình trạng backend:
```powershell
curl.exe -s -i "http://localhost:8080/api/v1/auth/me"
```

---

## 6. Checklist kiểm tra nhanh khi gặp lỗi khởi chạy (Self-Verification)

- [ ] 1. Kiểm tra cấu hình `launch.json` có `console: "internalConsole"` hay không (nếu là `integratedTerminal`, chuyển sang `internalConsole`).
- [ ] 2. Kiểm tra `vmArgs` có `-Djava.net.preferIPv4Stack=true` hay chưa.
- [ ] 3. Kiểm tra xem cổng 8080 có bị chiếm dụng bởi PID khác hay không (`Get-NetTCPConnection -LocalPort 8080`).
- [ ] 4. Nếu chỉ cần chạy mà không debug breakpoint, ưu tiên chọn cấu hình `Spring Boot - KchtgApplication (Run - Local)` có `noDebug: true`.
