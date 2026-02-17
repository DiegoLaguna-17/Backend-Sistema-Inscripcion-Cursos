const supabase = require('../config/supabase');
const EncryptUtils = require('../utils/encrypt');
const JwtUtils = require('../utils/jwt');
const Rol = require('../models/Rol');

class AuthService {
    
    /**
     * @param {string} correo - Correo del usuario
     * @param {string} password - Contraseña en texto plano
     * @returns {Promise<Object>} - Resultado del login con datos del usuario y rol
     */
    async login(correo, password) {
        try {
            // Validamos los datos de entrada
            if (!correo || !password) {
                return {
                    exito: false,
                    errores: ['El correo y la contraseña son requeridos'],
                    mensaje: 'Error de validación'
                };
            }

            // Buscamos al usuario por correo

            const { data: usuario, error } = await supabase
                .from('usuario')
                .select(`
                    ci,
                    nombre,
                    correo,
                    telefono,
                    contrasenia,
                    fecha_nac,
                    direccion,
                    experiencia,
                    estado,
                    rol_id_rol,
                    rol:rol_id_rol (
                        id_rol,
                        rol,
                        accesos
                    )
                `)
                .eq('correo', correo)
                .maybeSingle();


            if (error) {
                console.error('Error en la consulta:', error);
                return {
                    exito: false,
                    errores: ['Error en la base de datos'],
                    mensaje: 'Autenticación fallida'
                };
            }

            if (!usuario) {
                console.log('Usuario no encontrado');
                return {
                    exito: false,
                    errores: ['Credenciales inválidas'],
                    mensaje: 'Autenticación fallida'
                };
            }

            // Verificamos si el usuario está activo
            if (!usuario.estado) {
                console.log('Usuario inactivo');
                return {
                    exito: false,
                    errores: ['Credenciales inválidas'],
                    mensaje: 'Autenticación fallida'
                };
            }

            // Verificamos la contraseña
            const passwordValida = await EncryptUtils.comparePassword(password, usuario.contrasenia);

            if (!passwordValida) {
                console.log('Contraseña incorrecta');
                // Registramos el intento fallido
                await this.registrarIntento(correo, false, 'Contraseña incorrecta');
                return {
                    exito: false,
                    errores: ['Credenciales inválidas'],
                    mensaje: 'Autenticación fallida'
                };
            }

            // Verificamos que tenemos los datos del rol
            if (!usuario.rol) {
                console.error('No se encontraron datos del rol');
                return {
                    exito: false,
                    errores: ['Error en la configuración del usuario'],
                    mensaje: 'Autenticación fallida'
                };
            }

            const rol = new Rol({
                id_rol: usuario.rol.id_rol,
                nombre: usuario.rol.rol,
                accesos: usuario.rol.accesos
            });

            // Obtener los accesos como array
            const accesosArray = rol.getAccesosArray();

            // Preparamos los datos del usuario (sin contraseña)
            const usuarioSinPassword = {
                ci: usuario.ci,
                nombre: usuario.nombre,
                correo: usuario.correo,
                telefono: usuario.telefono,
                fecha_nac: usuario.fecha_nac,
                direccion: usuario.direccion,
                experiencia: usuario.experiencia,  
                rol: {
                    id: rol.id_rol,
                    nombre: rol.nombre,
                    accesos: accesosArray
                }
            };

            // Generamos el token JWT con información del rol
            const token = JwtUtils.generarToken({
                ci: usuario.ci,
                correo: usuario.correo,
                nombre: usuario.nombre,
                rol: {
                    id: rol.id_rol,
                    nombre: rol.nombre
                }
            });

            // Registramos el intento exitoso
            await this.registrarIntento(correo, true, 'Login exitoso');

            // Damos una respuesta completa 
            return {
                exito: true,
                mensaje: 'Login exitoso',
                data: {
                    usuario: usuarioSinPassword,
                    token: token,
                    expira_en: '24 horas'
                }
            };

        } catch (error) {
            console.error('Error inesperado en login:', error);
            await this.registrarIntento(correo, false, error.message);
            
            return {
                exito: false,
                errores: ['Error interno del servidor'],
                mensaje: 'Error al procesar la solicitud'
            };
        }
    }

    /**
     * Registrar intentos de login (para auditoría)
     */
    async registrarIntento(identificador, exitoso, detalle = '') {
        try {
            console.log(`[LOGIN] ${new Date().toISOString()}`);
            console.log(`  Usuario: ${identificador}`);
            console.log(`  Exitoso: ${exitoso ? 'SÍ' : 'NO'}`);
            if (detalle) console.log(`  Detalle: ${detalle}`);
            
            // Aquí podrías guardar en una tabla de auditoría si lo deseas
            
        } catch (error) {
            console.error('Error al registrar intento:', error);
        }
    }

    /**
     * Obtenemos los permisos de un usuario
     */
    async obtenerPermisosUsuario(ci) {
        try {
            const { data, error } = await supabase
                .from('usuario')
                .select(`
                    rol:rol_id_rol (
                        id_rol,
                        rol,
                        accesos
                    )
                `)
                .eq('ci', ci)
                .single();

            if (error || !data) {
                return {
                    exito: false,
                    errores: ['Usuario no encontrado'],
                    mensaje: 'Error al obtener permisos'
                };
            }

            const rol = new Rol({
                id_rol: data.rol.id_rol,
                nombre: data.rol.rol,
                accesos: data.rol.accesos
            });
            
            return {
                exito: true,
                data: {
                    rol: {
                        id: rol.id_rol,
                        nombre: rol.nombre,
                        accesos: rol.getAccesosArray()
                    }
                },
                mensaje: 'Permisos obtenidos exitosamente'
            };

        } catch (error) {
            console.error('Error al obtener permisos:', error);
            return {
                exito: false,
                errores: ['Error interno del servidor'],
                mensaje: 'Error al obtener permisos'
            };
        }
    }

    /**
     * Verificamos el token y obtenemos los datos actualizados
     */
    async verificarToken(token) {
        try {
            // Verificamos el token
            const decoded = JwtUtils.verificarToken(token);
            
            if (!decoded) {
                return {
                    exito: false,
                    errores: ['Token inválido o expirado'],
                    mensaje: 'No autorizado'
                };
            }

            // Verificamos que el usuario sigue activo y obtenemos datos actualizados
            const { data: usuario, error } = await supabase
                .from('usuario')
                .select(`
                    ci,
                    nombre,
                    correo,
                    telefono,
                    fecha_nac,
                    direccion,
                    experiencia,
                    estado,
                    rol:rol_id_rol (
                        id_rol,
                        rol,
                        accesos
                    )
                `)
                .eq('ci', decoded.ci)
                .single();

            if (error || !usuario || !usuario.estado) {
                return {
                    exito: false,
                    errores: ['Usuario no activo o no encontrado'],
                    mensaje: 'No autorizado'
                };
            }

            // Procesamos el rol y permisos
            const rol = new Rol({
                id_rol: usuario.rol.id_rol,
                nombre: usuario.rol.rol,
                accesos: usuario.rol.accesos
            });
            
            // Preparamos respuesta
            const usuarioData = {
                ci: usuario.ci,
                nombre: usuario.nombre,
                correo: usuario.correo,
                telefono: usuario.telefono,
                fecha_nac: usuario.fecha_nac,
                direccion: usuario.direccion,
                experiencia: usuario.experiencia,
                rol: {
                    id: rol.id_rol,
                    nombre: rol.nombre,
                    accesos: rol.getAccesosArray()
                }
            };

            return {
                exito: true,
                mensaje: 'Token válido',
                data: usuarioData
            };

        } catch (error) {
            console.error('Error al verificar token:', error);
            return {
                exito: false,
                errores: ['Error al verificar token'],
                mensaje: 'Error interno del servidor'
            };
        }
    }
}

module.exports = new AuthService();

