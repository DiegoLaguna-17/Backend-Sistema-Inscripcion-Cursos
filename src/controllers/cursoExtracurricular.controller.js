const supabase = require("../config/supabase");
const service = require("../services/cursoExtracurricular.service");

function httpError(status, message, data = null) {
    const e = new Error(message);
    e.status = status;
    e.data = data;
    return e;
}




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
        const data = await service.crear(req.body);  // ← Usar el servicio
        res.status(201).json(data);
    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
    try {
        const data = await service.listar();  // ← hay que usar el servicio 
        res.json(data);
    } catch (error) {
        next(error);
    }
}

async function obtenerPorId(req, res, next) {
    try {
        const data = await service.obtenerPorId(req.params.id);  // ← Usar el servicio
        res.json(data);
    } catch (error) {
        next(error);
    }
}

async function actualizar(req, res, next) {
    try {
        const data = await service.actualizar(req.params.id, req.body);  // ← Usar el servicio
        res.json(data);
    } catch (error) {
        next(error);
    }
}

async function eliminar(req, res, next) {
    try {
        const result = await service.eliminar(req.params.id);  // ← Usar el servicio
        res.json(result);
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    crear, 
    listar, 
    obtenerPorId, 
    actualizar, 
    eliminar 
};