const { MongoClient } = require("mongodb");
let dbConnection = undefined;
let cli = undefined;

module.exports = {
  connectToDb: (connectString, dbName, callback) => {
    MongoClient.connect(connectString)
      .then((client) => {
        cli = client;
        dbConnection = client.db(dbName);

        return callback();
      })
      .catch((err) => {
        console.log(err);
        return callback(err);
      });
  },
  getDb: () => {
    return dbConnection;
  },
  disconnect: () => {
    cli.close();
    console.log("Connection Closed");
  },
};