import { Schema, model } from 'mongoose';

const connectionSchema = new Schema(
	{
		sender: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Sender _id is required.'],
		},
		receiver: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Receiver _id is required.'],
		},

		status: {
			type: String,
			required: [true, 'Status is required.'],
			enum: {
				values: ['ignored', 'interested', 'accepted', 'rejected'],
				message: '{VALUE} value is not correct status.',
			},
		},
	},
	{ timestamps: true }
);

export default model('Connection', connectionSchema);
