const express = require('express');
const docenteController = require('../controllers/docente.controller');
const estudianteRoutes = require('./estudiante.routes');

const router = express.Router();

// Rutas para estudiantes (de tu compañera)
router.use('/estudiantes', estudianteRoutes);

// Rutas para docentes (tuyas)
router.post('/usuarios/registro-docente', docenteController.registrarDocente);
router.get('/usuarios/verificar-ci/:ci', docenteController.verificarCI);
router.get('/usuarios/docentes', docenteController.obtenerDocentes);
router.get('/usuarios/docentes/:ci', docenteController.obtenerDocente);
router.put('/usuarios/docentes/:ci', docenteController.editarDocente);
router.delete('/usuarios/docentes/:ci', docenteController.eliminarDocente);

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;