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

const obtenerCarreraPorCodigo = async (codigo) => {
    //Buscar carrera + materias relacionadas
    const { data, error} = await supabase
        .from('carrera')
        .select(`
            codigo,
            nombre,
            descripcion,
            duracion,
            materias: materia (
                id_materia,
                usuario_ci,
                carrera_codigo,
                nombre,
                tipo,
                cupo,
                dia,
                hora_inicio,
                hora_fin,
                fecha_inicio,
                fecha_fin,
                monto,
                aula_id_aula,
                aula:aula_id_aula ( id_aula, nombre )
            )
        `)
        .eq('codigo', codigo)
        .single();
    if (error && error.code === 'PRRST116'){
        throw {
          status: 404,
        message: 'No se encontró la carrera solicitada'  
        };
    }
    
    if (error) {
        throw error;
    }

    return data;
};

// Obtener solo información de la carrera (sin materias) - Para "Ver más"
const obtenerCarreraSinMaterias = async (codigo) => {
    const { data, error } = await supabase
        .from('carrera')
        .select('codigo, nombre, descripcion, duracion')
        .eq('codigo', codigo)
        .single();
    
    if (error && error.code === 'PGRST116') {
        throw {
            status: 404,
            message: 'No se encontró la carrera solicitada'
        };
    }
    
    if (error) {
        throw error;
    }

    return data;
};

// Obtener solo las materias de una carrera - Para "Ver materias"
const obtenerMateriasPorCarrera = async (codigo) => {
    // Primero verificar que la carrera existe
    const { data: carrera, error: errorCarrera } = await supabase
        .from('carrera')
        .select('codigo')
        .eq('codigo', codigo)
        .single();

    if (errorCarrera && errorCarrera.code === 'PGRST116') {
        throw {
            status: 404,
            message: 'No se encontró la carrera solicitada'
        };
    }

    if (errorCarrera) {
        throw errorCarrera;
    }

    // Obtener materias de la carrera
    const { data, error } = await supabase
        .from('materia')
        .select(`
            id_materia,
            usuario_ci,
            carrera_codigo,
            nombre,
            tipo,
            cupo,
            dia,
            hora_inicio,
            hora_fin,
            fecha_inicio,
            fecha_fin,
            monto,
            aula_id_aula,
            aula:aula_id_aula ( id_aula, nombre )
        `)
        .eq('carrera_codigo', codigo);

    if (error) {
        throw error;
    }

    return data;
};

module.exports = {
    crearCarrera,
    obtenerCarreras,
    actualizarCarrera,
    obtenerCarreraPorCodigo,
    obtenerCarreraSinMaterias,
    obtenerMateriasPorCarrera
};