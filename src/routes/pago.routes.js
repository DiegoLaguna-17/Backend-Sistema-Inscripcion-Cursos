// routes/pago.routes.js
const { Router } = require("express");
const controller = require("../controllers/pago.controller");

const {
    verificarAutenticacion,
    verificarRol,
    verificarPermiso,
} = require("../middlewares/auth.middleware");

const router = Router();

router.get(
    "/inscripciones/:id_inscripcion/resumen",
    verificarAutenticacion,
    verificarRol([3]), // estudiante
    verificarPermiso("inscripcion a materias"),
    controller.resumenPago
);

// Pagar una inscripción 
router.post(
    "/inscripciones/:id_inscripcion/pagar",
    verificarAutenticacion,
    verificarRol([3]), // estudiante
    verificarPermiso("inscripcion a materias"),
    controller.pagarInscripcion
);

// Ver factura por id 
router.get(
    "/facturas/:id_factura",
    verificarAutenticacion,
    verificarRol([3]),
    verificarPermiso("inscripcion a materias"),
    controller.obtenerFactura
);

module.exports = router;