const { createClient } = require('@supabase/supabase-js');

// Cargamos las variables de entorno
require('dotenv').config();

// Obtenemos las credenciales de las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Verificamos que las credenciales existan
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las credenciales de Supabase. Verifica tu archivo .env');
}

// Crear y exportar el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;