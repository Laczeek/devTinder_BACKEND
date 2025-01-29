import { Schema, model } from 'mongoose';

const messageSchema = new Schema(
	{
		text: {
			type: String,
			minLength: 1,
			maxLength: 2000,
			required: true,
			trim: true,
		},
		sender: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{ timestamps: true }
);

const chatSchema = new Schema(
	{
		participants: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User',
				required: true,
			},
		],
		messages: [messageSchema],
	},
	{ timestamps: true }
);

export default model('Chat', chatSchema);
