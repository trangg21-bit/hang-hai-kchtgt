$ErrorActionPreference = 'SilentlyContinue'
try {
    $connections = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
    if ($connections) {
        $processIds = $connections.OwningProcess | Where-Object { $_ -gt 4 } | Select-Object -Unique
        foreach ($pidToKill in $processIds) {
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            Write-Host "Da dung tien trinh cu tren port 8080 (PID: $pidToKill)"
        }
    } else {
        Write-Host "Port 8080 san sang"
    }
} catch {
    Write-Host "Port 8080 san sang"
}
