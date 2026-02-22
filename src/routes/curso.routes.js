const { Router } = require("express");
const controller = require("../controllers/curso.controller");

const {
    verificarAutenticacion,
    verificarRol,
    verificarPermiso,
} = require("../middlewares/auth.middleware");

const router = Router();

// Rutas para curso con solo el acceso al Administrador
router.post(
    "/",
    verificarAutenticacion,
    verificarRol([1]),
    verificarPermiso("crear materias"),
    controller.crearCurso
);

router.get(
    "/",
    verificarAutenticacion,
    verificarRol([1]),
    verificarPermiso("ver cursos"),
    controller.listarCursos
);

router.get(
    "/:id",
    verificarAutenticacion,
    verificarRol([1]),
    verificarPermiso("ver cursos"),
    controller.obtenerCurso
);

router.put(
    "/:id",
    verificarAutenticacion,
    verificarRol([1]),
    verificarPermiso("crear materias"),
    controller.actualizarCurso
);

router.delete(
    "/:id",
    verificarAutenticacion,
    verificarRol([1]),
    verificarPermiso("crear materias"),
    controller.eliminarCurso
);

module.exports = router;