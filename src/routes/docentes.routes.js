const { Router } = require("express");
const docenteController = require("../controllers/docente.controller");

const {
    verificarAutenticacion,
    verificarPermiso,
} = require("../middlewares/auth.middleware");

const router = Router();

// Crear docente
router.post(
    "/",
    verificarAutenticacion,
    verificarPermiso("registro de usuarios"),
    docenteController.registrarDocente
);

// Modificar docente
router.put(
    "/:ci",
    verificarAutenticacion,
    verificarPermiso("registro de usuarios"),
    docenteController.editarDocente
);

// Eliminar docente
router.delete(
    "/:ci",
    verificarAutenticacion,
    verificarPermiso("registro de usuarios"),
    docenteController.eliminarDocente
);

// Listar docentes
router.get(
    "/",
    verificarAutenticacion,
    verificarPermiso("registro de usuarios"),
    docenteController.obtenerDocentes
);

// Obtener por CI
router.get(
    "/:ci",
    verificarAutenticacion,
    verificarPermiso("registro de usuarios"),
    docenteController.obtenerDocente
);

// Verificar CI
router.get(
    "/verificar-ci/:ci",
    verificarAutenticacion,
    verificarPermiso("registro de usuarios"),
    docenteController.verificarCI
);

module.exports = router;
