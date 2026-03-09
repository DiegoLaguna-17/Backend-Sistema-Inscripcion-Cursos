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

router.get(
    "/activas",
    verificarAutenticacion,
    verificarRol([3]),
    verificarPermiso("inscripcion a materias"),
    controller.listarInscripcionesActivas
);

router.patch(
    "/:inscripcionId/materias/:materiaId/retirar",
    verificarAutenticacion,
    verificarRol([3]),
    verificarPermiso("inscripcion a materias"),
    controller.retirarMateria
);

router.post(
    "/actualizar-estados",
    verificarAutenticacion,
    verificarRol([1, 2]),
    controller.ejecutarActualizacionEstados
);

router.get(
    "/en-curso",
    verificarAutenticacion,
    verificarRol([3]),
    verificarPermiso("inscripcion a materias"),
    controller.listarMateriasEnCurso
);

router.get(
    "/culminadas",
    verificarAutenticacion,
    verificarRol([3]),
    verificarPermiso("inscripcion a materias"),
    controller.listarMateriasCulminadas
);

router.get(
    "/retiradas",
    verificarAutenticacion,
    verificarRol([3]),
    verificarPermiso("inscripcion a materias"),
    controller.listarMateriasRetiradas
);

router.get(
    "/estado-academico",
    verificarAutenticacion,
    verificarRol([3]),
    verificarPermiso("inscripcion a materias"),
    controller.listarEstadoAcademico
);

module.exports = router;