const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

class JwtUtils {
    
    /**
     * Generar token JWT
     * @param {Object} usuario - Datos del usuario
     */
    static generarToken(usuario) {
        try {
            const payload = {
                ci: usuario.ci,
                correo: usuario.correo,
                nombre: usuario.nombre,
                rol: usuario.rol  // Guardamos el objeto rol completo
            };

            const token = jwt.sign(payload, JWT_SECRET, {
                expiresIn: JWT_EXPIRES_IN
            });

            return token;

        } catch (error) {
            console.error('Error al generar token:', error);
            throw new Error('Error al generar token de autenticación');
        }
    }

    /**
     * Verificamos el token JWT
     */
    static verificarToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return decoded;
        } catch (error) {
            console.error('Error al verificar token:', error);
            return null;
        }
    }

    /**
     * Middleware para verificar token
     */
    static verificarTokenMiddleware(req, res, next) {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                exito: false,
                mensaje: 'No autorizado',
                errores: ['Token no proporcionado']
            });
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                exito: false,
                mensaje: 'No autorizado',
                errores: ['Formato de token inválido']
            });
        }

        const decoded = JwtUtils.verificarToken(token);
        
        if (!decoded) {
            return res.status(401).json({
                exito: false,
                mensaje: 'No autorizado',
                errores: ['Token inválido o expirado']
            });
        }

        // Guardamos toda la información del token en el request
        req.usuario = decoded;
        next();
    }
}

module.exports = JwtUtils;
