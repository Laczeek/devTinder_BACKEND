import AppError from '../utils/AppError.js';
import { verifyJWT } from '../utils/jwt-promise.js';

const authenticateMiddleware = async (req, res, next) => {
	const jwt = req.cookies?.jwt;
	try {
		if (!jwt) throw new AppError('You are unauthorized.', 401);

		const decodedJWT = await verifyJWT(jwt);

		req.user = decodedJWT;

		next();
	} catch (err) {
		if (jwt) {
			res.clearCookie('jwt');
		}
		next(err);
	}
};

export default authenticateMiddleware;
