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

// Registrar estudiante
async function createStudent(payload) {
const { ci, nombre, correo, telefono, contrasenia, fecha_nac, direccion } = payload;

if (!ci || !nombre || !correo || !contrasenia) {
    const err = new Error("Campos obligatorios: ci, nombre, correo, contrasenia");
    err.status = 400;
    throw err;
}

  // CI duplicado
const existingCI = await findUserByCI(ci);
    if (existingCI) {
    const err = new Error("Ya existe un usuario con ese CI");
    err.status = 409;
    throw err;
}

  // correo duplicado
const { data: existingEmail, error: errEmail } = await supabase
    .from("usuario")
    .select("correo")
    .eq("correo", correo)
    .maybeSingle();

    if (errEmail) throw errEmail;
    if (existingEmail) {
        const err = new Error("Ya existe un usuario con ese correo");
        err.status = 409;
        throw err;
}

  // rol estudiante
const rol_id_rol = await getRolIdByName("ESTUDIANTE");

  // hash contraseña
    const passwordHash = await bcrypt.hash(contrasenia, SALT_ROUNDS);

    const { data, error } = await supabase
        .from("usuario")
        .insert([{
        ci: String(ci),
        rol_id_rol,
        nombre,
        correo,
        telefono: telefono ?? null,
        contrasenia: passwordHash, // tu campo
        fecha_nac: fecha_nac ?? null,
        direccion: direccion ?? null,
        }])
        .select("ci, rol_id_rol, nombre, correo, telefono, fecha_nac, direccion")
        .single();

    if (error) throw error;
    return data;
}

// Listar estudiantes
async function listStudents() {
    const rol_id_rol = await getRolIdByName("ESTUDIANTE");

    const { data, error } = await supabase
        .from("usuario")
        .select("ci, rol_id_rol, nombre, correo, telefono, fecha_nac, direccion")
        .eq("rol_id_rol", rol_id_rol)
        .order("nombre", { ascending: true });

    if (error) throw error;
    return data;
}

// Obtener estudiante por CI
async function getStudentByCI(ci) {
    const rol_id_rol = await getRolIdByName("ESTUDIANTE");

    const { data, error } = await supabase
        .from("usuario")
        .select("ci, rol_id_rol, nombre, correo, telefono, fecha_nac, direccion")
        .eq("ci", String(ci))
        .eq("rol_id_rol", rol_id_rol)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        const err = new Error("Estudiante no encontrado");
        err.status = 404;
        throw err;
    }
    return data;
    }

    // Editar estudiante
    async function updateStudent(ci, payload) {
    const existing = await findUserByCI(ci);
    if (!existing) {
        const err = new Error("Estudiante no encontrado");
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
        const err = new Error("No enviaste campos para actualizar");
        err.status = 400;
        throw err;
    }

  // Si el correo se está actualizando, verificar que no esté en uso por otro usuario   
    if (updates.correo && updates.correo !== existing.correo) {
        const { data: emailTaken, error: emailErr } = await supabase
        .from("usuario")
        .select("correo")
        .eq("correo", updates.correo)
        .maybeSingle();

        if (emailErr) throw emailErr;
        if (emailTaken) {
        const err = new Error("Ese correo ya está en uso");
        err.status = 409;
        throw err;
        }
    }

    const { data, error } = await supabase
        .from("usuario")
        .update(updates)
        .eq("ci", String(ci))
        .select("ci, rol_id_rol, nombre, correo, telefono, fecha_nac, direccion")
        .single();

    if (error) throw error;
    return data;
}

// Eliminar estudiante   
async function deleteStudent(ci) {
    const existing = await findUserByCI(ci);
    if (!existing) {
        const err = new Error("Estudiante no encontrado");
        err.status = 404;
        throw err;
    }

    const { error } = await supabase
        .from("usuario")
        .delete()
        .eq("ci", String(ci));

    if (error) throw error;
    return { deleted: true };
}

module.exports = {
    createStudent,
    listStudents,
    getStudentByCI,
    updateStudent,
    deleteStudent,
};
