const { Router } = require("express");
const estudianteController = require("../controllers/estudiante.controller");

const {
    verificarAutenticacion,
    verificarPermiso,
} = require("../middlewares/auth.middleware");

const router = Router();

// Crear estudiante
router.post(
    "/",
    verificarAutenticacion,
    verificarPermiso("registro de usuarios"),
    estudianteController.registrarEstudiante
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
    verificarPermiso("registro de usuarios"),
    estudianteController.obtenerEstudiantePorCI
);

module.exports = router;
