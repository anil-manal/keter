const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

function getGitHubToken() {
  try {
    const creds = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf8'
    });
    const match = creds.match(/password=([^\r\n]+)/);
    if (match) return match[1].trim();
  } catch (e) {
    console.error('Could not get git token:', e.message);
  }
  return null;
}

async function uploadAsset() {
  const token = getGitHubToken();
  if (!token) {
    console.error('No GitHub token found.');
    process.exit(1);
  }

  const targetArg = process.argv[2] || '../release/Keter.exe';
  const filePath = path.resolve(__dirname, targetArg);
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  const stats = fs.statSync(filePath);
  const fileName = path.basename(filePath);
  console.log(`[1/3] Preparing to upload ${fileName} (${(stats.size / (1024 * 1024)).toFixed(1)} MB)...`);

  // Step 1: Get release info
  console.log('[2/3] Getting GitHub release info for v1.0.0...');
  const releaseRes = await fetch('https://api.github.com/repos/anil-manal/keter/releases/tags/v1.0.0', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'KeterUploader'
    }
  });

  if (!releaseRes.ok) {
    throw new Error(`Failed to get release: ${releaseRes.status} ${await releaseRes.text()}`);
  }

  const release = await releaseRes.json();
  const releaseId = release.id;
  console.log(`Found release ID: ${releaseId}`);

  // Check if asset already exists and delete if so
  const existingAsset = release.assets.find(a => a.name === fileName);
  if (existingAsset) {
    console.log(`Deleting existing asset ${fileName} (id: ${existingAsset.id})...`);
    await fetch(`https://api.github.com/repos/anil-manal/keter/releases/assets/${existingAsset.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'KeterUploader'
      }
    });
    console.log('Existing asset deleted.');
  }

  // Step 2: Upload file stream
  console.log(`[3/3] Uploading ${fileName} to GitHub Releases...`);
  const uploadUrl = `https://uploads.github.com/repos/anil-manal/keter/releases/${releaseId}/assets?name=${encodeURIComponent(fileName)}`;

  return new Promise((resolve, reject) => {
    const parsed = new URL(uploadUrl);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/vnd.microsoft.portable-executable',
        'Content-Length': stats.size,
        'User-Agent': 'KeterUploader'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('\n======================================================');
          console.log(` SUCCESS! ${fileName} is now live and downloadable!`);
          console.log(` Direct URL: https://github.com/anil-manal/keter/releases/download/v1.0.0/${fileName}`);
          console.log('======================================================\n');
          resolve();
        } else {
          reject(new Error(`Upload failed (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', reject);

    const stream = fs.createReadStream(filePath);
    let uploadedBytes = 0;
    let lastLogTime = Date.now();

    stream.on('data', chunk => {
      uploadedBytes += chunk.length;
      if (Date.now() - lastLogTime > 5000) {
        console.log(`Progress: ${(uploadedBytes / (1024 * 1024)).toFixed(1)} / ${(stats.size / (1024 * 1024)).toFixed(1)} MB (${Math.round((uploadedBytes / stats.size) * 100)}%)`);
        lastLogTime = Date.now();
      }
    });

    stream.pipe(req);
  });
}

uploadAsset().catch(err => {
  console.error('Error uploading asset:', err);
  process.exit(1);
});
