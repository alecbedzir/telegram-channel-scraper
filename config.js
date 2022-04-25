require('dotenv').config();

const config = {
    telegram: {
        id: process.env.TELEGRAM_APP_ID,
        hash: process.env.TELEGRAM_APP_HASH,
        phone: process.env.TELEGRAM_PHONE_NUMBER,
        storage: process.env.TELEGRAM_FILE,
        devServer: false,
        msgHistory: {
            limit: 99
        },
        getChat: {
            limit: 50
        },
    },
    storage: {
        connection: {
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DBNAME
        }
    },
    dbfile: process.env.DB_FILE,
    chatdb: process.env.CHAT_FILE,
    server: process.env.SERVER_URL
}

module.exports = config;