import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const OUTPUT_FILE = path.join(process.cwd(), "gkd_data.json");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    defaultViewport: null
  });
// PLEASE USE YOUR OWN CHROME PATH !!!
  const page = await browser.newPage();
  await page.goto(
    "https://guvenilirgida.tarimorman.gov.tr/GuvenilirGida/gkd/TaklitVeyaTagsis",
    { waitUntil: "networkidle2" }
  );

  await new Promise(resolve => setTimeout(resolve, 4000));

  await page.waitForSelector("#btn-taklit-1");
  await page.click("#btn-taklit-1");

  await page.waitForSelector('select[name="tblTagsis_length"]');
  await page.select('select[name="tblTagsis_length"]', "-1");

  await page.waitForSelector("#tblTagsis tbody tr");
  
  const rows = await page.$$eval("#tblTagsis tbody tr", rows =>
    rows.map(row => {
      const cells = row.querySelectorAll("td");
      return {
        duyuruTarihi: cells[0]?.innerText.trim() || "",
        firmaAdi: cells[1]?.innerText.trim() || "",
        marka: cells[2]?.innerText.trim() || "",
        urunAdi: cells[3]?.innerText.trim() || "",
        urunCesidi: cells[4]?.innerText.trim() || "",
        uygunsuzluk: cells[5]?.innerText.trim() || "",
        partiNo: cells[6]?.innerText.trim() || "",
        ilce: cells[7]?.innerText.trim() || "",
        il: cells[8]?.innerText.trim() || "",
        urunGrubu: cells[9]?.innerText.trim() || "",
      };
    })
  );

  console.log(`Toplam kayıt: ${rows.length}`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(rows, null, 2));

  console.log(`Tüm veriler '${OUTPUT_FILE}' dosyasına kaydedildi.`);

  await browser.close();
})();

