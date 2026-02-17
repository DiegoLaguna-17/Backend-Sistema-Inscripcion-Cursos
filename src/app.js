const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes/index');
const { errorMiddleware } = require('./middlewares/error.middleware');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend funcionando',
    supabase_conectado: true,
    supabase_url: process.env.SUPABASE_URL ? 'Configurada' : 'No configurada'
  });
});

// Conexión para los endpoints 
app.use('/api', routes);

// Middleware de manejo de errores
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`API disponible en: http://localhost:${PORT}/api`);
});
