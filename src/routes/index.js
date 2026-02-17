const express = require('express');
const docenteController = require('../controllers/docente.controller');
const estudianteRoutes = require('./estudiante.routes');
const administradorController = require('../controllers/administrador.controller');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// RUTAS PARA ESTUDIANTES
router.use('/estudiantes', estudianteRoutes);

// RUTAS PARA DOCENTES
router.post('/usuarios/registro-docente', docenteController.registrarDocente);
router.get('/usuarios/verificar-ci/:ci', docenteController.verificarCI);
router.get('/usuarios/docentes', docenteController.obtenerDocentes);
router.get('/usuarios/docentes/:ci', docenteController.obtenerDocente);
router.put('/usuarios/docentes/:ci', docenteController.editarDocente);
router.delete('/usuarios/docentes/:ci', docenteController.eliminarDocente);

// RUTAS PARA ADMINISTRADORES
router.post('/administradores/registro', administradorController.registrar);
router.get('/administradores', administradorController.obtenerTodos);
router.patch('/administradores/:ci', administradorController.actualizarParcial);
router.delete('/administradores/:ci', administradorController.eliminar);

//RUTAS PARA AUTENTICACIÓN
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/verificar', authController.verificarToken);
router.get('/auth/permisos', authMiddleware.verificarAutenticacion, authController.obtenerPermisos);

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
