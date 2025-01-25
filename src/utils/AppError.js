class AppError extends Error {
	isOperational = true;
	constructor(message, statusCode, fieldName) {
		super(message);
		this.statusCode = statusCode;
		if (fieldName) {
			this.fieldName = fieldName;
		}
	}
}

export default AppError;
