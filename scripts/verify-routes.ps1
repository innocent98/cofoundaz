# Mock API Verification Script
$baseUrl = "http://localhost:3000/api/v1"

$endpoints = @(
    "/dashboard/overview",
    "/dashboard/widgets",
    "/dashboard/activity",
    "/roadmap/milestones",
    "/roadmap/milestones/ms1",
    "/roadmap/kanban",
    "/roadmap/dependencies",
    "/health/overview",
    "/health/benchmarks",
    "/health/recommendations",
    "/health/history",
    "/assessments",
    "/assessments/a1",
    "/missions",
    "/missions/m1",
    "/documents",
    "/document-templates",
    "/sign",
    "/journal",
    "/journal/j1",
    "/learning/courses",
    "/learning/paths",
    "/learning/certificates",
    "/notifications",
    "/invitations",
    "/validation/assumptions",
    "/finance/runway",
    "/marketing/campaigns",
    "/sales/leads",
    "/investor-readiness/data-room"
)

Write-Host "Verifying Local Mock API endpoints at $baseUrl..."

$successCount = 0
$failCount = 0

foreach ($endpoint in $endpoints) {
    $url = "$baseUrl$endpoint"
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "[PASS] $endpoint" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "[FAIL] $endpoint returned HTTP $($response.StatusCode)" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "[FAIL] $endpoint - $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "Summary: $successCount Passed, $failCount Failed."
if ($failCount -gt 0) {
    exit 1
} else {
    exit 0
}
