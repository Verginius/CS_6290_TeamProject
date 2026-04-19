param(
    [string]$RpcUrl = "",
    [string]$PrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    [string]$Dao = "COMPOUND",
    [switch]$NoBroadcast,
    [switch]$BroadcastSimulations,
    [switch]$DryRun,
    [switch]$SkipDeploy,
    [switch]$ReuseAnvil
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptDir "..")
Set-Location $projectRoot
$script:ForgeExecutable = "forge"

if ([string]::IsNullOrWhiteSpace($RpcUrl)) {
    if (-not [string]::IsNullOrWhiteSpace($env:LOCALHOST_RPC_URL)) {
        $RpcUrl = $env:LOCALHOST_RPC_URL
    } elseif (-not [string]::IsNullOrWhiteSpace($env:RPC_URL)) {
        $RpcUrl = $env:RPC_URL
    } else {
        $RpcUrl = "http://localhost:8545"
    }
}

$useBroadcast = -not $NoBroadcast

if ($useBroadcast -and [string]::IsNullOrWhiteSpace($PrivateKey)) {
    if (-not [string]::IsNullOrWhiteSpace($env:PRIVATE_KEY)) {
        $PrivateKey = $env:PRIVATE_KEY
    } elseif (-not [string]::IsNullOrWhiteSpace($env:DEPLOYER_KEY)) {
        $PrivateKey = $env:DEPLOYER_KEY
    }
}

if ($useBroadcast -and -not $DryRun -and [string]::IsNullOrWhiteSpace($PrivateKey)) {
    throw "Private key is required when broadcasting. Provide -PrivateKey, or set PRIVATE_KEY / DEPLOYER_KEY."
}

if (-not $DryRun) {
    $forgeCmd = Get-Command forge -ErrorAction SilentlyContinue
    if ($null -ne $forgeCmd) {
        $script:ForgeExecutable = $forgeCmd.Source
    } else {
        $fallbackForge = Join-Path $env:USERPROFILE ".foundry\bin\forge.exe"
        if (Test-Path $fallbackForge) {
            $script:ForgeExecutable = $fallbackForge
            Write-Host "forge not found in PATH, using fallback: $fallbackForge" -ForegroundColor Yellow
        } else {
            throw "forge command not found. Install Foundry first: https://book.getfoundry.sh/getting-started/installation"
        }
    }
    
    $anvilCmd = Get-Command anvil -ErrorAction SilentlyContinue
    if ($null -ne $anvilCmd) {
        $script:AnvilExecutable = $anvilCmd.Source
    } else {
        $fallbackAnvil = Join-Path $env:USERPROFILE ".foundry\bin\anvil.exe"
        if (Test-Path $fallbackAnvil) {
            $script:AnvilExecutable = $fallbackAnvil
            Write-Host "anvil not found in PATH, using fallback: $fallbackAnvil" -ForegroundColor Yellow
        } else {
            throw "anvil command not found. Install Foundry first."
        }
    }
}

function Invoke-ForgeScript {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [Parameter(Mandatory = $true)]
        [string]$ScriptTarget,
        [hashtable]$TempEnv = @{},
        [string[]]$ExtraArgs = @(),
        [switch]$Broadcast,
        [switch]$PassThru,
        [switch]$ContinueOnWarning
    )

    Write-Host ""
    Write-Host "==== $Label ====" -ForegroundColor Cyan

    $argList = @("script", $ScriptTarget, "--rpc-url", $RpcUrl)

    if ($Broadcast) {
        $argList += "--broadcast"
    }
    
    $continueOnNonZero = $ContinueOnWarning
    
    if (-not [string]::IsNullOrWhiteSpace($PrivateKey)) {
        if (-not $DryRun) {
            $argList += @("--private-key", $PrivateKey)
        } else {
            $argList += @("--private-key", "<PRIVATE_KEY>")
        }
    }

    if ($ExtraArgs.Count -gt 0) {
        $argList += $ExtraArgs
    }

    $oldEnv = @{}
    foreach ($key in $TempEnv.Keys) {
        $oldEnv[$key] = [Environment]::GetEnvironmentVariable($key, "Process")
        [Environment]::SetEnvironmentVariable($key, [string]$TempEnv[$key], "Process")
    }

try {
        if ($DryRun) {
            Write-Host "[DRY RUN] forge $($argList -join ' ')" -ForegroundColor Yellow
        } else {
            if ($PassThru) {
                $output = & $script:ForgeExecutable @argList 2>&1
                $output | Write-Host
                if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 1) {
                    Write-Host "Warning: forge exited with code $LASTEXITCODE (continuing anyway)" -ForegroundColor Yellow
                }
                return $output
            } else {
                $output = & $script:ForgeExecutable @argList 2>&1
                if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 1) {
                    Write-Host "Warning: forge exited with code $LASTEXITCODE (continuing anyway)" -ForegroundColor Yellow
                }
            }
        }
    }
    finally {
        foreach ($key in $TempEnv.Keys) {
            [Environment]::SetEnvironmentVariable($key, $oldEnv[$key], "Process")
        }
    }
}

function Import-EnvFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath
    )

    if (-not (Test-Path $FilePath)) {
        throw "Env file not found: $FilePath"
    }

    Get-Content $FilePath | ForEach-Object {
        $line = $_.Trim()
        if ([string]::IsNullOrWhiteSpace($line)) {
            return
        }
        if ($line.StartsWith("#")) {
            return
        }
        $pair = $line -split "=", 2
        if ($pair.Count -eq 2) {
            [Environment]::SetEnvironmentVariable($pair[0].Trim(), $pair[1].Trim(), "Process")
        }
    }
}

Write-Host "Project root : $projectRoot"
Write-Host "RPC URL      : $RpcUrl"
Write-Host "Target DAO   : $Dao"
Write-Host "Broadcast    : $useBroadcast"
Write-Host "Dry run      : $DryRun"

$validDaos = @("COMPOUND", "UNISWAP", "AAVE")
$Dao = $Dao.ToUpper()
if ($validDaos -notcontains $Dao) {
    throw "Invalid DAO: $Dao. Valid options: COMPOUND, UNISWAP, AAVE"
}
Write-Host "Target DAO validated: $Dao" -ForegroundColor Green

$anvilProcess = $null
if ($useBroadcast -and ($RpcUrl -match "localhost" -or $RpcUrl -match "127.0.0.1")) {
    Write-Host "Starting local anvil node..." -ForegroundColor Yellow
    $anvilProcess = Start-Process $script:AnvilExecutable -PassThru
    Start-Sleep -Seconds 10 # Wait for anvil to initialize
}

try {
    $scenarios = @("A", "B", "C", "D", "E")
    
    Write-Host "Running scenarios: $($scenarios -join ', ')" -ForegroundColor Cyan
    
    if ($Dao -eq "UNISWAP") {
        Write-Host "Note: UNISWAP requires 1B token supply - may take longer" -ForegroundColor Yellow
    }

    foreach ($scen in $scenarios) {
        Write-Host ""
        Write-Host "=================================================" -ForegroundColor Magenta
        Write-Host " STARTING SCENARIO: $scen " -ForegroundColor Magenta
        Write-Host "=================================================" -ForegroundColor Magenta

        Invoke-ForgeScript -Label "1/6 Deploy Contracts" -ScriptTarget "script/Deploy.s.sol:Deploy" -Broadcast:$useBroadcast

        $simEnv = Join-Path $projectRoot ".env.simulation"
        if (Test-Path $simEnv) {
            Write-Host "Loading simulation env from $simEnv"
            Import-EnvFile -FilePath $simEnv
        } elseif (-not $DryRun) {
            throw "Expected .env.simulation was not generated by Deploy step."
        }

        Invoke-ForgeScript -Label "2/6 Setup Scenario" -ScriptTarget "script/SetupScenarios.s.sol:SetupScenarios" -Broadcast:$useBroadcast -TempEnv @{ SCENARIO = $scen; TARGET_DAO = $Dao }

        if (Test-Path $simEnv) {
            Write-Host "Reloading simulation env after SetupScenarios"
            Import-EnvFile -FilePath $simEnv
        }

        $rawSimVuln = "analysis/data/raw/attack_simulation_raw_${Dao}_${scen}.json"
        
        $outVuln = Invoke-ForgeScript -Label "3/6 Simulate Attacks [Vulnerable]" -ScriptTarget "script/SimulateAttacks.s.sol:SimulateAttacks" -Broadcast -PassThru -TempEnv @{ TARGET_DAO = $Dao } -ExtraArgs @("-vvvv", "--force")
        if ($outVuln) { $outVuln -join "`n" | Set-Content $rawSimVuln -Encoding UTF8 }
        
$rawSimDef = "analysis/data/raw/attack_simulation_defended_raw_${Dao}_${scen}.json"
        
        $outDef = Invoke-ForgeScript -Label "4/6 Simulate Attacks [With Defenses]" -ScriptTarget "script/SimulateDefendedAttacks.s.sol:SimulateDefendedAttacks" -Broadcast -PassThru -TempEnv @{ TARGET_DAO = $Dao }
        if ($outDef) { $outDef -join "`n" | Set-Content $rawSimDef -Encoding UTF8 }
        
        Invoke-ForgeScript -Label "5/6 Export Processed Data [Vulnerable]" -ScriptTarget "script/ExportData.s.sol:ExportData" -TempEnv @{ TARGET_DAO = $Dao }
        Invoke-ForgeScript -Label "6/6 Export Processed Data [With Defenses]" -ScriptTarget "script/ExportDefendedData.s.sol:ExportDefendedData" -TempEnv @{ TARGET_DAO = $Dao }

        $vulnOutput = "analysis/data/processed/attack_simulation_results.json"
        $defOutput = "analysis/data/processed/attack_simulation_defended_results.json"
        if (Test-Path $vulnOutput) { Copy-Item $vulnOutput "analysis/data/processed/attack_simulation_results_${Dao}_$scen.json" -Force }
        if (Test-Path $defOutput) { Copy-Item $defOutput "analysis/data/processed/attack_simulation_defended_results_${Dao}_$scen.json" -Force }
    }

    Write-Host "Extracting insights for $Dao per Target Selection Document..." -ForegroundColor Yellow
    python .\analysis\scripts\extract_metrics.py

    Write-Host "Generating visualizations and analysis reports for $Dao based on Analysis_Metrics.md..." -ForegroundColor Yellow
    python .\analysis\scripts\visualize_metrics.py

    Write-Host ""
    Write-Host "All $dao scenarios completed successfully." -ForegroundColor Green
    Write-Host "Outputs saved with suffix _${Dao}_A.json, _${Dao}_B.json, etc in analysis/data/processed/"
    Write-Host "Metrics visualizations saved to analysis/plots/" -ForegroundColor Cyan
    Write-Host "Analysis report generated at docs/Analysis_Report.md" -ForegroundColor Cyan
}
finally {
    if ($null -ne $anvilProcess) {
        Write-Host "Stopping local anvil node..." -ForegroundColor Yellow
        Stop-Process -Id $anvilProcess.Id -Force -ErrorAction SilentlyContinue
    }
}
