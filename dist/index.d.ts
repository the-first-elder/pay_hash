import { WalletClient, Transport, Chain, Account, WalletActions, PublicActions, Client, RpcSchema, Address, Hex } from 'viem';
import { TempoActions, Actions } from 'viem/tempo';

type PayHashViemClient = WalletClient<Transport, Chain, Account> & WalletActions<Chain, Account> & PublicActions<Transport, Chain> & TempoActions<Chain, Account> & Omit<Client<Transport, Chain, Account, RpcSchema>, "cacheTime">;
interface PayHashSDKConfig {
    client: PayHashViemClient;
}
interface PayParams {
    token: Address;
    amount: string;
    memo: Hex;
    orgAddress: Address;
    orgName: string;
    orgMail: string;
    clientMail: string;
    additionalInfo?: Hex;
}
interface SMTPConfig {
    host: string;
    port: number;
    secure?: boolean;
    user: string;
    pass: string;
}
type EmailTemplate = {
    pdfFileName?: string;
    pdfTemplatePath?: string;
    pdfTemplateName?: string;
    emailTemplatePath?: string;
    emailTemplateName?: string;
    subject?: string;
    brandName: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: "inter" | "roboto" | "poppins";
    titleFontSize?: number;
    bodyFontSize?: number;
    footerFontSize?: number;
    layout?: "compact" | "standard" | "spacious";
    align?: "left" | "center";
    receiptTitle?: string;
    footerText?: string;
    showTxHash?: boolean;
    showTimestamp?: boolean;
};

declare class PayHashClient {
    private client;
    private transporter;
    private emailTemplate;
    constructor(client: PayHashViemClient, smtp: SMTPConfig, emailTemplate: EmailTemplate);
    verifyTransporter(): Promise<true>;
    pay(params: PayParams): Promise<{
        success: boolean;
        receipt: Actions.token.transferSync.ReturnValue;
        account: `0x${string}`;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        receipt?: undefined;
        account?: undefined;
    }>;
    batchPay(params: PayParams[]): Promise<{
        success: boolean;
        message: string;
    }>;
    batchPayAsync(params: PayParams[]): Promise<{
        success: boolean;
        results: ({
            success: boolean;
            index: number;
            orgAddress: `0x${string}`;
            txHash: `0x${string}`;
            error?: undefined;
        } | {
            success: boolean;
            index: number;
            orgAddress: `0x${string}`;
            error: any;
            txHash?: undefined;
        })[];
    }>;
    private sendReceiptAndEmail;
}

export { type EmailTemplate, PayHashClient, type PayHashSDKConfig, type PayHashViemClient, type PayParams, type SMTPConfig };
