// services/curso.service.js
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
    carrera:carrera_codigo ( codigo, nombre, descripcion, duracion ),
    materia_requisito!materia_id_materia ( 
        requisito_id_materia,
        requisito:requisito_id_materia ( id_materia, nombre )
    )
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

// Opcional (recomendado): validar que el código sea tipo SIS-111
function validarCodigoMateria(c) {
    return typeof c === "string" && /^[A-Z]{2,6}-\d{1,6}$/i.test(c.trim());
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

async function docenteExiste(ci) {
    const { data, error } = await supabase
        .from("usuario")
        .select("ci, estado, rol!inner(rol)")
        .eq("ci", String(ci))
        .eq("estado", true)
        .eq("rol.rol", "docente")
        .maybeSingle();

    if (error) throw error;
    return !!data;
}

async function existeCursoPorId(id_materia) {
    const { data, error } = await supabase
        .from("materia")
        .select("id_materia")
        .eq("id_materia", String(id_materia))
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

    // ✅ id_materia ahora es TEXT
    if (exceptId !== null) q = q.neq("id_materia", String(exceptId));

    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return !!data;
}

async function getCursoById(id) {
    const { data, error } = await supabase
        .from("materia")
        .select(SELECT_CURSO)
        .eq("id_materia", String(id)) // ✅ TEXT
        .maybeSingle();

    if (error) throw error;
    return data;
}

// Crear curso por carrera
async function crearCurso(payload) {
    const required = [
        "id_materia",     
        "usuario_ci",
        // carrera_codigo es condicional (requerido si tipo='Obligatoria', null si tipo='Extracurricular')
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

    // Validar tipo
    const tiposPermitidos = ["Obligatoria", "Extracurricular"];
    if (!tiposPermitidos.includes(payload.tipo)) {
        erroresValidacion.push("tipo debe ser 'Obligatoria' o 'Extracurricular'");
    }

    // Validar lógica de carrera_codigo según tipo
    if (payload.tipo === "Obligatoria") {
        if (!payload.carrera_codigo || payload.carrera_codigo === null) {
            erroresValidacion.push("carrera_codigo es requerido cuando tipo='Obligatoria'");
        }
    } else if (payload.tipo === "Extracurricular") {
        if (payload.carrera_codigo !== null && payload.carrera_codigo !== undefined) {
            erroresValidacion.push("carrera_codigo debe ser null cuando tipo='Extracurricular'");
        }
    }

    if (!validarCodigoMateria(payload.id_materia)) {
        erroresValidacion.push("id_materia debe tener formato tipo SIS-111");
    }

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
    if (payload.carrera_codigo && !(await carreraExiste(payload.carrera_codigo))) {
        throw makeError(422, "Error de validación en los datos enviados", { errores: ["carrera_codigo inválido (no existe)"] });
    }
    if (!(await aulaExiste(payload.aula_id_aula))) {
        throw makeError(422, "Error de validación en los datos enviados", { errores: ["aula_id_aula inválido (no existe)"] });
    }
        if (!(await docenteExiste(payload.usuario_ci))) {
        throw makeError(422, "Error de validación en los datos enviados", {
            errores: ["usuario_ci inválido (docente no existe o está inactivo)"]
        });
}
    if (await existeCursoPorId(payload.id_materia)) {
        throw makeError(409, "El registro ya existe en el sistema");
    }

    // Solo validar duplicado por nombre si tiene carrera
    if (payload.carrera_codigo && await existeCursoMismoNombreEnCarrera(payload.nombre, payload.carrera_codigo)) {
        throw makeError(409, "El registro ya existe en el sistema");
    }

    // Validar requisitos (opcional)
    let requisitosValidados = [];
    if (payload.requisitos && Array.isArray(payload.requisitos) && payload.requisitos.length > 0) {
        for (const reqId of payload.requisitos) {
            if (!(await existeCursoPorId(reqId))) {
                erroresValidacion.push(`requisito '${reqId}' no existe en la base de datos`);
            } else {
                requisitosValidados.push(reqId);
            }
        }
    }

    if (erroresValidacion.length) {
        throw makeError(422, "Error de validación en los datos enviados", { errores: erroresValidacion });
    }

    const { data, error } = await supabase
        .from("materia")
        .insert([{
            id_materia: String(payload.id_materia).trim(), 
            usuario_ci: String(payload.usuario_ci),
            carrera_codigo: payload.carrera_codigo || null,
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

    // Insertar requisitos si los hay
    if (requisitosValidados.length > 0) {
        const requisitosInsert = requisitosValidados.map(reqId => ({
            materia_id_materia: String(payload.id_materia).trim(),
            requisito_id_materia: String(reqId)
        }));

        const { error: errorRequisitos } = await supabase
            .from("materia_requisito")
            .insert(requisitosInsert);

        if (errorRequisitos) {
            // Si falla la inserción de requisitos, intentar eliminar la materia creada
            await supabase.from("materia").delete().eq("id_materia", String(payload.id_materia).trim());
            throw makeError(500, "Error al registrar los requisitos", { error: errorRequisitos.message });
        }
    }

    return data;
}

async function listarCursos({ carrera_codigo } = {}) {
    let q = supabase
        .from("materia")
        .select(SELECT_CURSO)
        .order("id_materia", { ascending: false })
        .not("carrera_codigo", "is", null);

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

    if (payload.id_materia !== undefined && String(payload.id_materia) !== String(id)) {
        throw makeError(403, "No se puede modificar este campo", { campo: "id_materia" });
    }

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
        "requisitos", // Array de id_materia
    ];

    const updates = {};
    let requisitosNuevos = null;
    
    for (const k of allowed) {
        if (payload[k] !== undefined) {
            if (k === "requisitos") {
                requisitosNuevos = payload[k]; // Procesar aparte
            } else {
                updates[k] = payload[k];
            }
        }
    }

    // sin cambios
    if (Object.keys(updates).length === 0 && requisitosNuevos === null) {
        return { sinCambios: true, data: actual };
    }

    // Validaciones 
    const erroresValidacion = [];

    // Validar tipo si se actualiza
    if (updates.tipo !== undefined) {
        const tiposPermitidos = ["Obligatoria", "Extracurricular"];
        if (!tiposPermitidos.includes(updates.tipo)) {
            erroresValidacion.push("tipo debe ser 'Obligatoria' o 'Extracurricular'");
        }
    }

    // Validar lógica de carrera_codigo vs tipo
    const tipoFinal = updates.tipo ?? actual.tipo;
    const carreraFinal = updates.carrera_codigo !== undefined ? updates.carrera_codigo : actual.carrera_codigo;

    if (tipoFinal === "Obligatoria") {
        if (!carreraFinal || carreraFinal === null) {
            erroresValidacion.push("carrera_codigo es requerido cuando tipo='Obligatoria'");
        }
    } else if (tipoFinal === "Extracurricular") {
        if (carreraFinal !== null) {
            erroresValidacion.push("carrera_codigo debe ser null cuando tipo='Extracurricular'");
        }
    }

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
    if (updates.carrera_codigo !== undefined && updates.carrera_codigo !== null) {
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
        if (!(await docenteExiste(updates.usuario_ci))) {
            erroresValidacion.push("usuario_ci inválido (docente no existe o está inactivo)");
        } else {
            updates.usuario_ci = String(updates.usuario_ci);
        }
        }

    if (erroresValidacion.length) {
        throw makeError(422, "Datos inválidos para la actualización", { errores: erroresValidacion });
    }

    // Validar requisitos si se actualizan
    let requisitosValidados = [];
    if (requisitosNuevos !== null) {
        if (Array.isArray(requisitosNuevos)) {
            for (const reqId of requisitosNuevos) {
                if (!(await existeCursoPorId(reqId))) {
                    throw makeError(422, "Datos inválidos para la actualización", { 
                        errores: [`requisito '${reqId}' no existe en la base de datos`] 
                    });
                }
                requisitosValidados.push(reqId);
            }
        } else {
            throw makeError(422, "Datos inválidos para la actualización", { 
                errores: ["requisitos debe ser un array"] 
            });
        }
    }

    // Duplicado por carrera (si cambian nombre/carrera) - solo si tiene carrera
    const nombreFinal = updates.nombre ?? actual.nombre;

    if (carreraFinal && await existeCursoMismoNombreEnCarrera(nombreFinal, carreraFinal, String(id))) {
        throw makeError(409, "Los datos a actualizar ya existen en otro registro");
    }

    const { data, error } = await supabase
        .from("materia")
        .update(updates)
        .eq("id_materia", String(id)) // ✅ TEXT
        .select(SELECT_CURSO)
        .single();

    if (error) throw error;

    // Actualizar requisitos si se especificaron
    if (requisitosNuevos !== null) {
        // Eliminar requisitos anteriores
        await supabase
            .from("materia_requisito")
            .delete()
            .eq("materia_id_materia", String(id));

        // Insertar nuevos requisitos
        if (requisitosValidados.length > 0) {
            const requisitosInsert = requisitosValidados.map(reqId => ({
                materia_id_materia: String(id),
                requisito_id_materia: String(reqId)
            }));

            const { error: errorRequisitos } = await supabase
                .from("materia_requisito")
                .insert(requisitosInsert);

            if (errorRequisitos) {
                throw makeError(500, "Error al actualizar los requisitos", { error: errorRequisitos.message });
            }
        }
    }

    return { sinCambios: false, data };
}

// Eliminar curso (id texto)
async function eliminarCurso(id) {
    const actual = await getCursoById(id);
    if (!actual) throw makeError(404, "No se puede eliminar: el registro no existe");

    const { error } = await supabase
        .from("materia")
        .delete()
        .eq("id_materia", String(id)); // ✅ TEXT

    if (error) throw error;

    return { deleted: true, id: String(id) };
}

module.exports = {
    crearCurso,
    listarCursos,
    obtenerCurso,
    actualizarCurso,
    eliminarCurso,
};