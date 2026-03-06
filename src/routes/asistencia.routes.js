const express = require("express");
const router = express.Router();

const asistenciaController = require("../controllers/asistencia.controller");
const { verificarAutenticacion } = require("../middlewares/auth.middleware");

router.post(
  "/materia/:materiaId",
  verificarAutenticacion,
  asistenciaController.registrarAsistenciaClase
);

router.get(
  "/materia/:materiaId",
  verificarAutenticacion,
  asistenciaController.obtenerHistorialMateria
);

router.get(
  "/mis-asistencias/:materiaId",
  verificarAutenticacion,
  asistenciaController.misAsistenciasPorMateria
);

module.exports = router;