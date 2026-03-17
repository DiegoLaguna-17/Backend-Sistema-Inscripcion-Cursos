const service = require("../services/certificate.service");

async function generarCertificados(req, res) {
  try {
    const { id_materia, estudiantes } = req.body;

    if (
      !id_materia ||
      !Array.isArray(estudiantes) ||
      estudiantes.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Se requiere el ID de la materia y una lista de estudiantes válida.",
      });
    }

    const resultados = await service.emitirCertificadosCurso(
      id_materia,
      estudiantes,
    );

    const totalExitos = resultados.filter((r) => r.email_enviado).length;

    return res.status(200).json({
      success: true,
      message: `Proceso finalizado. Se enviaron ${totalExitos} de ${estudiantes.length} certificados con éxito.`,
      data: resultados,
    });
  } catch (err) {
    console.error("Error en certificate.controller:", err);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor al procesar certificados.",
      error: err.message,
    });
  }
}

module.exports = { generarCertificados };
