import { Server } from 'socket.io';
import cookie from 'cookie';

import { verifyJWT } from './jwt-promise.js';
import Chat from '../models/Chat.js';
import Connection from '../models/Connection.js';

const createRoom = (uid, uid2) => {
	return [uid, uid2].sort().join('_');
};

const onlineUsersMap = new Map();

const createSocket = (serverInstance) => {
	const io = new Server(serverInstance, {
		cors: {
			credentials: true,
			origin: ['http://localhost:80', 'http://localhost:5173'],
		},
	});

	io.use(async (socket, next) => {
		const cookies = cookie.parse(socket.handshake.headers.cookie || '');
		try {
			if (!cookies.jwt) throw new Error('You are unauthorized.');

			const decodedJWT = await verifyJWT(cookies.jwt);
			socket.user = decodedJWT;
			next();
		} catch (err) {
			next(err);
		}
	});

	io.on('connection', (socket) => {
		socket.on('joinChat', async (data) => {
			try {
				const areFriends = await Connection.findOne({
					$or: [
						{
							sender: socket.user._id,
							receiver: data.userId,
						},
						{ sender: data.userId, receiver: socket.user._id },
					],
					status: 'accepted',
				});

				if (!areFriends) throw new Error('User are not fiends.');

				const room = createRoom(socket.user._id, data.userId);
				socket.join(room);

				let chat = await Chat.findOne({
					participants: { $all: [socket.user._id, data.userId] },
				});

				if (!chat) {
					chat = new Chat({
						participants: [socket.user._id, data.userId],
					});
					await chat.save();
				}

				await chat.populate(
					'participants',
					'firstName lastName photoURL'
				);

				if (!onlineUsersMap.has(room)) {
					onlineUsersMap.set(room, new Set([socket.user._id]));
				} else {
					onlineUsersMap.get(room).add(socket.user._id);
				}

				socket.emit('joinChat', {
					chat,
				});
				io.to(room).emit('onlineUsers', {
					onlineUsers: [...onlineUsersMap.get(room)],
				});
			} catch (err) {
				socket.emit('errorEvent', {
					message:
						'Something went wrong when receiving chat history.',
				});
			}
		});

		socket.on('sendMessage', async (data) => {
			const room = createRoom(socket.user._id, data.userId);
			try {
				const message = {
					text: data.text,
					sender: socket.user._id,
				};

				const chat = await Chat.findOneAndUpdate(
					{ participants: { $all: [socket.user._id, data.userId] } },
					{
						$push: {
							messages: message,
						},
					},
					{ runValidators: true, new: true }
				);

				io.to(room).emit('receiveMessage', {
					message: chat.messages.at(-1),
				});
			} catch (err) {
				socket.emit('errorEvent', {
					message: 'Something went wrong while sending the message.',
				});
			}
		});

		socket.on('leaveRoom', (data) => {
			const room = createRoom(socket.user._id, data.userId);
			socket.leave(room);

			const participantsSet = onlineUsersMap.get(room);

			if (!participantsSet) return;

			participantsSet.delete(socket.user._id);

			io.to(room).emit('onlineUsers', {
				onlineUsers: [...participantsSet],
			});

			if (participantsSet.size === 0) {
				onlineUsersMap.delete(room);
			}
		});

		socket.on('disconnect', () => {
			onlineUsersMap.forEach((participantsSet, room) => {
				if (participantsSet && participantsSet.has(socket.user._id)) {
					participantsSet.delete(socket.user._id);

					io.to(room).emit('onlineUsers', {
						onlineUsers: [...participantsSet],
					});

					if (participantsSet.size === 0) {
						onlineUsersMap.delete(room);
					}
				}
			});
		});
	});
};

export default createSocket;
