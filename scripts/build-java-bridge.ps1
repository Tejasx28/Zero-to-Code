$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$classDir = Join-Path $projectRoot 'work-java-bridge'
New-Item -ItemType Directory -Force -Path $classDir | Out-Null
javac --release 11 -d $classDir (Join-Path $PSScriptRoot 'QuestBridge.java')
if ($LASTEXITCODE -ne 0) { throw 'Java bridge compilation failed.' }
jar --create --file (Join-Path $projectRoot 'public\runners\quest-runtime.jar') -C $classDir .
if ($LASTEXITCODE -ne 0) { throw 'Java bridge packaging failed.' }
Write-Output 'Browser Java bridge rebuilt.'
