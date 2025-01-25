import express from 'express';
import { Types } from 'mongoose';

import Connection from '../models/Connection.js';
import AppError from '../utils/AppError.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/:status/:uid', async (req, res, next) => {
	const receiverId = req.params.uid;
	const status = req.params.status;

	const allowedStatus = ['interested', 'ignored'];

	try {
		if (!allowedStatus.includes(status))
			throw new AppError('Provided status is not allowed.', 400);

		if (req.user._id === receiverId)
			throw new AppError('You cannot connect with your self.', 403);

		const isReceiverExist = await User.findById(receiverId);
		if (!isReceiverExist)
			throw new AppError('User with provided _id does not exist.', 404);

		const isConnectionAlreadyCreated = await Connection.findOne({
			$or: [
				{
					sender: req.user._id,
					receiver: receiverId,
				},
				{ sender: receiverId, receiver: req.user._id },
			],
		});

		if (isConnectionAlreadyCreated)
			throw new AppError('Connection is already created.', 403);

		const connection = await Connection.create({
			receiver: receiverId,
			sender: req.user._id,
			status: status,
		});

		res.status(201).json({ connection });
	} catch (err) {
		next(err);
	}
});

router.patch('/:status/:cid', async (req, res, next) => {
	const connectionId = req.params.cid;
	const status = req.params.status;
	const allowedStatus = ['accepted', 'rejected'];
	try {
		if (!allowedStatus.includes(status))
			throw new AppError('Provided status is not allowed.', 400);

		const connection = await Connection.findById(connectionId);
		if (!connection) throw new AppError('Connection cannot be found.', 404);

		if (connection.receiver.toString() !== req.user._id)
			throw new AppError("You're not receiver of this connection.", 403);

		if (connection.status !== 'interested')
			throw new AppError('This connection is already finalized.', 403);

		connection.status = status;
		await connection.save();

		res.status(200).json({ connection });
	} catch (err) {
		next(err);
	}
});

router.get('/accepted', async (req, res, next) => {
	try {
		const connections = await Connection.aggregate([
			{
				$match: {
					$or: [
						{ receiver: new Types.ObjectId(`${req.user._id}`) },
						{ sender: new Types.ObjectId(`${req.user._id}`) },
					],
					status: 'accepted',
				},
			},
			{
				$project: {
					_id: 1,
					status: 1,
					createdAt: 1,
					updatedAt: 1,
					ourMatch: {
						$cond: {
							if: {
								$ne: [
									'$receiver',
									new Types.ObjectId(`${req.user._id}`),
								],
							},
							then: '$receiver',
							else: '$sender',
						},
					},
				},
			},
			{
				$lookup: {
					from: 'users',
					localField: 'ourMatch',
					foreignField: '_id',
					as: 'ourMatch',
				},
			},
			{
				$set: {
					ourMatch: { $arrayElemAt: ['$ourMatch', 0] },
				},
			},
			{ $unset: ['ourMatch.password', 'ourMatch.email', 'ourMatch.__v'] },
		]);

		res.status(200).json({ connections });
	} catch (err) {
		next(err);
	}
});

router.get('/requests', async (req, res, next) => {
	try {
		const connections = await Connection.find({
			receiver: req.user._id,
			status: 'interested',
		}).populate('sender', '-__v -updatedAt -createdAt -email');

		res.status(200).json({ connections });
	} catch (err) {
		next(err);
	}
});

export default router;
