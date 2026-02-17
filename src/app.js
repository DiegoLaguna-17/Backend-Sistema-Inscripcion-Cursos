const express = require('express');

// Cargamos las variables de entorno
require('dotenv').config();

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend funcionando',
    supabase_conectado: true,
    supabase_url: process.env.SUPABASE_URL ? 'Configurada' : 'No configurada'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});