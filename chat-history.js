const { pluck } = require('ramda')
const { inputField } = require('./utils/fixtures')
const config = require('./config')
const fetch = require("node-fetch")
const db = require('./utils/db');
const storage = require('./utils/storage');

const telegram = require('./utils/init')

/**
 * Iterating through chats (channels)
 * 
 * Note that pagination in Telegram API is not desribed well. Relying on timestamp was the only
 * option to paginate. 
 * 
 * See the details at https://github.com/LonamiWebs/Telethon/issues/188#issuecomment-398200117
 */
const getChat = async () => {
  let lastTimestamp = null;
  let channels = [];

  // currerent timestamp in seconds
  let startTimestamp = Math.floor(Date.now() / 1000);
  do {
    let params = {
      offset_peer: {
        _: 'inputPeerEmpty'
      },
      offset_id: 0,
      limit: config.telegram.getChat.limit
    }
    if (lastTimestamp !== null){
      params.offset_date = lastTimestamp;
    } else {
      params.offset_date = startTimestamp;
    }
    // see specifiction at https://core.telegram.org/method/messages.getDialogs
    const dialogs = await telegram('messages.getDialogs', params);

    let chats = dialogs.chats || [];

    let timestamps = [];
    chats.forEach(c => {
      if (c._ == 'channel' && Number.isInteger(c.date)) {
        timestamps.push(c.date);
        //console.log(getFormattedMessage(c.id, c.date, c.title));
        if (channels.filter(e => e.id === c.id).length === 0) {
          channels.push(c);
        }
      }
    });
    lastTimestamp = timestamps.length === 0 ? null : Math.max.apply(Math, timestamps);
    //console.log(`==> Last channel max timestamp ID is: ${lastTimestamp}`);
  } while (lastTimestamp !== null)

  const selectedChat = await selectChat(channels)
  console.log(selectedChat);
  return selectedChat
}

const chatHistory = async (chat) => {
  let lastMinId = null;
  let messages = [];

  // Set to integer for debugging
  let startId = null;
  do {
    let params = {
      peer: {
        _: 'inputPeerChannel',
        channel_id: chat.id,
        access_hash: chat.access_hash
      },
      add_offset: 0,
      limit: config.telegram.msgHistory.limit
    };
    // Details on offset usage (incl. examples)
    // @see https://core.telegram.org/api/offsets#offset-id-based-pagination
    if (lastMinId !== null){
      params.offset_id = lastMinId;
    } else if (startId !== null) {
      params.offset_id = startId;
    }
    // see specifiction at https://core.telegram.org/method/messages.getHistory 
    let history = await telegram('messages.getHistory', params);

    messages = history.messages || [];

    let ids = [];
    messages.forEach(m => {
      if (m._ == 'message') {
        storage.insertMessage(m);
        console.log(getFormattedMessage(m.id, m.date, m.message));
      }
      ids.push(m.id);
    });

    lastMinId = ids.length === 0 ? null : Math.min.apply(Math, ids);
    console.log(`==> Last chat history min ID is: ${lastMinId}`);
  } while (messages.length !== 0)

  console.log(`==> Chat history processing was finished.`);
  
  // if (usersMsg.length>0){
  //   const done = await sendToServer(usersMsg)
  //   printMessages(usersMsg)
  //   console.log("saved to server: ",done)
  //   console.log("Last msg id ", messages[0].id)
  // }
  // lastIdofMsgs = await db.getLastMsgId();
  // const dt = new Date()
  // const hours = dt.getHours()
  // const mins = dt.getMinutes()
  // console.log( `${hours}:${mins} - [${lastIdofMsgs}]`)
}

let sent = []

const sendToServer = async (messages) => {
	let toPush = messages.filter(m => {
		return sent.indexOf( m ) < 0;
	})
	messages.forEach(m => {
		sent.push(m.id)
	});

  //const response = await fetch(config.server,
  const response = await fetch("https://149.154.167.50",
    {
      method: 'POST',
      body: JSON.stringify(toPush),
      headers: { "Content-Type": "application/json" }
    })
  const json = await response.json();
  return json
}

const printMessages = (messages) => {
  const formatted = messages.map(formatMessage)
  formatted.forEach(e => console.log(e))
}

const uniqueArray = function(myArr, prop) {
  return myArr.filter((obj, pos, arr) => {
      return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
  });
}
const filterLastDay = ({ date }) => new Date(date * 1e3) > dayRange()
const dayRange = () => Date.now() - new Date(86400000 * 4)
const filterUsersMessages = ({ _ }) => _ === 'message'

const getFormattedMessage = (id, timestamp, message) => {
  let dt = new Date(timestamp * 1000)
  const day = dt.getDate()
  const month = dt.getMonth()
  const year = dt.getFullYear()
  const hours = dt.getHours()
  const mins = dt.getMinutes()
  return `${day}.${month}.${year} ${hours}:${mins} [${id}] ${message}`
}

const formatMessage = ({ message, date, id }) => {
  const dt = new Date(date * 1e3)
  const hours = dt.getHours()
  const mins = dt.getMinutes()
  return `${hours}:${mins} [${id}] ${message}`
}

const selectChat = async (chats) => {
  const chatNames = pluck('title', chats)
  console.log('Your chat list')
  chatNames.map((name, id) => console.log(`${id}  ${name}`))
  console.log('Select chat by index')
  const chatIndex = await inputField('index')
  return chats[+chatIndex]
}

module.exports = {
  getChat,
  chatHistory,
}
