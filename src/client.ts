import { parseUnits, stringToHex } from "viem";
import {
  PayHashViemClient,
  PayParams,
  EmailTemplate,
  SMTPConfig,
} from "./types";
import { generateReceiptPDF } from "./pdf";
import { createTransporter } from "./mailer";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import { TEMPO_TESTNET_CHAIN_ID } from "./constants";
import fs from "fs";
import { renderReceiptHtml } from "./render";
import { Actions } from "viem/tempo";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pdfPath = path.join(__dirname, "./receipt.hbs");

export class PayHashClient {
  private client: PayHashViemClient;
  private transporter: nodemailer.Transporter;
  private emailTemplate: EmailTemplate;

  constructor(
    client: PayHashViemClient,
    smtp: SMTPConfig,
    emailTemplate: EmailTemplate
  ) {
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

  async pay(params: PayParams) {
    try {
      const [account] = await this.client?.getAddresses();
      const metadata = await this.client.token.getMetadata({
        token: params.token,
      });
      const tokenName = metadata.symbol;
      const decimals = metadata.decimals;
      const chainId = this.client.chain.id;
      let receipt: Actions.token.transferSync.ReturnValue | null = null;
      if (chainId == TEMPO_TESTNET_CHAIN_ID) {
        receipt = await this.client.token.transferSync({
          amount: parseUnits(params.amount, decimals),
          memo: stringToHex(params.memo || "0x"),
          token: params.token,
          to: params.orgAddress,
        });
      }
      if (receipt == null) {
        throw new Error("Receipt not found");
      }

      await this.sendReceiptAndEmail({
        params: params,
        receipt: receipt,
        txHash: receipt.receipt.transactionHash,
        tokenName: metadata.symbol,
      });

      return {
        success: true,
        receipt,
        account,
      };
    } catch (error: any) {
      console.error("[PayHashClient Error]", error);
      return {
        success: false,
        error: error?.message || "Unknown error occurred",
      };
    }
  }

  // bathch Pay sync to multiple addresses at once
  async batchPay(params: PayParams[]) {
    for (const param of params) {
      await this.pay(param);
    }
    return {
      success: true,
      message: "Batch payment successful",
    };
  }

  // batch Pay async to multiple addresses at once
  async batchPayAsync(params: PayParams[]) {
    const [account] = await this.client.getAddresses();

    // 1️⃣ unique nonce key per tx
    const nonceKeys = params.map((_, i) => BigInt(i + 1));

    // 2️⃣ fetch all nonces in parallel
    const nonces = await Promise.all(
      nonceKeys.map((nonceKey) =>
        Actions.nonce.getNonce(this.client, { account, nonceKey })
      )
    );

    // 3️⃣ send all txs in parallel with per-item error handling
    const results = await Promise.all(
      params.map(async (param, i) => {
        try {
          const metadata = await this.client.token.getMetadata({
            token: param.token,
          });

          const decimals = metadata.decimals;

          const receipt = await Actions.token.transferSync(this.client, {
            amount: parseUnits(param.amount, decimals),
            to: param.orgAddress,
            token: param.token,
            // memo: stringToHex(param.memo || "0x"),
            nonceKey: nonceKeys[i],
            nonce: Number(nonces[i]),
          });

          await this.sendReceiptAndEmail({
            params: param,
            receipt: receipt,
            txHash: receipt.receipt.transactionHash,
            tokenName: metadata.symbol,
          });

          return {
            success: true,
            index: i,
            orgAddress: param.orgAddress,
            txHash: receipt.receipt.transactionHash,
          };
        } catch (error: any) {
          console.error(
            `[BatchPay Error] index=${i}, org=${param.orgAddress}`,
            error
          );

          return {
            success: false,
            index: i,
            orgAddress: param.orgAddress,
            error: error?.message ?? "Unknown error",
          };
        }
      })
    );

    return {
      success: true,
      results,
    };
  }
  private async sendReceiptAndEmail({
    params,
    receipt,
    txHash,
    tokenName,
  }: {
    params: PayParams;
    receipt: Actions.token.transferSync.ReturnValue;
    txHash: `0x${string}`;
    tokenName: string;
  }) {
    /* Generate PDF */
    const pdf = await generateReceiptPDF(
      path.join(
        this.emailTemplate?.pdfTemplatePath ?? __dirname,
        this.emailTemplate?.pdfTemplateName ?? "receipt.hbs"
      ),
      {
        brandName: this.emailTemplate?.brandName ?? params.orgName,
        primaryColor: this.emailTemplate?.primaryColor ?? "#000",
        receiptTitle: this.emailTemplate?.receiptTitle ?? "Payment Receipt",
        amount: params.amount,
        token: tokenName,
        txHash,
        date: new Date().toUTCString(),
        footerText: this.emailTemplate?.footerText ?? "Powered by PayHash",
        fontFamily: this.emailTemplate?.fontFamily ?? "Inter",
        titleFontSize: this.emailTemplate?.titleFontSize ?? 24,
      }
    );

    const html = renderReceiptHtml({
      receipt,
      template: this.emailTemplate,
      params,
      tokenName,
    });

    /* Send email */
    await this.transporter.sendMail({
      from: `${params.orgName} <${params.orgMail}>`,
      to: `${params.clientMail}, ${params.orgMail}`,
      subject: this.emailTemplate?.subject ?? "Payment Receipt",
      html,
      attachments: [
        {
          filename: this.emailTemplate?.pdfFileName ?? "receipt.pdf",
          content: pdf,
        },
      ],
    });
  }
}
