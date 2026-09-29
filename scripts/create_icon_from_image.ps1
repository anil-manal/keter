Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\Asus\.gemini\antigravity-ide\brain\db74e9fc-ed73-475c-859a-33e87a6d4a08\.user_uploaded\media_1790432568433.png'
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y += 2) {
    for ($x = 0; $x -lt $bmp.Width; $x += 2) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -lt 250 -or $c.G -lt 250 -or $c.B -lt 250) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Bounds: $minX, $minY to $maxX, $maxY"

# Crop the window tightly with 2px padding
$cropW = $maxX - $minX + 1
$cropH = $maxY - $minY + 1
$rect = New-Object System.Drawing.Rectangle($minX, $minY, $cropW, $cropH)
$cropped = $bmp.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Save cropped image for inspection
$cropped.Save('c:\Users\Asus\Desktop\keter\cropped_window.png', [System.Drawing.Imaging.ImageFormat]::Png)

# Function to make white outside the window border transparent if needed, or create standard multi-size .ico
# Generate crisp 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256
$sizes = @(16, 20, 24, 32, 40, 48, 64, 128, 256)

# Windows .ico binary encoder
function Build-IcoFile($sourceBmp, $outputPath, $sizesList) {
    $pngStreams = @()
    $pngBytesList = @()

    foreach ($sz in $sizesList) {
        $targetBmp = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($targetBmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.Clear([System.Drawing.Color]::Transparent)

        # Maintain aspect ratio centered
        $scale = [Math]::Min($sz / $sourceBmp.Width, $sz / $sourceBmp.Height)
        $destW = [int]($sourceBmp.Width * $scale)
        $destH = [int]($sourceBmp.Height * $scale)
        $destX = [int](($sz - $destW) / 2)
        $destY = [int](($sz - $destH) / 2)

        $g.DrawImage($sourceBmp, $destX, $destY, $destW, $destH)
        $g.Dispose()

        $ms = New-Object System.IO.MemoryStream
        $targetBmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $bytes = $ms.ToArray()
        $ms.Dispose()
        $targetBmp.Dispose()

        $pngBytesList += ,$bytes
    }

    # Write ICO header
    $fs = New-Object System.IO.FileStream($outputPath, [System.IO.FileMode]::Create)
    $bw = New-Object System.IO.BinaryWriter($fs)

    # ICONDIR
    $bw.Write([uint16]0) # Reserved
    $bw.Write([uint16]1) # Type (1 = ICO)
    $bw.Write([uint16]$sizesList.Count) # Count

    # Calculate offset
    $offset = 6 + (16 * $sizesList.Count)

    for ($i = 0; $i -lt $sizesList.Count; $i++) {
        $sz = $sizesList[$i]
        $bytes = $pngBytesList[$i]
        $w = if ($sz -ge 256) { 0 } else { [byte]$sz }
        $h = if ($sz -ge 256) { 0 } else { [byte]$sz }

        $bw.Write([byte]$w)
        $bw.Write([byte]$h)
        $bw.Write([byte]0) # Colors
        $bw.Write([byte]0) # Reserved
        $bw.Write([uint16]1) # Color planes
        $bw.Write([uint16]32) # Bits per pixel
        $bw.Write([uint32]$bytes.Length) # Image size in bytes
        $bw.Write([uint32]$offset) # Offset to image data

        $offset += $bytes.Length
    }

    # Write PNG payloads
    for ($i = 0; $i -lt $sizesList.Count; $i++) {
        $bw.Write($pngBytesList[$i])
    }

    $bw.Flush()
    $bw.Close()
    $fs.Close()
}

Build-IcoFile $cropped 'c:\Users\Asus\Desktop\keter\electron\service_host.ico' $sizes
Build-IcoFile $cropped 'c:\Users\Asus\Desktop\keter\service_host.ico' $sizes

$cropped.Dispose()
$bmp.Dispose()

Write-Output "ICO successfully created at electron\service_host.ico!"
