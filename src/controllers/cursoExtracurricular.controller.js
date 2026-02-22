const service = require("../services/cursoExtracurricular.service");

function ok(res, message, data = null, status = 200) {
    return res.status(status).json({ success: true, message, data });
}
function fail(res, message, data = null, status = 400) {
    return res.status(status).json({ success: false, message, data });
}

async function crear(req, res) {
    try {
        const creado = await service.crear(req.body);
        return ok(res, "Registro creado exitosamente", creado, 201);
    } catch (err) {
        const status = err.status || 500;

        if (status === 409) return fail(res, "El registro ya existe en el sistema", null, 409);
        if (status === 422) return fail(res, "Error de validación en los datos enviados", err.data || null, 422);
        if (status === 400) return fail(res, "Faltan campos requeridos", err.data || null, 400);

        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function listar(req, res) {
    try {
        const data = await service.listar();
        if (!data || data.length === 0) {
        return ok(res, "No se encontraron registros", [], 200);
        }
        return ok(res, "Datos obtenidos correctamente", data, 200);
    } catch (err) {
        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function obtenerPorId(req, res) {
    try {
        const data = await service.obtenerPorId(req.params.id);
        return ok(res, "Datos obtenidos correctamente", data, 200);
    } catch (err) {
        const status = err.status || 500;
        if (status === 404) return fail(res, "No se encontraron registros", null, 404);
        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function actualizar(req, res) {
    try {
        const data = await service.actualizar(req.params.id, req.body);
        return ok(res, "Registro actualizado correctamente", data, 200);
    } catch (err) {
        const status = err.status || 500;

        if (status === 404) return fail(res, "No se puede actualizar: el registro no existe", null, 404);
        if (status === 409) return fail(res, "Los datos a actualizar ya existen en otro registro", null, 409);
        if (status === 422) return fail(res, "Datos inválidos para la actualización", err.data || null, 422);

        // Si no envió cambios, lo manejamos como 200 según tu tabla
        if (status === 200 && err.message === "No se detectaron cambios para actualizar") {
        return ok(res, "No se detectaron cambios para actualizar", err.data || null, 200);
        }

        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function eliminar(req, res) {
    try {
        const data = await service.eliminar(req.params.id);
        return ok(res, "Registro eliminado correctamente", data, 200);
    } catch (err) {
        const status = err.status || 500;
        if (status === 404) return fail(res, "No se puede eliminar: el registro no existe", null, 404);
        if (status === 409) return fail(res, "No se puede eliminar: el registro tiene dependencias", err.data || null, 409);
        return fail(res, "Error interno del servidor", null, 500);
    }
}

module.exports = { crear, listar, obtenerPorId, actualizar, eliminar };