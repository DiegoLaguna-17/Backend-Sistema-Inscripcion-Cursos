const bcrypt = require("bcrypt");
const { supabase } = require("../config/supabase");

const SALT_ROUNDS = 10;

const TABLA_USUARIO = "usuario";
const TABLA_ROL = "rol";

async function getRolIdByName(nombreRol) {
    const { data, error } = await supabase
        .from(TABLA_ROL)
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
        .from(TABLA_USUARIO)
        .select("*")
        .eq("ci", String(ci))
        .maybeSingle();

    if (error) throw error;
    return data; // null si no existe
    }

    // ✅ ALTA
    async function createStudent(payload) {
    const {
        ci,
        nombre,
        correo,
        telefono,
        contrasena,
        fecha_nac,
        direccion,
        experienci,
    } = payload;

    if (!ci || !nombre || !correo || !contrasena) {
        const err = new Error("Campos obligatorios: ci, nombre, correo, contrasena");
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

    // Correo duplicado
    const { data: existingEmail, error: errEmail } = await supabase
        .from(TABLA_USUARIO)
        .select("correo")
        .eq("correo", correo)
        .maybeSingle();

    if (errEmail) throw errEmail;
    if (existingEmail) {
        const err = new Error("Ya existe un usuario con ese correo");
        err.status = 409;
        throw err;
    }

    // Rol estudiante
    const rol_id_rol = await getRolIdByName("ESTUDIANTE");

    // Proteger datos (hash)
    const passwordHash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    const { data, error } = await supabase
        .from(TABLA_USUARIO)
        .insert([
        {
            ci: String(ci),
            rol_id_rol,
            nombre,
            correo,
            telefono: telefono ?? null,
            contraseni: passwordHash, // 👈 tu columna de password
            fecha_nac: fecha_nac ?? null,
            direccion: direccion ?? null,
            experienci: experienci ?? null,
        },
        ])
        .select("ci, rol_id_rol, nombre, correo, telefono, fecha_nac, direccion, experienci")
        .single();

    if (error) throw error;
    return data;
    }

    // ✅ LISTAR
    async function listStudents() {
    const rol_id_rol = await getRolIdByName("ESTUDIANTE");

    const { data, error } = await supabase
        .from(TABLA_USUARIO)
        .select("ci, rol_id_rol, nombre, correo, telefono, fecha_nac, direccion, experienci")
        .eq("rol_id_rol", rol_id_rol)
        .order("nombre", { ascending: true });

    if (error) throw error;
    return data;
    }

    // ✅ OBTENER 1
    async function getStudentByCI(ci) {
    const rol_id_rol = await getRolIdByName("ESTUDIANTE");

    const { data, error } = await supabase
        .from(TABLA_USUARIO)
        .select("ci, rol_id_rol, nombre, correo, telefono, fecha_nac, direccion, experienci")
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

    // ✅ MODIFICACIÓN
    async function updateStudent(ci, payload) {
    const existing = await findUserByCI(ci);
    if (!existing) {
        const err = new Error("Estudiante no encontrado");
        err.status = 404;
        throw err;
    }

    // opcional: asegurar que sea estudiante
    const rolEstudiante = await getRolIdByName("ESTUDIANTE");
    if (existing.rol_id_rol !== rolEstudiante) {
        const err = new Error("El usuario no es estudiante");
        err.status = 400;
        throw err;
    }

    const updates = {};
    if (payload.nombre !== undefined) updates.nombre = payload.nombre;
    if (payload.correo !== undefined) updates.correo = payload.correo;
    if (payload.telefono !== undefined) updates.telefono = payload.telefono;
    if (payload.fecha_nac !== undefined) updates.fecha_nac = payload.fecha_nac;
    if (payload.direccion !== undefined) updates.direccion = payload.direccion;
    if (payload.experienci !== undefined) updates.experienci = payload.experienci;

    if (payload.contrasena) {
        updates.contraseni = await bcrypt.hash(payload.contrasena, SALT_ROUNDS);
    }

    if (Object.keys(updates).length === 0) {
        const err = new Error("No enviaste campos para actualizar");
        err.status = 400;
        throw err;
    }

    // Evitar correo duplicado si lo cambian
    if (updates.correo && updates.correo !== existing.correo) {
        const { data: emailTaken, error: emailErr } = await supabase
        .from(TABLA_USUARIO)
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
        .from(TABLA_USUARIO)
        .update(updates)
        .eq("ci", String(ci))
        .select("ci, rol_id_rol, nombre, correo, telefono, fecha_nac, direccion, experienci")
        .single();

    if (error) throw error;
    return data;
    }

    // ✅ BAJA
    async function deleteStudent(ci) {
    const existing = await findUserByCI(ci);
    if (!existing) {
        const err = new Error("Estudiante no encontrado");
        err.status = 404;
        throw err;
    }

    const rolEstudiante = await getRolIdByName("ESTUDIANTE");
    if (existing.rol_id_rol !== rolEstudiante) {
        const err = new Error("El usuario no es estudiante");
        err.status = 400;
        throw err;
    }

    const { error } = await supabase
        .from(TABLA_USUARIO)
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
