const service = require("../services/inscripcion.service");

function ok(res, message, data, status = 200) {
    return res.status(status).json({ success: true, message, data });
}

function fail(res, message, data = null, status = 400) {
    return res.status(status).json({ success: false, message, data });
}

async function listarMateriasDisponibles(req, res) {
    try {
        const ci = req.usuario?.ci;

        const result = await service.listarMateriasDisponibles(ci, {
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
        if (status === 404) return fail(res, err.message, err.data || null, 404);
        if (status === 409) return fail(res, err.message, err.data || null, 409);
        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function listarExtracurriculares(req, res) {
    try {
        const result = await service.listarExtracurriculares({
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
        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function obtenerDetalleMateria(req, res) {
    try {
        const ci = req.usuario?.ci;
        const id = req.params.id;

        const detalle = await service.obtenerDetalleMateria(ci, id);
        return ok(res, "Datos obtenidos correctamente", detalle, 200);
    } catch (err) {
        const status = err.status || 500;
        if (status === 404) return fail(res, err.message || "No se encontraron registros", null, 404);
        if (status === 400) return fail(res, err.message, err.data || null, 400);
        if (status === 403) return fail(res, err.message, err.data || null, 403);
        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function obtenerDetalleExtracurricular(req, res) {
    try {
        const id = req.params.id;

        const detalle = await service.obtenerDetalleExtracurricular(id);
        return ok(res, "Datos obtenidos correctamente", detalle, 200);
    } catch (err) {
        const status = err.status || 500;
        if (status === 404) return fail(res, err.message || "No se encontraron registros", null, 404);
        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function crearInscripcion(req, res) {
    try {
        const ci = req.usuario?.ci;

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
        const ci = req.usuario?.ci;

        const data = await service.misInscripciones(ci);
        if (!data || data.length === 0) {
            return ok(res, "No se encontraron registros", [], 200);
        }
        return ok(res, "Datos obtenidos correctamente", data, 200);
    } catch (err) {
        const status = err.status || 500;
        return fail(res, "Error interno del servidor", null, status);
    }
}

async function listarInscripcionesActivas(req, res) {
    try {
        const ci = req.usuario?.ci;

        const data = await service.listarInscripcionesActivas(ci);
        if (!data || data.length === 0) {
            return ok(res, "No se encontraron materias activas", [], 200);
        }
        return ok(res, "Materias activas obtenidas correctamente", data, 200);
    } catch (err) {
        const status = err.status || 500;
        if (status === 400) return fail(res, err.message, err.data || null, 400);
        if (status === 404) return fail(res, err.message, err.data || null, 404);
        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function retirarMateria(req, res) {
    try {
        const ci = req.usuario?.ci;
        const { inscripcionId, materiaId } = req.params;

        const result = await service.retirarMateria(ci, inscripcionId, materiaId);
        return ok(res, result.mensaje, result.detalle, 200);
    } catch (err) {
        const status = err.status || 500;
        if (status === 400) return fail(res, err.message, err.data || null, 400);
        if (status === 404) return fail(res, err.message, err.data || null, 404);
        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function ejecutarActualizacionEstados(req, res) {
    try {
        const resultados = await service.actualizarEstadosAcademicos();
        return ok(res, "Actualización de estados ejecutada correctamente", resultados, 200);
    } catch (err) {
        const status = err.status || 500;
        return fail(res, "Error al ejecutar actualización de estados", null, status);
    }
}

async function listarMateriasEnCurso(req, res) {
    try {
        const ci = req.usuario?.ci;

        const data = await service.listarMateriasEnCurso(ci);
        if (!data || data.length === 0) {
            return ok(res, "No se encontraron materias en curso", [], 200);
        }
        return ok(res, "Materias en curso obtenidas correctamente", data, 200);
    } catch (err) {
        const status = err.status || 500;
        return fail(res, "Error interno del servidor", null, status);
    }
}

async function listarMateriasCulminadas(req, res) {
    try {
        const ci = req.usuario?.ci;

        const data = await service.listarMateriasCulminadas(ci);
        if (!data || data.length === 0) {
            return ok(res, "No se encontraron materias culminadas", [], 200);
        }
        return ok(res, "Materias culminadas obtenidas correctamente", data, 200);
    } catch (err) {
        const status = err.status || 500;
        return fail(res, "Error interno del servidor", null, status);
    }
}

async function listarMateriasRetiradas(req, res) {
    try {
        const ci = req.usuario?.ci;

        const data = await service.listarMateriasRetiradas(ci);
        if (!data || data.length === 0) {
            return ok(res, "No se encontraron materias retiradas", [], 200);
        }
        return ok(res, "Materias retiradas obtenidas correctamente", data, 200);
    } catch (err) {
        const status = err.status || 500;
        return fail(res, "Error interno del servidor", null, status);
    }
}

async function listarEstadoAcademico(req, res) {
    try {
        const ci = req.usuario?.ci;

        const data = await service.listarEstadoAcademico(ci);
        if (!data || data.length === 0) {
            return ok(res, "No se encontraron materias con estado académico", [], 200);
        }
        return ok(res, "Estado académico obtenido correctamente", data, 200);
    } catch (err) {
        const status = err.status || 500;
        return fail(res, "Error interno del servidor", null, status);
    }
}

module.exports = {
    listarMateriasDisponibles,
    obtenerDetalleMateria,
    listarExtracurriculares,
    obtenerDetalleExtracurricular,
    crearInscripcion,
    misInscripciones,
    listarInscripcionesActivas,
    retirarMateria,
    ejecutarActualizacionEstados,
    listarMateriasEnCurso,
    listarMateriasCulminadas,
    listarMateriasRetiradas,
    listarEstadoAcademico,
};