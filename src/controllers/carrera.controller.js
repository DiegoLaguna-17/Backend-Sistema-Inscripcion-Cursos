// controllers/carrera.controller.js
const carreraService = require('../services/carrera.service');

const crearCarrera = async (req, res, next) => {
    try {
        const carrera = await carreraService.crearCarrera(req.body);
        res.status(201).json({
            message: 'Carrera creada exitosamente',
            data: carrera
        });
    } catch (error) {
        next(error);
    }
};

const obtenerCarreras = async (req, res, next) => {
    try {
        const carreras = await carreraService.obtenerCarreras();
        res.json(carreras);
    } catch (error) {
        next(error);
    }
};

const actualizarCarrera = async (req, res, next) => {
    try {
        const carrera = await carreraService.actualizarCarrera(
            req.params.codigo,
            req.body
        );
        res.json({
            message: 'Carrera actualizada correctamente',
            data: carrera
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    crearCarrera,
    obtenerCarreras,
    actualizarCarrera
};