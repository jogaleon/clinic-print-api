//Main Dependencies
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

//Middleware Dependencies
const cors = require('cors');

//Function imports
const connectDB = require('./config/connectDB');
const logRequest = require('./middleware/logRequest');

//Init
const app = express();  
connectDB();
mongoose.connection.once('open', () => {
    console.log("Successfully connected to database.");
    app.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`);
    });
});

//Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Routes
app.use(logRequest);
app.use('/api/receipt', require('./routes/api/receipt.route'));