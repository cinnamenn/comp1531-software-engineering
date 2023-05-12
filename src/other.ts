import { getData, setData } from './dataStore';
import { getUserId, isValidToken } from './global';
const fs = require('fs');
const path = require('path');

import HTTPError from 'http-errors';

/**
  * Resets the internal data of the application to its initial state.

  * @returns {}
**/

function clearV1() {
  let data = getData();
  data = {
    users: [],
    channels: [],
    dms: [],
    sessionIds: [],
    messageDetails: [],
    inviteDetails: [],
    reactDetails: [],
    workspaceStats: {
      channelsExist: [{ numChannelsExist: 0, timeStamp: 0 }],
      dmsExist: [{ numDmsExist: 0, timeStamp: 0 }],
      messagesExist: [{ numMessagesExist: 0, timeStamp: 0 }],
    },
    counter: 0,
  };
  setData(data);

  // Removes files from static/profilepics
  removeFiles();
  return {};
}

function removeFiles() {
  const directory = 'static';

  fs.readdir(directory, (err: any, files: Array<any>) => {
    if (err) throw err;

    for (const file of files) {
      if (file !== 'default') {
        fs.unlink(path.join(directory, file), (err: any) => {
          if (err) throw err;
        });
      }
    }
  });
}

/**
  * Given a query substring, returns a collection of messages in all
  * of the channels/DMs that the user has joined that contain the query
  * (case-insensitive). There is no expected order for these messages.
  *
  * @param {string} token - a valid token from datStore
  * @param {string} queryStr - a query string
  *
  * @returns {Object: Messages: {messageId, uId, message, timeSent}}
**/

function searchV1(token: string, queryStr: string) {
  const data = getData();

  // check is user session is valid
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid session id');
  }

  if (queryStr.length < 1 || queryStr.length > 1000) {
    throw HTTPError(400, 'invalid queryStr length');
  }

  const authUserId = getUserId(token);

  const msgList = [];
  // checking channels
  for (const channel of data.channels) {
    if (!channel.memberIds.includes(authUserId)) {
      continue;
    }
    for (const message of channel.channelmessages) {
      if (message.uId === authUserId && message.message.includes(queryStr)) {
        const msg = message;
        delete msg.tags;
        msgList.push(msg);
      }
    }
  }

  // checking dms
  for (const dm of data.dms) {
    if (!dm.members.includes(authUserId)) {
      continue;
    }
    for (const message of dm.messages) {
      if (message.uId === authUserId && message.message.includes(queryStr)) {
        const msg = message;
        delete msg.tags;
        msgList.push(msg);
      }
    }
  }

  return { messages: msgList };
}

export {
  clearV1, searchV1
};
