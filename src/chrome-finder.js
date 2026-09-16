const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * Cross-platform Chrome / Chromium / Edge / Brave executable finder.
 * Returns the absolute path of a valid browser binary, or null if none found.
 */
function findChromeExecutable() {
  // 1. Explicit environment variables take precedence
  const envPath = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  const platform = process.platform;

  // 2. macOS candidates
  if (platform === 'darwin') {
    const macCandidates = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Arc.app/Contents/MacOS/Arc'
    ];
    for (const candidate of macCandidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  // 3. Linux candidates
  if (platform === 'linux') {
    const linuxCandidates = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
      '/usr/bin/microsoft-edge',
      '/usr/bin/brave-browser'
    ];
    for (const candidate of linuxCandidates) {
      if (fs.existsSync(candidate)) return candidate;
    }

    // Try `which` resolution on Linux
    const commands = ['google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser', 'microsoft-edge'];
    for (const cmd of commands) {
      try {
        const resolved = execSync(`which ${cmd} 2>/dev/null`).toString().trim();
        if (resolved && fs.existsSync(resolved)) return resolved;
      } catch {
        // Continue
      }
    }
  }

  // 4. Windows candidates
  if (platform === 'win32') {
    const prefixes = [
      process.env.LOCALAPPDATA,
      process.env.PROGRAMFILES,
      process.env['PROGRAMFILES(X86)']
    ].filter(Boolean);

    const winSuffixes = [
      '\\Google\\Chrome\\Application\\chrome.exe',
      '\\Microsoft\\Edge\\Application\\msedge.exe',
      '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      '\\Chromium\\Application\\chrome.exe'
    ];

    for (const prefix of prefixes) {
      for (const suffix of winSuffixes) {
        const candidate = path.join(prefix, suffix);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }

  return null;
}

module.exports = {
  findChromeExecutable
};
