const { Router } = require("express");
const controller = require("../controllers/estudiante.controller");

const router = Router();

router.post("/", controller.registrarEstudiante);       // Registrar estudiante
router.get("/", controller.listarEstudiantes);          // Mostrar lista de estudiantes
router.get("/:ci", controller.obtenerEstudiantePorCI);  // Obtener estudiante por CI
router.put("/:ci", controller.actualizarEstudiante);    // Editar estudiante
router.delete("/:ci", controller.eliminarEstudiante);   // Eliminar estudiante

module.exports = router;
