const supabase = require("../config/supabase");

// Campos a seleccionar en consultas de curso (incluye joins)
const SELECT_CURSO = `
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
    carrera:carrera_codigo ( codigo, nombre, descripcion, duracion )
`;

function makeError(status, message, data = null) {
    const err = new Error(message);
    err.status = status;
    err.data = data;
    return err;
}

function validarHora(h) {
    return typeof h === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(h);
}

function validarFecha(f) {
    return typeof f === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f);
}

async function carreraExiste(codigo) {
const { data, error } = await supabase
    .from("carrera")
    .select("codigo")
    .eq("codigo", codigo)
    .maybeSingle();
    if (error) throw error;
    return !!data;
}

async function aulaExiste(id) {
const { data, error } = await supabase
    .from("aula")
    .select("id_aula")
    .eq("id_aula", Number(id))
    .maybeSingle();
    if (error) throw error;
    return !!data;
}

async function usuarioExiste(ci) {
const { data, error } = await supabase
    .from("usuario")
    .select("ci")
    .eq("ci", String(ci))
    .maybeSingle();
    if (error) throw error;
    return !!data;
}

async function existeCursoMismoNombreEnCarrera(nombre, carrera_codigo, exceptId = null) {
let q = supabase
    .from("materia")
    .select("id_materia")
    .eq("carrera_codigo", carrera_codigo)
    .ilike("nombre", nombre);

    if (exceptId !== null) q = q.neq("id_materia", Number(exceptId));

    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return !!data;
    }

async function getCursoById(id) {
const { data, error } = await supabase
    .from("materia")
    .select(SELECT_CURSO)
    .eq("id_materia", Number(id))
    .maybeSingle();

    if (error) throw error;
    return data;
}

// Crear curso por carrera
async function crearCurso(payload) {
const required = [
    "usuario_ci",
    "carrera_codigo",
    "nombre",
    "tipo",
    "cupo",
    "dia",
    "hora_inicio",
    "hora_fin",
    "fecha_inicio",
    "fecha_fin",
    "monto",
    "aula_id_aula",
];

const faltantes = required.filter(
    (k) => payload[k] === undefined || payload[k] === null || payload[k] === ""
);

if (faltantes.length) {
    throw makeError(400, "Faltan campos requeridos", { campos_faltantes: faltantes });
}

  // Validaciones de formato 
const erroresValidacion = [];

if (!Number.isInteger(Number(payload.cupo)) || Number(payload.cupo) <= 0) {
    erroresValidacion.push("cupo debe ser un entero > 0");
}

if (Number.isNaN(Number(payload.monto)) || Number(payload.monto) < 0) {
    erroresValidacion.push("monto debe ser un número válido (>= 0)");
}

if (!validarHora(payload.hora_inicio) || !validarHora(payload.hora_fin)) {
    erroresValidacion.push("hora_inicio y hora_fin deben ser HH:MM o HH:MM:SS");
}

if (!validarFecha(payload.fecha_inicio) || !validarFecha(payload.fecha_fin)) {
    erroresValidacion.push("fecha_inicio y fecha_fin deben ser YYYY-MM-DD");
}

if (erroresValidacion.length) {
    throw makeError(422, "Error de validación en los datos enviados", { errores: erroresValidacion });
}

  // Validaciones de llaves foraneas
if (!(await carreraExiste(payload.carrera_codigo))) {
    throw makeError(422, "Error de validación en los datos enviados", { errores: ["carrera_codigo inválido (no existe)"] });
}
if (!(await aulaExiste(payload.aula_id_aula))) {
    throw makeError(422, "Error de validación en los datos enviados", { errores: ["aula_id_aula inválido (no existe)"] });
}
if (!(await usuarioExiste(payload.usuario_ci))) {
    throw makeError(422, "Error de validación en los datos enviados", { errores: ["usuario_ci inválido (no existe)"] });
}

  // Duplicado (mismo nombre dentro de misma carrera)
if (await existeCursoMismoNombreEnCarrera(payload.nombre, payload.carrera_codigo)) {
    throw makeError(409, "El registro ya existe en el sistema");
}

const { data, error } = await supabase
    .from("materia")
    .insert([{
        usuario_ci: String(payload.usuario_ci),
        carrera_codigo: payload.carrera_codigo,
        nombre: payload.nombre,
        tipo: payload.tipo,
        cupo: Number(payload.cupo),
        dia: payload.dia,
        hora_inicio: payload.hora_inicio,
        hora_fin: payload.hora_fin,
        fecha_inicio: payload.fecha_inicio,
        fecha_fin: payload.fecha_fin,
        monto: Number(payload.monto),
        aula_id_aula: Number(payload.aula_id_aula),
    }])
    .select(SELECT_CURSO)
    .single();

if (error) throw error;
    return data;
}

// Obtener curso por codigo de carrera  
async function listarCursos({ carrera_codigo } = {}) {
    let q = supabase
        .from("materia")
        .select(SELECT_CURSO)
        .order("id_materia", { ascending: false });

    if (carrera_codigo) q = q.eq("carrera_codigo", carrera_codigo);

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
}

// Obtener curso por id
async function obtenerCurso(id) {
    const curso = await getCursoById(id);
    if (!curso) throw makeError(404, "No se encontró el registro");
    return curso;
}

// Modificar curso
async function actualizarCurso(id, payload) {
    const actual = await getCursoById(id);
    if (!actual) throw makeError(404, "No se puede actualizar: el registro no existe");

    const allowed = [
        "usuario_ci",
        "carrera_codigo",
        "nombre",
        "tipo",
        "cupo",
        "dia",
        "hora_inicio",
        "hora_fin",
        "fecha_inicio",
        "fecha_fin",
        "monto",
        "aula_id_aula",
    ];

const updates = {};
    for (const k of allowed) {
    if (payload[k] !== undefined) updates[k] = payload[k];
}

    // sin cambios
    if (Object.keys(updates).length === 0) {
        return { sinCambios: true, data: actual };
    }

    // Validaciones (solo si llegan)
    const erroresValidacion = [];

    if (updates.cupo !== undefined) {
        if (!Number.isInteger(Number(updates.cupo)) || Number(updates.cupo) <= 0) {
        erroresValidacion.push("cupo debe ser un entero > 0");
        } else {
        updates.cupo = Number(updates.cupo);
        }
    }

    if (updates.monto !== undefined) {
        if (Number.isNaN(Number(updates.monto)) || Number(updates.monto) < 0) {
        erroresValidacion.push("monto debe ser un número válido (>= 0)");
        } else {
        updates.monto = Number(updates.monto);
        }
    }

    if (updates.hora_inicio !== undefined && !validarHora(updates.hora_inicio)) {
        erroresValidacion.push("hora_inicio debe ser HH:MM o HH:MM:SS");
    }
    if (updates.hora_fin !== undefined && !validarHora(updates.hora_fin)) {
        erroresValidacion.push("hora_fin debe ser HH:MM o HH:MM:SS");
    }

    if (updates.fecha_inicio !== undefined && !validarFecha(updates.fecha_inicio)) {
        erroresValidacion.push("fecha_inicio debe ser YYYY-MM-DD");
    }
    if (updates.fecha_fin !== undefined && !validarFecha(updates.fecha_fin)) {
        erroresValidacion.push("fecha_fin debe ser YYYY-MM-DD");
    }

    // FK checks si cambian
    if (updates.carrera_codigo !== undefined) {
        if (!(await carreraExiste(updates.carrera_codigo))) {
        erroresValidacion.push("carrera_codigo inválido (no existe)");
        }
    }
    if (updates.aula_id_aula !== undefined) {
        if (!(await aulaExiste(updates.aula_id_aula))) {
        erroresValidacion.push("aula_id_aula inválido (no existe)");
        } else {
        updates.aula_id_aula = Number(updates.aula_id_aula);
        }
    }
    if (updates.usuario_ci !== undefined) {
        if (!(await usuarioExiste(updates.usuario_ci))) {
        erroresValidacion.push("usuario_ci inválido (no existe)");
        } else {
        updates.usuario_ci = String(updates.usuario_ci);
        }
    }

    if (erroresValidacion.length) {
        throw makeError(422, "Datos inválidos para la actualización", { errores: erroresValidacion });
    }

    // Duplicado por carrera (si cambian nombre/carrera)
    const carreraFinal = updates.carrera_codigo ?? actual.carrera_codigo;
    const nombreFinal = updates.nombre ?? actual.nombre;

    if (await existeCursoMismoNombreEnCarrera(nombreFinal, carreraFinal, Number(id))) {
        throw makeError(409, "Los datos a actualizar ya existen en otro registro");
    }

    const { data, error } = await supabase
        .from("materia")
        .update(updates)
        .eq("id_materia", Number(id))
        .select(SELECT_CURSO)
        .single();

    if (error) throw error;
    return { sinCambios: false, data };
    }

// Eliminar curso
async function eliminarCurso(id) {
const actual = await getCursoById(id);
    if (!actual) throw makeError(404, "No se puede eliminar: el registro no existe");

const { error } = await supabase
    .from("materia")
    .delete()
    .eq("id_materia", Number(id));

    if (error) throw error;

    return { deleted: true, id: Number(id) };
}

module.exports = {
    crearCurso,
    listarCursos,
    obtenerCurso,
    actualizarCurso,
    eliminarCurso,
};