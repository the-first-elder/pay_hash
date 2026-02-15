import {
  WalletActions,
  PublicActions,
  Transport,
  Chain,
  Account,
  Client,
  RpcSchema,
  Address,
  Hex,
  WalletClient,
  PublicClient,
} from "viem";
import { TempoActions } from "viem/tempo";

export type PayHashViemClient = WalletClient<Transport,Chain, Account> & WalletActions<Chain, Account> & PublicActions<Transport, Chain> &
  TempoActions<Chain, Account> &
  Omit<Client<Transport, Chain, Account, RpcSchema>, "cacheTime">;

export interface PayHashSDKConfig {
  client: PayHashViemClient;
}

export interface PayParams {
  token: Address;
  amount: string; // already in token decimals
  memo: Hex;
  orgAddress: Address;
  orgName:string,
  orgMail:string,
  clientMail:string,
  additionalInfo?: Hex;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
}

export type EmailTemplate = {
  pdfFileName?: string;
  pdfTemplatePath?: string;
  pdfTemplateName?: string;
  emailTemplatePath?: string;
  emailTemplateName?: string;
  subject?: string;
  brandName: string;
  logoUrl?: string;

  // Colors
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;

  // Typography
  fontFamily?: "inter" | "roboto" | "poppins";
  titleFontSize?: number; // px
  bodyFontSize?: number; // px
  footerFontSize?: number; // px

  // Layout
  layout?: "compact" | "standard" | "spacious";
  align?: "left" | "center";

  // Content
  receiptTitle?: string;
  footerText?: string;
  showTxHash?: boolean;
  showTimestamp?: boolean;
};
