// routes/carrera.routes.js
const express = require('express');
const router = express.Router();
const carreraController = require('../controllers/carrera.controller');

router.post('/carreras', carreraController.crearCarrera);
router.get('/carreras', carreraController.listarCarreras);
router.put('/carreras/:codigo', carreraController.actualizarCarrera);

module.exports = router;