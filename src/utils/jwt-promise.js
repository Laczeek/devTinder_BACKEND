import jwt from 'jsonwebtoken';
import AppError from './AppError.js';

const SECRET_KEY = process.env.SECRET_KEY;

export const signJWT = (payload) => {
	return new Promise((resolve, reject) => {
		jwt.sign(payload, SECRET_KEY, { expiresIn: '1d' }, (err, token) => {
			if (err) {
				reject(
					new AppError(
						'Something went wrong while signing the authentication token.',
						500
					)
				);
				return;
			}

			resolve(token);
		});
	});
};

export const verifyJWT = (token) => {
	return new Promise((resolve, reject) => {
		jwt.verify(token, SECRET_KEY, (err, decodedToken) => {
			if (err) {
				reject(new AppError('You are unauthorized.', 401));
				return;
			}

			resolve(decodedToken);
		});
	});
};
