const express = require('express');
const docenteController = require('../controllers/docente.controller');
const estudianteRoutes = require('./estudiante.routes');
const administradorController = require('../controllers/administrador.controller');

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

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
