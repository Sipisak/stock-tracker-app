import nodemailer from 'nodemailer';
import {WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE, STOCK_ALERT_LOWER_EMAIL_TEMPLATE, STOCK_ALERT_UPPER_EMAIL_TEMPLATE} from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro);

    const mailOptions = {
        from: `"Signalist" <signalist@gmail.com>`,
        to: email,
        subject: `Welcome to Signalist - your stock market toolkit is ready!`,
        text: 'Thanks for joining Signalist',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"Signalist News" <signalist@gmail.com>`,
        to: email,
        subject: `📈 Market News Summary Today - ${date}`,
        text: `Today's market news summary from Signalist`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};

export const sendStockAlertEmail = async ({
                                              email, symbol, company, currentPrice, targetPrice, condition, timestamp
                                          }: {
    email: string;
    symbol: string;
    company: string;
    currentPrice: number;
    targetPrice: number;
    condition: string;
    timestamp: string;
}) => {

    const template = condition === 'upper'
        ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE
        : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;


    const htmlTemplate = template
        .replace(/{{symbol}}/g, symbol)
        .replace(/{{company}}/g, company)
        .replace(/{{currentPrice}}/g, currentPrice.toString())
        .replace(/{{targetPrice}}/g, targetPrice.toString())
        .replace(/{{timestamp}}/g, timestamp);

    const subjectDirection = condition === 'upper' ? 'Stoupla NAD' : 'Klesla POD';

    const mailOptions = {
        from: `"Signalist Alerts" <signalist@gmail.com>`,
        to: email,
        subject: `🚨 Alert: Akcie ${symbol} ${subjectDirection} tvůj limit!`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};