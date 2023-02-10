const mongoose = require('mongoose');

const connectDB = () => {
    mongoose.set('strictQuery', false);
    mongoose.connect(process.env.MONGO_DATABASE_URI)
}

module.exports = connectDB;