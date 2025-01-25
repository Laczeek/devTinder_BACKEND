import { Schema, model } from 'mongoose';
import validatorUtils from 'validator';
import bcrypt from 'bcrypt';

const userSchema = new Schema(
	{
		firstName: {
			type: String,
			minLength: 1,
			maxLength: 100,
			required: [true, 'First name is required.'],
			trim: true,
			validate: {
				validator: (val) => {
					return /^[a-z ,.'-]+$/i.test(val);
				},
				message: 'Incorrect first name.',
			},
		},
		lastName: {
			type: String,
			minLength: 1,
			maxLength: 100,
			required: [true, 'Last name is required.'],
			trim: true,
			validate: {
				validator: (val) => {
					return /^[a-z ,.'-]+$/i.test(val);
				},
				message: 'Incorrect last name.',
			},
		},
		email: {
			type: String,
			required: [true, 'Email address is required.'],
			unique: true,
			lowercase: true,
			trim: true,
			validate: {
				validator: (val) => {
					return validatorUtils.isEmail(val);
				},
				message: 'Incorrect email address.',
			},
		},
		password: {
			type: String,
			required: [true, 'Password is required.'],
			validate: {
				validator: (val) => {
					return validatorUtils.isStrongPassword(val);
				},
				message: 'Please provide strong password.',
			},
			select: false,
		},
		age: {
			type: Number,
			min: 18,
		},
		gender: {
			type: String,
			enum: {
				values: ['male', 'female', 'others'],
				message: '{VALUE} is incorrect gender.',
			},
		},
		photoURL: {
			type: String,
			validate: {
				validator: (val) => {
					return validatorUtils.isURL(val);
				},
				message: 'Incorrect photo URL.',
			},
			default:
				'https://res.cloudinary.com/dy4nafoiy/image/upload/v1734745143/avatars/xkesqylhn9sgaxx1kfbi.webp',
		},
		about: {
			type: String,
			maxLength: 600,
		},
		skills: {
			type: [String],
			validate: {
				validator: (val) => {
					return val.length <= 10;
				},
				message: 'A maximum of 10 skills are allowed.',
			},
		},
	},
	{ timestamps: true }
);

userSchema.methods.comparePasswords = function (password) {
	return bcrypt.compare(password, this.password);
};

userSchema.pre('save', async function () {
	const hashedPassword = await bcrypt.hash(this.password, 13);

	this.password = hashedPassword;
});

export default model('User', userSchema);
