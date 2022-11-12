const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config({
  path: './config/config.env',
});

connectDB();

const app = require('./app');

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
