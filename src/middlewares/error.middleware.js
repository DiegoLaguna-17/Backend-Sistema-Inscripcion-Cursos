function errorMiddleware(err, req, res, next) {
    console.error("❌ ERROR:", err);

    const status = err.status || err.statusCode || 500;

    const data =
        err.data ??
        err.errors ??
        (err.details || err.hint || err.code
        ? {
            details: err.details || null,
            hint: err.hint || null,
            code: err.code || null,
            }
        : null);

    return res.status(status).json({
        success: false,
        message: err.message || "Error interno",
        data,
    });
}

module.exports = { errorMiddleware };