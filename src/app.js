const express = require('express');
const cors = require('cors');

// Cargamos las variables de entorno
require('dotenv').config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors()); // Para permitir peticiones desde el frontend

// Importar rutas
const routes = require('./routes/index');

// Usar rutas
app.use('/api', routes);

// Ruta raíz para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend funcionando',
    supabase_conectado: true,
    supabase_url: process.env.SUPABASE_URL ? 'Configurada' : 'No configurada',
    endpoints_disponibles: [
      'POST /api/usuarios/registro-docente',
      'GET /api/usuarios/docentes',
      'GET /api/usuarios/docentes/:ci', 
      'PUT /api/usuarios/docentes/:ci',
      'DELETE /api/usuarios/docentes/:ci',
      'GET /api/usuarios/verificar-ci/:ci',
      'GET /api/roles',
      'GET /api/test'
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`API disponible en: http://localhost:${PORT}/api`);
});
