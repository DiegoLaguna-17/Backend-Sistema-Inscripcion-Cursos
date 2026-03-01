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

// ✅ Validar que la carrera exista (si llega)
async function validateCarreraCodigo(codigo) {
  if (codigo === undefined) return undefined; // no vino en payload
  if (codigo === null || codigo === "") return null; // se quiere limpiar

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

// Select join para obtener estudiante con su carrera
const SELECT_ESTUDIANTE_CON_CARRERA = `
    ci, rol_id_rol, nombre, correo, telefono, fecha_nac, direccion, carrera_usuario, estado,
    carrera:carrera_usuario (
    codigo,
    nombre,
    descripcion,
    duracion
    )
`;


// Registrar estudiante
async function createStudent(payload) {
const {
    ci,
    nombre,
    correo,
    telefono,
    contrasenia,     // password plano del request (lo hash)
    fecha_nac,
    direccion,
    carrera_usuario,
    carrera,         // alias opcional
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

  // CI duplicado
const existingCI = await findUserByCI(ci);
if (existingCI) {
    const err = new Error("El registro ya existe en el sistema");
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
    const err = new Error("El registro ya existe en el sistema");
    err.status = 409;
    throw err;
}

  // rol estudiante
const rol_id_rol = await getRolIdByName("ESTUDIANTE");

  // hash contraseña
const passwordHash = await bcrypt.hash(contrasenia, SALT_ROUNDS);

  // carrera (si llega)
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
        carrera_usuario: codigoCarrera ?? null, // guarda null si no llega
        estado: true,
    }])
    .select(SELECT_ESTUDIANTE_CON_CARRERA)
    .single();

if (error) throw error;
return data;
}

// Listar estudiantes (incluye carrera)
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

// Obtener estudiante por CI (incluye carrera)
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

// Editar estudiante
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

  // cambiar password
    if (payload.contrasenia) {
    updates.contrasenia = await bcrypt.hash(payload.contrasenia, SALT_ROUNDS);
    }

    if (Object.keys(updates).length === 0) {
    const err = new Error("Faltan campos requeridos");
    err.status = 400;
    err.data = { mensaje: "No se enviaron campos para actualizar" };
    throw err;
}

  // correo duplicado (si cambia)
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

// Eliminar estudiante
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
    const esAdmin = user && String(user.rol_id_rol) === "1"; // por seguridad, string/number

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

// Inscribirse a una carrera (estudiante se inscribe a sí mismo)
async function inscribirseCarrera(ci, payload) {
    // Verificar que el usuario existe y es estudiante
    const existing = await findUserByCI(ci);
    if (!existing || existing.estado === false) {
        const err = new Error("Registro no encontrado");
        err.status = 404;
        throw err;
    }

    // Verificar que ya no tenga una carrera asignada (opcional - ajustar según lógica)
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

    // Validar que la carrera existe
    const codigoCarrera = await validateCarreraCodigo(String(codigo).trim());
    if (!codigoCarrera) {
        const err = new Error("Formato de datos inválido");
        err.status = 400;
        err.data = { erroresDeFormato: ["El código de carrera no existe"] };
        throw err;
    }

    // Actualizar carrera del estudiante
    const { data, error } = await supabase
        .from("usuario")
        .update({ carrera_usuario: codigoCarrera })
        .eq("ci", String(ci))
        .select(SELECT_ESTUDIANTE_CON_CARRERA)
        .single();

    if (error) throw error;
    return data;
}

module.exports = {
    createStudent,
    listStudents,
    getStudentByCI,
    updateStudent,
    deleteStudent,
    assignCarrera,
    inscribirseCarrera,
};
