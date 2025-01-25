import { Error, mongo } from 'mongoose';

import AppError from '../utils/AppError.js';

const errorMiddleware = (err, req, res, next) => {
	console.error(err);

	const mainError = {
		statusCode: err.statusCode || 500,
		message: err.isOperational
			? err.message
			: 'Something went wrong on the server.',
		isValidation: false,
	};

	if (err instanceof AppError && err.fieldName) {
		mainError.isValidation = true;
		mainError.message = {
			[err.fieldName]: err.message,
		};
	}

	if (err instanceof Error.ValidationError) {
		let customErrorsObj = {};

		const validationErrors = err.errors;

		Object.entries(validationErrors).forEach((entry) => {
			const [key, validationError] = entry;
			customErrorsObj[key] = validationError.message;
		});

		mainError.message = customErrorsObj;
		mainError.statusCode = 400;
		mainError.isValidation = true;
	}

	if (err instanceof mongo.MongoServerError && err.code === 11000) {
		const fieldName = Object.keys(err.keyPattern)[0];

		mainError.message = {
			[fieldName]: `This ${fieldName} is already in use.`,
		};
		mainError.statusCode = 400;
		mainError.isValidation = true;
	}

	if (mainError.isValidation) {
		res.status(mainError.statusCode).json({
			error: mainError.message,
		});
		return;
	}

	res.status(mainError.statusCode).json({
		error: { message: mainError.message },
	});
};

export default errorMiddleware;
