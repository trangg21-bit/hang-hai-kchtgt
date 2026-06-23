# Responsive E2E Test Runner Script
# Runs tests across 3 viewports: Desktop, Tablet, Mobile

$Results = @{}
$ViewportTests = @(
    @{ Name="Desktop"; Width=1920; Height=1080; Device="Desktop Chrome (1920x1080)" },
    @{ Name="Tablet"; Width=820; Height=1180; Device="iPad Air (820x1180)" },
    @{ Name="Mobile"; Width=390; Height=844; Device="iPhone 14 Pro (390x844)" }
)

foreach ($vp in $ViewportTests) {
    Write-Output ""
    Write-Output "=========================================="
    Write-Output "Running tests: $($vp.Name) ($($vp.Device))"
    Write-Output "=========================================="
    
    $outputFile = "C:\Users\trangtt1\hang-hai-kchtgt\.ai-scratch\e2e-logs\$($vp.Name)-output.txt"
    mkdir "C:\Users\trangtt1\hang-hai-kchtgt\.ai-scratch\e2e-logs" -Force | Out-Null
    
    # Run playwright with viewport override, capture to file
    npx playwright test example.spec.ts login.spec.ts `
        --config=playwright-run.config.ts `
        --reporter=list `
        --project=chromium `
        --viewport-size="$($vp.Width),$($vp.Height)" `
        2>&1 | Tee-Object -FilePath $outputFile
    
    $Results[$vp.Name] = Get-Content $outputFile -Raw
}

# Summary
Write-Output ""
Write-Output "=========================================="
Write-Output "TEST RUN SUMMARY"
Write-Output "=========================================="
foreach ($vp in $ViewportTests) {
    $log = $Results[$vp.Name]
    $passed = ([regex]::Matches($log, "ok\s+\d+\s+\[")).Count
    $failed = ([regex]::Matches($log, "x\s+\d+\s+\[")).Count
    Write-Output "$($vp.Name): Passed=$passed Failed=$failed"
}
