import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PayParams, EmailTemplate } from "./types";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function renderReceiptHtml({
  receipt,
  template,
  params,
  tokenName,
}: {
  receipt: any;
  template: EmailTemplate;
  params: PayParams;
  tokenName: string;
}) {
  const templateSource = fs.readFileSync(
    path.join(
      template.emailTemplatePath ?? __dirname,
      template.emailTemplateName ?? "mailTemplate.hbs",
    ),
    "utf8",
  );
  const templates = Handlebars.compile(templateSource);
  return templates({
    brandName: template.brandName || params.orgName,
    logoUrl: template.logoUrl || "",
    primaryColor: template.primaryColor || "#b5a8b0ff",
    titleFontSize: template.titleFontSize || 20,
    bodyFontSize: template.bodyFontSize || 14,
    receiptTitle: template.subject || "Payment Receipt",
    footerText: template.footerText || "Powered by PayHash",
    txHash: receipt.receipt?.transactionHash || receipt.transactionHash,
    payer: receipt.receipt?.from || receipt.from,
    timestamp: new Date(
      receipt.receipt?.timestamp || receipt.timestamp,
    ).toUTCString(),
    year: new Date().getFullYear().toLocaleString(),
    amount: params.amount,
    token: tokenName,
  });
}
