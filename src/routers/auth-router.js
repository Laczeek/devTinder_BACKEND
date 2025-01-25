import express from 'express';

import AppError from '../utils/AppError.js';
import { signJWT } from '../utils/jwt-promise.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/signup', async (req, res, next) => {
	try {
		const userData = { ...req.body };
		const allowedKeys = ['firstName', 'lastName', 'email', 'password'];

		Object.keys(userData).forEach(
			(key) => !allowedKeys.includes(key) && delete userData[key]
		);

		const user = new User(userData);
		await user.save();

		const jwt = await signJWT({ _id: user.id });
		user.set('password', undefined);

		res.cookie('jwt', jwt, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 });

		res.status(201).json({ user });
	} catch (err) {
		next(err);
	}
});

router.post('/login', async (req, res, next) => {
	const { email, password } = req.body;

	try {
		if (
			!email ||
			email.trim().length === 0 ||
			!password ||
			password.trim().length === 0
		)
			throw new AppError('Invalid credentials', 400);

		const user = await User.findOne({ email }).select('+password');

		if (!user) throw new AppError('Invalid credentials.', 400);

		const arePasswordsSame = await user.comparePasswords(password);
		if (!arePasswordsSame) throw new AppError('Invalid credentials.', 400);

		const jwt = await signJWT({ _id: user.id });

		user.set('password', undefined);

		res.cookie('jwt', jwt, {
			maxAge: 1000 * 60 * 60 * 24,
			httpOnly: true,
		});
		res.status(200).json({ user });
	} catch (err) {
		next(err);
	}
});

router.get('/logout', (req, res) => {
	// THERE SHOULD BE LOGIC FOF ADDING JWT TO BLACKLIST IN DB
	res.clearCookie('jwt');
	res.status(200).json({ message: "You're logged out." });
});

export default router;
