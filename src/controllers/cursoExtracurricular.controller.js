const supabase = require("../config/supabase");

function httpError(status, message, data = null) {
    const e = new Error(message);
    e.status = status;
    e.data = data;
    return e;
}

const SELECT_CURSO_EXTRA = `
id_materia,
usuario_ci,
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
carrera_codigo
`;


function validarCodigoMateria(c) {
    return typeof c === "string" && /^[A-Z]{2,6}-\d{1,6}$/i.test(c.trim());
}

function validarPayloadCrear(p) {
const faltantes = [];
const requeridos = [
    "id_materia",
    "usuario_ci",
    "nombre",
    "cupo",
    "dia",
    "hora_inicio",
    "hora_fin",
    "fecha_inicio",
    "fecha_fin",
    "monto",
    "aula_id_aula",
];

for (const k of requeridos) {
    if (p[k] === undefined || p[k] === null || p[k] === "") faltantes.push(k);
}

    if (faltantes.length) {
    throw httpError(400, "Faltan campos requeridos", { campos_faltantes: faltantes });
    }

  // Validación de formato de id_materia
    if (!validarCodigoMateria(p.id_materia)) {
        throw httpError(422, "Error de validación en los datos enviados", {
        errores: ["id_materia debe tener formato tipo SIS-111"],
        });
    }

    // Validaciones simples de formato
    if (Number.isNaN(Number(p.cupo)) || Number(p.cupo) <= 0) {
        throw httpError(422, "Error de validación en los datos enviados", {
        errores: ["cupo debe ser número > 0"],
        });
    }
    if (Number.isNaN(Number(p.monto)) || Number(p.monto) < 0) {
        throw httpError(422, "Error de validación en los datos enviados", {
        errores: ["monto debe ser número >= 0"],
        });
    }
}

async function validarFKs(payload) {
  // validar aula existe
const { data: aula, error: aulaErr } = await supabase
    .from("aula")
    .select("id_aula")
    .eq("id_aula", Number(payload.aula_id_aula))
    .maybeSingle();

    if (aulaErr) throw aulaErr;
    if (!aula)
        throw httpError(422, "Error de validación en los datos enviados", {
        errores: ["aula_id_aula inválido (no existe)"],
});

  // validar docente/usuario responsable existe
const { data: usuario, error: userErr } = await supabase
    .from("usuario")
    .select("ci")
    .eq("ci", String(payload.usuario_ci))
    .maybeSingle();

    if (userErr) throw userErr;
    if (!usuario)
        throw httpError(422, "Error de validación en los datos enviados", {
        errores: ["usuario_ci inválido (no existe)"],
        });
    }

async function existeDuplicadoNombreExtra(nombre, exceptId = null) {
    let q = supabase
    .from("materia")
    .select("id_materia")
    .ilike("nombre", nombre)
    .eq("tipo", "EXTRACURRICULAR")
    .is("carrera_codigo", null);


    if (exceptId !== null) q = q.neq("id_materia", String(exceptId));

const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return !!data;
}

async function existePorId(id_materia) {
const { data, error } = await supabase
    .from("materia")
    .select("id_materia")
    .eq("id_materia", String(id_materia))
    .maybeSingle();

    if (error) throw error;
    return !!data;
}
async function crear(req, res, next) {
    try {
        const payload = req.body;

        validarPayloadCrear(payload);
        await validarFKs(payload);

        if (
            payload.carrera_codigo !== undefined &&
            payload.carrera_codigo !== null &&
            payload.carrera_codigo !== ""
        ) {
            throw httpError(403, "No se puede modificar este campo", { campo: "carrera_codigo" });
        }

        if (await existePorId(payload.id_materia)) {
            throw httpError(409, "El registro ya existe en el sistema");
        }

        if (await existeDuplicadoNombreExtra(payload.nombre)) {
            throw httpError(409, "El registro ya existe en el sistema");
        }

        const insertData = {
            id_materia: String(payload.id_materia).trim(),
            usuario_ci: String(payload.usuario_ci),
            carrera_codigo: null,
            nombre: payload.nombre,
            tipo: "EXTRACURRICULAR",
            cupo: Number(payload.cupo),
            dia: payload.dia,
            hora_inicio: payload.hora_inicio,
            hora_fin: payload.hora_fin,
            fecha_inicio: payload.fecha_inicio,
            fecha_fin: payload.fecha_fin,
            monto: Number(payload.monto),
            aula_id_aula: Number(payload.aula_id_aula),
        };

        const { data, error } = await supabase
            .from("materia")
            .insert([insertData])
            .select(SELECT_CURSO_EXTRA)
            .single();

        if (error) throw error;

        res.status(201).json(data);

    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("materia")
      .select(SELECT_CURSO_EXTRA)
      .eq("tipo", "EXTRACURRICULAR")
      .is("carrera_codigo", null)
      .order("nombre", { ascending: true });

    if (error) throw error;

    res.json(data || []);

  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(id) {
const { data, error } = await supabase
    .from("materia")
    .select(SELECT_CURSO_EXTRA)
    .eq("id_materia", String(id)) // ✅ TEXT
    .eq("tipo", "EXTRACURRICULAR")
    .is("carrera_codigo", null)
    .maybeSingle();

    if (error) throw error;
    if (!data) throw httpError(404, "No se encontraron registros", null);
    return data;
}

async function actualizar(id, payload) {
    const actual = await obtenerPorId(id);

    if (payload.carrera_codigo !== undefined) {
        throw httpError(403, "No se puede modificar este campo", { campo: "carrera_codigo" });
    }
    if (payload.tipo !== undefined) {
        throw httpError(403, "No se puede modificar este campo", { campo: "tipo" });
    }
    if (payload.id_materia !== undefined && String(payload.id_materia) !== String(id)) {
        throw httpError(403, "No se puede modificar este campo", { campo: "id_materia" });
    }

const updates = {};
const permitidos = [
    "usuario_ci",
    "nombre",
    "cupo",
    "dia",
    "hora_inicio",
    "hora_fin",
    "fecha_inicio",
    "fecha_fin",
    "monto",
    "aula_id_aula",
];
for (const k of permitidos) {
    if (payload[k] !== undefined) updates[k] = payload[k];
}

if (Object.keys(updates).length === 0) {
    return actual;
}

if (updates.aula_id_aula !== undefined || updates.usuario_ci !== undefined) {
    await validarFKs({
        aula_id_aula: updates.aula_id_aula ?? actual.aula_id_aula,
        usuario_ci: updates.usuario_ci ?? actual.usuario_ci,
        });
    }

    // Duplicado si cambia nombre
    if (updates.nombre && updates.nombre.toLowerCase() !== String(actual.nombre).toLowerCase()) {
        if (await existeDuplicadoNombreExtra(updates.nombre, String(id))) {
        throw httpError(409, "Los datos a actualizar ya existen en otro registro");
        }
    }


    if (updates.cupo !== undefined) updates.cupo = Number(updates.cupo);
    if (updates.monto !== undefined) updates.monto = Number(updates.monto);
    if (updates.aula_id_aula !== undefined) updates.aula_id_aula = Number(updates.aula_id_aula);
    if (updates.usuario_ci !== undefined) updates.usuario_ci = String(updates.usuario_ci);

const { data, error } = await supabase
    .from("materia")
    .update(updates)
    .eq("id_materia", String(id)) // ✅ TEXT
    .select(SELECT_CURSO_EXTRA)
    .single();

    if (error) throw error;
    return data;
}

async function eliminar(id) {
    await obtenerPorId(id);

const { error } = await supabase
    .from("materia")
    .delete()
    .eq("id_materia", String(id));

    if (error) throw error;
    return { deleted: true, id: String(id) };
}

module.exports = { crear, listar, obtenerPorId, actualizar, eliminar };