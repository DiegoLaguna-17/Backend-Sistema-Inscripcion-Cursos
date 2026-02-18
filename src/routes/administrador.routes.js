const { Router } = require("express");
const administradorController = require("../controllers/administrador.controller");

const {
    verificarAutenticacion,
    verificarPermiso,
} = require("../middlewares/auth.middleware");

const router = Router();

// Crear admin
router.post(
    "/",
    verificarAutenticacion,
    verificarPermiso("crear carreras"),
    administradorController.registrarAdministrador
);

// Listar admins
router.get(
    "/",
    verificarAutenticacion,
    verificarPermiso("ver cursos"),
    administradorController.obtenerAdministradores
);

// Actualizar admin
router.put(
    "/:ci",
    verificarAutenticacion,
    verificarPermiso("crear carreras"),
    administradorController.actualizarAdministrador
);

// Eliminar lógico admin
router.delete(
    "/:ci",
    verificarAutenticacion,
    verificarPermiso("crear carreras"),
    administradorController.eliminarAdministrador
);

module.exports = router;
