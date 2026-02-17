const EncryptUtils = require('../utils/encrypt');
class Administrador {

    //DEFINIMOS LA ESTRUCTURA DE LOS DATOS QUE DEBEMOS RECIBIR
    constructor(data) {
        this.ci = data.ci;
        this.rol_id_rol = data.rol_id_rol || 1; // Por defecto 1 porque es un administrador
        this.nombre = data.nombre;
        this.correo = data.correo;
        this.telefono = data.telefono;
        this.contrasenia = data.contrasenia;
        this.fecha_nac = data.fecha_nac;
        this.direccion = data.direccion;
    }

    //VALIDAMOS LOS DATOS QUE NOS LLEGARON
    validar() {
        const errores = [];

        // Validación del ci
        if (!this.ci || typeof this.ci !== 'string' || this.ci.trim() === '') {
            errores.push('La cédula es requerida y debe ser texto');
        }

        // Validación de rol 
        if (this.rol_id_rol !== 1) {
            errores.push('El rol debe ser 1 (administrador)');
        }

        // Validación de nombre
        if (!this.nombre || typeof this.nombre !== 'string' || this.nombre.trim() === '') {
            errores.push('El nombre es requerido y debe ser texto');
        }

        // Validación de correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!this.correo || !emailRegex.test(this.correo)) {
            errores.push('El correo electrónico no es válido');
        }

        // Validación de teléfono
        if (this.telefono && typeof this.telefono !== 'string') {
            errores.push('El teléfono debe ser texto');
        }

        // Validación de contraseña
        if (!this.contrasenia) {
            errores.push('La contraseña es requerida');
        } else {
            // Validar fortaleza de la contraseña
            const validacionPassword = EncryptUtils.validarFortalezaPassword(this.contrasenia);
            if (!validacionPassword.valida) {
                errores.push(...validacionPassword.errores);
            }
        }

        // Validación de fecha de nacimiento
        if (!this.fecha_nac) {
            errores.push('La fecha de nacimiento es requerida');
        } else {
            // Verificar que sea una fecha válida
            const fecha = new Date(this.fecha_nac);
            if (isNaN(fecha.getTime())) {
                errores.push('La fecha de nacimiento no es válida');
            }
        }

        // Validación de dirección
        if (this.direccion && typeof this.direccion !== 'string') {
            errores.push('La dirección debe ser texto');
        }

        return {
            valido: errores.length === 0,
            errores: errores
        };
    }

    //PREPARAMOS DATOS PARA INSERTAR
    toDatabase() {
        return {
            ci: this.ci,
            rol_id_rol: this.rol_id_rol,
            nombre: this.nombre,
            correo: this.correo,
            telefono: this.telefono,
            contrasenia: this.contrasenia, 
            fecha_nac: this.fecha_nac,
            direccion: this.direccion
        };
    }
}

module.exports = Administrador;
