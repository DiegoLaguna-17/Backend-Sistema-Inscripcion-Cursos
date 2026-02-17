// Importamos el cliente de Supabase
const supabase = require('../config/supabase');
// Importamos el modelo
const Administrador = require('../models/Administrador');

const EncryptUtils = require('../utils/encrypt');

class AdministradorService {
    
    /**
     * -------------------------------------------
     * PARA EL REGISTRO DE NUEVOS ADMINISTRADORES 
     * -------------------------------------------
     * @param {Object} datosAdministrador - Los datos del administrador a registrar
     * @returns {Promise<Object>} - Resultado de la operación
     */
    async registrarAdministrador(datosAdministrador) {
        try {
            // Creamos una instancia del modelo con los datos recibidos
            const nuevoAdmin = new Administrador(datosAdministrador);

            // Validammos los datos usando el modelo
            const validacion = nuevoAdmin.validar();
            if (!validacion.valido) {
                return {
                    exito: false,
                    errores: validacion.errores,
                    mensaje: 'Error de validación'
                };
            }

            // Ver si ya hay un administrador con ese ci porque es nuestra PK
            const { data: existeCi, error: errorCi } = await supabase
                .from('usuario') 
                .select('ci')
                .eq('ci', nuevoAdmin.ci)
                .single();

            if (existeCi) {
                return {
                    exito: false,
                    errores: ['Ya existe un usuario con ese ci'],
                    mensaje: 'Error de validación'
                };
            }

            // Verificamos si ya existe un administrador con ese correo
            const { data: existeCorreo, error: errorCorreo } = await supabase
                .from('usuario')
                .select('correo')
                .eq('correo', nuevoAdmin.correo)
                .single();

            if (existeCorreo) {
                return {
                    exito: false,
                    errores: ['Ya existe un usuario con ese correo electrónico'],
                    mensaje: 'Error de validación'
                };
            }

            //Hasheamos la contraseña
            try {
                const passwordHasheada = await EncryptUtils.hashPassword(nuevoAdmin.contrasenia);
                nuevoAdmin.contrasenia = passwordHasheada; // Reemplazar con el hash
            } catch (error) {
                console.error('Error al hashear contraseña:', error);
                return {
                    exito: false,
                    errores: ['Error al procesar la contraseña'],
                    mensaje: 'Error en el registro'
                };
            }

            // Preparamos los datos para insertar
            const datosParaInsertar = nuevoAdmin.toDatabase();

            // Insertamos en la base de datos
            const { data, error } = await supabase
                .from('usuario')
                .insert([datosParaInsertar])
                .select(); // Para ver el registro insertado en la BD

            // Manejaomos errores de la base de datos
            if (error) {
                console.error('Error al insertar en Supabase:', error);
                return {
                    exito: false,
                    errores: ['Error en la base de datos: ' + error.message],
                    mensaje: 'Error al registrar administrador'
                };
            }

            // Devolvemoa los datos insertados si todo salió bien sin la contraseña hasheada
            const respuestaData = { ...data[0] };
            delete respuestaData.contrasenia;

            return {
                exito: true,
                data: data[0], // Supabase devuelve un array con los registros insertados
                mensaje: 'Administrador registrado exitosamente'
            };

        } catch (error) {
            // Capturar los errores inesperados
            console.error('Error inesperado en registrarAdministrador:', error);
            return {
                exito: false,
                errores: ['Error interno del servidor'],
                mensaje: 'Error al procesar la solicitud'
            };
        }
    }

    /**
     * --------------------------------------
     * PARA OBTENER TODOS LOS ADMINISTRADORES
     * --------------------------------------
     * @returns {Promise<Object>} - Lista de administradores
     */
    async obtenerAdministradores() {
        try {
            // Consultamos todos los usuarios con el rol de admin (1)
            const { data, error } = await supabase
                .from('usuario')
                .select(`
                    ci,
                    rol_id_rol,
                    nombre,
                    telefono,
                    fecha_nac,
                    direccion,
                    correo,
                    estado
                `)
                .eq('rol_id_rol', 1)  // Filtramos por administradores
                .eq('estado', true) // Solo mostramos los activos

            // Manejamos errores de la base de datos
            if (error) {
                console.error('Error al obtener administradores:', error);
                return {
                    exito: false,
                    errores: ['Error al consultar la base de datos'],
                    mensaje: 'Error al obtener administradores'
                };
            }

            // Verificamos si hay resultados
            if (!data || data.length === 0) {
                return {
                    exito: true,
                    data: [],
                    mensaje: 'No hay administradores registrados'
                };
            }

            // Si todo sale bien devolvemos los datos
            return {
                exito: true,
                data: data,
                mensaje: 'Administradores obtenidos exitosamente',
                total: data.length
            };

        } catch (error) {
            console.error('Error inesperado en obtenerAdministradores:', error);
            return {
                exito: false,
                errores: ['Error interno del servidor'],
                mensaje: 'Error al procesar la solicitud'
            };
        }
    }

    /**
     * -----------------------------------------
     * ACTUALIZAMOS LOS DATOS DEL ADMINISTRADOR (solo contrasenia, telefono y direccion)
     * -----------------------------------------
     * @param {string} ci - Cédula del administrador a actualizar
     * @param {Object} datosActualizar - Objeto con los campos a actualizar
     * @returns {Promise<Object>} - Resultado de la operación
     */
    async actualizarAdministrador(ci, datosActualizar) {
        try {
            // Validamos que la cédula no esté vacía
            if (!ci || typeof ci !== 'string' || ci.trim() === '') {
                return {
                    exito: false,
                    errores: ['La cédula es requerida'],
                    mensaje: 'Error de validación'
                };
            }

            // Verificamos que el administrador existe y es administrador
            const { data: adminExistente, error: errorExistente } = await supabase
                .from('usuario')
                .select('ci, rol_id_rol')
                .eq('ci', ci)
                .eq('rol_id_rol', 1)
                .single();

            if (errorExistente || !adminExistente) {
                return {
                    exito: false,
                    errores: ['No se encontró un administrador con esa cédula'],
                    mensaje: 'Administrador no encontrado'
                };
            }

            // Definimos los campos que se pueden actualizar
            const camposPermitidos = ['contrasenia', 'telefono', 'direccion'];
            
            // Filtramos solo los campos permitidos que vienen en la petición
            const datosFiltrados = {};
            const camposRecibidos = Object.keys(datosActualizar);
            
            camposRecibidos.forEach(campo => {
                if (camposPermitidos.includes(campo)) {
                    // Si el campo es permitido, lo agregamos a los datos a actualizar
                    datosFiltrados[campo] = datosActualizar[campo];
                }
            });

            // Validamos que haya al menos un campo para actualizar
            if (Object.keys(datosFiltrados).length === 0) {
                return {
                    exito: false,
                    errores: ['No se enviaron campos válidos para actualizar. Los campos permitidos son: contraseña, teléfono, dirección'],
                    mensaje: 'Error de validación'
                };
            }

            // Validamos cada uno de los campos enviados que se van a actualozar
            const erroresValidacion = [];

            // Validar contraseña
            if (datosFiltrados.hasOwnProperty('contrasenia')) {
                // Validar fortaleza de la nueva contraseña
                const validacionPassword = EncryptUtils.validarFortalezaPassword(datosFiltrados.contrasenia);
                if (!validacionPassword.valida) {
                    erroresValidacion.push(...validacionPassword.errores);
                } else {
                    // HASHEAR LA NUEVA CONTRASEÑA
                    try {
                        const passwordHasheada = await EncryptUtils.hashPassword(datosFiltrados.contrasenia);
                        datosFiltrados.contrasenia = passwordHasheada;
                    } catch (error) {
                        erroresValidacion.push('Error al procesar la nueva contraseña');
                    }
                }
            }

            // Validar teléfono
            if (datosFiltrados.hasOwnProperty('telefono')) {
                if (datosFiltrados.telefono && typeof datosFiltrados.telefono !== 'string') {
                    erroresValidacion.push('El teléfono debe ser texto');
                }
                // Si es null o undefined, lo dejamos como null en la BD
                if (datosFiltrados.telefono === '') {
                    datosFiltrados.telefono = null;
                }
            }

            // Validar dirección
            if (datosFiltrados.hasOwnProperty('direccion')) {
                if (datosFiltrados.direccion && typeof datosFiltrados.direccion !== 'string') {
                    erroresValidacion.push('La dirección debe ser texto');
                }
                // Si es null o undefined, lo dejamos como null en la BD
                if (datosFiltrados.direccion === '') {
                    datosFiltrados.direccion = null;
                }
            }

            // Si hay errores de validación los devolvemos
            if (erroresValidacion.length > 0) {
                return {
                    exito: false,
                    errores: erroresValidacion,
                    mensaje: 'Error de validación'
                };
            }

            // Realizamos la actualización en la base de datos
            const { data, error } = await supabase
                .from('usuario')
                .update(datosFiltrados)
                .eq('ci', ci)
                .eq('rol_id_rol', 1) // Solo actualizar si es administrador
                .select(); // Devolvemos el registro actualizado

            // Manejamos errores de la base de datos
            if (error) {
                console.error('Error al actualizar en Supabase:', error);
                return {
                    exito: false,
                    errores: ['Error en la base de datos: ' + error.message],
                    mensaje: 'Error al actualizar administrador'
                };
            }

            // Si los datos se actualizaron correctamente sin la contraseña
            const respuestaData = { ...data[0] };
            delete respuestaData.contrasenia;

            return {
                exito: true,
                data: data[0],
                mensaje: 'Administrador actualizado exitosamente',
                camposActualizados: Object.keys(datosFiltrados)
            };

        } catch (error) {
            console.error('Error inesperado en actualizarAdministrador:', error);
            return {
                exito: false,
                errores: ['Error interno del servidor'],
                mensaje: 'Error al procesar la solicitud'
            };
        }
    }

    /**
     * --------------------------------------
     * ELIMINACIÓN LÓGICA DE UN ADMINISTRADOR (cambiamos el estado a FALSE)
     * --------------------------------------
     * @param {string} ci - Cédula del administrador a eliminar lógicamente
     * @returns {Promise<Object>} - Resultado de la operación
     */
    async eliminarAdministrador(ci) {
        try {
            // Validamos que el ci no esté vacía
            if (!ci || typeof ci !== 'string' || ci.trim() === '') {
                return {
                    exito: false,
                    errores: ['La cédula es requerida'],
                    mensaje: 'Error de validación'
                };
            }

            // Verificamos que el administrador existe y esta activo
            const { data: adminExistente, error: errorExistente } = await supabase
                .from('usuario')
                .select('ci, nombre, estado')
                .eq('ci', ci)
                .eq('rol_id_rol', 1)
                .single();

            if (errorExistente || !adminExistente) {
                return {
                    exito: false,
                    errores: ['No se encontró un administrador con esa cédula'],
                    mensaje: 'Administrador no encontrado'
                };
            }

            // Verificamos si ya está inactivo
            if (adminExistente.estado === false) {
                return {
                    exito: false,
                    errores: ['El administrador ya se encuentra inactivo'],
                    mensaje: 'Operación no permitida'
                };
            }

            // Realizamos la eliminación lógica
            const { data, error } = await supabase
                .from('usuario')
                .update({ estado: false })
                .eq('ci', ci)
                .eq('rol_id_rol', 1) 
                .select(); // Devuelve el registro actualizado

            // Manejamos errores de la base de datos
            if (error) {
                console.error('Error al eliminar administrador:', error);
                return {
                    exito: false,
                    errores: ['Error en la base de datos: ' + error.message],
                    mensaje: 'Error al eliminar administrador'
                };
            }

            // Si todo slae bien    
            return {
                exito: true,
                data: data[0],
                mensaje: `Administrador ${adminExistente.nombre} ha sido desactivado exitosamente`,
                detalles: {
                    ci: ci,
                    estado_anterior: true,
                    estado_nuevo: false
                }
            };

        } catch (error) {
            console.error('Error inesperado en eliminarAdministrador:', error);
            return {
                exito: false,
                errores: ['Error interno del servidor'],
                mensaje: 'Error al procesar la solicitud'
            };
        }
    }
}

module.exports = new AdministradorService();
