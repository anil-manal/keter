Add-Type -AssemblyName System.Drawing

$sig = @"
[System.Runtime.InteropServices.DllImport("shell32.dll", CharSet=System.Runtime.InteropServices.CharSet.Auto)]
public static extern uint ExtractIconEx(string szFileName, int nIconIndex, IntPtr[] phiconLarge, IntPtr[] phiconSmall, uint nIcons);
"@
$win32 = Add-Type -MemberDefinition $sig -Name Win32Ext -Namespace Native -PassThru
$large = New-Object IntPtr[] 1
$small = New-Object IntPtr[] 1

$targetDll = 'C:\Windows\System32\imageres.dll'
# Check icon indices
for ($i = 0; $i -lt 100; $i++) {
    [Native.Win32Ext]::ExtractIconEx($targetDll, $i, $large, $small, 1) | Out-Null
    if ($large[0] -ne [IntPtr]::Zero) {
        $ico = [System.Drawing.Icon]::FromHandle($large[0])
        $bmp = $ico.ToBitmap()
        $bmp.Save("c:\Users\Asus\Desktop\keter\scratch_ico_$i.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
        $ico.Dispose()
    }
}
Write-Output "Extracted icons"
