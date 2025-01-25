import express from 'express';

import AppError from '../utils/AppError.js';
import User from '../models/User.js';
import Connection from '../models/Connection.js';

const LIMIT_PER_PAGE = 10;

const router = express.Router();

router.get('/me', async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user)
			throw new AppError('Your profile data cannot be found.', 404);

		res.status(200).json({ user });
	} catch (err) {
		next(err);
	}
});

router.patch('/', async (req, res, next) => {
	try {
		const updateData = { ...req.body };
		const allowedKeys = [
			'firstName',
			'lastName',
			'age',
			'gender',
			'photoURL',
			'skills',
			'about',
		];

		Object.keys(updateData).forEach(
			(key) => !allowedKeys.includes(key) && delete updateData[key]
		);

		const updatedUser = await User.findByIdAndUpdate(
			req.user._id,
			updateData,
			{ runValidators: true, new: true }
		);


		res.status(200).json({ user: updatedUser });
	} catch (err) {
		next(err);
	}
});

router.get('/feed', async (req, res, next) => {
	try {
		let page = +req.query.page;

		if (typeof page !== 'number' || page <= 0) {
			page = 1;
		}

		const skip = (page - 1) * LIMIT_PER_PAGE;

		const collections = await Connection.find({
			$or: [{ sender: req.user._id }, { receiver: req.user._id }],
		}).select('sender receiver');

		const alreadyConnectedUsersIds = collections.map((collection) =>
			collection.sender.toString() === req.user._id
				? collection.receiver
				: collection.sender
		);

		const users = await User.find({
			_id: { $nin: [...alreadyConnectedUsersIds, req.user._id] },
		})
			.skip(skip)
			.limit(LIMIT_PER_PAGE)
			.select('-email');

		res.status(200).json({ users });
	} catch (err) {
		next(err);
	}
});

export default router;
