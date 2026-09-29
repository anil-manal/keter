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

  console.log('[1/3] Packaging portable build with system service icon...');
  await packageWindows();

  console.log('[2/3] Generating Inno Setup configuration...');
  const issContent = `
[Setup]
AppId={{E6F7A23C-7281-4275-B139-B13809EA853D}
AppName=Keter
AppVersion=1.0.0
AppPublisher=Keter AI
AppPublisherURL=https://keter-ai.vercel.app
DefaultDirName={localappdata}\\Programs\\Keter
DefaultGroupName=Keter
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=${releaseDir}
OutputBaseFilename=Keter-Setup-v1.0.0
SetupIconFile=${serviceIcon}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\\Keter.exe

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "${portableDir}\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\\Keter"; Filename: "{app}\\Keter.exe"
Name: "{group}\\{cm:UninstallProgram,Keter}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\\Keter"; Filename: "{app}\\Keter.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\\Keter.exe"; Description: "{cm:LaunchProgram,Keter}"; Flags: nowait postinstall skipifsilent
`;

  const issPath = path.join(releaseDir, 'setup-script.iss');
  fs.writeFileSync(issPath, issContent.trim(), 'utf8');

  console.log('[3/3] Compiling standalone Windows installer (Keter-Setup-v1.0.0.exe)...');
  execSync(`"${isccExe}" "${issPath}"`, { stdio: 'inherit' });

  const setupExePath = path.join(releaseDir, 'Keter-Setup-v1.0.0.exe');
  if (fs.existsSync(setupExePath)) {
    const stats = fs.statSync(setupExePath);
    console.log('\\n======================================================');
    console.log(' SUCCESS! Standalone Single Windows Setup Installer Created:');
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
