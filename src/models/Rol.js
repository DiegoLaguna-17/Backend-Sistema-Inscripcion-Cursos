class Rol {
    constructor(data) {
        this.id_rol = data.id_rol;
        this.nombre = data.nombre;
        this.accesos = data.accesos;
    }

    /**
     * Convierte el string de accesos en un array
     * @returns {Array} - Array de permisos
     */
    getAccesosArray() {
        if (!this.accesos) return [];
        return this.accesos.split(',').map(acceso => acceso.trim());
    }

    /**
     * Verifica si el rol tiene un permiso específico
     * @param {string} permiso - Permiso a verificar
     * @returns {boolean} - True si tiene el permiso
     */
    tienePermiso(permiso) {
        const accesosArray = this.getAccesosArray();
        return accesosArray.includes(permiso);
    }
}

module.exports = Rol;
