import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';

import Connection from '../models/Connection.js';

const logFilePath = path.join(
	import.meta.dirname,
	'..',
	'logs',
	'connections.log'
);

// At 8:00 every day
cron.schedule('0 8 * * *', async () => {
	const yesterday = new Date(new Date().setDate(new Date().getDate() - 1));
	yesterday.setUTCHours(0, 0, 0, 0);

	const yesterdayEnd = new Date(yesterday);
	yesterdayEnd.setUTCHours(23, 59, 59, 999);

	try {
		const yesterdayConnectionsCount = await Connection.find({
			createdAt: { $gte: yesterday, $lt: yesterdayEnd },
		}).countDocuments();

		await fs.appendFile(
			logFilePath,
			`${yesterday.toLocaleDateString()} - ${yesterdayConnectionsCount} \n`
		);
	} catch (err) {
		console.error('CRON SCHEDULE ERROR 💥');
		console.error(err);
	}
});
