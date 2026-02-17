const JwtUtils = require('../utils/jwt');

/**
 * Middleware para verificar que el usuario está autenticado
 */
const verificarAutenticacion = (req, res, next) => {
    return JwtUtils.verificarTokenMiddleware(req, res, next);
};

/**
 * Middleware para verificar que el usuario tiene un rol específico
 * @param {Array} rolesPermitidos - Array de IDs de roles permitidos
 */
const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        // Primero verificamos que esté autenticado
        if (!req.usuario) {
            return res.status(401).json({
                exito: false,
                mensaje: 'No autorizado',
                errores: ['Usuario no autenticado']
            });
        }

        // Verificamos que el rol del usuario esté en los permitidos
        const rolUsuario = req.usuario.rol?.id || req.usuario.rol;
        
        if (!rolesPermitidos.includes(rolUsuario)) {
            return res.status(403).json({
                exito: false,
                mensaje: 'Acceso prohibido',
                errores: ['No tiene permisos suficientes para esta operación']
            });
        }

        next();
    };
};

/**
 * Middleware para verificar que el usuario tiene un permiso específico
 * @param {string} permiso - Permiso requerido (ej: "crear carreras")
 */
const verificarPermiso = (permiso) => {
    return async (req, res, next) => {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    exito: false,
                    mensaje: 'No autorizado',
                    errores: ['Usuario no autenticado']
                });
            }

            // Obtener permisos del usuario desde la base de datos
            const supabase = require('../config/supabase');
            
            const { data, error } = await supabase
                .from('usuario')
                .select('rol:rol_id_rol(accesos)')
                .eq('ci', req.usuario.ci)
                .single();

            if (error || !data) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'Acceso prohibido',
                    errores: ['No se pudieron verificar los permisos']
                });
            }

            const accesos = data.rol.accesos || '';
            const permisos = accesos.split(',').map(p => p.trim());

            if (!permisos.includes(permiso)) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'Acceso prohibido',
                    errores: [`No tiene el permiso requerido: ${permiso}`]
                });
            }

            next();

        } catch (error) {
            console.error('Error al verificar permiso:', error);
            return res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                errores: ['Error al verificar permisos']
            });
        }
    };
};

module.exports = {
    verificarAutenticacion,
    verificarRol,
    verificarPermiso
};
