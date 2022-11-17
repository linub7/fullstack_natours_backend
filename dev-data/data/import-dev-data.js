const { readFileSync } = require('fs');
const dotenv = require('dotenv');
const Tour = require('../../models/Tour');
const connectDB = require('../../config/db');

dotenv.config({
  path: `./config/config.env`,
});

// Read JSON File
const tours = JSON.parse(readFileSync(`${__dirname}/tours.json`, 'utf-8'));

connectDB();

// Import DATA into DB
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('DATA Successfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Delete All DATA from DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('DATA Successfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
}
