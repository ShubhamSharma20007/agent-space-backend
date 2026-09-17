class ApiResponse {
    constructor(statusCode, message, data = null) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    static success(message, data = null, statusCode = 200) {
        return new ApiResponse(statusCode, message, data);
    }

    static error(message, statusCode = 500, data = null) {
        return new ApiResponse(statusCode, message, data);
    }
}

export default ApiResponse;