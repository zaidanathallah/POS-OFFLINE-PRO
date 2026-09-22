const fs = require('fs');
const path = require('path');

const targets = [
  'node_modules/expo-modules-jsi/apple/Package.swift',
  'node_modules/@expo/expo-modules-macros-plugin/apple/Package.swift'
];

targets.forEach(relPath => {
  const fullPath = path.join(__dirname, '..', relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    const updated = content
      .replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0')
      .replace(/602\.0\.0-latest/g, '600.0.0');
    if (content !== updated) {
      fs.writeFileSync(fullPath, updated, 'utf8');
      console.log(`[patch-swift] Successfully patched ${relPath} for Xcode 16 / Swift 6.0 compatibility.`);
    }
  }
});
