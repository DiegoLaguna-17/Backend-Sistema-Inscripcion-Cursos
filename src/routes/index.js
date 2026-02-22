const express = require('express');
const estudianteRoutes = require('./estudiante.routes');
const docenteRoutes = require('./docentes.routes');
const cursoRoutes = require("./curso.routes");
const administradorController = require('../controllers/administrador.controller');
const carreraRoutes = require('./carrera.routes');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// RUTAS PARA AUTENTICACIÓN
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/verificar', authController.verificarToken);
router.get('/auth/permisos', authMiddleware.verificarAutenticacion, authController.obtenerPermisos);

// RUTAS PARA ESTUDIANTES
router.use('/estudiantes', estudianteRoutes);

// RUTAS PARA DOCENTES
router.use('/docentes', docenteRoutes);

// RUTAS PARA CURSOS
router.use("/cursos", cursoRoutes);

// RUTAS PARA ADMINISTRADORES
router.post(
  '/administradores/registro',
  authMiddleware.verificarAutenticacion,
  authMiddleware.verificarPermiso('registro de usuarios'),
  administradorController.registrar
);
// RUTAS PARA CARRERAS
router.use('/carreras', carreraRoutes);

// Listar administradores (solo para seguridad)
router.get(
  '/administradores',
  authMiddleware.verificarAutenticacion,
  authMiddleware.verificarPermiso('registro de usuarios'),
  administradorController.obtenerTodos
);

// Actualizar administrador (por parte del de seguridad)
router.patch(
  '/administradores/:ci',
  authMiddleware.verificarAutenticacion,
  authMiddleware.verificarPermiso('registro de usuarios'),
  administradorController.actualizarParcial
);

//Eliminar administrador (por parte del de seguridad)
router.delete(
  '/administradores/:ci',
  authMiddleware.verificarAutenticacion,
  authMiddleware.verificarPermiso('registro de usuarios'),
  administradorController.eliminar
);

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
