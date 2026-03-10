const asistenciaService = require("../services/asistencia.service");


// DOCENTE
async function registrarAsistenciaClase(req, res, next) {
  try {

    const { materiaId } = req.params;
    const { fecha, asistencias } = req.body;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos",
        data: ["La fecha es obligatoria"]
      });
    }

    if (!Array.isArray(asistencias) || asistencias.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos",
        data: ["Debe enviar la lista de asistencias"]
      });
    }

    const result = await asistenciaService.registrarAsistenciaClase(
      materiaId,
      fecha,
      asistencias
    );

    res.status(201).json({
      success: true,
      message: "Registro creado exitosamente",
      data: result
    });

  } catch (error) {
    next(error);
  }
}


async function obtenerHistorialMateria(req, res, next) {
   try {

    const { materiaId } = req.params;

    const result = await asistenciaService.obtenerHistorialMateria(materiaId);

    res.status(200).json({
      success: true,
      message: "Datos obtenidos correctamente",
      data: result
    });

  } catch (error) {
    next(error);
  }
}


// ESTUDIANTE
async function misAsistenciasPorMateria(req, res, next) {
  try {

    const { materiaId } = req.params;
    const estudianteId = req.usuario.ci;

    const result = await asistenciaService.misAsistenciasPorMateria(
      estudianteId,
      materiaId
    );

    res.status(200).json({
      success: true,
      message: "Datos obtenidos correctamente",
      data: result,
    });

  } catch (error) {
    next(error);
  }
}


module.exports = {
  registrarAsistenciaClase,
  obtenerHistorialMateria,
  misAsistenciasPorMateria,
};