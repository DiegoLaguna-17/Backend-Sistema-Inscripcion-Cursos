const nodemailer = require("nodemailer");

function getMailEnv() {
    return {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT || 587),
        user: process.env.MAIL_USER || process.env.EMAIL_USER,
        pass: process.env.MAIL_PASS || process.env.EMAIL_PASS,
        from: process.env.MAIL_FROM || `"Six Seven Academy" <${process.env.MAIL_USER || process.env.EMAIL_USER}>`,
    };
}

function crearTransport() {
    const { host, port, user, pass } = getMailEnv();

    return nodemailer.createTransport({
        host,
        port,
        secure: false, 
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
    });
}

async function enviarFacturaPorCorreo({ to, subject, text, pdfBuffer, filename }) {
    const transporter = crearTransport();
    const { from } = getMailEnv();

    const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        attachments: [
        {
            filename: filename || "factura.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
        },
        ],
    });

    return info;
}

module.exports = { enviarFacturaPorCorreo };