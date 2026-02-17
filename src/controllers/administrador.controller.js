// Importamos el servicio
const administradorService = require('../services/administrador.service');

class AdministradorController {
    
    /**
     * -------------------------------------------------
     * CONTROLADOR PARA REGISTRAR UN NUEVO ASMINISTARDOR
     * -------------------------------------------------
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     */
    async registrar(req, res) {
        try {
            // Extraemos los datos del cuerpo de la petición
            const datosAdministrador = req.body;

            // Llamamos al servicio para registrar
            const resultado = await administradorService.registrarAdministrador(datosAdministrador);

            // Enviamos la respuesta según el resultado
            if (resultado.exito) {
                // Si sale bien el código es 201
                return res.status(201).json({
                    exito: true,
                    mensaje: resultado.mensaje,
                    data: resultado.data
                });
            } else {
                // Si hay error en la validación el código es 400
                return res.status(400).json({
                    exito: false,
                    mensaje: resultado.mensaje,
                    errores: resultado.errores
                });
            }

        } catch (error) {
            // Si hay error inesperado el código es 500
            console.error('Error en controlador registrar:', error);
            return res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                errores: ['Ocurrió un error inesperado']
            });
        }
    }

    /**
     * --------------------------------------------------
     * CONTROLADOR PARA OBTENER TODOS LOS ADMINISTARDORES
     * --------------------------------------------------
     */
    async obtenerTodos(req, res) {
        try {
            const resultado = await administradorService.obtenerAdministradores();

            if (resultado.exito) {
                return res.status(200).json({
                    exito: true,
                    mensaje: resultado.mensaje,
                    total: resultado.total || resultado.data.length,
                    data: resultado.data
                });
            } else {
                return res.status(400).json({
                    exito: false,
                    mensaje: resultado.mensaje,
                    errores: resultado.errores
                });
            }

        } catch (error) {
            console.error('Error en controlador obtenerTodos:', error);
            return res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                errores: ['Ocurrió un error inesperado']
            });
        }
    }

    /**
     * ---------------------------------------------
     * CCONTROLADOR PARA ACTUALZIAR UN ADMINISTRADOR
     * ---------------------------------------------
     */
    async actualizarParcial(req, res) {
        try {
            const { ci } = req.params; // CI de la URL
            const datosActualizar = req.body; // Datos a actualizar

            // Verificamos que el cuerpo de la petición no este vacío
            if (!datosActualizar || Object.keys(datosActualizar).length === 0) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Error de validación',
                    errores: ['Debe enviar al menos un campo para actualizar']
                });
            }

            const resultado = await administradorService.actualizarAdministrador(ci, datosActualizar);

            if (resultado.exito) {
                return res.status(200).json({
                    exito: true,
                    mensaje: resultado.mensaje,
                    camposActualizados: resultado.camposActualizados,
                    data: resultado.data
                });
            } else {
                // Determinar el código de estado según el tipo de error
                let statusCode = 400;
                if (resultado.mensaje === 'Administrador no encontrado') {
                    statusCode = 404;
                }
                
                return res.status(statusCode).json({
                    exito: false,
                    mensaje: resultado.mensaje,
                    errores: resultado.errores
                });
            }

        } catch (error) {
            console.error('Error en controlador actualizarParcial:', error);
            return res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                errores: ['Ocurrió un error inesperado']
            });
        }
    }

    /**
     * ------------------------------------------
     * CONTROLADOR PARA ELIMINAR UN ADMINISTRADOR
     * ------------------------------------------
     */
    async eliminar(req, res) {
        try {
            const { ci } = req.params; // Obtenemos el ci de la URL

            const resultado = await administradorService.eliminarAdministrador(ci);

            if (resultado.exito) {
                return res.status(200).json({
                    exito: true,
                    mensaje: resultado.mensaje,
                    detalles: resultado.detalles,
                    data: resultado.data
                });
            } else {
                // Determinamos el código de estado según el tipo de error
                let statusCode = 400;
                if (resultado.mensaje === 'Administrador no encontrado') {
                    statusCode = 404;
                } else if (resultado.mensaje === 'Operación no permitida') {
                    statusCode = 409; // Conflict
                }

                return res.status(statusCode).json({
                    exito: false,
                    mensaje: resultado.mensaje,
                    errores: resultado.errores
                });
            }

        } catch (error) {
            console.error('Error en controlador eliminar:', error);
            return res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                errores: ['Ocurrió un error inesperado']
            });
        }
    }
}

module.exports = new AdministradorController();
