# PayHash SDK

PayHash SDK is a professional TypeScript library designed to streamline blockchain payments, receipt generation, and automated email notifications. Built on top of `viem`, it provides a high-level interface for handling crypto transactions on the Tempo network, while automatically generating PDF receipts and sending them to both organizations and clients via SMTP.

## Key Features

- **Seamless Payments**: Process single or batch token transfers with ease.
- **Automated Receipts**: Generates professional PDF receipts using Puppeteer and Handlebars.
- **Email Notifications**: Automatically sends email confirmations with attached PDF receipts.
- **Customizable Templates**: Fully customizable HTML email and PDF receipt templates.
- **Batch Processing**: Supports both sequential and parallel batch payments with advanced nonce management.
- **TypeScript First**: Robust type definitions for a superior developer experience.

## Installation

```bash
npm install pay_hash viem
```

## Quick Start

```typescript
import { PayHashClient } from "pay_hash";
import { createClient, http, publicActions, walletActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { tempoTestnet } from "viem/chains";
import { tempoActions } from "viem/tempo";

// 1. Setup Viem Client
const client = createClient({
  account: privateKeyToAccount("0x..."),
  chain: tempoTestnet,
  transport: http(),
})
  .extend(publicActions)
  .extend(walletActions)
  .extend(tempoActions());

// 2. Configure SMTP
const smtp = {
  host: "smtp.example.com",
  port: 587,
  secure: false,
  user: "your-user",
  pass: "your-password",
};

// 3. Define Email/Receipt Branding
const emailTemplate = {
  brandName: "My Brand",
  primaryColor: "#4F46E5",
  receiptTitle: "Payment Receipt",
  subject: "Success! Your Payment Receipt",
};

// 4. Initialize PayHash SDK
const payhash = new PayHashClient(client, smtp, emailTemplate);

// 5. Process Payment
const main = async () => {
  const result = await payhash.pay({
    amount: "100.50",
    token: "0x...", // Token Address
    orgAddress: "0x...", // Recipient Address
    orgName: "My Company Inc",
    orgMail: "billing@mycompany.com",
    clientMail: "customer@example.com",
    memo: "Order #789",
  });

  console.log(result.success ? "Paid!" : "Error: " + result.error);
};

main();
```

## Advanced Usage

### Batch Payments

#### Sequential Batch (Safer)

Processes payments one by one, waiting for each to complete.

```typescript
await payhash.batchPay([params1, params2]);
```

#### Parallel Batch (Faster)

Sends multiple transactions simultaneously using advanced nonce tracking.

```typescript
await payhash.batchPayAsync([params1, params2]);
```

### Customizing Templates

You can provide your own Handlebars (.hbs) files for both emails and PDF receipts.

```typescript
const emailTemplate = {
  brandName: "PayHash",
  // Specify custom template paths
  pdfTemplatePath: "./templates",
  pdfTemplateName: "custom-receipt.hbs",
  emailTemplatePath: "./templates",
  emailTemplateName: "custom-email.hbs",
  // Reusable branding
  primaryColor: "#000",
  logoUrl: "https://example.com/logo.png",
};
```

## API Reference

### `PayHashClient`

- `constructor(client, smtp, template)`: Initializes the SDK.
- `pay(params)`: Executes a single token transfer, generates a receipt, and sends an email.
- `batchPay(params[])`: Executes multiple payments sequentially.
- `batchPayAsync(params[])`: Executes multiple payments in parallel using unique nonces.
- `verifyTransporter()`: Checks if the SMTP configuration is valid.

## Configuration Types

### `PayParams`

| Property     | Type      | Description                                       |
| :----------- | :-------- | :------------------------------------------------ |
| `amount`     | `string`  | The amount to transfer (in human-readable units). |
| `token`      | `Address` | The ERC20 token contract address.                 |
| `orgAddress` | `Address` | The organization's wallet address.                |
| `orgMail`    | `string`  | The organization's support email.                 |
| `clientMail` | `string`  | The client's email address.                       |
| `memo`       | `string`  | Optional payment reference.                       |

### `EmailTemplate`

| Property       | Type     | Description                                       |
| :------------- | :------- | :------------------------------------------------ |
| `brandName`    | `string` | Your organization's name.                         |
| `primaryColor` | `string` | Primary hex color for the branding.               |
| `logoUrl`      | `string` | URL to your organization's logo.                  |
| `fontFamily`   | `string` | Font family for the PDF (Inter, Roboto, Poppins). |

## License

MIT License.
