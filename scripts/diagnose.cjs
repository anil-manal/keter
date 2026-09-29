const fs = require('fs');
let code = fs.readFileSync('dist/assets/index-DYLL17Fh.js', 'utf8');
code = code.replace(
  'f=s(o,d),zr=!1',
  'try{f=s(o,d)}catch(err){console.error(">>> CRASHING COMPONENT:", s.name || s.displayName || String(s).slice(0, 100), "ERROR:", err.message, err.stack); throw err;}zr=!1'
);
fs.writeFileSync('dist/assets/index-DYLL17Fh.js', code);
console.log('Patched diagnostic successfully');
