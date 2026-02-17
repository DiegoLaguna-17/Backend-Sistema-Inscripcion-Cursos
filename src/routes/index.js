const { Router } = require("express");
const estudianteRoutes = require("./estudiante.routes");

const router = Router();

router.use("/estudiantes", estudianteRoutes);

module.exports = router;
