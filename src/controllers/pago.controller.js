const service = require("../services/pago.service");

function ok(res, message, data, status = 200) {
    return res.status(status).json({ success: true, message, data });
}
function fail(res, message, data = null, status = 400) {
    return res.status(status).json({ success: false, message, data });
}

async function resumenPago(req, res) {
    try {
        const ci = req.usuario?.ci;
        const idInscripcion = req.params.id_inscripcion;

        const data = await service.resumenPago(ci, idInscripcion);
        return ok(res, "Datos obtenidos correctamente", data, 200);
    } catch (err) {
        const status = err.status || 500;
        if (status === 404) return fail(res, err.message, err.data || null, 404);
        if (status === 403) return fail(res, err.message, err.data || null, 403);
        if (status === 400) return fail(res, err.message, err.data || null, 400);
        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function pagarInscripcion(req, res) {
    try {
    const ci = req.usuario?.ci;
    const idInscripcion = req.params.id_inscripcion;

    const data = await service.pagarInscripcion(ci, idInscripcion, req.body);
    return ok(res, "Pago realizado exitosamente", data, 201);
    } catch (err) {
        const status = err.status || 500;
        if (status === 404) return fail(res, err.message, err.data || null, 404);
        if (status === 403) return fail(res, err.message, err.data || null, 403);
        if (status === 409) return fail(res, err.message, err.data || null, 409);
        if (status === 422) return fail(res, err.message, err.data || null, 422);
        if (status === 400) return fail(res, err.message, err.data || null, 400);
        return fail(res, "Error interno del servidor", null, 500);
    }
}

async function obtenerFactura(req, res) {
    try {
        const ci = req.usuario?.ci;
        const idFactura = req.params.id_factura;

        const data = await service.obtenerFactura(ci, idFactura);
        return ok(res, "Datos obtenidos correctamente", data, 200);
    } catch (err) {
        const status = err.status || 500;
        if (status === 404) return fail(res, err.message, err.data || null, 404);
        if (status === 403) return fail(res, err.message, err.data || null, 403);
        return fail(res, "Error interno del servidor", null, 500);
    }
}

module.exports = {
    resumenPago,
    pagarInscripcion,
    obtenerFactura,
};