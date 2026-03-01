const { Router } = require("express");
const controller = require("../controllers/inscripcion.controller");

const {
    verificarAutenticacion,
    verificarRol,
    verificarPermiso,
} = require("../middlewares/auth.middleware");

const router = Router();

router.get(
    "/materias",
    verificarAutenticacion,
    verificarRol([3]),
    verificarPermiso("inscripcion a materias"),
    controller.listarMateriasDisponibles
);

router.get(
    "/materias/:id",
    verificarAutenticacion,
    verificarRol([3]),
    verificarPermiso("inscripcion a materias"),
    controller.obtenerDetalleMateria
);

router.get(
    "/extracurriculares",
    verificarAutenticacion,
    verificarRol([3]),
    verificarPermiso("inscripcion a materias"),
    controller.listarExtracurriculares
);

router.get(
    "/extracurriculares/:id",
    verificarAutenticacion,
    verificarRol([3]),
    verificarPermiso("inscripcion a materias"),
    controller.obtenerDetalleExtracurricular
);

router.post(
    "/",
    verificarAutenticacion,
    verificarRol([3]),
    verificarPermiso("inscripcion a materias"),
    controller.crearInscripcion
);

router.get(
    "/mis-inscripciones",
    verificarAutenticacion,
    verificarRol([3]),
    verificarPermiso("inscripcion a materias"),
    controller.misInscripciones
);

module.exports = router;