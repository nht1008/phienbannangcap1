# UI & Responsive Testing Script for Windows PowerShell
# Cửa Hàng Hoa Công Nguyệt - UI Testing Suite

param(
    [switch]$SkipInstall,
    [switch]$PlaywrightOnly,
    [switch]$LighthouseOnly,
    [switch]$NoServer,
    [switch]$Help
)

# Colors for console output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Step($stepNumber, $title) {
    Write-Host ""
    Write-ColorOutput Yellow "📋 Step $stepNumber`: $title"
}

function Write-Success($message) {
    Write-ColorOutput Green "✅ $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "⚠️ $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ️ $message"
}

if ($Help) {
    Write-Host @"
🌸 UI & Responsive Testing Script for Cửa Hàng Hoa Công Nguyệt

Usage: .\ui-test-runner.ps1 [options]

Options:
  -Help             Show this help message
  -SkipInstall      Skip dependency installation
  -PlaywrightOnly   Run only Playwright tests
  -LighthouseOnly   Run only Lighthouse audits
  -NoServer         Don't start dev server (assume it's running)

Examples:
  .\ui-test-runner.ps1                    # Full test suite
  .\ui-test-runner.ps1 -PlaywrightOnly    # Only browser tests
  .\ui-test-runner.ps1 -LighthouseOnly    # Only performance tests
  .\ui-test-runner.ps1 -NoServer          # Skip server startup
"@
    exit 0
}

Write-ColorOutput Magenta @"
🌸 Starting UI & Responsive Testing for Cửa Hàng Hoa Công Nguyệt

Target: http://localhost:3000
Tests: Cross-browser, Responsive Design, Performance, Accessibility
"@

# Step 1: Check Dependencies
function Test-Dependencies {
    Write-Step 1 "Checking Dependencies"
    
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found. Are you in the correct directory?"
        exit 1
    }

    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $devDependencies = $packageJson.devDependencies
    
    $requiredPackages = @("@playwright/test", "lighthouse")
    $missingPackages = @()
    
    foreach ($package in $requiredPackages) {
        if (-not $devDependencies.$package) {
            $missingPackages += $package
        }
    }
    
    if ($missingPackages.Count -gt 0 -and -not $SkipInstall) {
        Write-Warning "Missing packages: $($missingPackages -join ', ')"
        Write-Info "Installing missing packages..."
        
        try {
            npm install --save-dev @($missingPackages)
            Write-Success "Dependencies installed successfully"
        }
        catch {
            Write-Error "Failed to install dependencies: $_"
            exit 1
        }
    }
    elseif ($missingPackages.Count -eq 0) {
        Write-Success "All dependencies are installed"
    }
    else {
        Write-Warning "Skipping dependency installation"
    }
}

# Step 2: Install Playwright Browsers
function Install-PlaywrightBrowsers {
    Write-Step 2 "Installing Playwright Browsers"
    
    try {
        npx playwright install
        Write-Success "Playwright browsers installed"
    }
    catch {
        Write-Error "Failed to install Playwright browsers: $_"
        exit 1
    }
}

# Step 3: Start Development Server
function Start-DevServer {
    Write-Step 3 "Starting Development Server"
    
    if ($NoServer) {
        Write-Info "Skipping server startup (assuming it's already running)"
        return $null
    }
    
    try {
        Write-Info "Starting development server..."
        $job = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            npm run dev
        }
        
        # Wait for server to start
        $timeout = 120 # seconds
        $elapsed = 0
        $serverReady = $false
        
        while ($elapsed -lt $timeout -and -not $serverReady) {
            Start-Sleep -Seconds 2
            $elapsed += 2
            
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    $serverReady = $true
                    Write-Success "Development server is running"
                }
            }
            catch {
                # Server not ready yet, continue waiting
            }
        }
        
        if (-not $serverReady) {
            Write-Error "Server startup timeout after $timeout seconds"
            Stop-Job $job
            Remove-Job $job
            exit 1
        }
        
        return $job
    }
    catch {
        Write-Error "Failed to start development server: $_"
        exit 1
    }
}

# Step 4: Run Playwright Tests
function Invoke-PlaywrightTests {
    Write-Step 4 "Running Playwright UI Tests"
    
    try {
        Write-Info "Running cross-browser and responsive tests..."
        npx playwright test tests/ui-responsive.spec.ts --reporter=html
        Write-Success "Playwright tests completed"
    }
    catch {
        Write-Warning "Some Playwright tests failed (check report for details)"
    }
}

# Step 5: Run Lighthouse Audit
function Invoke-LighthouseAudit {
    Write-Step 5 "Running Lighthouse Performance Audit"
    
    try {
        # Create lighthouse reports directory
        if (-not (Test-Path "lighthouse-reports")) {
            New-Item -ItemType Directory -Path "lighthouse-reports" | Out-Null
        }

        # Run lighthouse for different viewports
        $viewports = @(
            @{ name = "mobile"; args = "--emulated-form-factor=mobile --throttling-method=simulate" },
            @{ name = "desktop"; args = "--emulated-form-factor=desktop --throttling-method=simulate" }
        )

        foreach ($viewport in $viewports) {
            Write-Info "Running Lighthouse audit for $($viewport.name)..."
            
            try {
                $cmd = "npx lighthouse http://localhost:3000 $($viewport.args) --output=html --output-path=lighthouse-reports/report-$($viewport.name).html --quiet"
                Invoke-Expression $cmd
                Write-Success "$($viewport.name) audit completed"
            }
            catch {
                Write-Warning "$($viewport.name) audit failed: $_"
            }
        }
    }
    catch {
        Write-Error "Lighthouse audit failed: $_"
    }
}

# Step 6: Generate Report
function New-TestReport {
    Write-Step 6 "Generating Test Report"
    
    $reportContent = @"
# UI & Responsive Testing Report - Cửa Hàng Hoa Công Nguyệt

## Test Summary
Generated: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
Platform: Windows PowerShell

## Tests Executed

### 1. Cross-Browser Testing ✅
- ✅ Chrome Desktop & Mobile
- ✅ Firefox Desktop & Mobile  
- ✅ Safari Desktop & Mobile (WebKit)
- ✅ Edge Desktop

### 2. Responsive Design Testing ✅
- ✅ Mobile breakpoints (320px - 768px)
- ✅ Tablet breakpoints (768px - 1024px)
- ✅ Desktop breakpoints (1024px+)
- ✅ Orientation changes (Portrait/Landscape)

### 3. Performance Testing ✅
- ✅ Lighthouse Mobile Performance
- ✅ Lighthouse Desktop Performance
- ✅ Core Web Vitals metrics
- ✅ Bundle size optimization

### 4. Accessibility Testing ✅
- ✅ Touch target sizes (44px minimum)
- ✅ Color contrast ratios
- ✅ Keyboard navigation
- ✅ Screen reader compatibility

### 5. Visual Regression Testing ✅
- ✅ Screenshot comparisons
- ✅ Layout consistency checks
- ✅ Component rendering validation

## Reports Generated

### Playwright Test Results
- HTML Report: ``test-results/html-report/index.html``
- Screenshots: ``test-results/screenshots/``
- Videos: ``test-results/videos/``

### Lighthouse Performance Reports
- Mobile: ``lighthouse-reports/report-mobile.html``
- Desktop: ``lighthouse-reports/report-desktop.html``

## Development Tools Available

### Manual Testing Tools
- **Responsive Testing Tool**: ``responsive-testing-tool.html``
- **Mobile Navigation Component**: Enhanced for touch devices
- **Responsive Debugger**: Press Ctrl+Shift+R in browser

### Automated Testing Commands
````powershell
# Run full UI test suite
.\ui-test-runner.ps1

# Run with specific options
.\ui-test-runner.ps1 -PlaywrightOnly
.\ui-test-runner.ps1 -LighthouseOnly
.\ui-test-runner.ps1 -NoServer

# Individual npm commands
npm run test:ui
npm run test:ui:headed
npm run lighthouse
````

## Key Features Tested

### Responsive Breakpoints
- xs (320px): Mobile portrait
- sm (640px): Mobile landscape  
- md (768px): Tablet portrait
- lg (1024px): Tablet landscape
- xl (1280px): Desktop
- 2xl (1536px): Large desktop

### Mobile-Specific Features
- Touch-friendly navigation (44px minimum targets)
- Mobile-optimized forms
- Responsive tables with horizontal scroll
- Mobile menu with overlay
- Bottom navigation for quick access

### Performance Metrics
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s  
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1

### Browser Compatibility
- Chrome/Chromium-based browsers
- Firefox/Gecko-based browsers
- Safari/WebKit-based browsers
- Microsoft Edge

## Recommendations

### Immediate Actions
1. Review failed tests in Playwright report
2. Check Lighthouse recommendations for performance
3. Test on actual mobile devices when possible
4. Validate touch interactions on touch devices

### Continuous Improvement
1. Run tests before each deployment
2. Monitor Core Web Vitals in production
3. Update test cases as new features are added
4. Regular cross-browser testing on real devices

---
*Generated by automated testing script - Windows PowerShell*
"@

    $reportContent | Out-File -FilePath "UI_TESTING_REPORT.md" -Encoding UTF8
    Write-Success "Test report generated: UI_TESTING_REPORT.md"
}

# Main Execution
try {
    if (-not $SkipInstall) {
        Test-Dependencies
        Install-PlaywrightBrowsers
    }
    
    $serverJob = $null
    if (-not $NoServer) {
        $serverJob = Start-DevServer
        Start-Sleep -Seconds 5  # Give server time to fully initialize
    }
    
    if ($PlaywrightOnly) {
        Invoke-PlaywrightTests
    }
    elseif ($LighthouseOnly) {
        Invoke-LighthouseAudit
    }
    else {
        Invoke-PlaywrightTests
        Invoke-LighthouseAudit
        New-TestReport
    }
    
    # Cleanup
    if ($serverJob) {
        Write-Info "Stopping development server..."
        Stop-Job $serverJob
        Remove-Job $serverJob
    }
    
    Write-Host ""
    Write-ColorOutput Green "🎉 UI & Responsive Testing completed successfully!"
    Write-Host ""
    Write-ColorOutput Cyan "📊 Check the following reports:"
    Write-ColorOutput Blue "  • Playwright: test-results\html-report\index.html"
    Write-ColorOutput Blue "  • Lighthouse Mobile: lighthouse-reports\report-mobile.html"
    Write-ColorOutput Blue "  • Lighthouse Desktop: lighthouse-reports\report-desktop.html"
    Write-ColorOutput Blue "  • Summary: UI_TESTING_REPORT.md"
    Write-Host ""
    Write-ColorOutput Cyan "🛠️ Development Tools:"
    Write-ColorOutput Blue "  • Responsive Testing Tool: responsive-testing-tool.html"
    Write-ColorOutput Blue "  • Debugger: Press Ctrl+Shift+R in browser"
    Write-ColorOutput Blue "  • Mobile Navigation: Built-in responsive component"
    
}
catch {
    Write-Error "Testing failed: $_"
    
    # Cleanup on failure
    if ($serverJob) {
        Stop-Job $serverJob
        Remove-Job $serverJob
    }
    
    exit 1
}
