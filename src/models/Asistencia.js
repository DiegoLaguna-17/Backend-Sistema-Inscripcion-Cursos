class Asistencia {

    constructor(data){
        this.id_materia = data.materia_id;
        this.fecha = data.fecha;
        this.asistencias = data.asistencias;
    }

    validar(){
        const errores = [];

        if (!this.id_materia || typeof this.id_materia !== 'string'){
            errores.push('El código de materia es obligatorio');
        }

        if (!this.fecha){
            errores.push('La fecha es obligatoria');
        }

        if (!Array.isArray(this.asistencias) || this.asistencias.length === 0){
            errores.push('Debe enviar la lista de asistencias');
        }

        this.asistencias?.forEach((a, index) => {

            if (!a.ci){
                errores.push(`El CI es obligatorio en el registro ${index}`);
            }

            if (typeof a.estado !== 'boolean'){
                errores.push(`El estado debe ser boolean en el registro ${index}`);
            }

        });

        return {
            valido: errores.length === 0,
            errores
        };
    }

    toDatabase(){

        return this.asistencias.map(a => ({
            materia_id_materia: this.id_materia,
            usuario_ci: a.ci,
            fecha: this.fecha,
            estado: a.estado
        }));

    }
}

module.exports = Asistencia;