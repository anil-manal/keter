const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../electron/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[TEST-LOG] ${message} (${sourceId}:${line})`);
  });

  let reloaded = false;
  win.webContents.on('did-finish-load', () => {
    if (!reloaded) {
      reloaded = true;
      win.webContents.executeJavaScript(`
        localStorage.setItem('keter_user_profile', JSON.stringify({
          id: 'usr_anil',
          name: 'Anil Manal',
          email: 'anilmanal992115@gmail.com',
          plan: 'free_trial',
          plan_status: 'active',
          free_credits_left: 10,
        }));
        window.location.reload();
      `);
    } else {
      setTimeout(async () => {
        try {
          console.log('[TEST-LOG] Finding Profile button...');
          const result = await win.webContents.executeJavaScript(`
            (async () => {
              // Click Profile button (identified by title="Candidate Profile & Settings" or text containing name)
              const profileBtn = Array.from(document.querySelectorAll('button')).find(b => 
                (b.title && b.title.includes('Candidate Profile')) || 
                (b.innerText && b.innerText.includes('Anil Manal'))
              );
              if (profileBtn) {
                profileBtn.click();
                await new Promise(r => setTimeout(r, 400));
                
                // Now find the "User Manual" tab button
                const manualTab = Array.from(document.querySelectorAll('button')).find(b => 
                  b.innerText && b.innerText.includes('User Manual')
                );
                if (manualTab) {
                  manualTab.click();
                  await new Promise(r => setTimeout(r, 400));
                  const heading = document.querySelector('h3');
                  return 'USER_MANUAL_LOADED: ' + (heading ? heading.innerText : 'NO_H3');
                }
                return 'MANUAL_TAB_NOT_FOUND';
              }
              return 'PROFILE_BTN_NOT_FOUND';
            })()
          `);
          console.log('[TEST-LOG] Interaction Result:', result);
        } catch (e) {
          console.error('[TEST-ERROR]', e);
        }
      }, 1000);
    }
  });

  win.loadFile(path.join(__dirname, '../dist/index.html')).catch(err => {
    console.error('Failed to load:', err);
    process.exit(1);
  });

  setTimeout(() => {
    console.log('[TEST-LOG] Timeout reached, closing test window.');
    app.quit();
    process.exit(0);
  }, 4000);
});
