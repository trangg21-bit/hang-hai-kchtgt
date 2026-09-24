# Script giải phóng cổng 8080 theo quy chuẩn skill kcht-spring-boot-launch
$connections = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections.OwningProcess | Where-Object { $_ -gt 4 } | Select-Object -Unique
    foreach ($p in $pids) {
        Write-Host "Đang dừng tiến trình PID $p đang chiếm dụng cổng 8080..."
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Milliseconds 500
    $check = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
    if (-not $check) {
        Write-Host "Cổng 8080 đã được giải phóng thành công."
    } else {
        Write-Warning "Không thể giải phóng cổng 8080."
    }
} else {
    Write-Host "Cổng 8080 hiện đang trống, sẵn sàng khởi chạy."
}
