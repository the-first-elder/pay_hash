// mailer.ts
import nodemailer from "nodemailer";
export function createTransporter(smtp) {
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
