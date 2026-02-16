const { Router } = require("express");
const {
    registrarEstudiante,
    listarEstudiantes,
    obtenerEstudiantePorCI,
    actualizarEstudiante,
    eliminarEstudiante,
} = require("../controllers/estudiante.controller");

const router = Router();

router.post("/", registrarEstudiante);         // ALTA
router.get("/", listarEstudiantes);            // LISTAR
router.get("/:ci", obtenerEstudiantePorCI);    // OBTENER 1
router.put("/:ci", actualizarEstudiante);      // MODIFICAR
router.delete("/:ci", eliminarEstudiante);     // BAJA

module.exports = router;
