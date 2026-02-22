// routes/carrera.routes.js
const { Router } = require('express');
const carreraController = require('../controllers/carrera.controller');

const {
    verificarAutenticacion,
    verificarPermiso
} = require('../middlewares/auth.middleware');

const router = Router();

router.post(
    '/',
    verificarAutenticacion,
    verificarPermiso("crear carreras"),
    carreraController.crearCarrera
);

router.get(
    '/',
    verificarAutenticacion,
    verificarPermiso("crear carreras"),
    carreraController.obtenerCarreras
);

router.put(
    '/:codigo',
    verificarAutenticacion,
    verificarPermiso("crear carreras"),
    carreraController.actualizarCarrera
);

module.exports = router;