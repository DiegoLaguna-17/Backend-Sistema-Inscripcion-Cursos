const { Router } = require("express");
const estudianteController = require("../controllers/estudiante.controller");

const {
    verificarAutenticacion,
    verificarPermiso,
    verificarAccesoPropioOAdmin
} = require("../middlewares/auth.middleware");

const router = Router();

// ===== Rutas públicas (solo requieren autenticación) =====

// Inscribirse a una carrera (estudiante se inscribe a sí mismo)
router.post(
    "/inscribirse",
    verificarAutenticacion,
    estudianteController.inscribirseCarrera
);

// ===== Rutas administrativas =====

// Crear estudiante
router.post(
    "/",
    verificarAutenticacion,
    verificarPermiso("registro de usuarios"),
    estudianteController.registrarEstudiante
);

// Asignar carrera a estudiante cuando se inscriba
router.put(
    "/:ci/asignar-carrera",
    verificarAutenticacion,
    estudianteController.asignarCarrera
);

// Modificar estudiante
router.put(
    "/:ci",
    verificarAutenticacion,
    verificarPermiso("registro de usuarios"),
    estudianteController.actualizarEstudiante
);

// Eliminar estudiante
router.delete(
    "/:ci",
    verificarAutenticacion,
    verificarPermiso("registro de usuarios"),
    estudianteController.eliminarEstudiante
);

// Listar estudiantes
router.get(
    "/",
    verificarAutenticacion,
    verificarPermiso("registro de usuarios"),
    estudianteController.listarEstudiantes
);

// Obtener por CI
router.get(
    "/:ci",
    verificarAutenticacion,
    verificarAccesoPropioOAdmin(),
    estudianteController.obtenerEstudiantePorCI
);

module.exports = router;
