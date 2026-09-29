const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const customExe = path.join(__dirname, '../node_modules/electron/dist/AudioCoreHost.exe');
const defaultExe = path.join(__dirname, '../node_modules/electron/dist/electron.exe');

const targetExe = fs.existsSync(customExe) ? customExe : defaultExe;

const child = spawn(targetExe, ['.'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

child.on('close', (code) => {
  process.exit(code || 0);
});
