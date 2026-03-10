const supabase = require("../config/supabase");

// PDF + correo
const { generarFacturaPDFBuffer } = require("../utils/facturaPdf");
const { enviarFacturaPorCorreo } = require("../utils/mailer");

function makeError(status, message, data = null) {
    const err = new Error(message);
    err.status = status;
    err.data = data;
    return err;
}

function hoyISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function horaISO() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${hh}:${mi}:${ss}`;
}

// ✅ CAMBIO AQUÍ: acepta MAIL_* o EMAIL_*
function mailConfigurado() {
    const user = process.env.MAIL_USER || process.env.EMAIL_USER;
    const pass = process.env.MAIL_PASS || process.env.EMAIL_PASS;

    return (
        !!process.env.MAIL_HOST &&
        !!process.env.MAIL_PORT &&
        !!user &&
        !!pass
    );
}

async function obtenerInscripcionDelEstudiante(ci, idInscripcion) {
    const { data, error } = await supabase
        .from("inscripcion")
        .select("id_inscripcion, usuario_ci, fecha_inscripcion")
        .eq("id_inscripcion", Number(idInscripcion))
        .maybeSingle();

    if (error) throw error;
    if (!data) throw makeError(404, "Inscripción no encontrada");

    if (String(data.usuario_ci) !== String(ci)) {
        throw makeError(403, "No autorizado para ver esta inscripción");
    }

    return data;
}

async function obtenerDetallesPendientes(idInscripcion) {
    const { data, error } = await supabase
        .from("inscripciones_materia")
        .select(`
            inscripcion_id_inscripcion,
            materia_id_materia,
            estado,
            fecha_inicio,
            fecha_fin,
            materia:materia_id_materia (
                id_materia,
                nombre,
                tipo,
                monto,
                dia,
                hora_inicio,
                hora_fin,
                cupo,
                fecha_inicio,
                fecha_fin,
                aula_id_aula,
                usuario_ci,
                carrera_codigo,
                aula:aula_id_aula ( id_aula, nombre ),
                docente:usuario_ci ( ci, nombre )
            )
        `)
        .eq("inscripcion_id_inscripcion", Number(idInscripcion))
        .eq("estado", "PENDIENTE_PAGO");

    if (error) throw error;
    return data || [];
}

async function marcarInscrito(idInscripcion) {
    const hoy = hoyISO();

    const { data: pendientes, error: pendientesErr } = await supabase
        .from("inscripciones_materia")
        .select(`
            inscripcion_id_inscripcion,
            materia_id_materia,
            estado,
            estado_academico,
            fecha_inicio,
            fecha_fin
        `)
        .eq("inscripcion_id_inscripcion", Number(idInscripcion))
        .eq("estado", "PENDIENTE_PAGO");

    if (pendientesErr) throw pendientesErr;

    if (!pendientes || pendientes.length === 0) {
        return [];
    }

    const actualizados = [];

    for (const materia of pendientes) {
        const hoyDate = new Date(`${hoy}T00:00:00`);
        const inicio = new Date(`${materia.fecha_inicio}T00:00:00`);
        const fin = new Date(`${materia.fecha_fin}T23:59:59`);

        const debeEstarEnCurso =
            inicio <= hoyDate &&
            fin >= hoyDate;

        const nuevoEstadoAcademico = debeEstarEnCurso ? "EN_CURSO" : null;

        const { data, error } = await supabase
            .from("inscripciones_materia")
            .update({
                estado: "INSCRITO",
                estado_academico: nuevoEstadoAcademico,
            })
            .eq("inscripcion_id_inscripcion", Number(idInscripcion))
            .eq("materia_id_materia", String(materia.materia_id_materia))
            .eq("estado", "PENDIENTE_PAGO")
            .select(`
                inscripcion_id_inscripcion,
                materia_id_materia,
                estado,
                estado_academico,
                fecha_inicio,
                fecha_fin
            `)
            .single();

        if (error) throw error;

        actualizados.push(data);
    }

    return actualizados;
}

async function crearFactura(ci, total, datosFactura) {
    const { nit_ci, razon_social, correo } = datosFactura || {};

    const { data, error } = await supabase
        .from("factura")
        .insert([{
            usuario_ci: String(ci),
            fecha_emision: hoyISO(),
            hora: horaISO(),
            total: Number(total),
            nit_ci: String(nit_ci),
            razon_social: String(razon_social),
            correo: String(correo),
        }])
        .select("id_factura, usuario_ci, fecha_emision, hora, total, nit_ci, razon_social, correo")
        .single();

    if (error) throw error;
    return data;
}

async function registrarPago(idInscripcion, idFactura, total, metodo) {
    const { data, error } = await supabase
        .from("pagos")
        .insert([{
            inscripcion_id_inscripcion: Number(idInscripcion),
            factura_id_factura: Number(idFactura),
            monto: Number(total),
            fecha: hoyISO(),
            metodo_pago: String(metodo),
            estado: "PAGADO",
        }])
        .select("id_pago, inscripcion_id_inscripcion, factura_id_factura, monto, fecha, metodo_pago, estado")
        .single();

    if (error) throw error;
    return data;
}

async function resumenPago(ci, idInscripcion) {
    const inscripcion = await obtenerInscripcionDelEstudiante(ci, idInscripcion);
    const pendientes = await obtenerDetallesPendientes(inscripcion.id_inscripcion);

    const total_pendiente = pendientes.reduce((acc, row) => {
        const monto = Number(row?.materia?.monto || 0);
        return acc + monto;
    }, 0);

    return {
        inscripcion,
        pendientes,
        total_pendiente_pago: total_pendiente,
        puede_pagar: total_pendiente > 0,
    };
}

async function pagarInscripcion(ci, idInscripcion, payload) {
    const inscripcion = await obtenerInscripcionDelEstudiante(ci, idInscripcion);

    const faltantes = [];
    const { nit_ci, razon_social, correo, metodo_pago } = payload || {};

    if (!nit_ci) faltantes.push("nit_ci");
    if (!razon_social) faltantes.push("razon_social");
    if (!correo) faltantes.push("correo");
    if (!metodo_pago) faltantes.push("metodo_pago");

    if (faltantes.length) {
        throw makeError(400, "Faltan campos requeridos", { campos_faltantes: faltantes });
    }

    const metodo = String(metodo_pago).toUpperCase();
    if (!["TARJETA", "QR"].includes(metodo)) {
        throw makeError(422, "Error de validación en los datos enviados", {
            errores: ["metodo_pago debe ser TARJETA o QR"],
        });
    }

    const pendientes = await obtenerDetallesPendientes(inscripcion.id_inscripcion);
    if (!pendientes.length) throw makeError(409, "No tienes materias pendientes de pago para esta inscripción");

    const total = pendientes.reduce((acc, row) => acc + Number(row?.materia?.monto || 0), 0);
    if (total <= 0) throw makeError(409, "No hay monto pendiente de pago");

    const factura = await crearFactura(ci, total, { nit_ci, razon_social, correo });
    const pago = await registrarPago(inscripcion.id_inscripcion, factura.id_factura, total, metodo);
    const actualizados = await marcarInscrito(inscripcion.id_inscripcion);

    const items = (pendientes || []).map((p) => ({
        id_materia: p?.materia?.id_materia ?? p?.materia_id_materia,
        codigo: p?.materia?.id_materia ?? p?.materia_id_materia,
        nombre: p?.materia?.nombre || "",
        monto: Number(p?.materia?.monto || 0),
    }));

    let envio = { enviado: false, simulado: true, detalle: "No enviado" };

    try {
        const pdfBuffer = await generarFacturaPDFBuffer({
            factura,
            pago,
            datosFactura: { nit_ci, razon_social, correo },
            items,
        });

        if (!mailConfigurado()) {
            envio = { enviado: false, simulado: true, detalle: "MAIL_* o EMAIL_* no configurado" };
        } else {
            const info = await enviarFacturaPorCorreo({
                to: correo,
                subject: `Factura #${factura.id_factura} - SixSeven Academy`,
                text: `Hola ${razon_social},\n\nAdjunto encontrarás tu factura #${factura.id_factura}.\n\nGracias.`,
                pdfBuffer,
                filename: `factura_${factura.id_factura}.pdf`,
            });

            envio = {
                enviado: true,
                simulado: false,
                detalle: "Correo enviado",
                messageId: info?.messageId || null,
                accepted: info?.accepted || [],
                rejected: info?.rejected || [],
            };
        }
    } catch (e) {
        envio = {
            enviado: false,
            simulado: !mailConfigurado(),
            detalle: e?.message || "Error enviando factura",
        };
    }

    return {
        inscripcion,
        pago,
        factura,
        total_pagado: total,
        materias_actualizadas: actualizados,
        envio_factura: envio,
        mensaje_envio_factura: envio.enviado
            ? "Factura enviada al correo"
            : envio.simulado
                ? "Factura generada (envío simulado)"
                : "Pago OK, pero falló el envío de la factura",
    };
}

async function obtenerFactura(ci, idFactura) {
    const { data: factura, error } = await supabase
        .from("factura")
        .select("id_factura, usuario_ci, fecha_emision, hora, total, nit_ci, razon_social, correo")
        .eq("id_factura", Number(idFactura))
        .maybeSingle();

    if (error) throw error;
    if (!factura) throw makeError(404, "Factura no encontrada");

    if (String(factura.usuario_ci) !== String(ci)) {
        throw makeError(403, "No autorizado para ver esta factura");
    }

    const { data: pagos, error: pagosErr } = await supabase
        .from("pagos")
        .select("id_pago, inscripcion_id_inscripcion, factura_id_factura, monto, fecha, metodo_pago, estado")
        .eq("factura_id_factura", Number(idFactura))
        .order("id_pago", { ascending: false });

    if (pagosErr) throw pagosErr;

    return { factura, pagos: pagos || [] };
}

module.exports = {
    resumenPago,
    pagarInscripcion,
    obtenerFactura,
};