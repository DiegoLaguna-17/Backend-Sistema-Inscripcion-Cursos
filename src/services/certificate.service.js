const { generarCertificadoPDFBuffer } = require("../utils/certificadoPdf");
const { enviarFacturaPorCorreo } = require("../utils/mailer");
const { hoyISO } = require("./inscripcion.service");

async function emitirCertificadosCurso(idMateria, estudiantes) {
  const resultados = [];
  const fechaEmision = hoyISO();

  for (const est of estudiantes) {
    const status = {
      estudiante: est.nombre,
      email: est.correo,
      pdf_generado: false,
      email_enviado: false,
      error: null,
    };

    try {
      const pdfBuffer = await generarCertificadoPDFBuffer({
        estudiante: { nombre: est.nombre },
        curso: { nombre: idMateria },
        fecha_emision: fechaEmision,
      });
      status.pdf_generado = true;

      await enviarFacturaPorCorreo({
        to: est.correo,
        subject: `Certificado de Aprobación: ${idMateria}`,
        text: `Estimado(a) ${est.nombre},\n\nMuchas felicidades por haber concluido exitosamente el curso "${idMateria}".\n\nAdjunto a este correo encontrarás tu certificado oficial de finalización.\n\nAtentamente,\nSix Seven Academy`,
        pdfBuffer: pdfBuffer,
        filename: `Certificado_${idMateria.replace(/\s+/g, "_")}.pdf`,
      });

      status.email_enviado = true;
    } catch (err) {
      console.error(
        `Error procesando certificado para ${est.nombre}:`,
        err.message,
      );
      status.error = err.message;
    }

    resultados.push(status);
  }

  return resultados;
}

module.exports = { emitirCertificadosCurso };
