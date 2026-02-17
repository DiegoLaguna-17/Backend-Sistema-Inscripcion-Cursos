const express = require('express');
const estudianteRoutes = require('./estudiante.routes');
const docenteRoutes = require('./docentes.routes');
const authController = require('../controllers/auth.controller');
const { verificarAutenticacion } = require('../middlewares/auth.middleware');

const router = express.Router();

// RUTAS PARA AUTENTICACIÓN
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/verificar', authController.verificarToken);
router.get('/auth/permisos', verificarAutenticacion, authController.obtenerPermisos);

// Rutas para estudiantes (de tu compañera)
router.use('/estudiantes', estudianteRoutes);

// Rutas para docentes (tuyas)
router.use('/docentes', docenteRoutes);

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;