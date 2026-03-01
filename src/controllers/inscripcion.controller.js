const service = require("../services/inscripcion.service");

function ok(res, message, data, status = 200) {
    return res.status(status).json({ success: true, message, data });
}

function fail(res, message, data = null, status = 400) {
    return res.status(status).json({ success: false, message, data });
}

async function listarMateriasDisponibles(req, res) {
    try {
        const ci = req.user?.ci;

        const result = await service.listarMateriasDisponibles(ci, {
        incluir_extracurriculares: String(req.query.incluir_extracurriculares || "false") === "true",
        q: req.query.q,
        dia: req.query.dia,
        solo_disponibles: String(req.query.solo_disponibles || "false") === "true",
        });

        if (!result || result.length === 0) {
        return ok(res, "No se encontraron registros", [], 200);
        }
        return ok(res, "Datos obtenidos correctamente", result, 200);
    } catch (err) {
        const status = err.status || 500;
        if (status === 400) return fail(res, err.message, err.data || null, 400);
        if (status === 403) return fail(res, err.message, err.data || null, 403);
        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function obtenerDetalleMateria(req, res) {
    try {
        const ci = req.user?.ci;
        const id = req.params.id;

        const detalle = await service.obtenerDetalleMateria(ci, id);
        return ok(res, "Datos obtenidos correctamente", detalle, 200);
    } catch (err) {
        const status = err.status || 500;
        if (status === 404) return fail(res, err.message || "No se encontraron registros", null, 404);
        if (status === 400) return fail(res, err.message, err.data || null, 400);
        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function crearInscripcion(req, res) {
    try {
        const ci = req.user?.ci;

        const created = await service.crearInscripcion(ci, req.body);
        return ok(res, "Inscripción creada exitosamente", created, 201);
    } catch (err) {
        const status = err.status || 500;

        if (status === 400) return fail(res, err.message, err.data || null, 400);
        if (status === 403) return fail(res, err.message, err.data || null, 403);
        if (status === 404) return fail(res, err.message, err.data || null, 404);
        if (status === 409) return fail(res, err.message, err.data || null, 409);
        if (status === 422) return fail(res, err.message, err.data || null, 422);

        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function misInscripciones(req, res) {
    try {
    const ci = req.user?.ci;

    const data = await service.misInscripciones(ci);
    if (!data || data.length === 0) {
        return ok(res, "No se encontraron registros", [], 200);
        }
        return ok(res, "Datos obtenidos correctamente", data, 200);
    } catch (err) {
        return fail(res, "Error interno del servidor", null, 500);
    }
}

module.exports = {
    listarMateriasDisponibles,
    obtenerDetalleMateria,
    crearInscripcion,
    misInscripciones,
};