const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

function escapeHtml(str = "") {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function loadLogoDataUri() {
    const candidates = [
        path.resolve(process.cwd(), "src", "assets", "logo_sixsevenacademy.png"),
        path.resolve(process.cwd(), "assets", "logo_sixsevenacademy.png"),
        path.resolve(process.cwd(), "src", "assets", "sixsevenacademy.png"),
        path.resolve(process.cwd(), "assets", "sixsevenacademy.png"),
    ];

    const logoPath = candidates.find((p) => fs.existsSync(p));
    if (!logoPath) return null;

    const file = fs.readFileSync(logoPath);
    const base64 = file.toString("base64");
    return `data:image/png;base64,${base64}`;
    }

    function plantillaFacturaHTML({ factura, pago, datosFactura, items }) {
    const rows = (items || [])
        .map(
        (it) => `
            <tr>
            <td>${escapeHtml(it.codigo || it.id_materia)}</td>
            <td>${escapeHtml(it.nombre)}</td>
            <td style="text-align:right">${Number(it.monto || 0).toFixed(2)}</td>
            </tr>
        `
        )
        .join("");

    const total = Number(factura.total || 0).toFixed(2);

    const logoDataUri = loadLogoDataUri();
    const logoHtml = logoDataUri
        ? `<img class="logo" src="${logoDataUri}" alt="SixSeven Academy" />`
        : `<div class="logo-fallback">SIXSEVEN ACADEMY</div>`;

    return `
    <!doctype html>
    <html>
        <head>
        <meta charset="utf-8"/>
        <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }

            .header { display:flex; justify-content:space-between; align-items:flex-start; gap: 16px; }
            .brand { display:flex; align-items:center; gap: 12px; }

            .logo { height: 52px; width: auto; object-fit: contain; }
            .logo-fallback { font-weight: 700; letter-spacing: 1px; font-size: 14px; }

            .box { border:1px solid #ddd; padding:12px; border-radius:8px; min-width: 280px; }
            h1 { margin:0; font-size:18px; }
            .muted { color:#666; font-size:12px; margin-top: 2px; }

            table { width:100%; border-collapse:collapse; margin-top:16px; }
            th, td { border-bottom:1px solid #eee; padding:10px 6px; font-size:13px; }
            th { text-align:left; background:#fafafa; }

            .total { margin-top: 12px; text-align:right; font-size:14px; }
            .total strong { font-size:16px; }

            .footer { margin-top: 24px; font-size:12px; color:#555; }
        </style>
        </head>

        <body>
        <div class="header">
            <div class="brand">
            ${logoHtml}
            <div>
                <h1>Factura</h1>
                <div class="muted">ID Factura: ${escapeHtml(factura.id_factura)}</div>
                <div class="muted">Fecha: ${escapeHtml(factura.fecha_emision)} ${escapeHtml(factura.hora)}</div>
            </div>
            </div>

            <div class="box">
            <div><strong>NIT/CI:</strong> ${escapeHtml(datosFactura.nit_ci)}</div>
            <div><strong>Razón Social:</strong> ${escapeHtml(datosFactura.razon_social)}</div>
            <div><strong>Correo:</strong> ${escapeHtml(datosFactura.correo)}</div>
            </div>
        </div>

        <table>
            <thead>
            <tr>
                <th>Código</th>
                <th>Materia</th>
                <th style="text-align:right">Monto (Bs)</th>
            </tr>
            </thead>
            <tbody>
            ${rows || `<tr><td colspan="3">Sin detalle</td></tr>`}
            </tbody>
        </table>

        <div class="total">
            <div>Método de pago: <strong>${escapeHtml(pago.metodo_pago)}</strong></div>
            <div>Total: <strong>Bs ${total}</strong></div>
        </div>

        <div class="footer">
            <div>Pago simulado: esta factura fue generada automáticamente por el sistema.</div>
        </div>
        </body>
    </html>
    `;
    }

async function generarFacturaPDFBuffer({ factura, pago, datosFactura, items }) {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
        const page = await browser.newPage();
        const html = plantillaFacturaHTML({ factura, pago, datosFactura, items });
        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
        });

        return pdfBuffer;
    } finally {
        await browser.close();
    }
}

module.exports = { generarFacturaPDFBuffer };