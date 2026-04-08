param(
    [string]$RpcUrl = "",
    [string]$PrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    [switch]$NoBroadcast,
    [switch]$BroadcastSimulations,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

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
        [switch]$PassThru
    )

    Write-Host ""
    Write-Host "==== $Label ====" -ForegroundColor Cyan

    $argList = @("script", $ScriptTarget, "--rpc-url", $RpcUrl)

    if ($Broadcast) {
        $argList += "--broadcast"
    }
    
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
                # Capture output and display it simultaneously if possible, but redirect it
                $output = & $script:ForgeExecutable @argList 2>&1
                $output | Write-Host
                if ($LASTEXITCODE -ne 0) {
                    throw "forge script failed for $ScriptTarget"
                }
                return $output
            } else {
                & $script:ForgeExecutable @argList
                if ($LASTEXITCODE -ne 0) {
                    throw "forge script failed for $ScriptTarget"
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
Write-Host "Broadcast    : $useBroadcast"
Write-Host "Dry run      : $DryRun"

$anvilProcess = $null
if ($useBroadcast -and ($RpcUrl -match "localhost" -or $RpcUrl -match "127.0.0.1")) {
    Write-Host "Starting local anvil node..." -ForegroundColor Yellow
    $anvilProcess = Start-Process $script:AnvilExecutable -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 3 # Wait for anvil to initialize
}

try {
    $scenarios = @("A", "B", "C", "D", "E")

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

        Invoke-ForgeScript -Label "2/6 Setup Scenario" -ScriptTarget "script/SetupScenarios.s.sol:SetupScenarios" -Broadcast:$useBroadcast -TempEnv @{ SCENARIO = $scen }

        if (Test-Path $simEnv) {
            Write-Host "Reloading simulation env after SetupScenarios"
            Import-EnvFile -FilePath $simEnv
        }

        $rawSimVuln = "analysis/data/raw/attack_simulation_raw_$scen.json"
        
        $outVuln = Invoke-ForgeScript -Label "3/6 Simulate Attacks [Vulnerable]" -ScriptTarget "script/SimulateAttacks.s.sol:SimulateAttacks" -Broadcast:($useBroadcast -and $BroadcastSimulations) -PassThru -ExtraArgs @("-vvvv")
        if ($outVuln) { $outVuln | Out-File $rawSimVuln }
        
        $rawSimDef = "analysis/data/raw/attack_simulation_defended_raw_$scen.json"
        
        $outDef = Invoke-ForgeScript -Label "4/6 Simulate Attacks [With Defenses]" -ScriptTarget "script/SimulateDefendedAttacks.s.sol:SimulateDefendedAttacks" -Broadcast:($useBroadcast -and $BroadcastSimulations) -PassThru
        if ($outDef) { $outDef | Out-File $rawSimDef }
        
        Invoke-ForgeScript -Label "5/6 Export Processed Data [Vulnerable]" -ScriptTarget "script/ExportData.s.sol:ExportData"
        Invoke-ForgeScript -Label "6/6 Export Processed Data [With Defenses]" -ScriptTarget "script/ExportDefendedData.s.sol:ExportDefendedData"

        $vulnOutput = "analysis/data/processed/attack_simulation_results.json"
        $defOutput = "analysis/data/processed/attack_simulation_defended_results.json"
        if (Test-Path $vulnOutput) { Copy-Item $vulnOutput "analysis/data/processed/attack_simulation_results_$scen.json" -Force }
        if (Test-Path $defOutput) { Copy-Item $defOutput "analysis/data/processed/attack_simulation_defended_results_$scen.json" -Force }
    }

    Write-Host "Extracting insights per Target Selection Document..." -ForegroundColor Yellow
    python .\analysis\scripts\extract_metrics.py

    Write-Host ""
    Write-Host "All scenarios completed successfully." -ForegroundColor Green
    Write-Host "Outputs saved with suffix _A.json, _B.json, etc in analysis/data/processed/"
}
finally {
    if ($null -ne $anvilProcess) {
        Write-Host "Stopping local anvil node..." -ForegroundColor Yellow
        Stop-Process -Id $anvilProcess.Id -Force -ErrorAction SilentlyContinue
    }
}
