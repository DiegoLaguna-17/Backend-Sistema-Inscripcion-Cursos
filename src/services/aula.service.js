const supabase = require("../config/supabase");

class AulaService {
    async listarAulas() {
        const { data, error } = await supabase
        .from("aula")
        .select("id_aula, nombre")   // agrega más campos si quieres
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
}

module.exports = new AulaService();