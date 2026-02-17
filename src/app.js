const express = require("express");
require("dotenv").config();

const routes = require("./routes/index"); 
const { errorMiddleware } = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Backend funcionando",
    supabase_conectado: true,
    supabase_url: process.env.SUPABASE_URL ? "Configurada" : "No configurada",
    instrucciones: 'Usa /api por delante para acceder a las API'
  });
});

// Conexión para los endpoints 
app.use("/api", routes);

// Middleware de manejo de errores de supabase 
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
