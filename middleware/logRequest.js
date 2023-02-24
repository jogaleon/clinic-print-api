const logRequest = (req, res, next) => {
    console.count(`${req.method} ${req.url}`);
    next();
}

module.exports = logRequest;