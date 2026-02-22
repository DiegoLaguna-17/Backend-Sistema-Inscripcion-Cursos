// services/carrera.service.js
const Carrera = require('../models/Carrera');
const supabase = require('../config/supabase');

const crearCarrera = async (data) => {
    const carrera = new Carrera(data);

    const validacion = carrera.validar();
    if (!validacion.valido) {
        throw {
            status: 422,
            message: 'Error de validación en los datos enviados',
            errors: validacion.errores
        };
    }

    // Verificar duplicados
    const { data: existente } = await supabase
        .from('carrera')
        .select('codigo, nombre')
        .or(`codigo.eq.${carrera.codigo},nombre.eq.${carrera.nombre}`);

    if (existente && existente.length > 0) {
        throw {
            status: 409,
            message: 'El registro ya existe en el sistema'
        };
    }

    const { data: creada, error } = await supabase
        .from('carrera')
        .insert(carrera.toDatabase())
        .select()
        .single();

    if (error) throw error;

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
            status: 422,
            message: 'Datos inválidos para la actualización',
            errors: validacion.errores
        };
    }

    // Verificar existencia
    const { data: existente } = await supabase
        .from('carrera')
        .select('*')
        .eq('codigo', codigo)
        .single();

    if (!existente) {
        throw {
            status: 404,
            message: 'No se puede actualizar: el registro no existe'
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