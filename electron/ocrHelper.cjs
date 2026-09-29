const { execFile } = require('child_process');
const path = require('path');

const psScriptPath = path.join(__dirname, 'winOcr.ps1');

function recognizeTextFromImage(imagePath) {
  return new Promise((resolve) => {
    // Windows WinRT StorageFile requires normalized Windows backslashes
    const winPath = path.resolve(imagePath).replace(/\//g, '\\');
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', psScriptPath, '-ImagePath', winPath],
      { timeout: 8000, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout) => {
        if (err) {
          console.warn('[OCR] PowerShell OCR warning:', err.message);
          return resolve('');
        }
        resolve((stdout || '').trim());
      }
    );
  });
}

module.exports = {
  recognizeTextFromImage,
};
