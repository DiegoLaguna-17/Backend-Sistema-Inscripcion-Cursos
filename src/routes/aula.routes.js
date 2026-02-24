const { Router } = require("express");
const aulaController = require("../controllers/aula.controller");

const {
    verificarAutenticacion,
    verificarRol,
    verificarPermiso,
} = require("../middlewares/auth.middleware");

const router = Router();

router.get(
    "/",
    verificarAutenticacion,
    verificarRol([1]),
    verificarPermiso("ver cursos"),
    aulaController.listar
);

router.get(
    "/:id",
    verificarAutenticacion,
    verificarRol([1]),
    verificarPermiso("ver cursos"),
    aulaController.obtenerPorId
);

module.exports = router;