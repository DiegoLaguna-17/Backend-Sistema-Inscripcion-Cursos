const cron = require('node-cron');
const inscripcionService = require('../services/inscripcion.service');

// Ejecutar todos los días a las 00:05 (5 minutos después de medianoche)
// Formato: minuto hora día mes día-semana
// '5 0 * * *' = minuto 5, hora 0, todos los días
const cronExpression = '5 0 * * *';

function iniciarCronActualizacionEstados() {
    cron.schedule(cronExpression, async () => {
        console.log(`[CRON] Iniciando actualización de estados académicos: ${new Date().toISOString()}`);
        
        try {
            const resultados = await inscripcionService.actualizarEstadosAcademicos();
            
            console.log('[CRON] Actualización completada:');
            console.log(`  - Materias retiradas corregidas: ${resultados.retiradas_corregidas}`);
            console.log(`  - Materias activadas (EN_CURSO): ${resultados.activadas}`);
            console.log(`  - Materias finalizadas: ${resultados.finalizadas}`);
            console.log(`  - Aprobadas: ${resultados.aprobadas}`);
            console.log(`  - Reprobadas: ${resultados.reprobadas}`);
            
            if (resultados.errores.length > 0) {
                console.error(`[CRON] Errores encontrados: ${resultados.errores.length}`);
                resultados.errores.forEach((err, idx) => {
                    console.error(`  Error ${idx + 1}:`, err);
                });
            }
        } catch (error) {
            console.error('[CRON] Error al ejecutar actualización de estados:', error.message);
            console.error(error);
        }
    }, {
        scheduled: true,
        timezone: "America/La_Paz" // Ajusta según zona horaria
    });

    console.log(`[CRON] Job de actualización de estados académicos programado: ${cronExpression}`);
    console.log('[CRON] Se ejecutará todos los días a las 00:05');
}

module.exports = { iniciarCronActualizacionEstados };
