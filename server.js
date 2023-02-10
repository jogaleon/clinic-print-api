require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/connectDB');
const app = express();

//Init
connectDB();
mongoose.connection.once('open', () => {
    console.log("Successfully connected to database.");
    app.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`);
    });
})

//Middleware

//Router