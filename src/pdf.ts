import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import fs from "fs";

export async function generateReceiptPDF(
  templatePath: string,
  data: Record<string, any>
): Promise<Buffer> {
  const html = fs.readFileSync(templatePath, "utf8");
  const compiled = Handlebars.compile(html);
  const content = compiled(data);

  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(content, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return pdf;
}