$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$assetDirectory = Join-Path (Split-Path $PSScriptRoot -Parent) 'assets'
New-Item -ItemType Directory -Force $assetDirectory | Out-Null
# The same green cross and soft green background as src/components/HealthIcon.tsx.
foreach ($asset in @(@{Name='icon.png';Background=$true;Arm=466}, @{Name='adaptive-icon.png';Background=$false;Arm=400})) {
    $bitmap = [Drawing.Bitmap]::new(1024,1024)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.Clear($(if ($asset.Background) { [Drawing.ColorTranslator]::FromHtml('#E2F2EB') } else { [Drawing.Color]::Transparent }))
        $pen = [Drawing.Pen]::new([Drawing.ColorTranslator]::FromHtml('#126B57'),140)
        try {
            $pen.StartCap = [Drawing.Drawing2D.LineCap]::Round
            $pen.EndCap = [Drawing.Drawing2D.LineCap]::Round
            $extent = ($asset.Arm - 140) / 2
            $graphics.DrawLine($pen, [single](512-$extent), [single]512, [single](512+$extent), [single]512)
            $graphics.DrawLine($pen, [single]512, [single](512-$extent), [single]512, [single](512+$extent))
        } finally { $pen.Dispose() }
        $bitmap.Save((Join-Path $assetDirectory $asset.Name),[Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $bitmap.Dispose() }
}
