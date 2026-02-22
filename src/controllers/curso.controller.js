const service = require("../services/curso.service");

function ok(res, message, data, status = 200) {
    return res.status(status).json({ success: true, message, data });
}

function fail(res, message, data = null, status = 400) {
    return res.status(status).json({ success: false, message, data });
}

async function crearCurso(req, res) {
    try {
        const created = await service.crearCurso(req.body);
        return ok(res, "Registro creado exitosamente", created, 201);
    } catch (err) {
        const status = err.status || 500;
        const message = err.message || "Error interno del servidor";

        // Ajuste de mensajes según tu tabla
        if (status === 409) return fail(res, "El registro ya existe en el sistema", null, 409);
        if (status === 422) return fail(res, "Error de validación en los datos enviados", err.data || null, 422);
        if (status === 400) return fail(res, "Faltan campos requeridos", err.data || null, 400);

        return fail(res, message, err.data || null, status);
    }
}

async function listarCursos(req, res) {
    try {
        const cursos = await service.listarCursos({ carrera_codigo: req.query.carrera_codigo });

        if (!cursos || cursos.length === 0) {
        return ok(res, "No se encontraron registros", [], 200);
        }
        return ok(res, "Datos obtenidos correctamente", cursos, 200);
    } catch (err) {
        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function obtenerCurso(req, res) {
    try {
        const curso = await service.obtenerCurso(req.params.id);
        return ok(res, "Datos obtenidos correctamente", curso, 200);
    } catch (err) {
        const status = err.status || 500;
        if (status === 404) return fail(res, "No se encontraron registros", null, 404);
        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function actualizarCurso(req, res) {
try {
    const result = await service.actualizarCurso(req.params.id, req.body);

    if (result.sinCambios) {
        return ok(res, "No se detectaron cambios para actualizar", result.data, 200);
    }
    return ok(res, "Registro actualizado correctamente", result.data, 200);
    } catch (err) {
        const status = err.status || 500;

        if (status === 404) return fail(res, "No se puede actualizar: el registro no existe", null, 404);
        if (status === 409) return fail(res, "Los datos a actualizar ya existen en otro registro", null, 409);
        if (status === 422) return fail(res, "Datos inválidos para la actualización", err.data || null, 422);

        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function eliminarCurso(req, res) {
    try {
        const result = await service.eliminarCurso(req.params.id);
        return ok(res, "Registro eliminado correctamente", result, 200);
    } catch (err) {
        const status = err.status || 500;
        if (status === 404) return fail(res, "No se puede eliminar: el registro no existe", null, 404);
        return fail(res, "Error interno del servidor", null, 500);
    }
}

module.exports = {
    crearCurso,
    listarCursos,
    obtenerCurso,
    actualizarCurso,
    eliminarCurso,
};