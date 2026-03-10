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
 try {

    const { data, error } = await supabase
  .from("inscripciones_materia")
  .select(`
    materia_id_materia,
    inscripcion:inscripcion_id_inscripcion (
      usuario:usuario_ci (
        ci,
        nombre,
        asistencia:asistencia!asistencia_usuario (
          fecha,
          estado,
          materia_id_materia
        )
      )
    )
  `)
  .eq("materia_id_materia", materiaId);

    if (error) throw error;

    const estudiantes = data.map((e) => {

      const usuario = e.inscripcion?.usuario;

      const asistencias =
        (usuario?.asistencia || [])
          .filter(a => a.materia_id_materia === materiaId)
          .map(a => ({
            fecha: a.fecha,
            estado: a.estado
          }));

      return {
        ci: usuario?.ci,
        nombre: usuario?.nombre ?? "Sin nombre",
        asistencias: asistencias.length > 0
          ? asistencias
          : [
              {
                fecha: null,
                estado: null
              }
            ]
      };

    });

    return estudiantes;

  } catch (error) {
    console.error("Error en obtenerAsistenciaClase:", error);
    throw error;
  }
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