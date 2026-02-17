const express = require('express');
const estudianteRoutes = require('./estudiante.routes');
const docenteRoutes = require('./docentes.routes');
const administradorController = require('../controllers/administrador.controller');
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

// RUTAS PARA ADMINISTRADORES
router.post('/administradores/registro', administradorController.registrar);
router.get('/administradores', administradorController.obtenerTodos);
router.patch('/administradores/:ci', administradorController.actualizarParcial);
router.delete('/administradores/:ci', administradorController.eliminar);

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
