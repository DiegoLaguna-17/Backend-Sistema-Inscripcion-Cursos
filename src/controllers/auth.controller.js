const authService = require('../services/auth.service');

class AuthController {
    async login(req, res) {
        try {
            // Extraemos los datos del cuerpo de la petición
            const { correo, password } = req.body;

            if (!correo || !password) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Error de validación',
                    errores: ['El correo y la contraseña son requeridos']
                });
            }

            // Llamamos al servicio de autenticación
            const resultado = await authService.login(correo, password);

            // Respondemos según el resultado
            if (resultado.exito) {
                // Login exitoso
                return res.status(200).json({
                    exito: true,
                    mensaje: resultado.mensaje,
                    data: resultado.data
                });
            } else {
                // Login fallido
                return res.status(401).json({
                    exito: false,
                    mensaje: resultado.mensaje,
                    errores: resultado.errores
                });
            }

        } catch (error) {
            console.error('Error en controlador login:', error);
            return res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                errores: ['Ocurrió un error inesperado']
            });
        }
    }

    /**
     * Obtenemos los permisos del usuario actual
     */
    async obtenerPermisos(req, res) {
        try {
            // El usuario viene del middleware de autenticación
            const { ci } = req.usuario;
            
            const resultado = await authService.obtenerPermisosUsuario(ci);

            if (resultado.exito) {
                return res.status(200).json({
                    exito: true,
                    mensaje: resultado.mensaje,
                    data: resultado.data
                });
            } else {
                return res.status(404).json({
                    exito: false,
                    mensaje: resultado.mensaje,
                    errores: resultado.errores
                });
            }

        } catch (error) {
            console.error('Error en controlador obtenerPermisos:', error);
            return res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                errores: ['Ocurrió un error inesperado']
            });
        }
    }

    /**
     * Verificamos el token para mantener sesión
     */
    async verificarToken(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({
                    exito: false,
                    mensaje: 'No autorizado',
                    errores: ['Token no proporcionado']
                });
            }

            const resultado = await authService.verificarToken(token);

            if (resultado.exito) {
                return res.status(200).json({
                    exito: true,
                    mensaje: resultado.mensaje,
                    data: resultado.data
                });
            } else {
                return res.status(401).json({
                    exito: false,
                    mensaje: resultado.mensaje,
                    errores: resultado.errores
                });
            }

        } catch (error) {
            console.error('Error en controlador verificarToken:', error);
            return res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                errores: ['Ocurrió un error inesperado']
            });
        }
    }

    /**
     * Logout
     * */
    async logout(req, res) {
        try {
            // El logout es solo informativo, el cliente debe eliminar el token
            return res.status(200).json({
                exito: true,
                mensaje: 'Sesión cerrada exitosamente'
            });
        } catch (error) {
            console.error('Error en logout:', error);
            return res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                errores: ['Ocurrió un error inesperado']
            });
        }
    }
}

module.exports = new AuthController();
