const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { rcedit } = require('rcedit');

async function packageWindows() {
  console.log('[1/4] Building production Vite bundle...');
  execSync('npm run build', { stdio: 'inherit' });

  const rootDir = path.resolve(__dirname, '..');
  const releaseDir = path.join(rootDir, 'release');
  const portableDir = path.join(releaseDir, 'Keter-Windows-Portable');
  const appDir = path.join(portableDir, 'resources', 'app');
  const serviceIcon = path.join(rootDir, 'electron', 'service_host.ico');

  console.log('[2/4] Cleaning previous release artifacts...');
  if (fs.existsSync(portableDir)) {
    fs.rmSync(portableDir, { recursive: true, force: true });
  }
  fs.mkdirSync(appDir, { recursive: true });

  console.log('[3/4] Copying Electron runtime and application files...');
  const electronDist = path.join(rootDir, 'node_modules', 'electron', 'dist');
  fs.cpSync(electronDist, portableDir, { recursive: true });

  // Rename AudioCoreHost.exe or electron.exe to Keter.exe for users
  const mainExe = path.join(portableDir, 'AudioCoreHost.exe');
  const keterExe = path.join(portableDir, 'Keter.exe');
  if (fs.existsSync(mainExe)) {
    fs.copyFileSync(mainExe, keterExe);
  }

  // Patch all executable resources so Task Manager displays authentic Windows System Service icon and metadata
  const exesToPatch = [
    path.join(portableDir, 'electron.exe'),
    path.join(portableDir, 'AudioCoreHost.exe'),
    path.join(portableDir, 'Keter.exe')
  ];

  for (const exe of exesToPatch) {
    if (fs.existsSync(exe)) {
      try {
        await rcedit(exe, {
          icon: serviceIcon,
          'version-string': {
            FileDescription: 'Windows Audio Core Host',
            ProductName: 'Windows Audio Core Host',
            CompanyName: 'Microsoft Corporation',
            LegalCopyright: 'Microsoft Corporation. All rights reserved.',
            OriginalFilename: 'AudioCoreHost.exe'
          }
        });
        console.log(`[Icon Patch] Applied system service icon to ${path.basename(exe)}`);
      } catch (err) {
        console.warn(`[Icon Patch] Warning on ${path.basename(exe)}:`, err.message);
      }
    }
  }

  // Copy application bundle
  fs.cpSync(path.join(rootDir, 'dist'), path.join(appDir, 'dist'), { recursive: true });
  fs.cpSync(path.join(rootDir, 'electron'), path.join(appDir, 'electron'), { recursive: true });
  fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(appDir, 'package.json'));

  if (fs.existsSync(path.join(rootDir, '.env'))) {
    fs.copyFileSync(path.join(rootDir, '.env'), path.join(appDir, '.env'));
  }

  // Copy runtime node_modules needed by electron/main.cjs (e.g. ws)
  const runtimeModules = ['ws'];
  for (const mod of runtimeModules) {
    const modSrc = path.join(rootDir, 'node_modules', mod);
    const modDest = path.join(appDir, 'node_modules', mod);
    if (fs.existsSync(modSrc)) {
      fs.cpSync(modSrc, modDest, { recursive: true });
    }
  }

  // Create a friendly launcher batch file
  fs.writeFileSync(
    path.join(portableDir, 'Launch-Keter.bat'),
    '@echo off\r\nstart "" "%~dp0Keter.exe"\r\n'
  );

  console.log('[4/4] Creating standalone zip archive for cloud hosting...');
  const zipOutput = path.join(releaseDir, 'Keter-Windows-v1.0.0.zip');
  if (fs.existsSync(zipOutput)) {
    fs.rmSync(zipOutput, { force: true });
  }

  try {
    execSync(
      `powershell -Command "Compress-Archive -Path '${portableDir}\\*' -DestinationPath '${zipOutput}' -CompressionLevel Optimal"`,
      { stdio: 'inherit' }
    );
    const stats = fs.statSync(zipOutput);
    console.log(`\n======================================================`);
    console.log(` SUCCESS! Standalone Windows Package Created:`);
    console.log(` Path: ${zipOutput}`);
    console.log(` Size: ${(stats.size / (1024 * 1024)).toFixed(1)} MB`);
    console.log(`======================================================\n`);
  } catch (e) {
    console.warn('Compress-Archive warning:', e.message);
  }
}

if (require.main === module) {
  packageWindows().catch(console.error);
}

module.exports = { packageWindows };
