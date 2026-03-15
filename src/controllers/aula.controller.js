const aulaService = require("../services/aula.service");

class AulaController {
  async listar(req, res) {
    try {
      const aulas = await aulaService.listarAulas();
      return res.json({
        exito: true,
        mensaje: aulas.length
          ? "Aulas obtenidas exitosamente"
          : "No se encontraron registros",
        data: aulas,
        total: aulas.length,
      });
    } catch (error) {
      console.error("Error en listar aulas:", error);
      return res.status(500).json({
        exito: false,
        mensaje: "Error al obtener las aulas",
        errores: [error.message],
      });
    }
  }

  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          exito: false,
          mensaje: "Se requiere el id del aula",
          errores: ["id no proporcionado"],
        });
      }

      const aula = await aulaService.obtenerAulaPorId(id);
      return res.json({
        exito: true,
        mensaje: "Aula obtenida exitosamente",
        data: aula,
      });
    } catch (error) {
      console.error("Error en obtener aula:", error);

      const status = error.status || 500;
      if (status === 404) {
        return res.status(404).json({
          exito: false,
          mensaje: error.message,
          errores: ["Aula no encontrada"],
        });
      }

      return res.status(500).json({
        exito: false,
        mensaje: "Error al obtener el aula",
        errores: [error.message],
      });
    }
  }

  async insertarAulaNueva(req, res) {
    try {
      const { nombre } = req.body;

      if (!nombre || nombre.trim() === "") {
        return res.status(400).json({
          exito: false,
          mensaje: "El nombre del aula es obligatorio",
          errores: ["nombre no proporcionado o vacío"],
        });
      }

      const nuevaAula = await aulaService.registrarAulaNueva({
        nombre: nombre.trim(),
      });

      return res.status(201).json({
        exito: true,
        mensaje: "Aula registrada exitosamente",
        data: nuevaAula,
      });
    } catch (error) {
      console.error("Error en insertarAulaNueva:", error);
      const status = error.status || 500;

      return res.status(status).json({
        exito: false,
        mensaje: error.message || "Error al registrar la nueva aula",
        errores: [error.message],
      });
    }
  }
}

module.exports = new AulaController();
