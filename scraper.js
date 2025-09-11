import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

const OUTPUT_FILE = path.join(process.cwd(), "gkd_data.json");

const MONGO_URI = "mongodb://127.0.0.1:27017/gkd";
await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const GidaSchema = new mongoose.Schema({
  duyuruTarihi: String,
  firmaAdi: String,
  marka: String,
  urunAdi: String,
  uygunsuzluk: [String],
  partiNo: String,
  ilce: String,
  il: String,
  urunGrubu: String,
});

const GidaModel = mongoose.model("Gida", GidaSchema);

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto(
    "https://guvenilirgida.tarimorman.gov.tr/GuvenilirGida/gkd/TaklitVeyaTagsis",
    { waitUntil: "networkidle2" }
  );

  await new Promise((resolve) => setTimeout(resolve, 4000));

  await page.waitForSelector("#btn-taklit-1");
  await page.click("#btn-taklit-1");

  await page.waitForSelector('select[name="tblTagsis_length"]');
  await page.select('select[name="tblTagsis_length"]', "-1");

  await page.waitForSelector("#tblTagsis tbody tr");

  const rows = await page.$$eval("#tblTagsis tbody tr", (rows) =>
    rows.map((row) => {
      const cells = row.querySelectorAll("td");

      const uygunsuzlukText = cells[4]?.innerText.trim() || "";
      const uygunsuzlukArr = uygunsuzlukText
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      return {
        duyuruTarihi: cells[0]?.innerText.trim() || "",
        firmaAdi: cells[1]?.innerText.trim() || "",
        marka: cells[2]?.innerText.trim() || "",
        urunAdi: cells[3]?.innerText.trim() || "",
        uygunsuzluk: uygunsuzlukArr,
        partiNo: cells[5]?.innerText.trim() || "",
        ilce: cells[6]?.innerText.trim() || "",
        il: cells[7]?.innerText.trim() || "",
        urunGrubu: cells[8]?.innerText.trim() || "",
      };
    })
  );

  console.log(`Toplam kayıt: ${rows.length}`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(rows, null, 2));
  console.log(`Tüm veriler '${OUTPUT_FILE}' dosyasına kaydedildi.`);

  await GidaModel.deleteMany({});
  await GidaModel.insertMany(rows);
  console.log("Veriler MongoDB'ye kaydedildi.");

  await browser.close();
  await mongoose.disconnect();
})();
