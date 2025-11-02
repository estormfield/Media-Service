param(
  [Parameter(Mandatory = $true)]
  [string]$ExecutablePath,
  [string]$ShortcutName = "TV Launcher"
)

$startupPath = Join-Path $env:APPDATA "Microsoft\\Windows\\Start Menu\\Programs\\Startup"
if (-not (Test-Path $startupPath)) {
  New-Item -ItemType Directory -Path $startupPath -Force | Out-Null
}

$shortcutPath = Join-Path $startupPath ("{0}.lnk" -f $ShortcutName)
$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $ExecutablePath
$shortcut.WorkingDirectory = Split-Path $ExecutablePath
$shortcut.WindowStyle = 7
$shortcut.Save()
