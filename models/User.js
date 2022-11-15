const mongoose = require('mongoose');
const validator = require('validator');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      minlength: [2, 'Name must be more or equal than 2'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a valid email'],
    },
    photo: {
      type: String,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      min: [8, 'password must be at least 8 characters'],
      max: [25, 'password must be less that 26 characters'],
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      min: [6, 'password must be at least 6 characters'],
      max: [25, 'password must be less that 26 characters'],
    },
  },
  // without toJSON: { virtuals: true }, toObject: { virtuals: true } our virtual field will now show
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model('User', UserSchema);
