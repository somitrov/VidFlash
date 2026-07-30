const fs = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, '../public/subscribe_badge.png');
const outputPath = path.join(__dirname, '../src/lib/subscribeBadgeDataUrl.ts');

const b64 = fs.readFileSync(pngPath).toString('base64');
const content = `export const SUBSCRIBE_BADGE_DATA_URL = "data:image/png;base64,${b64}";\n`;

fs.writeFileSync(outputPath, content);
console.log('Successfully generated src/lib/subscribeBadgeDataUrl.ts');
