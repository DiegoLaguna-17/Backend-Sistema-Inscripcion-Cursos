// routes/carrera.routes.js
const { Router } = require('express');
const carreraController = require('../controllers/carrera.controller');

const {
    verificarAutenticacion,
    verificarPermiso
} = require('../middlewares/auth.middleware');

const router = Router();

// ===== Rutas públicas (solo requieren autenticación) =====
// Para estudiantes que quieren ver carreras disponibles

// Listar todas las carreras disponibles (para las cards)
router.get(
    '/disponibles',
    verificarAutenticacion,
    carreraController.obtenerCarreras
);

// Ver detalles de una carrera específica (para "Ver más") - SIN MATERIAS
router.get(
    '/disponibles/:codigo',
    verificarAutenticacion,
    carreraController.obtenerCarreraSinMaterias
);

// Ver materias de una carrera (para botón "Ver materias")
router.get(
    '/disponibles/:codigo/materias',
    verificarAutenticacion,
    carreraController.obtenerMateriasPorCarrera
);

// ===== Rutas administrativas (requieren permisos) =====

// Crear carrera (solo admin)
router.post(
    '/',
    verificarAutenticacion,
    verificarPermiso("crear carreras"),
    carreraController.crearCarrera
);

// Listar carreras (admin)
router.get(
    '/',
    verificarAutenticacion,
    verificarPermiso("crear carreras"),
    carreraController.obtenerCarreras
);

// Actualizar carrera (admin)
router.put(
    '/:codigo',
    verificarAutenticacion,
    verificarPermiso("crear carreras"),
    carreraController.actualizarCarrera
);

// Obtener carrera por código (admin)
router.get(
    '/:codigo',
    verificarAutenticacion,
    verificarPermiso('crear carreras'),
    carreraController.obtenerCarreraPorCodigo
);

module.exports = router;