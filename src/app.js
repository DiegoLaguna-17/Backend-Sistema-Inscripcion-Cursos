const express = require('express');
const cors = require('cors');

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
      'POST /api/usuarios/registro-docente', //Crear nuevo docente
      'GET /api/usuarios/docentes', //consultar docentes activos
      'GET /api/usuarios/docentes/:ci', //consultar docente por CI
      'PUT /api/usuarios/docentes/:ci', //editar docente por CI
      'DELETE /api/usuarios/docentes/:ci', //eliminar docente por CI
      'GET /api/usuarios/verificar-ci/:ci', //verificar si un CI existe
      'GET /api/test' //ruta de prueba para verificar que la API funciona correctamente
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`API disponible en: http://localhost:${PORT}/api`);
});
