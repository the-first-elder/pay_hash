// src/client.ts
import { parseUnits, stringToHex } from "viem";

// src/pdf.ts
import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import fs from "fs";
async function generateReceiptPDF(templatePath, data) {
  const html = fs.readFileSync(templatePath, "utf8");
  const compiled = Handlebars.compile(html);
  const content = compiled(data);
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"]
  });
  const page = await browser.newPage();
  await page.setContent(content, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({
    format: "A4",
    printBackground: true
  });
  await browser.close();
  return pdf;
}

// src/mailer.ts
import nodemailer from "nodemailer";
function createTransporter(smtp) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure ?? smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass
    }
  });
}

// src/client.ts
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/constants.ts
var TEMPO_TESTNET_CHAIN_ID = 42431;

// src/render.ts
import Handlebars2 from "handlebars";
import fs2 from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
function renderReceiptHtml({
  receipt,
  template,
  params,
  tokenName
}) {
  const templateSource = fs2.readFileSync(
    path.join(
      template.emailTemplatePath ?? __dirname,
      template.emailTemplateName ?? "mailTemplate.hbs"
    ),
    "utf8"
  );
  const templates = Handlebars2.compile(templateSource);
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
      receipt.receipt?.timestamp || receipt.timestamp
    ).toUTCString(),
    year: (/* @__PURE__ */ new Date()).getFullYear().toLocaleString(),
    amount: params.amount,
    token: tokenName
  });
}

// src/client.ts
import { Actions } from "viem/tempo";
var __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
var pdfPath = path2.join(__dirname2, "./receipt.hbs");
var PayHashClient = class {
  client;
  transporter;
  emailTemplate;
  constructor(client, smtp, emailTemplate) {
    this.client = client;
    this.transporter = createTransporter(smtp);
    this.emailTemplate = emailTemplate;
  }
  async verifyTransporter() {
    return await this.transporter.verify();
  }
  // private loadEmailTemplate(filePath: string, fileName: string) {
  //   const templatePath = path.join(filePath, fileName);
  //   const html = fs.readFileSync(templatePath, "utf-8");
  //   return html;
  // }
  async pay(params) {
    try {
      const [account] = await this.client?.getAddresses();
      const metadata = await this.client.token.getMetadata({
        token: params.token
      });
      const tokenName = metadata.symbol;
      const decimals = metadata.decimals;
      const chainId = this.client.chain.id;
      let receipt = null;
      if (chainId == TEMPO_TESTNET_CHAIN_ID) {
        receipt = await this.client.token.transferSync({
          amount: parseUnits(params.amount, decimals),
          memo: stringToHex(params.memo || "0x"),
          token: params.token,
          to: params.orgAddress
        });
      }
      if (receipt == null) {
        throw new Error("Receipt not found");
      }
      await this.sendReceiptAndEmail({
        params,
        receipt,
        txHash: receipt.receipt.transactionHash,
        tokenName: metadata.symbol
      });
      return {
        success: true,
        receipt,
        account
      };
    } catch (error) {
      console.error("[PayHashClient Error]", error);
      return {
        success: false,
        error: error?.message || "Unknown error occurred"
      };
    }
  }
  // bathch Pay sync to multiple addresses at once
  async batchPay(params) {
    for (const param of params) {
      await this.pay(param);
    }
    return {
      success: true,
      message: "Batch payment successful"
    };
  }
  // batch Pay async to multiple addresses at once
  async batchPayAsync(params) {
    const [account] = await this.client.getAddresses();
    const nonceKeys = params.map((_, i) => BigInt(i + 1));
    const nonces = await Promise.all(
      nonceKeys.map(
        (nonceKey) => Actions.nonce.getNonce(this.client, { account, nonceKey })
      )
    );
    const results = await Promise.all(
      params.map(async (param, i) => {
        try {
          const metadata = await this.client.token.getMetadata({
            token: param.token
          });
          const decimals = metadata.decimals;
          const receipt = await Actions.token.transferSync(this.client, {
            amount: parseUnits(param.amount, decimals),
            to: param.orgAddress,
            token: param.token,
            // memo: stringToHex(param.memo || "0x"),
            nonceKey: nonceKeys[i],
            nonce: Number(nonces[i])
          });
          await this.sendReceiptAndEmail({
            params: param,
            receipt,
            txHash: receipt.receipt.transactionHash,
            tokenName: metadata.symbol
          });
          return {
            success: true,
            index: i,
            orgAddress: param.orgAddress,
            txHash: receipt.receipt.transactionHash
          };
        } catch (error) {
          console.error(
            `[BatchPay Error] index=${i}, org=${param.orgAddress}`,
            error
          );
          return {
            success: false,
            index: i,
            orgAddress: param.orgAddress,
            error: error?.message ?? "Unknown error"
          };
        }
      })
    );
    return {
      success: true,
      results
    };
  }
  async sendReceiptAndEmail({
    params,
    receipt,
    txHash,
    tokenName
  }) {
    const pdf = await generateReceiptPDF(
      path2.join(
        this.emailTemplate?.pdfTemplatePath ?? __dirname2,
        this.emailTemplate?.pdfTemplateName ?? "receipt.hbs"
      ),
      {
        brandName: this.emailTemplate?.brandName ?? params.orgName,
        primaryColor: this.emailTemplate?.primaryColor ?? "#000",
        receiptTitle: this.emailTemplate?.receiptTitle ?? "Payment Receipt",
        amount: params.amount,
        token: tokenName,
        txHash,
        date: (/* @__PURE__ */ new Date()).toUTCString(),
        footerText: this.emailTemplate?.footerText ?? "Powered by PayHash",
        fontFamily: this.emailTemplate?.fontFamily ?? "Inter",
        titleFontSize: this.emailTemplate?.titleFontSize ?? 24
      }
    );
    const html = renderReceiptHtml({
      receipt,
      template: this.emailTemplate,
      params,
      tokenName
    });
    await this.transporter.sendMail({
      from: `${params.orgName} <${params.orgMail}>`,
      to: `${params.clientMail}, ${params.orgMail}`,
      subject: this.emailTemplate?.subject ?? "Payment Receipt",
      html,
      attachments: [
        {
          filename: this.emailTemplate?.pdfFileName ?? "receipt.pdf",
          content: pdf
        }
      ]
    });
  }
};
export {
  PayHashClient
};
