Add-Type -AssemblyName System.Drawing
$candidates = @(
  'C:\Windows\System32\audiodg.exe',
  'C:\Windows\System32\svchost.exe',
  'C:\Windows\System32\sihost.exe',
  'C:\Windows\System32\dwm.exe',
  'C:\Windows\System32\taskhostw.exe'
)
foreach ($c in $candidates) {
  if (Test-Path $c) {
    $name = [System.IO.Path]::GetFileNameWithoutExtension($c)
    $ico = [System.Drawing.Icon]::ExtractAssociatedIcon($c)
    $bmp = $ico.ToBitmap()
    $bmp.Save("c:\Users\Asus\Desktop\keter\icon_$name.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $fs = New-Object System.IO.FileStream("c:\Users\Asus\Desktop\keter\icon_$name.ico", [System.IO.FileMode]::Create)
    $ico.Save($fs)
    $fs.Close()
    $bmp.Dispose()
    $ico.Dispose()
  }
}
Get-ChildItem "c:\Users\Asus\Desktop\keter\icon_*.png" | Select-Object Name
