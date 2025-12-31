class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }

  log(error, context = {}) {
    this.errors.unshift({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      message: error.message || error,
      stack: error.stack,
      context,
    });

    // Keep only last 100 errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
  }

  getErrors() {
    return this.errors;
  }

  clear() {
    this.errors = [];
  }
}

module.exports = new ErrorLogger();
