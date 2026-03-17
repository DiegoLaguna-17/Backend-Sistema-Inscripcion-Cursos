const { Router } = require("express");
const docenteController = require("../controllers/docente.controller");

const {
  verificarAutenticacion,
  verificarPermiso,
  verificarRol,
} = require("../middlewares/auth.middleware");

console.log("CARGÓ src/routes/docentes.routes.js");

const router = Router();

router.use((req, res, next) => {
  console.log("DOCENTES ROUTE:", {
    method: req.method,
    originalUrl: req.originalUrl,
    path: req.path,
  });
  next();
});

// Crear docente
router.post(
  "/",
  verificarAutenticacion,
  verificarPermiso("registro de usuarios"),
  docenteController.registrarDocente,
);

// Registrar notas de estudiantes por materia
router.post(
  "/registrar-notas",
  verificarAutenticacion,
  verificarPermiso("registro de notas"),
  docenteController.registrarNotas,
);

// Editar notas de estudiantes por materia
router.put(
  "/editar-notas",
  verificarAutenticacion,
  verificarPermiso("registro de notas"),
  docenteController.editarNotas,
);

// Verificar CI
router.get(
  "/verificar-ci/:ci",
  verificarAutenticacion,
  verificarPermiso("registro de usuarios"),
  docenteController.verificarCI,
);

// Obtener estudiantes y sus notas por materia
router.get(
  "/:id_materia/notas",
  verificarAutenticacion,
  verificarPermiso("registro de notas"),
  docenteController.obtenerNotasEstudiantes,
);

// Obtener las materias de un docente
router.get(
  "/:ci/materias",
  verificarAutenticacion,
  verificarPermiso("registro de asistencia"),
  docenteController.obtenerMateriasDocente,
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

// Obtener docente por CI
router.get(
  "/:ci",
  verificarAutenticacion,
  verificarPermiso("registro de usuarios"),
  docenteController.obtenerDocente,
);

// Listar docentes
router.get(
  "/",
  verificarAutenticacion,
  verificarRol([1, 4]),
  docenteController.obtenerDocentes,
);

module.exports = router;
