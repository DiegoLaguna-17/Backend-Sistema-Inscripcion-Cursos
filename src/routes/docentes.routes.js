const { Router } = require("express");
const docenteController = require("../controllers/docente.controller");

const {
  verificarAutenticacion,
  verificarPermiso,
  verificarRol,
} = require("../middlewares/auth.middleware");

const router = Router();

// Crear docente
router.post(
  "/",
  verificarAutenticacion,
  verificarPermiso("registro de usuarios"),
  docenteController.registrarDocente,
);

// Modificar docente
router.put(
  "/:ci",
  verificarAutenticacion,
  verificarPermiso("registro de usuarios"),
  docenteController.editarDocente,
);

// Eliminar docente
router.delete(
  "/:ci",
  verificarAutenticacion,
  verificarPermiso("registro de usuarios"),
  docenteController.eliminarDocente,
);

// Listar docentes
router.get(
  "/",
  verificarAutenticacion,
  verificarRol([1, 4]),
  docenteController.obtenerDocentes,
);

// Obtener por CI
router.get(
  "/:ci",
  verificarAutenticacion,
  verificarPermiso("registro de usuarios"),
  docenteController.obtenerDocente,
);

// Verificar CI
router.get(
  "/verificar-ci/:ci",
  verificarAutenticacion,
  verificarPermiso("registro de usuarios"),
  docenteController.verificarCI,
);

// Obtener las materias de un docente
router.get(
  "/:ci/materias",
  verificarAutenticacion,
  verificarPermiso("registro de asistencia"),
  docenteController.obtenerMateriasDocente,
);

module.exports = router;
