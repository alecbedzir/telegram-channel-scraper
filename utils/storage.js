const config = require('../config');
const mysql = require('mysql');
const connection = mysql.createConnection(config.storage.connection);

async function connect() {
    connection.connect((err) => {
        if (err) {
            throw err;
        }
        //console.log('Mysql connected!');
      });
}

function getMappedHistoryObj(historyObj) {
    if(!historyObj.hasOwnProperty('to_id') || !historyObj.to_id.hasOwnProperty('channel_id')) {
        console.log('ERROR: failed mapping for the history object below');
        console.log(historyObj);
        return null;
    }
    return mapped = {
        tid: historyObj.id,
        cid: historyObj.to_id.channel_id,
        from_id: historyObj.from_id,
        created_at: historyObj.date,
        message: historyObj.message
    };
}

async function insertMessage(historyObj) {    
    let message = getMappedHistoryObj(historyObj);
    if (message !== null) {
        connection.query('INSERT IGNORE INTO message SET ? ', message, (err, res) => {
            if(err) {
                throw err;
            }
            //console.log('Last insert ID:', res.insertId);
        });
    }
}

async function insertChannel(channelObj) {
    let channel = {
        'cid': channelObj.id,
        'access_hash': channelObj.access_hash,
        'title': channelObj.title
    };
    connection.query('INSERT IGNORE INTO channel SET ? ', channel, (err, res) => {
        if(err) {
            throw err;
        }
        //console.log('Last insert ID:', res.insertId);
    });
}

module.exports = { connect, insertMessage, insertChannel }