
const { getChat, chatHistory } = require('./chat-history')
const db = require('./utils/db');
const storage = require('./utils/storage');
const {checkLogin} = require('./utils/node-storage');

const storage_connect = async () => {
  await storage.connect();
}

const run = async (chat) => {
  await chatHistory(chat);
}

const start = async () => {
  await checkLogin();

  //let chat = await db.getChat();
  //if (!chat) {
    // chat = await getChat();
    // await db.updateChat(chat);
    // await storage.insertChannel(chat);
  //}
  chat = await getChat();
  await storage.insertChannel(chat);

  // let timerId = setTimeout(function tick() {
  //   run(chat);
  //   timerId = setTimeout(tick, 10000);
  // }, 2000);
  run(chat);
}

storage_connect();
start();