const { Router } = require("express");
const controller = require("../controllers/certificate.controller");
const {
  verificarAutenticacion,
  verificarRol,
} = require("../middlewares/auth.middleware");

const router = Router();

router.post(
  "/enviar-lote",
  verificarAutenticacion,
  verificarRol([2]),
  controller.generarCertificados,
);

module.exports = router;
