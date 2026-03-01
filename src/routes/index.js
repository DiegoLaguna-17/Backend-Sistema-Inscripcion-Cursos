const express = require('express');
const estudianteRoutes = require('./estudiante.routes');
const docenteRoutes = require('./docentes.routes');
const cursoRoutes = require("./curso.routes");
const administradorController = require('../controllers/administrador.controller');
const carreraRoutes = require('./carrera.routes');
const cursosExtraRoutes = require("./cursoExtracurricular.routes");
const aulaRoutes = require("./aula.routes");
const inscripcionRoutes = require("./inscripcion.routes");
const pagoRoutes = require("./pago.routes");
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/verificar', authController.verificarToken);
router.get('/auth/permisos', authMiddleware.verificarAutenticacion, authController.obtenerPermisos);

router.use('/estudiantes', estudianteRoutes);

router.use('/docentes', docenteRoutes);

router.use("/cursos", cursoRoutes);

router.use("/cursos-extracurriculares", cursosExtraRoutes);

router.use("/inscripcion", inscripcionRoutes);

router.post(
  '/administradores/registro',
  authMiddleware.verificarAutenticacion,
  authMiddleware.verificarPermiso('registro de usuarios'),
  administradorController.registrar
);

router.use('/carreras', carreraRoutes);
router.use("/pagos", pagoRoutes);
router.use('/aulas', aulaRoutes);

router.get(
  '/administradores',
  authMiddleware.verificarAutenticacion,
  authMiddleware.verificarPermiso('registro de usuarios'),
  administradorController.obtenerTodos
);

router.patch(
  '/administradores/:ci',
  authMiddleware.verificarAutenticacion,
  authMiddleware.verificarPermiso('registro de usuarios'),
  administradorController.actualizarParcial
);

router.delete(
  '/administradores/:ci',
  authMiddleware.verificarAutenticacion,
  authMiddleware.verificarPermiso('registro de usuarios'),
  administradorController.eliminar
);

router.get('/test', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;