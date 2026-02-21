// models/Carrera.js
class Carrera {

    constructor(data) {
        this.codigo = data.codigo;
        this.nombre = data.nombre;
        this.descripcion = data.descripcion;
        this.duracion = data.duracion;
    }

    // VALIDACIONES
    validar() {
        const errores = [];

        // Código
        if (!this.codigo || typeof this.codigo !== 'string' || this.codigo.trim() === '') {
            errores.push('El código de la carrera es obligatorio');
        }

        // Nombre
        if (!this.nombre || typeof this.nombre !== 'string' || this.nombre.trim() === '') {
            errores.push('El nombre de la carrera es obligatorio');
        }

        // Duración
        if (!this.duracion || typeof this.duracion !== 'string') {
            errores.push('La duración es obligatoria');
        }

        // Descripción
        if (!this.descripcion || typeof this.descripcion !== 'string') {
            errores.push('La descripción es obligatoria');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    // FORMATO PARA BD
    toDatabase() {
        return {
            codigo: this.codigo,
            nombre: this.nombre,
            descripcion: this.descripcion,
            duracion: this.duracion
        };
    }
}

module.exports = Carrera;