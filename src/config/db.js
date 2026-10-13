const moongose = require('mongoose');

function connecToDB() {



    moongose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log("MongoDB connected successfully");
        })
        .catch(err => {
            console.error("MongoDB connection error:", err);
            process.exit(1);


        })
}

module.exports = connecToDB;