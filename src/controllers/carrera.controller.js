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

const obtenerCarreraPorCodigo = async (req, res, next) => {
    try {
        const { codigo } = req.params;

        const carrera = await carreraService.obtenerCarreraPorCodigo(codigo)

        res.status(200).json({
            success: true,
            message: 'Datos obtenidos correctamente',
            data: carrera
        });

    } catch (error) {
        next (error);
    }
};

// Obtener solo info de carrera sin materias (para botón "Ver más")
const obtenerCarreraSinMaterias = async (req, res, next) => {
    try {
        const { codigo } = req.params;

        const carrera = await carreraService.obtenerCarreraSinMaterias(codigo);

        res.status(200).json({
            success: true,
            message: 'Datos obtenidos correctamente',
            data: carrera
        });

    } catch (error) {
        next(error);
    }
};

// Obtener materias de una carrera (para botón "Ver materias")
const obtenerMateriasPorCarrera = async (req, res, next) => {
    try {
        const { codigo } = req.params;

        const materias = await carreraService.obtenerMateriasPorCarrera(codigo);

        res.status(200).json({
            success: true,
            message: materias.length === 0 ? 'Esta carrera no tiene materias registradas' : 'Materias obtenidas correctamente',
            data: materias
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    crearCarrera,
    obtenerCarreras,
    actualizarCarrera,
    obtenerCarreraPorCodigo,
    obtenerCarreraSinMaterias,
    obtenerMateriasPorCarrera
};