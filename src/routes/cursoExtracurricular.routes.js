const { Router } = require("express");
const controller = require("../controllers/cursoExtracurricular.controller");

const {
    verificarAutenticacion,
    verificarRol,
    verificarPermiso,
} = require("../middlewares/auth.middleware");

const router = Router();

// Crear extracurricular
router.post(
    "/",
    verificarAutenticacion,
    verificarRol([1]),
    verificarPermiso("crear materias"),
    controller.crear
);

// Listar extracurriculares
router.get(
    "/",
    verificarAutenticacion,
    verificarRol([1]),
    verificarPermiso("ver cursos"),
    controller.listar
);

// Obtener por ID
router.get(
    "/:id",
    verificarAutenticacion,
    verificarRol([1]),
    verificarPermiso("ver cursos"),
    controller.obtenerPorId
);

// Actualizar
router.put(
    "/:id",
    verificarAutenticacion,
    verificarRol([1]),
    verificarPermiso("crear materias"),
    controller.actualizar
);

// Eliminar
router.delete(
    "/:id",
    verificarAutenticacion,
    verificarRol([1]),
    verificarPermiso("crear materias"),
    controller.eliminar
);

module.exports = router;