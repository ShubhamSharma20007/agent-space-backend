export const globalErrorMiddleware = (err, req, res, next) => {
    console.error('Global Error:', err.stack || err);
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: message,
        status: statusCode,
        success: false,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};