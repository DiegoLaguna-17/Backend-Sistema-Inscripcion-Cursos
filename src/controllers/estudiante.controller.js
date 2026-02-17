const service = require("../services/estudiante.service");

async function registrarEstudiante(req, res, next) {
    try {
        const created = await service.createStudent(req.body);
        res.status(201).json({ message: "Estudiante registrado", student: created });
    } catch (err) {
        next(err);
    }
}

async function listarEstudiantes(req, res, next) {
    try {
        const students = await service.listStudents();
        res.json({ students });
    } catch (err) {
        next(err);
    }
}

async function obtenerEstudiantePorCI(req, res, next) {
    try {
        const student = await service.getStudentByCI(req.params.ci);
        res.json({ student });
    } catch (err) {
        next(err);
    }
}

async function actualizarEstudiante(req, res, next) {
    try {
        const updated = await service.updateStudent(req.params.ci, req.body);
        res.json({ message: "Estudiante actualizado", student: updated });
    } catch (err) {
        next(err);
    }
}

async function eliminarEstudiante(req, res, next) {
    try {
        const result = await service.deleteStudent(req.params.ci);
        res.json({ message: "Estudiante eliminado", ...result });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    registrarEstudiante,
    listarEstudiantes,
    obtenerEstudiantePorCI,
    actualizarEstudiante,
    eliminarEstudiante,
};
