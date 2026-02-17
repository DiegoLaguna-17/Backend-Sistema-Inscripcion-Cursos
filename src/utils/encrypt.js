const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

class EncryptUtils {
    
    /**
     * Hashear una contraseña
     * @param {string} password - Contraseña en texto plano
     * @returns {Promise<string>} - Contraseña hasheada
     */
    static async hashPassword(password) {
        try {
            if (!password) {
                throw new Error('La contraseña es requerida');
            }
            
            // Generar el hash
            const hash = await bcrypt.hash(password, SALT_ROUNDS);
            return hash;
            
        } catch (error) {
            console.error('Error al hashear contraseña:', error);
            throw new Error('Error al procesar la contraseña');
        }
    }

    /**
     * Comparar una contraseña en texto plano con un hash
     * @param {string} password - Contraseña en texto plano
     * @param {string} hash - Hash almacenado
     * @returns {Promise<boolean>} - True si coinciden
     */
    static async comparePassword(password, hash) {
        try {
            if (!password || !hash) {
                return false;
            }
            
            // Comparar la contraseña con el hash
            const coincide = await bcrypt.compare(password, hash);
            return coincide;
            
        } catch (error) {
            console.error('Error al comparar contraseñas:', error);
            return false;
        }
    }

    /**
     * Validar fortaleza de la contraseña
     * @param {string} password - Contraseña a validar
     * @returns {Object} - Resultado de la validación
     */
    static validarFortalezaPassword(password) {
        const errores = [];
        
        if (!password) {
            errores.push('La contraseña es requerida');
            return { valida: false, errores };
        }
        
        if (password.length < 6) {
            errores.push('La contraseña debe tener al menos 6 caracteres');
        }
        
        if (!/[A-Z]/.test(password)) {
            errores.push('La contraseña debe contener al menos una letra mayúscula');
        }
        
        if (!/[a-z]/.test(password)) {
            errores.push('La contraseña debe contener al menos una letra minúscula');
        }
        
        if (!/[0-9]/.test(password)) {
            errores.push('La contraseña debe contener al menos un número');
        }
        
        if (!/[!@#$%^&*]/.test(password)) {
            errores.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*)');
        }
        
        return {
            valida: errores.length === 0,
            errores
        };
    }
}

module.exports = EncryptUtils;
