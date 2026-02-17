const { Router } = require("express");
const estudianteRoutes = require("./estudiante.routes");
const administradorController = require('../controllers/administrador.controller');

const router = Router();

//RUTAS PARA ESTUDIANTES
router.use("/estudiantes", estudianteRoutes);

// RUTAS PARA ADMINISTARDORES
//Para registrar un nuevo administrador
router.post('/administradores/registro', administradorController.registrar);
//Para listar todos los administardores
router.get('/administradores', administradorController.obtenerTodos);
//Para actualziar la información de un administardor 
router.patch('/administradores/:ci', administradorController.actualizarParcial);
//Para eliminar logicamente a un administardor
router.delete('/administradores/:ci', administradorController.eliminar);

module.exports = router;
