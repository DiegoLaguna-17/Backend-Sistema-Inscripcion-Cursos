function errorMiddleware(err, req, res, next) {
    console.error("❌ ERROR:", err);

    const status = err.status || err.statusCode || 500;

    // Deteccion de errores de supabase
    return res.status(status).json({
        message: err.message || "Error interno",
        details: err.details || null,
        hint: err.hint || null,
        code: err.code || null,
    });
}
module.exports = { errorMiddleware };
