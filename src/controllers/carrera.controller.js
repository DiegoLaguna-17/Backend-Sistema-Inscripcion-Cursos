// controllers/carrera.controller.js
const carreraService = require('../services/carrera.service');

const crearCarrera = async (req, res, next) => {
    try {
        const carrera = await carreraService.crearCarrera(req.body);

        res.status(201).json({
            success: true,
            message: 'Registro creado exitosamente',
            data: carrera
        });
    } catch (error) {
        next(error);
    }
};

const obtenerCarreras = async (req, res, next) => {
    try {
        const carreras = await carreraService.obtenerCarreras();

        if (carreras.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No se encontraron registros',
                data: []
            });
        }

        res.status(200).json({
            success: true,
            message: 'Datos obtenidos correctamente',
            data: carreras
        });
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

        res.status(200).json({
            success: true,
            message: 'Registro actualizado correctamente',
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