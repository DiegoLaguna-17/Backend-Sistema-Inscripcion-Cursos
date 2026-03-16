const supabase = require("../config/supabase");
const Aula = require("../models/Aula");

class AulaService {
  async listarAulas() {
    const { data, error } = await supabase
      .from("aula")
      .select("id_aula, nombre") // agrega más campos si quieres
      .order("nombre", { ascending: true });

    if (error) throw new Error("Error al obtener las aulas: " + error.message);
    return data || [];
  }

  async obtenerAulaPorId(id) {
    const { data, error } = await supabase
      .from("aula")
      .select("id_aula, nombre")
      .eq("id_aula", Number(id))
      .maybeSingle();

    if (error) throw new Error("Error al obtener el aula: " + error.message);
    if (!data) {
      const e = new Error("No se encontró el aula");
      e.status = 404;
      throw e;
    }
    return data;
  }

  async registrarAulaNueva(data) {
    const nuevaAula = new Aula(data);

    const { data: aulaExistente, error: errorBusqueda } = await supabase
      .from("aula")
      .select("id_aula")
      .eq("nombre", nuevaAula.nombre)
      .maybeSingle();

    if (errorBusqueda) {
      throw new Error(
        "Error al verificar duplicados: " + errorBusqueda.message,
      );
    }

    if (aulaExistente) {
      const e = new Error(
        `El aula con el nombre "${nuevaAula.nombre}" ya está registrada.`,
      );
      e.status = 400;
      throw e;
    }

    const { data: dataInsertada, error: errorInsert } = await supabase
      .from("aula")
      .insert([nuevaAula.toDatabase()])
      .select()
      .single();

    if (errorInsert) {
      throw new Error(
        "Error al registrar la nueva aula: " + errorInsert.message,
      );
    }

    return dataInsertada;
  }
}

module.exports = new AulaService();
