// services/carrera.service.js
const Carrera = require('../models/Carrera');

const carreras = [];

const crearCarrera = (data) => {
    // Validaciones obligatorias
    if (!data.nombre || !data.codigo || !data.duracion || !data.descripcion) {
        throw new Error('Todos los campos son obligatorios');
    }

    // Validar unicidad
    const existe = carreras.find(
        c => c.codigo === data.codigo || c.nombre === data.nombre
    );

    if (existe) {
        throw new Error('Ya existe una carrera con el mismo nombre o código');
    }

    const nuevaCarrera = new Carrera(data);
    carreras.push(nuevaCarrera);

    return nuevaCarrera;
};

const listarCarreras = () => {
    return carreras;
};

const actualizarCarrera = (codigo, data) => {
    const index = carreras.findIndex(c => c.codigo === codigo);

    if (index === -1) {
        throw new Error('Carrera no encontrada');
    }

    // Validar duplicados (excepto la misma carrera)
    const duplicado = carreras.find(
        c =>
            (c.codigo === data.codigo || c.nombre === data.nombre) &&
            c.codigo !== codigo
    );

    if (duplicado) {
        throw new Error('El nombre o código ya pertenece a otra carrera');
    }

    carreras[index] = {
        ...carreras[index],
        nombre: data.nombre,
        descripcion: data.descripcion,
        duracion: data.duracion,
        codigo: data.codigo
    };

    return carreras[index];
};

module.exports = {
    crearCarrera,
    listarCarreras,
    actualizarCarrera
};