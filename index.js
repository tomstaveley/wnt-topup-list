import 'dotenv/config';
import puppeteer from 'puppeteer';

const domain = 'https://www.wntlivescores.com';
const loginUrl = `${domain}/login`;
const rankingsUrl = `${domain}/rankings/wnt`;
const playersUrl = `${domain}/players`;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

(async () => {
  // Setup browser
  const browser = await puppeteer.launch({
    // headless: false,
  });
  const page = await browser.newPage();
  await page.setViewport({width: 1080, height: 1024});
  
  // Login to WNT Live Scores app
  await page.goto(loginUrl, { waitUntil: 'networkidle0' });
  await page.type('#loginInputEmail', USERNAME);
  await page.type('#loginInputPassword', PASSWORD);
  await page.waitForSelector('#loginInputEmail');
  await page.waitForSelector('#loginInputPassword');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);
  const loginError = await page.$("::-p-text(Authentication failed)");
  if (loginError) {
    throw new Error('Could not sign in to wntlivescores.com');
  }

  // Fetch latest rankings list
  await page.goto(rankingsUrl, { waitUntil: 'networkidle0' });
  const rankings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.player')).map(player => {
      const nameNodes = player.querySelectorAll('.player-name > span');
      const first = nameNodes[0].textContent;
      const last = nameNodes[1].textContent;
      const name = `${first} ${last}`;
      const position = player.querySelector('.position').childNodes[1].textContent;
      const points = player.querySelector('.points').textContent;
      return { position, name, points };
    });
  });
  
  // Fetch pro players list
  await page.goto(playersUrl, { waitUntil: 'networkidle0' });
  const pros = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div.col.player .player-name')).map(player => {
      const first = player.childNodes[0].textContent;
      const last = player.childNodes[1].childNodes[0].textContent;
      return `${first} ${last}`;
    });
  });

  // Generate top up list
  const rankingsWithoutPros = rankings.filter(player => !pros.includes(player.name));
  console.log(rankingsWithoutPros);

  // Close browser
  await browser.close();
})();
