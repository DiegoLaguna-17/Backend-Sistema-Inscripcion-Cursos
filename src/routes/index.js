const express = require('express');
const usuarioController = require('../controllers/estudiante.controller');

const router = express.Router();

// Rutas para usuarios/docentes
router.post('/usuarios/registro-docente', usuarioController.registrarDocente);
router.get('/usuarios/verificar-ci/:ci', usuarioController.verificarCI);
router.get('/usuarios/docentes', usuarioController.obtenerDocentes);
router.get('/usuarios/docentes/:ci', usuarioController.obtenerDocente);
router.put('/usuarios/docentes/:ci', usuarioController.editarDocente);
router.delete('/usuarios/docentes/:ci', usuarioController.eliminarDocente);

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;