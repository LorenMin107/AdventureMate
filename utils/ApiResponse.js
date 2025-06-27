class ApiResponse {
  constructor(statusCode, data = null, message = "", error = null) {
    this.statusCode = statusCode;
    this.status = statusCode < 400 ? 'success' : 'error';
    this.data = data;
    this.message = message;
    this.error = error;
  }

  static success(data, message = "", statusCode = 200) {
    return new ApiResponse(statusCode, data, message);
  }

  static error(error = "Something went wrong", message = "", statusCode = 500) {
    return new ApiResponse(statusCode, null, message, error);
  }

  send(res) {
    return res.status(this.statusCode).json({
      status: this.status,
      data: this.data,
      message: this.message,
      error: this.error
    });
  }
}

module.exports = ApiResponse;