/* eslint-disable camelcase */
const cloudinary = require('../cloud');

exports.uploadImageToCloudinary = async (filePath) => {
  const { secure_url: url, public_id } = await cloudinary.uploader.upload(
    filePath,
    // image optimization for detect face
    {
      gravity: 'face',
      height: 500,
      width: 500,
      crop: 'thumb',
    }
  );
  return { url, public_id };
};

exports.destroyImageFromCloudinary = async (public_id) => {
  const { result } = await cloudinary.uploader.destroy(public_id);
  console.log(result);

  return result;
};
