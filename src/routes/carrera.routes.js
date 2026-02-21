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
    verificarPermiso('gestión académica'),
    carreraController.crearCarrera
);

router.get(
    '/',
    verificarAutenticacion,
    verificarPermiso('gestión académica'),
    carreraController.obtenerCarreras
);

router.put(
    '/:codigo',
    verificarAutenticacion,
    verificarPermiso('gestión académica'),
    carreraController.actualizarCarrera
);

module.exports = router;