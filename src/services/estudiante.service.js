const bcrypt = require("bcrypt");
const supabase = require("../config/supabase");

const SALT_ROUNDS = 10;

async function getRolIdByName(nombreRol) {
    const { data, error } = await supabase
        .from("rol")
        .select("id_rol, rol")
        .ilike("rol", nombreRol)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err = new Error(`No existe el rol '${nombreRol}' en la tabla rol`);
        err.status = 400;
        throw err;
    }
    return data.id_rol;
}

async function findUserByCI(ci) {
    const { data, error } = await supabase
        .from("usuario")
        .select("*")
        .eq("ci", String(ci))
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function validateCarreraCodigo(codigo) {
    if (codigo === undefined) return undefined;
    if (codigo === null || codigo === "") return null;

    const { data, error } = await supabase
        .from("carrera")
        .select("codigo")
        .eq("codigo", codigo)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err = new Error("La carrera no existe (código inválido)");
        err.status = 400;
        throw err;
    }
    return data.codigo;
}

const SELECT_ESTUDIANTE_CON_CARRERA = `
    ci, rol_id_rol, nombre, correo, telefono, fecha_nac, direccion, carrera_usuario, estado,
    carrera:carrera_usuario (
        codigo,
        nombre,
        descripcion,
        duracion
    )
`;

async function createStudent(payload) {
    const {
        ci,
        nombre,
        correo,
        telefono,
        contrasenia,
        fecha_nac,
        direccion,
        carrera_usuario,
        carrera,
    } = payload;

    if (!ci || !nombre || !correo || !contrasenia) {
        const camposFaltantes = [];
        if (!ci) camposFaltantes.push("ci");
        if (!nombre) camposFaltantes.push("nombre");
        if (!correo) camposFaltantes.push("correo");
        if (!contrasenia) camposFaltantes.push("contrasenia");

        const err = new Error("Faltan campos requeridos");
        err.status = 400;
        err.data = { camposFaltantes };
        throw err;
    }

    const existingCI = await findUserByCI(ci);
    if (existingCI) {
        const err = new Error("El registro ya existe en el sistema");
        err.status = 409;
        throw err;
    }

    const { data: existingEmail, error: errEmail } = await supabase
        .from("usuario")
        .select("correo")
        .eq("correo", correo)
        .maybeSingle();

    if (errEmail) throw errEmail;
    if (existingEmail) {
        const err = new Error("El registro ya existe en el sistema");
        err.status = 409;
        throw err;
    }

    const rol_id_rol = await getRolIdByName("ESTUDIANTE");
    const passwordHash = await bcrypt.hash(contrasenia, SALT_ROUNDS);
    const codigoCarrera = await validateCarreraCodigo(carrera_usuario ?? carrera);

    const { data, error } = await supabase
        .from("usuario")
        .insert([{
            ci: String(ci),
            rol_id_rol,
            nombre,
            correo,
            telefono: telefono ?? null,
            contrasenia: passwordHash,
            fecha_nac: fecha_nac ?? null,
            direccion: direccion ?? null,
            carrera_usuario: codigoCarrera ?? null,
            estado: true,
        }])
        .select(SELECT_ESTUDIANTE_CON_CARRERA)
        .single();

    if (error) throw error;
    return data;
}

async function listStudents() {
    const rol_id_rol = await getRolIdByName("ESTUDIANTE");

    const { data, error } = await supabase
        .from("usuario")
        .select(SELECT_ESTUDIANTE_CON_CARRERA)
        .eq("rol_id_rol", rol_id_rol)
        .eq("estado", true)
        .order("nombre", { ascending: true });

    if (error) throw error;
    return data;
}

async function getStudentByCI(ci) {
    const rol_id_rol = await getRolIdByName("ESTUDIANTE");

    const { data, error } = await supabase
        .from("usuario")
        .select(SELECT_ESTUDIANTE_CON_CARRERA)
        .eq("ci", String(ci))
        .eq("rol_id_rol", rol_id_rol)
        .eq("estado", true)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err = new Error("Registro no encontrado");
        err.status = 404;
        throw err;
    }
    return data;
}

async function updateStudent(ci, payload) {
    const existing = await findUserByCI(ci);
    if (!existing || existing.estado === false) {
        const err = new Error("Registro no encontrado");
        err.status = 404;
        throw err;
    }

    const updates = {};
    if (payload.nombre !== undefined) updates.nombre = payload.nombre;
    if (payload.correo !== undefined) updates.correo = payload.correo;
    if (payload.telefono !== undefined) updates.telefono = payload.telefono;
    if (payload.fecha_nac !== undefined) updates.fecha_nac = payload.fecha_nac;
    if (payload.direccion !== undefined) updates.direccion = payload.direccion;

    if (payload.contrasenia) {
        updates.contrasenia = await bcrypt.hash(payload.contrasenia, SALT_ROUNDS);
    }

    if (Object.keys(updates).length === 0) {
        const err = new Error("Faltan campos requeridos");
        err.status = 400;
        err.data = { mensaje: "No se enviaron campos para actualizar" };
        throw err;
    }

    if (updates.correo && updates.correo !== existing.correo) {
        const { data: emailTaken, error: emailErr } = await supabase
            .from("usuario")
            .select("correo")
            .eq("correo", updates.correo)
            .maybeSingle();

        if (emailErr) throw emailErr;
        if (emailTaken) {
            const err = new Error("El registro ya existe en el sistema");
            err.status = 409;
            throw err;
        }
    }

    const { data, error } = await supabase
        .from("usuario")
        .update(updates)
        .eq("ci", String(ci))
        .select(SELECT_ESTUDIANTE_CON_CARRERA)
        .single();

    if (error) throw error;
    return data;
}

async function deleteStudent(ci) {
    const existing = await findUserByCI(ci);

    if (!existing || existing.estado === false) {
        const err = new Error("Registro no encontrado");
        err.status = 404;
        throw err;
    }

    const { data, error } = await supabase
        .from("usuario")
        .update({ estado: false })
        .eq("ci", String(ci))
        .select("ci, estado")
        .single();

    if (error) throw error;
    return { deleted: true, ci: data.ci, estado: data.estado };
}

async function assignCarrera(ci, payload, user) {
    const esMismoEstudiante = user && String(user.ci) === String(ci);
    const esAdmin = user && String(user.rol_id_rol) === "1";

    if (!esMismoEstudiante && !esAdmin) {
        const err = new Error("No autorizado");
        err.status = 403;
        throw err;
    }

    const codigo = payload.carrera_usuario;

    if (codigo === undefined || codigo === null || String(codigo).trim() === "") {
        const err = new Error("Faltan campos requeridos");
        err.status = 400;
        err.data = { camposFaltantes: ["carrera_usuario"] };
        throw err;
    }

    const codigoCarrera = await validateCarreraCodigo(String(codigo).trim());
    if (!codigoCarrera) {
        const err = new Error("Formato de datos inválido");
        err.status = 400;
        err.data = { erroresDeFormato: ["El código de carrera no existe"] };
        throw err;
    }

    const { data, error } = await supabase
        .from("usuario")
        .update({ carrera_usuario: codigoCarrera })
        .eq("ci", String(ci))
        .select(SELECT_ESTUDIANTE_CON_CARRERA)
        .single();

    if (error) throw error;
    return data;
}

async function inscribirseCarrera(ci, payload) {
    const existing = await findUserByCI(ci);
    if (!existing || existing.estado === false) {
        const err = new Error("Registro no encontrado");
        err.status = 404;
        throw err;
    }

    if (existing.carrera_usuario) {
        const err = new Error("El registro ya existe en el sistema");
        err.status = 409;
        throw err;
    }

    const codigo = payload.codigo_carrera || payload.carrera_usuario;

    if (!codigo || String(codigo).trim() === "") {
        const err = new Error("Faltan campos requeridos");
        err.status = 400;
        err.data = { camposFaltantes: ["codigo_carrera"] };
        throw err;
    }

    const codigoCarrera = await validateCarreraCodigo(String(codigo).trim());
    if (!codigoCarrera) {
        const err = new Error("Formato de datos inválido");
        err.status = 400;
        err.data = { erroresDeFormato: ["El código de carrera no existe"] };
        throw err;
    }

    const { data, error } = await supabase
        .from("usuario")
        .update({ carrera_usuario: codigoCarrera })
        .eq("ci", String(ci))
        .select(SELECT_ESTUDIANTE_CON_CARRERA)
        .single();

    if (error) throw error;
    return data;
}

async function getMiCarrera(ci) {
    const estudiante = await findUserByCI(ci);

    if (!estudiante || estudiante.estado === false) {
        const err = new Error("Registro no encontrado");
        err.status = 404;
        throw err;
    }

    if (!estudiante.carrera_usuario) {
        const err = new Error("No tienes una carrera asignada");
        err.status = 404;
        throw err;
    }

    const { data: carrera, error: errorCarrera } = await supabase
        .from("carrera")
        .select("codigo, nombre, descripcion, duracion")
        .eq("codigo", estudiante.carrera_usuario)
        .single();

    if (errorCarrera) throw errorCarrera;

    const { count: totalMaterias, error: errorTotal } = await supabase
        .from("materia")
        .select("id_materia", { count: "exact", head: true })
        .eq("carrera_codigo", estudiante.carrera_usuario);

    if (errorTotal) throw errorTotal;

    const { data: inscripciones, error: errorInscripciones } = await supabase
        .from("inscripciones_materia")
        .select(`
            estado,
            inscripcion:inscripcion_id_inscripcion!inner(usuario_ci)
        `)
        .eq("inscripcion.usuario_ci", String(ci));

    if (errorInscripciones) throw errorInscripciones;

    const conteo = {
        en_curso: 0,
        aprobadas: 0,
        reprobadas: 0,
        retiradas: 0
    };

    if (inscripciones && inscripciones.length > 0) {
        inscripciones.forEach(inscripcion => {
            const estado = inscripcion.estado?.toUpperCase();

            if (estado === "INSCRITO" || estado === "EN_CURSO") {
                conteo.en_curso++;
            } else if (estado === "APROBADO") {
                conteo.aprobadas++;
            } else if (estado === "REPROBADO") {
                conteo.reprobadas++;
            } else if (estado === "RETIRADO") {
                conteo.retiradas++;
            }
        });
    }

    return {
        carrera,
        total_materias_carrera: totalMaterias || 0,
        materias_por_estado: conteo,
        estudiante: {
            ci: estudiante.ci,
            nombre: estudiante.nombre,
            correo: estudiante.correo
        }
    };
}

async function obtenerNotasPorMateria(estudianteId, materiaId) {
    const { data, error } = await supabase
        .from("notas")
        .select("calificacion")
        .eq("usuario_ci", estudianteId)
        .eq("materia_id_materia", materiaId);

    if (error) {
        throw new Error(error.message);
    }

    return {
        data
    };
}

async function getMiPerfil(ci) {
    const estudiante = await findUserByCI(ci);

    if (!estudiante || estudiante.estado === false) {
        const err = new Error("Registro no encontrado");
        err.status = 404;
        throw err;
    }

    let carreraNombre = null;

    if (estudiante.carrera_usuario) {
        const { data: carrera, error: carreraError } = await supabase
            .from("carrera")
            .select("codigo, nombre")
            .eq("codigo", estudiante.carrera_usuario)
            .maybeSingle();

        if (carreraError) throw carreraError;
        carreraNombre = carrera?.nombre || null;
    }

    const { data: inscripciones, error: inscripcionesError } = await supabase
        .from("inscripcion")
        .select("id_inscripcion")
        .eq("usuario_ci", String(ci));

    if (inscripcionesError) throw inscripcionesError;

    const idsInscripcion = (inscripciones || []).map((item) => item.id_inscripcion);

    if (idsInscripcion.length === 0) {
        return {
            estudiante: {
                ci: estudiante.ci,
                nombre: estudiante.nombre,
                correo: estudiante.correo,
                telefono: estudiante.telefono,
                fecha_nac: estudiante.fecha_nac,
                direccion: estudiante.direccion,
                carrera: carreraNombre
            },
            materias_inscritas: [],
            horario: []
        };
    }

    const { data: materiasEnCurso, error: materiasError } = await supabase
        .from("inscripciones_materia")
        .select(`
            inscripcion_id_inscripcion,
            materia_id_materia,
            estado,
            estado_academico,
            fecha_inicio,
            fecha_fin,
            materia:materia_id_materia (
                id_materia,
                nombre,
                dia,
                hora_inicio,
                hora_fin,
                aula_id_aula,
                aula:aula_id_aula ( id_aula, nombre )
            )
        `)
        .in("inscripcion_id_inscripcion", idsInscripcion)
        .eq("estado_academico", "EN_CURSO");

    if (materiasError) throw materiasError;

    const materiasFormateadas = (materiasEnCurso || []).map((item) => ({
        id_materia: item.materia?.id_materia || item.materia_id_materia,
        nombre: item.materia?.nombre || null,
        estado_academico: item.estado_academico,
        aula: item.materia?.aula?.nombre || null,
        dia: item.materia?.dia || null,
        hora_inicio: item.materia?.hora_inicio || null,
        hora_fin: item.materia?.hora_fin || null
    }));

    const horario = (materiasEnCurso || []).map((item) => ({
        id_materia: item.materia?.id_materia || item.materia_id_materia,
        nombre: item.materia?.nombre || null,
        dia: item.materia?.dia || null,
        hora_inicio: item.materia?.hora_inicio || null,
        hora_fin: item.materia?.hora_fin || null,
        aula: item.materia?.aula?.nombre || null
    }));

    return {
        estudiante: {
            ci: estudiante.ci,
            nombre: estudiante.nombre,
            correo: estudiante.correo,
            telefono: estudiante.telefono,
            fecha_nac: estudiante.fecha_nac,
            direccion: estudiante.direccion,
            carrera: carreraNombre
        },
        materias_inscritas: materiasFormateadas,
        horario
    };
}

module.exports = {
    createStudent,
    listStudents,
    getStudentByCI,
    updateStudent,
    deleteStudent,
    assignCarrera,
    inscribirseCarrera,
    getMiCarrera,
    obtenerNotasPorMateria,
    getMiPerfil
};