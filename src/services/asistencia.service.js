const supabase = require("../config/supabase");

// registrar asistencia de toda la clase
async function registrarAsistenciaClase(materiaId, fecha, asistencias) {

  const registros = asistencias.map(a => ({
    materia_id_materia: materiaId,
    usuario_ci: a.ci,
    fecha: fecha,
    estado: a.estado
  }));

  const { data, error } = await supabase
    .from("asistencia")
    .insert(registros)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// historial para docente
async function obtenerHistorialMateria(materiaId) {

  const { data, error } = await supabase
    .from("asistencia")
    .select(`
      fecha,
      estado,
      usuario:usuario_ci (
        ci,
        nombre
      )
    `)
    .eq("materia_id_materia", materiaId)
    .order("fecha", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const resultado = {};

  data.forEach(registro => {

    const ci = registro.usuario.ci;

    if (!resultado[ci]) {
      resultado[ci] = {
        ci: registro.usuario.ci,
        nombre: registro.usuario.nombre,
        asistencias: []
      };
    }

    resultado[ci].asistencias.push({
      fecha: registro.fecha,
      estado: registro.estado
    });

  });

  return Object.values(resultado);
}

// conteo de asistencias del estudiante
async function misAsistenciasPorMateria(estudianteId, materiaId) {

  const { data, error } = await supabase
    .from("asistencia")
    .select("estado")
    .eq("usuario_ci", estudianteId)
    .eq("materia_id_materia", materiaId);

  if (error) {
    throw new Error(error.message);
  }

  const presentes = data.filter(a => a.estado).length;
  const faltas = data.filter(a => !a.estado).length;

  return {
    presentes,
    faltas,
    total: data.length
  };
}

module.exports = {
  registrarAsistenciaClase,
  obtenerHistorialMateria,
  misAsistenciasPorMateria,
};