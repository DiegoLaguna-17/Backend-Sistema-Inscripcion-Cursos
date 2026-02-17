const docenteService = require('../services/docente.service');

class DocenteController {
  // Registrar un nuevo docente
  async registrarDocente(req, res) {
    try {
      // Validar que se envíen todos los campos requeridos
      const camposRequeridos = [
        'ci', 'nombre', 'correo', 'telefono', 
        'contrasenia', 'fecha_nac', 'direccion', 'experiencia'
      ];

      const camposFaltantes = camposRequeridos.filter(campo => !req.body[campo]);

      if (camposFaltantes.length > 0) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Faltan campos requeridos',
          errores: camposFaltantes
        });
      }

      // Validaciones adicionales
      const { ci, correo, telefono, fecha_nac, contrasenia } = req.body;

      // Validar formato de CI
      if (ci.length < 4) {
        return res.status(400).json({
          exito: false,
          mensaje: 'El carnet de identidad debe tener al menos 4 caracteres',
          errores: ['CI inválido']
        });
      }

      // Validar formato de correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'El formato del correo electrónico no es válido',
          errores: ['Correo inválido']
        });
      }

      // Validar contraseña (mínimo 6 caracteres)
      if (contrasenia.length < 6) {
        return res.status(400).json({
          exito: false,
          mensaje: 'La contraseña debe tener al menos 6 caracteres',
          errores: ['Contraseña muy corta']
        });
      }

      // Validar fecha de nacimiento
      const fecha = new Date(fecha_nac);
      if (isNaN(fecha.getTime())) {
        return res.status(400).json({
          exito: false,
          mensaje: 'La fecha de nacimiento no es válida',
          errores: ['Fecha inválida']
        });
      }

      // Validar que la fecha no sea futura
      if (fecha > new Date()) {
        return res.status(400).json({
          exito: false,
          mensaje: 'La fecha de nacimiento no puede ser futura',
          errores: ['Fecha futura']
        });
      }

      // Llamar al servicio para registrar
      const resultado = await docenteService.registrarDocente(req.body);

      res.status(201).json(resultado);

    } catch (error) {
      console.error('Error en registrarDocente controller:', error);
      
      // Manejar errores específicos
      if (error.message.includes('Ya existe un usuario')) {
        return res.status(409).json({
          exito: false,
          mensaje: error.message,
          errores: ['Conflicto de datos']
        });
      }

      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        errores: [error.message]
      });
    }
  }

  // Verificar si un CI existe
  async verificarCI(req, res) {
    try {
      const { ci } = req.params;
      
      if (!ci) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Se requiere el carnet de identidad',
          errores: ['CI no proporcionado']
        });
      }

      const existe = await docenteService.verificarCIExiste(ci);
      
      res.json({
        exito: true,
        mensaje: 'Consulta exitosa',
        data: { existe }
      });
    } catch (error) {
      console.error('Error en verificarCI:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al verificar el carnet',
        errores: [error.message]
      });
    }
  }

  // Obtener lista de docentes activos
  async obtenerDocentes(req, res) {
    try {
      const docentes = await docenteService.obtenerDocentes();
      
      res.json({
        exito: true,
        mensaje: 'Docentes obtenidos exitosamente',
        data: docentes,
        total: docentes.length
      });
    } catch (error) {
      console.error('Error en obtenerDocentes:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al obtener los docentes',
        errores: [error.message]
      });
    }
  }

  // Obtener un docente específico por CI
  async obtenerDocente(req, res) {
    try {
      const { ci } = req.params;
      
      if (!ci) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Se requiere el carnet de identidad',
          errores: ['CI no proporcionado']
        });
      }

      const docente = await docenteService.obtenerDocentePorCI(ci);
      
      res.json({
        exito: true,
        mensaje: 'Docente obtenido exitosamente',
        data: docente
      });
    } catch (error) {
      console.error('Error en obtenerDocente:', error);
      
      if (error.message.includes('No se encontró')) {
        return res.status(404).json({
          exito: false,
          mensaje: error.message,
          errores: ['Docente no encontrado']
        });
      }

      res.status(500).json({
        exito: false,
        mensaje: 'Error al obtener el docente',
        errores: [error.message]
      });
    }
  }

  // Editar docente (solo campos permitidos)
  async editarDocente(req, res) {
    try {
      const { ci } = req.params;
      const datosActualizar = req.body;

      if (!ci) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Se requiere el carnet de identidad',
          errores: ['CI no proporcionado']
        });
      }

      // Validar que solo se envíen campos permitidos
      const camposPermitidos = ['telefono', 'direccion', 'contrasenia'];
      const camposEnviados = Object.keys(datosActualizar);
      const camposInvalidos = camposEnviados.filter(campo => !camposPermitidos.includes(campo));

      if (camposInvalidos.length > 0) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Campos no permitidos para edición',
          errores: [`Campos inválidos: ${camposInvalidos.join(', ')}. Permitidos: ${camposPermitidos.join(', ')}`]
        });
      }

      // Validaciones específicas
      if (datosActualizar.contrasenia && datosActualizar.contrasenia.length < 6) {
        return res.status(400).json({
          exito: false,
          mensaje: 'La contraseña debe tener al menos 6 caracteres',
          errores: ['Contraseña muy corta']
        });
      }

      if (datosActualizar.telefono && datosActualizar.telefono.length < 8) {
        return res.status(400).json({
          exito: false,
          mensaje: 'El teléfono debe tener al menos 8 caracteres',
          errores: ['Teléfono inválido']
        });
      }

      const resultado = await docenteService.editarDocente(ci, datosActualizar);
      
      res.json(resultado);
    } catch (error) {
      console.error('Error en editarDocente:', error);
      
      if (error.message.includes('No se encontró')) {
        return res.status(404).json({
          exito: false,
          mensaje: error.message,
          errores: ['Docente no encontrado']
        });
      }

      if (error.message.includes('No se proporcionaron')) {
        return res.status(400).json({
          exito: false,
          mensaje: error.message,
          errores: ['Sin campos para actualizar']
        });
      }

      res.status(500).json({
        exito: false,
        mensaje: 'Error al editar el docente',
        errores: [error.message]
      });
    }
  }

  // Eliminar docente (eliminación lógica)
  async eliminarDocente(req, res) {
    try {
      const { ci } = req.params;

      if (!ci) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Se requiere el carnet de identidad',
          errores: ['CI no proporcionado']
        });
      }

      const resultado = await docenteService.eliminarDocente(ci);
      
      res.json(resultado);
    } catch (error) {
      console.error('Error en eliminarDocente:', error);
      
      if (error.message.includes('No se encontró')) {
        return res.status(404).json({
          exito: false,
          mensaje: error.message,
          errores: ['Docente no encontrado']
        });
      }

      res.status(500).json({
        exito: false,
        mensaje: 'Error al eliminar el docente',
        errores: [error.message]
      });
    }
  }
}

module.exports = new DocenteController();
