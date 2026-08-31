const https = require('https');
const fs = require('fs');

async function search(q) {
  return new Promise((resolve) => {
    https.get('https://bigsoundbank.com/search?q=' + encodeURIComponent(q), (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const links = [];
        const regex = /href="([^"]*detail[^"]*)"/gi;
        let match;
        while ((match = regex.exec(data)) !== null) {
          links.push(match[1]);
        }
        resolve(links);
      });
    });
  });
}

async function main() {
  const markerLinks = await search('marker');
  console.log('Marker links:', markerLinks);
  const penLinks = await search('drawing pen');
  console.log('Pen links:', penLinks);
}

main();
