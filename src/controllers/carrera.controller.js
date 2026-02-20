// controllers/carrera.controller.js
const carreraService = require('../services/carrera.service');

const crearCarrera = (req, res) => {
    try {
        const carrera = carreraService.crearCarrera(req.body);
        res.status(201).json({
            mensaje: 'Carrera creada exitosamente',
            data: carrera
        });
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

const listarCarreras = (req, res) => {
    const carreras = carreraService.listarCarreras();
    res.status(200).json(carreras);
};

const actualizarCarrera = (req, res) => {
    try {
        const { codigo } = req.params;
        const carreraActualizada = carreraService.actualizarCarrera(codigo, req.body);
        res.status(200).json({
            mensaje: 'Carrera actualizada correctamente',
            data: carreraActualizada
        });
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

module.exports = {
    crearCarrera,
    listarCarreras,
    actualizarCarrera
};