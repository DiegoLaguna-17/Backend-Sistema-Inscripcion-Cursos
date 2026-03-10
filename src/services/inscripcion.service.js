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

async function requisitosPorMaterias(idsMaterias) {
    if (!idsMaterias || idsMaterias.length === 0) return {};

    const { data, error } = await supabase
        .from("materia_requisito")
        .select(`
            materia_id_materia,
            requisito_id_materia,
            requisito:requisito_id_materia ( id_materia, nombre )
        `)
        .in("materia_id_materia", idsMaterias);

    if (error) throw error;

    const map = {};
    for (const row of data || []) {
        const mid = row.materia_id_materia;
        if (!map[mid]) map[mid] = [];
        map[mid].push({
            id_materia: row.requisito_id_materia,
            nombre: row.requisito?.nombre || null,
        });
    }
    return map;
}

function mapMateriaLikeUI(m, inscritos, requisitos = []) {
    return {
        dia: m.dia,
        aula: m.aula ? { id_aula: m.aula.id_aula, nombre: m.aula.nombre } : null,
        cupo: Number(m.cupo || 0),
        inscritos: Number(inscritos || 0),
        tipo: m.tipo,
        monto: Number(m.monto || 0),
        nombre: m.nombre,
        hora_fin: m.hora_fin,
        fecha_fin: m.fecha_fin,
        id_materia: m.id_materia,
        usuario_ci: m.usuario_ci,
        hora_inicio: m.hora_inicio,
        aula_id_aula: m.aula_id_aula,
        fecha_inicio: m.fecha_inicio,
        carrera_codigo: m.carrera_codigo,
        docente: m.docente ? { ci: m.docente.ci, nombre: m.docente.nombre } : null,
        requisitos: requisitos || [],
    };
}

async function inscritosPorMaterias(idsMaterias) {
    if (!idsMaterias || idsMaterias.length === 0) return {};

    const { data, error } = await supabase
        .from("inscripciones_materia")
        .select("materia_id_materia")
        .in("materia_id_materia", idsMaterias)
        .in("estado", ["INSCRITO", "PENDIENTE_PAGO"]);

    if (error) throw error;

    const map = {};
    for (const row of data || []) {
        const id = row.materia_id_materia;
        map[id] = (map[id] || 0) + 1;
    }
    return map;
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

async function retiroEnMismoCiclo(ci_estudiante, id_materia) {
    const hoy = hoyISO();

    const { data: ins, error: insErr } = await supabase
        .from("inscripcion")
        .select("id_inscripcion")
        .eq("usuario_ci", String(ci_estudiante));

    if (insErr) throw insErr;

    const ids = (ins || []).map((x) => x.id_inscripcion);
    if (ids.length === 0) return false;

    const { data, error } = await supabase
        .from("inscripciones_materia")
        .select(`
            materia_id_materia,
            estado,
            fecha_inicio,
            fecha_fin,
            fecha_retiro
        `)
        .in("inscripcion_id_inscripcion", ids)
        .eq("materia_id_materia", String(id_materia))
        .eq("estado", "RETIRADO");

    if (error) throw error;

    return (data || []).some((row) => {
        if (!row.fecha_inicio || !row.fecha_fin) return true;
        return row.fecha_inicio <= hoy && row.fecha_fin >= hoy;
    });
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
        .eq("carrera_codigo", user.carrera_usuario)
        .order("nombre", { ascending: true });

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

    const ids = materias.map((m) => m.id_materia);
    const inscritosMap = await inscritosPorMaterias(ids);
    const reqMap = await requisitosPorMaterias(ids);

    return materias.map((m) =>
        mapMateriaLikeUI(
            m,
            inscritosMap[m.id_materia] || 0,
            reqMap[m.id_materia] || []
        )
    );
}

async function listarExtracurriculares(opts = {}) {
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
            docente:usuario_ci ( ci, nombre )
        `)
        .eq("tipo", "EXTRACURRICULAR")
        .is("carrera_codigo", null)
        .order("nombre", { ascending: true });

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

    const ids = materias.map((m) => m.id_materia);
    const inscritosMap = await inscritosPorMaterias(ids);

    return materias.map((m) =>
        mapMateriaLikeUI(m, inscritosMap[m.id_materia] || 0, [])
    );
}

async function obtenerDetalleMateria(ci_estudiante, id_materia) {
    const user = await obtenerEstudiante(ci_estudiante);

    if (!user.carrera_usuario) {
        throw makeError(400, "Debes seleccionar tu carrera para continuar.");
    }

    const materia = await materiaExiste(id_materia);
    if (!materia) throw makeError(404, "No se encontraron registros");

    const esDeSuCarrera = String(materia.carrera_codigo) === String(user.carrera_usuario);
    if (!esDeSuCarrera) {
        throw makeError(403, "No puedes ver esta materia (no pertenece a tu carrera).");
    }

    const inscritosMap = await inscritosPorMaterias([materia.id_materia]);
    const inscritos = inscritosMap[materia.id_materia] || 0;
    const reqMap = await requisitosPorMaterias([materia.id_materia]);
    const requisitosUI = reqMap[materia.id_materia] || [];

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

        if (!cumple) motivos.push(`No cumples el requisito: ${reqId}`);
    }

    const okCupo = await cupoDisponible(materia);
    if (!okCupo) motivos.push("No hay cupos disponibles");

    const yaInscrito = await yaInscritoEnMateria(ci_estudiante, materia.id_materia);
    if (yaInscrito) motivos.push("Ya estás inscrito o tienes un pago pendiente en esta materia");

    const retiroMismoCiclo = await retiroEnMismoCiclo(ci_estudiante, materia.id_materia);
    if (retiroMismoCiclo) {
        motivos.push("Retiraste esta materia en el ciclo actual y no puedes volver a inscribirte hasta un nuevo ciclo");
    }

    return {
        materia: mapMateriaLikeUI(materia, inscritos, requisitosUI),
        requisitos,
        puede_inscribirse: motivos.length === 0,
        motivos_bloqueo: motivos,
    };
}

async function obtenerDetalleExtracurricular(ci_estudiante, id_materia) {
    const materia = await materiaExiste(id_materia);
    if (!materia) throw makeError(404, "No se encontraron registros");

    const esExtra = materia.tipo === "EXTRACURRICULAR" && materia.carrera_codigo === null;
    if (!esExtra) throw makeError(403, "La materia solicitada no es extracurricular.");

    const inscritosMap = await inscritosPorMaterias([materia.id_materia]);
    const inscritos = inscritosMap[materia.id_materia] || 0;

    const motivos = [];

    const okCupo = await cupoDisponible(materia);
    if (!okCupo) motivos.push("No hay cupos disponibles");

    const yaInscrito = await yaInscritoEnMateria(ci_estudiante, materia.id_materia);
    if (yaInscrito) motivos.push("Ya estás inscrito o tienes un pago pendiente en esta materia");

    const retiroMismoCiclo = await retiroEnMismoCiclo(ci_estudiante, materia.id_materia);
    if (retiroMismoCiclo) {
        motivos.push("Retiraste esta materia en el ciclo actual y no puedes volver a inscribirte hasta un nuevo ciclo");
    }

    return {
        materia: mapMateriaLikeUI(materia, inscritos, []),
        requisitos: [],
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

        const retiradaMismoCiclo = await retiroEnMismoCiclo(ci_estudiante, materia.id_materia);
        if (retiradaMismoCiclo) {
            errores.push({
                materia: id,
                error: "Retiraste esta materia en el ciclo actual y no puedes volver a inscribirte hasta un nuevo ciclo"
            });
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
        
        let estado_academico = null;
        if (materia.fecha_inicio && materia.fecha_inicio <= hoyISO()) {
            estado_academico = "EN_CURSO";
        }

        const { data: det, error: detErr } = await supabase
            .from("inscripciones_materia")
            .insert([{
                inscripcion_id_inscripcion: ins.id_inscripcion,
                materia_id_materia: String(materia.id_materia),
                estado,
                estado_academico,
                fecha_inicio: materia.fecha_inicio,
                fecha_fin: materia.fecha_fin,
            }])
            .select("inscripcion_id_inscripcion, materia_id_materia, estado, estado_academico, fecha_inicio, fecha_fin")
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
            estado_academico,
            fecha_inicio,
            fecha_fin,
            fecha_retiro,
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
        .in("inscripcion_id_inscripcion", ids);

    if (detErr) throw detErr;

    const map = new Map();
    for (const i of ins) map.set(i.id_inscripcion, { ...i, materias: [] });

    const materiasIds = (det || []).map((x) => x.materia_id_materia);
    const inscritosMap = await inscritosPorMaterias(materiasIds);
    const reqMap = await requisitosPorMaterias(materiasIds);

    for (const d of (det || [])) {
        const row = map.get(d.inscripcion_id_inscripcion);
        if (!row) continue;

        const m = d.materia;
        row.materias.push({
            inscripcion_id_inscripcion: d.inscripcion_id_inscripcion,
            materia_id_materia: d.materia_id_materia,
            estado: d.estado,
            estado_academico: d.estado_academico,
            fecha_inicio: d.fecha_inicio,
            fecha_fin: d.fecha_fin,
            fecha_retiro: d.fecha_retiro,
            materia: m
                ? mapMateriaLikeUI(m, inscritosMap[m.id_materia] || 0, reqMap[m.id_materia] || [])
                : null,
        });
    }

    return Array.from(map.values());
}

async function listarInscripcionesActivas(ci_estudiante) {
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
            estado_academico,
            fecha_inicio,
            fecha_fin,
            fecha_retiro,
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
        .in("inscripcion_id_inscripcion", ids)
        .in("estado", ["INSCRITO", "PENDIENTE_PAGO"]);

    if (detErr) throw detErr;

    const map = new Map();
    for (const i of ins) map.set(i.id_inscripcion, { ...i, materias: [] });

    const materiasIds = (det || []).map((x) => x.materia_id_materia);
    const inscritosMap = await inscritosPorMaterias(materiasIds);
    const reqMap = await requisitosPorMaterias(materiasIds);

    for (const d of (det || [])) {
        const row = map.get(d.inscripcion_id_inscripcion);
        if (!row) continue;

        const m = d.materia;
        row.materias.push({
            inscripcion_id_inscripcion: d.inscripcion_id_inscripcion,
            materia_id_materia: d.materia_id_materia,
            estado: d.estado,
            estado_academico: d.estado_academico,
            fecha_inicio: d.fecha_inicio,
            fecha_fin: d.fecha_fin,
            fecha_retiro: d.fecha_retiro,
            materia: m
                ? mapMateriaLikeUI(m, inscritosMap[m.id_materia] || 0, reqMap[m.id_materia] || [])
                : null,
        });
    }

    return Array.from(map.values()).filter((x) => x.materias.length > 0);
}

async function retirarMateria(ci_estudiante, inscripcion_id, materia_id) {
    const { data: inscripcion, error: insErr } = await supabase
        .from("inscripcion")
        .select("id_inscripcion, usuario_ci")
        .eq("id_inscripcion", String(inscripcion_id))
        .eq("usuario_ci", String(ci_estudiante))
        .maybeSingle();

    if (insErr) throw insErr;
    if (!inscripcion) {
        throw makeError(404, "Inscripción no encontrada o no te pertenece");
    }

    const { data: detalle, error: detErr } = await supabase
        .from("inscripciones_materia")
        .select("inscripcion_id_inscripcion, materia_id_materia, estado, estado_academico, fecha_inicio, fecha_fin")
        .eq("inscripcion_id_inscripcion", String(inscripcion_id))
        .eq("materia_id_materia", String(materia_id))
        .maybeSingle();

    if (detErr) throw detErr;
    if (!detalle) {
        throw makeError(404, "Materia no encontrada en esta inscripción");
    }

    if (!detalle.estado || !["INSCRITO", "PENDIENTE_PAGO"].includes(detalle.estado)) {
        throw makeError(400, "No se puede retirar una materia que no está inscrita o pendiente de pago");
    }

    if (detalle.estado === "RETIRADO") {
        throw makeError(400, "Esta materia ya fue retirada");
    }

    const { data: updated, error: updErr } = await supabase
        .from("inscripciones_materia")
        .update({
            estado: "RETIRADO",
            estado_academico: "RETIRADO",
            fecha_retiro: hoyISO(),
        })
        .eq("inscripcion_id_inscripcion", String(inscripcion_id))
        .eq("materia_id_materia", String(materia_id))
        .select("inscripcion_id_inscripcion, materia_id_materia, estado, estado_academico, fecha_retiro")
        .single();

    if (updErr) throw updErr;

    return {
        mensaje: "Retiro exitoso",
        detalle: updated,
    };
}

async function calcularPromedioNotas(usuario_ci, materia_id) {
    const { data, error } = await supabase
        .from("notas")
        .select("calificacion")
        .eq("usuario_ci", String(usuario_ci))
        .eq("materia_id_materia", String(materia_id));

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const suma = data.reduce((acc, nota) => acc + Number(nota.calificacion || 0), 0);
    const promedio = suma / data.length;
    return promedio;
}

async function calcularPorcentajeAsistencia(usuario_ci, materia_id) {
    const { data, error } = await supabase
        .from("asistencia")
        .select("estado")
        .eq("usuario_ci", String(usuario_ci))
        .eq("materia_id_materia", String(materia_id));

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const presentes = data.filter((a) => a.estado === true).length;
    const total = data.length;
    const porcentaje = (presentes / total) * 100;
    return porcentaje;
}

async function actualizarEstadosAcademicos() {
    const hoy = hoyISO();
    const resultados = {
        activadas: 0,
        finalizadas: 0,
        aprobadas: 0,
        reprobadas: 0,
        retiradas_corregidas: 0,
        errores: [],
    };

    try {
        const { data: materiasRetiradasAntiguas, error: errRetiradas } = await supabase
            .from("inscripciones_materia")
            .select("inscripcion_id_inscripcion, materia_id_materia")
            .eq("estado", "RETIRADO")
            .is("estado_academico", null);

        if (errRetiradas) throw errRetiradas;

        for (const mat of materiasRetiradasAntiguas || []) {
            const { error: updErr } = await supabase
                .from("inscripciones_materia")
                .update({ estado_academico: "RETIRADO" })
                .eq("inscripcion_id_inscripcion", mat.inscripcion_id_inscripcion)
                .eq("materia_id_materia", mat.materia_id_materia);

            if (updErr) {
                resultados.errores.push({
                    tipo: "corregir_retirada",
                    inscripcion: mat.inscripcion_id_inscripcion,
                    materia: mat.materia_id_materia,
                    error: updErr.message,
                });
            } else {
                resultados.retiradas_corregidas++;
            }
        }

        const { data: materiasIniciar, error: errIniciar } = await supabase
            .from("inscripciones_materia")
            .select(`
                inscripcion_id_inscripcion,
                materia_id_materia,
                fecha_inicio,
                fecha_fin,
                inscripcion:inscripcion_id_inscripcion ( usuario_ci )
            `)
            .in("estado", ["INSCRITO", "PENDIENTE_PAGO"])
            .is("estado_academico", null)
            .lte("fecha_inicio", hoy)
            .gte("fecha_fin", hoy);

        if (errIniciar) throw errIniciar;

        for (const mat of materiasIniciar || []) {
            const { error: updErr } = await supabase
                .from("inscripciones_materia")
                .update({ estado_academico: "EN_CURSO" })
                .eq("inscripcion_id_inscripcion", mat.inscripcion_id_inscripcion)
                .eq("materia_id_materia", mat.materia_id_materia);

            if (updErr) {
                resultados.errores.push({
                    tipo: "activar",
                    inscripcion: mat.inscripcion_id_inscripcion,
                    materia: mat.materia_id_materia,
                    error: updErr.message,
                });
            } else {
                resultados.activadas++;
            }
        }

        const { data: materiasTerminar, error: errTerminar } = await supabase
            .from("inscripciones_materia")
            .select(`
                inscripcion_id_inscripcion,
                materia_id_materia,
                fecha_fin,
                inscripcion:inscripcion_id_inscripcion ( usuario_ci )
            `)
            .in("estado", ["INSCRITO", "PENDIENTE_PAGO"])
            .eq("estado_academico", "EN_CURSO");

        if (errTerminar) throw errTerminar;

        for (const mat of materiasTerminar || []) {
            try {
                const usuario_ci = mat.inscripcion?.usuario_ci;
                if (!usuario_ci) {
                    resultados.errores.push({
                        tipo: "finalizar",
                        inscripcion: mat.inscripcion_id_inscripcion,
                        materia: mat.materia_id_materia,
                        error: "No se pudo obtener el CI del estudiante",
                    });
                    continue;
                }

                const promedio = await calcularPromedioNotas(usuario_ci, mat.materia_id_materia);
                const asistencia = await calcularPorcentajeAsistencia(usuario_ci, mat.materia_id_materia);

                if (promedio === null && asistencia === null) {
                    continue;
                }

                let nuevoEstado = "REPROBADA";

                if (promedio !== null && asistencia !== null) {
                    if (promedio >= 51 && asistencia >= 70) {
                        nuevoEstado = "APROBADA";
                    }
                } else if (promedio === null && asistencia !== null) {
                    if (asistencia >= 70) {
                        nuevoEstado = "APROBADA";
                    }
                } else if (promedio !== null && asistencia === null) {
                    if (promedio >= 51) {
                        nuevoEstado = "APROBADA";
                    }
                }

                const { error: updErr } = await supabase
                    .from("inscripciones_materia")
                    .update({ estado_academico: nuevoEstado })
                    .eq("inscripcion_id_inscripcion", mat.inscripcion_id_inscripcion)
                    .eq("materia_id_materia", mat.materia_id_materia);

                if (updErr) {
                    resultados.errores.push({
                        tipo: "finalizar",
                        inscripcion: mat.inscripcion_id_inscripcion,
                        materia: mat.materia_id_materia,
                        error: updErr.message,
                    });
                } else {
                    resultados.finalizadas++;
                    if (nuevoEstado === "APROBADA") resultados.aprobadas++;
                    else resultados.reprobadas++;
                }
            } catch (err) {
                resultados.errores.push({
                    tipo: "finalizar",
                    inscripcion: mat.inscripcion_id_inscripcion,
                    materia: mat.materia_id_materia,
                    error: err.message,
                });
            }
        }

        return resultados;
    } catch (error) {
        throw error;
    }
}

async function listarMateriasEnCurso(ci_estudiante) {
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
            estado_academico,
            fecha_inicio,
            fecha_fin,
            fecha_retiro,
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
        .in("inscripcion_id_inscripcion", ids)
        .eq("estado_academico", "EN_CURSO");

    if (detErr) throw detErr;

    const map = new Map();
    for (const i of ins) map.set(i.id_inscripcion, { ...i, materias: [] });

    const materiasIds = (det || []).map((x) => x.materia_id_materia);
    const inscritosMap = await inscritosPorMaterias(materiasIds);
    const reqMap = await requisitosPorMaterias(materiasIds);

    for (const d of (det || [])) {
        const row = map.get(d.inscripcion_id_inscripcion);
        if (!row) continue;

        const m = d.materia;
        row.materias.push({
            inscripcion_id_inscripcion: d.inscripcion_id_inscripcion,
            materia_id_materia: d.materia_id_materia,
            estado: d.estado,
            estado_academico: d.estado_academico,
            fecha_inicio: d.fecha_inicio,
            fecha_fin: d.fecha_fin,
            fecha_retiro: d.fecha_retiro,
            materia: m
                ? mapMateriaLikeUI(m, inscritosMap[m.id_materia] || 0, reqMap[m.id_materia] || [])
                : null,
        });
    }

    return Array.from(map.values()).filter((x) => x.materias.length > 0);
}

async function listarMateriasCulminadas(ci_estudiante) {
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
            estado_academico,
            fecha_inicio,
            fecha_fin,
            fecha_retiro,
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
        .in("inscripcion_id_inscripcion", ids)
        .in("estado_academico", ["APROBADA", "REPROBADA"]);

    if (detErr) throw detErr;

    const map = new Map();
    for (const i of ins) map.set(i.id_inscripcion, { ...i, materias: [] });

    const materiasIds = (det || []).map((x) => x.materia_id_materia);
    const inscritosMap = await inscritosPorMaterias(materiasIds);
    const reqMap = await requisitosPorMaterias(materiasIds);

    for (const d of (det || [])) {
        const row = map.get(d.inscripcion_id_inscripcion);
        if (!row) continue;

        const m = d.materia;
        row.materias.push({
            inscripcion_id_inscripcion: d.inscripcion_id_inscripcion,
            materia_id_materia: d.materia_id_materia,
            estado: d.estado,
            estado_academico: d.estado_academico,
            fecha_inicio: d.fecha_inicio,
            fecha_fin: d.fecha_fin,
            fecha_retiro: d.fecha_retiro,
            materia: m
                ? mapMateriaLikeUI(m, inscritosMap[m.id_materia] || 0, reqMap[m.id_materia] || [])
                : null,
        });
    }

    return Array.from(map.values()).filter((x) => x.materias.length > 0);
}

async function listarMateriasRetiradas(ci_estudiante) {
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
            estado_academico,
            fecha_inicio,
            fecha_fin,
            fecha_retiro,
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
        .in("inscripcion_id_inscripcion", ids)
        .eq("estado_academico", "RETIRADO");

    if (detErr) throw detErr;

    const map = new Map();
    for (const i of ins) map.set(i.id_inscripcion, { ...i, materias: [] });

    const materiasIds = (det || []).map((x) => x.materia_id_materia);
    const inscritosMap = await inscritosPorMaterias(materiasIds);
    const reqMap = await requisitosPorMaterias(materiasIds);

    for (const d of (det || [])) {
        const row = map.get(d.inscripcion_id_inscripcion);
        if (!row) continue;

        const m = d.materia;
        row.materias.push({
            inscripcion_id_inscripcion: d.inscripcion_id_inscripcion,
            materia_id_materia: d.materia_id_materia,
            estado: d.estado,
            estado_academico: d.estado_academico,
            fecha_inicio: d.fecha_inicio,
            fecha_fin: d.fecha_fin,
            fecha_retiro: d.fecha_retiro,
            materia: m
                ? mapMateriaLikeUI(m, inscritosMap[m.id_materia] || 0, reqMap[m.id_materia] || [])
                : null,
        });
    }

    return Array.from(map.values()).filter((x) => x.materias.length > 0);
}

async function listarEstadoAcademico(ci_estudiante) {
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
            estado_academico,
            fecha_inicio,
            fecha_fin,
            fecha_retiro,
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
        .in("inscripcion_id_inscripcion", ids)
        .in("estado_academico", ["EN_CURSO", "APROBADA", "REPROBADA"]);

    if (detErr) throw detErr;

    const map = new Map();
    for (const i of ins) map.set(i.id_inscripcion, { ...i, materias: [] });

    const materiasIds = (det || []).map((x) => x.materia_id_materia);
    const inscritosMap = await inscritosPorMaterias(materiasIds);
    const reqMap = await requisitosPorMaterias(materiasIds);

    for (const d of (det || [])) {
        const row = map.get(d.inscripcion_id_inscripcion);
        if (!row) continue;

        const m = d.materia;
        row.materias.push({
            inscripcion_id_inscripcion: d.inscripcion_id_inscripcion,
            materia_id_materia: d.materia_id_materia,
            estado: d.estado,
            estado_academico: d.estado_academico,
            fecha_inicio: d.fecha_inicio,
            fecha_fin: d.fecha_fin,
            fecha_retiro: d.fecha_retiro,
            materia: m
                ? mapMateriaLikeUI(m, inscritosMap[m.id_materia] || 0, reqMap[m.id_materia] || [])
                : null,
        });
    }

    return Array.from(map.values()).filter((x) => x.materias.length > 0);
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
    actualizarEstadosAcademicos,
    listarMateriasEnCurso,
    listarMateriasCulminadas,
    listarMateriasRetiradas,
    listarEstadoAcademico,
};