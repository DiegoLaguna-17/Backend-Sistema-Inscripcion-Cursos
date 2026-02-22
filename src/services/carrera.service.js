// services/carrera.service.js
const Carrera = require('../models/Carrera');
const  supabase  = require('../config/supabase'); // ejemplo

const crearCarrera = async (data) => {
    const carrera = new Carrera(data);

    // Validación de modelo
    const validacion = carrera.validar();
    if (!validacion.valido) {
        throw {
            status: 400,
            message: 'Errores de validación',
            errors: validacion.errores
        };
    }

    // Validar duplicados
    const { data: existente } = await supabase
        .from('carrera')
        .select('codigo, nombre')
        .or(`codigo.eq.${carrera.codigo},nombre.eq.${carrera.nombre}`);

    if (existente.length > 0) {
        throw {
            status: 409,
            message: 'Ya existe una carrera con el mismo código o nombre'
        };
    }

    // Insertar
    const { data: creada, error } = await supabase
        .from('carrera')
        .insert(carrera.toDatabase())
        .select()
        .single();

    if (error) {
        throw error;
    }

    return creada;
};

const obtenerCarreras = async () => {
    const { data, error } = await supabase
        .from('carrera')
        .select('*');

    if (error) throw error;
    return data;
};

const actualizarCarrera = async (codigo, data) => {
    const carrera = new Carrera(data);

    const validacion = carrera.validar();
    if (!validacion.valido) {
        throw {
            status: 400,
            message: 'Errores de validación',
            errors: validacion.errores
        };
    }

    const { data: actualizada, error } = await supabase
        .from('carrera')
        .update(carrera.toDatabase())
        .eq('codigo', codigo)
        .select()
        .single();

    if (error) throw error;
    return actualizada;
};

module.exports = {
    crearCarrera,
    obtenerCarreras,
    actualizarCarrera
};