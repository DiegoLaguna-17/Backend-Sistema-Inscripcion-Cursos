const supabase = require("../config/supabase");

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

async function obtenerEstudiante(ci) {
const { data, error } = await supabase
    .from("usuario")
    .select("ci, carrera_usuario, estado, rol_id_rol")
    .eq("ci", String(ci))
    .eq("estado", true)
    .maybeSingle();

    if (error) throw error;
    if (!data) throw makeError(404, "Estudiante no encontrado");
    return data;
}

async function materiaExiste(id_materia) {
const { data, error } = await supabase
    .from("materia")
    .select(`
        id_materia,
        usuario_ci,
        carrera_codigo,
        nombre,
        tipo,
        cupo,
        dia,
        hora_inicio,
        hora_fin,
        fecha_inicio,
        fecha_fin,
        monto,
        aula_id_aula,
        aula:aula_id_aula ( id_aula, nombre ),
        carrera:carrera_codigo ( codigo, nombre ),
        docente:usuario_ci ( ci, nombre )
    `)
    .eq("id_materia", String(id_materia))
    .maybeSingle();

    if (error) throw error;
    return data;
}

async function cupoDisponible(materia) {
const { count, error } = await supabase
    .from("inscripciones_materia")
    .select("materia_id_materia", { count: "exact", head: true })
    .eq("materia_id_materia", String(materia.id_materia))
    .in("estado", ["INSCRITO", "PENDIENTE_PAGO"]);

    if (error) throw error;

    const inscritos = Number(count || 0);
    const cupo = Number(materia.cupo || 0);
    return inscritos < cupo;
}

async function obtenerRequisitos(id_materia) {
const { data, error } = await supabase
    .from("materia_requisito")
    .select(`
        requisito_id_materia,
        requisito:requisito_id_materia ( id_materia, nombre )
    `)
    .eq("materia_id_materia", String(id_materia));

    if (error) throw error;
    return data || [];
}

async function estudianteCumpleRequisito(ci_estudiante, id_requisito) {
const { data, error } = await supabase
    .from("inscripciones_materia")
    .select("materia_id_materia, estado")
    .eq("materia_id_materia", String(id_requisito))
    .in("estado", ["INSCRITO"])
    .in("inscripcion_id_inscripcion", (
        supabase
        .from("inscripcion")
        .select("id_inscripcion")
        .eq("usuario_ci", String(ci_estudiante))
    ))
    .maybeSingle();

if (error) {
    const { data: ins, error: insErr } = await supabase
        .from("inscripcion")
        .select("id_inscripcion")
        .eq("usuario_ci", String(ci_estudiante));

    if (insErr) throw insErr;
    const ids = (ins || []).map((x) => x.id_inscripcion);
    if (ids.length === 0) return false;

    const { data: det, error: detErr } = await supabase
        .from("inscripciones_materia")
        .select("materia_id_materia, estado")
        .in("inscripcion_id_inscripcion", ids)
        .eq("materia_id_materia", String(id_requisito))
        .in("estado", ["INSCRITO"])
        .maybeSingle();

    if (detErr) throw detErr;
    return !!det;
}

    return !!data;
}

async function yaInscritoEnMateria(ci_estudiante, id_materia) {
const { data: ins, error: insErr } = await supabase
    .from("inscripcion")
    .select("id_inscripcion")
    .eq("usuario_ci", String(ci_estudiante));

    if (insErr) throw insErr;
    const ids = (ins || []).map((x) => x.id_inscripcion);
    if (ids.length === 0) return false;

    const { data, error } = await supabase
        .from("inscripciones_materia")
        .select("materia_id_materia, estado")
        .in("inscripcion_id_inscripcion", ids)
        .eq("materia_id_materia", String(id_materia))
        .in("estado", ["INSCRITO", "PENDIENTE_PAGO"])
        .maybeSingle();

    if (error) throw error;
    return !!data;
}

async function listarMateriasDisponibles(ci_estudiante, opts = {}) {
const user = await obtenerEstudiante(ci_estudiante);

if (!user.carrera_usuario) {
    throw makeError(400, "Debes seleccionar tu carrera para continuar.");
}

let q = supabase
    .from("materia")
    .select(`
        id_materia,
        usuario_ci,
        carrera_codigo,
        nombre,
        tipo,
        cupo,
        dia,
        hora_inicio,
        hora_fin,
        fecha_inicio,
        fecha_fin,
        monto,
        aula_id_aula,
        aula:aula_id_aula ( id_aula, nombre ),
        carrera:carrera_codigo ( codigo, nombre ),
        docente:usuario_ci ( ci, nombre )
    `)
    .order("nombre", { ascending: true });

const incluirExtra = !!opts.incluir_extracurriculares;

if (incluirExtra) {
    q = q.or(
        `carrera_codigo.eq.${user.carrera_usuario},and(tipo.eq.EXTRACURRICULAR,carrera_codigo.is.null)`
        );
    } else {
        q = q.eq("carrera_codigo", user.carrera_usuario);
    }

    if (opts.q) q = q.ilike("nombre", `%${opts.q}%`);
    if (opts.dia) q = q.eq("dia", opts.dia);

const { data, error } = await q;
    if (error) throw error;

    let materias = data || [];

    if (opts.solo_disponibles) {
        const filtradas = [];
        for (const m of materias) {
        const okCupo = await cupoDisponible(m);
        if (okCupo) filtradas.push(m);
        }
        materias = filtradas;
    }

    return materias;
}

async function obtenerDetalleMateria(ci_estudiante, id_materia) {
    const user = await obtenerEstudiante(ci_estudiante);
    if (!user.carrera_usuario) {
        throw makeError(400, "Debes seleccionar tu carrera para continuar.");
    }

    const materia = await materiaExiste(id_materia);
    if (!materia) throw makeError(404, "No se encontraron registros");

  // Validar que pertenezca a su carrera o sea extracurricular
    const esExtra = materia.tipo === "EXTRACURRICULAR" && materia.carrera_codigo === null;
    const esDeSuCarrera = String(materia.carrera_codigo) === String(user.carrera_usuario);

    if (!esExtra && !esDeSuCarrera) {
        throw makeError(403, "No puedes ver esta materia (no pertenece a tu carrera).");
    }

const requisitosRaw = await obtenerRequisitos(materia.id_materia);

const requisitos = [];
const motivos = [];

for (const r of requisitosRaw) {
    const reqId = r.requisito_id_materia;
    const cumple = await estudianteCumpleRequisito(ci_estudiante, reqId);

    requisitos.push({
        id_materia: reqId,
        nombre: r.requisito?.nombre || null,
        cumple,
        });

        if (!cumple) {
        motivos.push(`No cumples el requisito: ${reqId}`);
        }
    }

    const okCupo = await cupoDisponible(materia);
    if (!okCupo) motivos.push("No hay cupos disponibles");

    const yaInscrito = await yaInscritoEnMateria(ci_estudiante, materia.id_materia);
    if (yaInscrito) motivos.push("Ya estás inscrito o tienes un pago pendiente en esta materia");

    return {
        materia,
        requisitos,
        puede_inscribirse: motivos.length === 0,
        motivos_bloqueo: motivos,
    };
}

async function crearInscripcion(ci_estudiante, payload) {
    const user = await obtenerEstudiante(ci_estudiante);

    if (!user.carrera_usuario) {
        throw makeError(400, "Debes seleccionar tu carrera para continuar.");
    }

    const materias = payload?.materias;

    if (!Array.isArray(materias) || materias.length === 0) {
        throw makeError(400, "Faltan campos requeridos", { campos_faltantes: ["materias"] });
    }

const { data: ins, error: insErr } = await supabase
        .from("inscripcion")
        .insert([{
        usuario_ci: String(ci_estudiante),
        fecha_inscripcion: hoyISO(),
        }])
        .select("id_inscripcion, usuario_ci, fecha_inscripcion")
        .single();

    if (insErr) throw insErr;

    const detalles = [];
    const errores = [];

    for (const id of materias) {
        const materia = await materiaExiste(id);

        if (!materia) {
        errores.push({ materia: id, error: "Materia no existe" });
        continue;
        }

        const esExtra = materia.tipo === "EXTRACURRICULAR" && materia.carrera_codigo === null;
        const esDeSuCarrera = String(materia.carrera_codigo) === String(user.carrera_usuario);

        if (!esExtra && !esDeSuCarrera) {
        errores.push({ materia: id, error: "Materia no pertenece a tu carrera" });
        continue;
        }

        const ya = await yaInscritoEnMateria(ci_estudiante, materia.id_materia);
        if (ya) {
        errores.push({ materia: id, error: "Ya inscrito o con pago pendiente" });
        continue;
        }

        const okCupo = await cupoDisponible(materia);
        if (!okCupo) {
        errores.push({ materia: id, error: "Sin cupos" });
        continue;
        }

        const reqs = await obtenerRequisitos(materia.id_materia);
        let okReq = true;

        for (const r of reqs) {
        const cumple = await estudianteCumpleRequisito(ci_estudiante, r.requisito_id_materia);
        if (!cumple) {
            okReq = false;
            errores.push({ materia: id, error: `No cumple requisito ${r.requisito_id_materia}` });
        }
        }

        if (!okReq) continue;

        const estado = Number(materia.monto) > 0 ? "PENDIENTE_PAGO" : "INSCRITO";

        const { data: det, error: detErr } = await supabase
        .from("inscripciones_materia")
        .insert([{
            inscripcion_id_inscripcion: ins.id_inscripcion,
            materia_id_materia: String(materia.id_materia),
            estado,
            fecha_inicio: materia.fecha_inicio,
            fecha_fin: materia.fecha_fin,
        }])
        .select("inscripcion_id_inscripcion, materia_id_materia, estado, fecha_inicio, fecha_fin")
        .single();

        if (detErr) {
        errores.push({ materia: id, error: detErr.message });
        continue;
        }

        detalles.push({
        ...det,
        monto: Number(materia.monto),
        });
    }

    if (detalles.length === 0) {
        throw makeError(422, "No se pudo inscribir ninguna materia", { errores });
    }

const totalPendiente = detalles
    .filter((x) => x.estado === "PENDIENTE_PAGO")
    .reduce((acc, x) => acc + Number(x.monto || 0), 0);

    return {
        inscripcion: ins,
        detalles,
        total_pendiente_pago: totalPendiente,
        errores,
    };
}

async function misInscripciones(ci_estudiante) {
const { data: ins, error: insErr } = await supabase
    .from("inscripcion")
    .select("id_inscripcion, fecha_inscripcion")
    .eq("usuario_ci", String(ci_estudiante))
    .order("id_inscripcion", { ascending: false });

    if (insErr) throw insErr;
    const ids = (ins || []).map((x) => x.id_inscripcion);
    if (ids.length === 0) return [];

const { data: det, error: detErr } = await supabase
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
            aula:aula_id_aula ( id_aula, nombre ),
            docente:usuario_ci ( ci, nombre )
        )
        `)
        .in("inscripcion_id_inscripcion", ids);

    if (detErr) throw detErr;

    const map = new Map();
    for (const i of ins) map.set(i.id_inscripcion, { ...i, materias: [] });

    for (const d of (det || [])) {
        const row = map.get(d.inscripcion_id_inscripcion);
        if (row) row.materias.push(d);
    }

    
}

module.exports = {
    listarMateriasDisponibles,
    obtenerDetalleMateria,
    crearInscripcion,
    misInscripciones,
};