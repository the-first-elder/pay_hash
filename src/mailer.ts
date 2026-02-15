// mailer.ts
import nodemailer from "nodemailer";
import { SMTPConfig } from "./types";

export function createTransporter(smtp: SMTPConfig) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure ?? smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });
}