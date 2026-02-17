const supabase = require('../config/supabase');

class UsuarioService {
  // Registrar un nuevo docente
  async registrarDocente(datosDocente) {
    try {
      // Primero verificar que el CI no exista
      const { data: usuarioExiste, error: errorBusqueda } = await supabase
        .from('usuario')
        .select('ci')
        .eq('ci', datosDocente.ci)
        .single();

      if (usuarioExiste) {
        throw new Error('Ya existe un usuario con ese carnet de identidad');
      }

      // Verificar que el correo no exista
      const { data: correoExiste, error: errorCorreo } = await supabase
        .from('usuario')
        .select('correo')
        .eq('correo', datosDocente.correo)
        .single();

      if (correoExiste) {
        throw new Error('Ya existe un usuario con ese correo electrónico');
      }

      // Obtener el ID del rol "docente" (asumo que existe)
      const { data: rolDocente, error: errorRol } = await supabase
        .from('rol')
        .select('id_rol')
        .eq('rol', 'docente')
        .single();

      if (errorRol || !rolDocente) {
        throw new Error('No se encontró el rol de docente en el sistema');
      }

      // Preparar datos para insertar
      const nuevoUsuario = {
        ci: datosDocente.ci,
        nombre: datosDocente.nombre,
        correo: datosDocente.correo,
        telefono: datosDocente.telefono,
        contrasenia: datosDocente.contrasenia,
        fecha_nac: datosDocente.fecha_nac,
        direccion: datosDocente.direccion,
        experiencia: datosDocente.experiencia,
        rol_id_rol: rolDocente.id_rol,
        estado: true // Por defecto el usuario está activo
      };

      // Insertar el nuevo usuario
      const { data, error } = await supabase
        .from('usuario')
        .insert([nuevoUsuario])
        .select();

      if (error) {
        console.error('Error al insertar usuario:', error);
        throw new Error('Error al registrar el docente: ' + error.message);
      }

      return {
        success: true,
        message: 'Docente registrado exitosamente',
        data: {
          ci: data[0].ci,
          nombre: data[0].nombre,
          correo: data[0].correo
        }
      };

    } catch (error) {
      console.error('Error en registrarDocente:', error);
      throw error;
    }
  }

  // Obtener todos los roles disponibles
  async obtenerRoles() {
    try {
      const { data, error } = await supabase
        .from('rol')
        .select('*');

      if (error) {
        throw new Error('Error al obtener los roles: ' + error.message);
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerRoles:', error);
      throw error;
    }
  }

  // Verificar si un CI existe
  async verificarCIExiste(ci) {
    try {
      const { data, error } = await supabase
        .from('usuario')
        .select('ci')
        .eq('ci', ci)
        .single();

      return !!data; // Devuelve true si existe, false si no
    } catch (error) {
      return false; // Si hay error, asumimos que no existe
    }
  }

  // Obtener lista de docentes activos
  async obtenerDocentes() {
    try {
      const { data, error } = await supabase
        .from('usuario')
        .select(`
          ci,
          nombre,
          correo,
          telefono,
          direccion,
          experiencia,
          fecha_nac,
          estado,
          rol!inner(rol)
        `)
        .eq('rol.rol', 'docente')
        .eq('estado', true)
        .order('nombre', { ascending: true });

      if (error) {
        throw new Error('Error al obtener los docentes: ' + error.message);
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerDocentes:', error);
      throw error;
    }
  }

  // Editar docente (solo campos permitidos: teléfono, dirección, contraseña)
  async editarDocente(ci, datosActualizar) {
    try {
      // Verificar que el docente existe y está activo
      const { data: docente, error: errorDocente } = await supabase
        .from('usuario')
        .select('ci, rol!inner(rol)')
        .eq('ci', ci)
        .eq('rol.rol', 'docente')
        .eq('estado', true)
        .single();

      if (errorDocente || !docente) {
        throw new Error('No se encontró el docente o está inactivo');
      }

      // Preparar datos para actualizar (solo campos permitidos)
      const datosPermitidos = {};
      if (datosActualizar.telefono !== undefined) {
        datosPermitidos.telefono = datosActualizar.telefono;
      }
      if (datosActualizar.direccion !== undefined) {
        datosPermitidos.direccion = datosActualizar.direccion;
      }
      if (datosActualizar.contrasenia !== undefined) {
        datosPermitidos.contrasenia = datosActualizar.contrasenia;
      }

      // Verificar que al menos un campo se va a actualizar
      if (Object.keys(datosPermitidos).length === 0) {
        throw new Error('No se proporcionaron campos válidos para actualizar');
      }

      // Actualizar el docente
      const { data, error } = await supabase
        .from('usuario')
        .update(datosPermitidos)
        .eq('ci', ci)
        .select();

      if (error) {
        console.error('Error al actualizar docente:', error);
        throw new Error('Error al actualizar el docente: ' + error.message);
      }

      return {
        success: true,
        message: 'Docente actualizado exitosamente',
        data: {
          ci: data[0].ci,
          nombre: data[0].nombre,
          camposActualizados: Object.keys(datosPermitidos)
        }
      };

    } catch (error) {
      console.error('Error en editarDocente:', error);
      throw error;
    }
  }

  // Eliminar docente (eliminación lógica)
  async eliminarDocente(ci) {
    try {
      // Verificar que el docente existe y está activo
      const { data: docente, error: errorDocente } = await supabase
        .from('usuario')
        .select('ci, nombre, rol!inner(rol)')
        .eq('ci', ci)
        .eq('rol.rol', 'docente')
        .eq('estado', true)
        .single();

      if (errorDocente || !docente) {
        throw new Error('No se encontró el docente o ya está inactivo');
      }

      // Cambiar estado a false (eliminación lógica)
      const { data, error } = await supabase
        .from('usuario')
        .update({ estado: false })
        .eq('ci', ci)
        .select();

      if (error) {
        console.error('Error al eliminar docente:', error);
        throw new Error('Error al eliminar el docente: ' + error.message);
      }

      return {
        success: true,
        message: 'Docente eliminado exitosamente',
        data: {
          ci: docente.ci,
          nombre: docente.nombre
        }
      };

    } catch (error) {
      console.error('Error en eliminarDocente:', error);
      throw error;
    }
  }

  // Obtener un docente específico por CI
  async obtenerDocentePorCI(ci) {
    try {
      const { data, error } = await supabase
        .from('usuario')
        .select(`
          ci,
          nombre,
          correo,
          telefono,
          direccion,
          experiencia,
          fecha_nac,
          estado,
          rol!inner(rol)
        `)
        .eq('ci', ci)
        .eq('rol.rol', 'docente')
        .eq('estado', true)
        .single();

      if (error || !data) {
        throw new Error('No se encontró el docente o está inactivo');
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerDocentePorCI:', error);
      throw error;
    }
  }
}

module.exports = new UsuarioService();