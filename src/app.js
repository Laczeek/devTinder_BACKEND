import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

import authenticationMiddleware from './middlewares/authentication-middleware.js';
import errorMiddleware from './middlewares/error-middleware.js';
import AppError from './utils/AppError.js';
import authRouter from './routers/auth-router.js';
import userRouter from './routers/user-router.js';
import connectionRouter from './routers/connection-router.js';
import createSocket from './utils/socket.js';
import './utils/crontasks.js';

const PORT = process.env.PORT || 8080;
const MONGO_URL = process.env.MONGO_URL;

const app = express();
app.use(
	cors({
		credentials: true,
		origin: ['http://localhost:80', 'http://localhost:5173'],
	})
);
app.use(cookieParser());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/users', authenticationMiddleware, userRouter);
app.use('/connections', authenticationMiddleware, connectionRouter);

app.all('*', (req, res) => {
	const path = req.path;
	const method = req.method;

	throw new AppError(`(${method} ${path}) endpoint is not supported.`, 404);
});

app.use(errorMiddleware);

const server = http.createServer(app);

createSocket(server);

mongoose.connect(MONGO_URL).then(() => {
	console.log('CONNECTION WITH MONGO SERVER ESTABILISHED.');
	server.listen(PORT, () => {
		console.log('HTTP SERVER LISTENING ON PORT ' + PORT);
	});
});

process.on('uncaughtException', (err) => {
	console.error('ERROR OCCURED!!!');
	console.error(err);
	process.exit(1);
});
