const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { packageWindows } = require('./package-windows.cjs');

async function buildInstaller() {
  const rootDir = path.resolve(__dirname, '..');
  const releaseDir = path.join(rootDir, 'release');
  const portableDir = path.join(releaseDir, 'Keter-Windows-Portable');
  const serviceIcon = path.join(rootDir, 'electron', 'service_host.ico');
  const isccExe = path.join(rootDir, 'node_modules', 'innosetup-compiler', 'bin', 'ISCC.exe');

  console.log('[1/3] Packaging fresh Windows build with latest UI bundle...');
  await packageWindows();

  console.log('[2/3] Generating Inno Setup configuration (1-Click Instant Install)...');
  const issContent = `
[Setup]
AppId={{E6F7A23C-7281-4275-B139-B13809EA853D}
AppName=Keter
AppVersion=1.0.0
AppPublisher=Keter AI
AppPublisherURL=https://keter-ai.vercel.app
DefaultDirName={localappdata}\\Programs\\Keter
DefaultGroupName=Keter
DisableDirPage=yes
DisableProgramGroupPage=yes
DisableReadyPage=yes
DisableWelcomePage=yes
DisableFinishedPage=yes
Uninstallable=no
CreateUninstallRegKey=no
UpdateUninstallLogAppName=no
PrivilegesRequired=lowest
OutputDir=${releaseDir}
OutputBaseFilename=Keter-Setup-v1.0.0
SetupIconFile=${serviceIcon}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "${portableDir}\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\\Keter"; Filename: "{app}\\Keter.exe"
Name: "{autodesktop}\\Keter"; Filename: "{app}\\Keter.exe"

[Run]
Filename: "{app}\\Keter.exe"; Description: "{cm:LaunchProgram,Keter}"; Flags: nowait skipifsilent
`;

  const issPath = path.join(releaseDir, 'setup-script.iss');
  fs.writeFileSync(issPath, issContent.trim(), 'utf8');

  console.log('[3/3] Compiling 1-Click Windows installer (Keter-Setup-v1.0.0.exe)...');
  execSync(`"${isccExe}" "${issPath}"`, { stdio: 'inherit' });

  const setupExePath = path.join(releaseDir, 'Keter-Setup-v1.0.0.exe');
  if (fs.existsSync(setupExePath)) {
    fs.copyFileSync(setupExePath, path.join(releaseDir, 'Keter-Setup.exe'));
    fs.copyFileSync(setupExePath, path.join(releaseDir, 'Keter.exe'));
    const stats = fs.statSync(setupExePath);
    console.log('\\n======================================================');
    console.log(' SUCCESS! 1-Click Windows Installer Created:');
    console.log(` Path: ${setupExePath}`);
    console.log(` Size: ${(stats.size / (1024 * 1024)).toFixed(1)} MB`);
    console.log('======================================================\\n');
  } else {
    console.error('Error: Keter-Setup-v1.0.0.exe was not created.');
    process.exit(1);
  }
}

buildInstaller().catch((err) => {
  console.error(err);
  process.exit(1);
});
