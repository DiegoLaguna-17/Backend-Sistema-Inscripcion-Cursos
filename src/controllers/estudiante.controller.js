const usuarioService = require('../services/estudiante.service');

class UsuarioController {
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
          success: false,
          message: 'Faltan campos requeridos',
          camposFaltantes
        });
      }

      // Validaciones adicionales
      const { ci, correo, telefono, fecha_nac, contrasenia } = req.body;

      // Validar formato de CI (que no esté vacío y tenga formato razonable)
      if (ci.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'El carnet de identidad debe tener al menos 4 caracteres'
        });
      }

      // Validar formato de correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        return res.status(400).json({
          success: false,
          message: 'El formato del correo electrónico no es válido'
        });
      }

      // Validar contraseña (mínimo 6 caracteres)
      if (contrasenia.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // Validar fecha de nacimiento (que sea una fecha válida)
      const fecha = new Date(fecha_nac);
      if (isNaN(fecha.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de nacimiento no es válida'
        });
      }

      // Validar que la fecha no sea futura
      if (fecha > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de nacimiento no puede ser futura'
        });
      }

      // Llamar al servicio para registrar
      const resultado = await usuarioService.registrarDocente(req.body);

      res.status(201).json(resultado);

    } catch (error) {
      console.error('Error en registrarDocente controller:', error);
      
      // Manejar errores específicos
      if (error.message.includes('Ya existe un usuario')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener roles disponibles
  async obtenerRoles(req, res) {
    try {
      const roles = await usuarioService.obtenerRoles();
      
      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error('Error en obtenerRoles:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los roles',
        error: error.message
      });
    }
  }

  // Verificar si un CI existe (útil para validaciones en frontend)
  async verificarCI(req, res) {
    try {
      const { ci } = req.params;
      
      if (!ci) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el carnet de identidad'
        });
      }

      const existe = await usuarioService.verificarCIExiste(ci);
      
      res.json({
        success: true,
        existe
      });
    } catch (error) {
      console.error('Error en verificarCI:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar el carnet',
        error: error.message
      });
    }
  }

  // Obtener lista de docentes activos
  async obtenerDocentes(req, res) {
    try {
      const docentes = await usuarioService.obtenerDocentes();
      
      res.json({
        success: true,
        data: docentes,
        total: docentes.length
      });
    } catch (error) {
      console.error('Error en obtenerDocentes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los docentes',
        error: error.message
      });
    }
  }

  // Obtener un docente específico por CI
  async obtenerDocente(req, res) {
    try {
      const { ci } = req.params;
      
      if (!ci) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el carnet de identidad'
        });
      }

      const docente = await usuarioService.obtenerDocentePorCI(ci);
      
      res.json({
        success: true,
        data: docente
      });
    } catch (error) {
      console.error('Error en obtenerDocente:', error);
      
      if (error.message.includes('No se encontró')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al obtener el docente',
        error: error.message
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
          success: false,
          message: 'Se requiere el carnet de identidad'
        });
      }

      // Validar que solo se envíen campos permitidos
      const camposPermitidos = ['telefono', 'direccion', 'contrasenia'];
      const camposEnviados = Object.keys(datosActualizar);
      const camposInvalidos = camposEnviados.filter(campo => !camposPermitidos.includes(campo));

      if (camposInvalidos.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Campos no permitidos para edición',
          camposInvalidos,
          camposPermitidos
        });
      }

      // Validaciones específicas
      if (datosActualizar.contrasenia && datosActualizar.contrasenia.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      if (datosActualizar.telefono && datosActualizar.telefono.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'El teléfono debe tener al menos 8 caracteres'
        });
      }

      const resultado = await usuarioService.editarDocente(ci, datosActualizar);
      
      res.json(resultado);
    } catch (error) {
      console.error('Error en editarDocente:', error);
      
      if (error.message.includes('No se encontró')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('No se proporcionaron')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al editar el docente',
        error: error.message
      });
    }
  }

  // Eliminar docente (eliminación lógica)
  async eliminarDocente(req, res) {
    try {
      const { ci } = req.params;

      if (!ci) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el carnet de identidad'
        });
      }

      const resultado = await usuarioService.eliminarDocente(ci);
      
      res.json(resultado);
    } catch (error) {
      console.error('Error en eliminarDocente:', error);
      
      if (error.message.includes('No se encontró')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al eliminar el docente',
        error: error.message
      });
    }
  }
}

module.exports = new UsuarioController();