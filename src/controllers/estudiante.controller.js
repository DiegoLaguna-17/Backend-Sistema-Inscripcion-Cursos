const service = require("../services/estudiante.service");

async function registrarEstudiante(req, res, next) {
    try {
        const created = await service.createStudent(req.body);
        res.status(201).json({ 
            success: true,
            message: "Registro creado exitosamente", 
            data: created 
        });
    } catch (err) {
        next(err);
    }
}

async function listarEstudiantes(req, res, next) {
    try {
        const students = await service.listStudents();
        res.status(200).json({ 
            success: true,
            message: students.length === 0 ? "No se encontraron registros" : "Datos obtenidos correctamente",
            data: students 
        });
    } catch (err) {
        next(err);
    }
}

async function obtenerEstudiantePorCI(req, res, next) {
    try {
        const student = await service.getStudentByCI(req.params.ci);
        res.status(200).json({ 
            success: true,
            message: "Datos obtenidos correctamente",
            data: student 
        });
    } catch (err) {
        next(err);
    }
}

async function actualizarEstudiante(req, res, next) {
    try {
        const updated = await service.updateStudent(req.params.ci, req.body);
        res.status(200).json({ 
            success: true,
            message: "Registro actualizado correctamente",
            data: updated 
        });
    } catch (err) {
        next(err);
    }
}

async function eliminarEstudiante(req, res, next) {
    try {
        const result = await service.deleteStudent(req.params.ci);
        res.status(200).json({ 
            success: true,
            message: "Registro eliminado correctamente",
            data: result 
        });
    } catch (err) {
        next(err);
    }
}

async function asignarCarrera(req, res, next) {
    try {
        const updated = await service.assignCarrera(req.params.ci, req.body, req.usuario);
        res.status(200).json({ 
            success: true,
            message: "Registro actualizado correctamente",
            data: updated 
        });
    } catch (err) {
        next(err);
    }
}

async function inscribirseCarrera(req, res, next) {
    try {
        const ci = req.usuario.ci; // CI del estudiante autenticado
        const updated = await service.inscribirseCarrera(ci, req.body);
        res.status(201).json({ 
            success: true,
            message: "Registro creado exitosamente",
            data: updated 
        });
    } catch (err) {
        next(err);
    }
}

async function obtenerMiCarrera(req, res, next) {
    try {
        const ci = req.usuario.ci; // CI del estudiante autenticado
        const miCarrera = await service.getMiCarrera(ci);
        res.status(200).json({ 
            success: true,
            message: "Datos obtenidos correctamente",
            data: miCarrera 
        });
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
    asignarCarrera,
    inscribirseCarrera,
    obtenerMiCarrera,
};
