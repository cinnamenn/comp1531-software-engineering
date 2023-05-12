import { getData, setData, reactions } from './dataStore';
import {
  isValidToken, isValidChannel, isInChannel, getUserId,
  isDmMember, isDmValid, getChannelIndex, getDmIndex, getMessageDetails,
  isGlobalOwner, getTags, isInDm, updateUserStats, updateWorkSpace
} from './global';
import HTTPError from 'http-errors';
const requestTimesent = () => Math.floor((new Date()).getTime() / 1000);

/**
  * Send a message from the authorised user to the channel specified by channelId.
  * Note: Each message should have its own unique ID, i.e. no messages should share
  * an ID with another message, even if that other message is in a different channel.
  *
  * @param {string} token - a valid authUserId from datadata
  * @param {number} channelId - a valid channelId from datadata
  * @param {string} message - string send by authorised user
  *
  * @returns {messageId} - the message id from the message sent by
  * @returns {error: error} - return error object in invalid cases
*/

function messageSendV2(token: string, channelId: number, message: string) {
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid auth user id');
  }
  const uId = getUserId(token);
  if (!isValidChannel(channelId)) {
    throw HTTPError(400, 'invalid channel id');
  }
  // check the message exist but the length is wrong
  if (message.length < 1 || message.length > 1000) {
    throw HTTPError(400, 'invalid message length');
  }
  // check the user is not in the channel
  if (!isInChannel(uId, channelId)) {
    throw HTTPError(403, 'auth user not in channel');
  }

  return sendMsg(token, channelId, -1, message);
}

/**
  * Given a message, update its text with new text. If the new message is an
  * empty string, the message is deleted.
  *
  * @param {string} token - a valid authUserId from datadata
  * @param {number} messageId - a valid messageId from datadata
  * @param {string} message - string send by authorised user
  *
  * @returns {} - return empty
  * @returns {error: error} - return error object in invalid cases
*/

function messageEditV2(token: string, messageId: number, message: string) {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid auth user id');
  }

  const authUserId = getUserId(token);

  if (message === '') {
    return messageRemoveV2(token, messageId);
  }

  const msg = getMessageDetails(messageId);

  if (msg === null) {
    throw HTTPError(400, 'invalid message id');
  }

  if (!msg.isDm) {
    // check if user is in channel
    if (!data.channels[msg.listIndex].memberIds.includes(authUserId)) {
      throw HTTPError(400, 'auth user not in channel');
    }
    // check if user has perms
    if (!data.channels[msg.listIndex].ownerIds.includes(authUserId) && msg.uId !== authUserId && !isGlobalOwner(authUserId)) {
      throw HTTPError(403, 'auth user in channel but dosent have perms');
    }
    if (message.length > 1000) {
      throw HTTPError(400, 'invalid message length');
    }
    data.channels[msg.listIndex].channelmessages[msg.messageIndex].message = message;
    const tags = getTags(message);
    for (const id of tags) {
      if (!data.channels[msg.listIndex].channelmessages[msg.messageIndex].tags.includes(id)) {
        data.channels[msg.listIndex].channelmessages[msg.messageIndex].tags.push(id);
      }
    }
  } else {
    // check is user is in dm and has perms
    if (!data.dms[msg.listIndex].members.includes(authUserId)) {
      throw HTTPError(400, 'auth user not in dm');
    }
    if (data.dms[msg.listIndex].owner !== authUserId && msg.uId !== authUserId) {
      throw HTTPError(403, 'auth user does not have permission');
    }
    if (message.length > 1000) {
      throw HTTPError(400, 'invalid message length');
    }
    data.dms[msg.listIndex].messages[msg.messageIndex].message = message;
    const tags = getTags(message);
    for (const id of tags) {
      if (!data.dms[msg.listIndex].messages[msg.messageIndex].tags.includes(id)) {
        data.dms[msg.listIndex].messages[msg.messageIndex].tags.push(id);
      }
    }
  }

  setData(data);
  return {};
}

/**
  * Given a messageId for a message, this message is removed from the channel/DM
  *
  * @param {string} token - a valid authUserId from datadata
  * @param {number} messageId - a valid messageId from datadata
  *
  *
  * @returns {} - return empty
  * @returns {error: error} - return error object in invalid cases
*/

function messageRemoveV2(token: string, messageId: number) {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid auth user id');
  }
  const authUserId = getUserId(token);

  const msg = getMessageDetails(messageId);

  if (msg === null) {
    throw HTTPError(400, 'invalid message id');
  }

  if (!msg.isDm) {
    // check if user is in channel and has perms
    if (!data.channels[msg.listIndex].memberIds.includes(authUserId)) {
      throw HTTPError(400, 'user not in channel');
    }
    // if not owner, msg not sent by authuser, not global owner
    if (!data.channels[msg.listIndex].ownerIds.includes(authUserId) && msg.uId !== authUserId && !isGlobalOwner(authUserId)) {
      throw HTTPError(403, 'user does not have permission to delete');
    }
    data.channels[msg.listIndex].channelmessages.splice(msg.messageIndex, 1);
  } else {
    // check is user is in dm and has perms
    if (!data.dms[msg.listIndex].members.includes(authUserId)) {
      throw HTTPError(400, 'user not in dm');
    }
    if (data.dms[msg.listIndex].owner !== authUserId && msg.uId !== authUserId) {
      throw HTTPError(403, 'user does not have permission to delete');
    }
    data.dms[msg.listIndex].messages.splice(msg.messageIndex, 1);
  }

  let index = 0;
  for (const i in data.messageDetails) {
    if (data.messageDetails[i].messageId === messageId) {
      index = parseInt(i);
    }
  }
  data.messageDetails.splice(index, 1);

  setData(data);

  updateWorkSpace('msgs', 'remove', requestTimesent(), 1);
  return {};
}

/**
  * Send a message from authorised user to the DM specified by dmId.
  * Note: Each message should have it's own unique ID, i.e. no messages
  * should share an ID with another message, even if that other message
  * is in a different channel or DM.
  *
  * @param {string} token - a valid authUserId from datadata
  * @param {number} dmId - a valid dmId from datadata
  * @param {string} message - a valid message from datadata
  *
  *
  * @returns {messageId} - the message id from the message sent by
  * @returns {error: error} - return error object in invalid cases
*/

function messageSenddmV2(token: string, dmId: number, message: string) {
  const uId = getUserId(token);
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid auth user id');
  }

  if (!isDmValid(dmId)) {
    throw HTTPError(400, 'invalid dm id');
  }
  const checkdmId = isDmMember(uId, dmId);

  if (!checkdmId) {
    throw HTTPError(403, 'user not in dm');
  }
  if (message.length < 1 || message.length > 1000) {
    throw HTTPError(400, 'invalid message length');
  }

  return sendMsg(token, -1, dmId, message);
}

function messageShareV1(token: string, ogMessageId: number, message: string, channelId: number, dmId: number) {
  const data = getData();
  const uId = getUserId(token);
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid auth user id');
  }

  if (channelId !== -1 && dmId === -1) {
    if (isValidChannel(channelId) && !isInChannel(uId, channelId)) {
      throw HTTPError(403, 'auth user not in channel');
    }
  } else if (dmId !== -1 && channelId === -1) {
    if (isDmValid(dmId) && !isInDm(uId, dmId)) {
      throw HTTPError(403, 'auth user not in dm');
    }
  } else {
    throw HTTPError(400, 'channel/dm not specified');
  }

  if (message.length > 1000) {
    throw HTTPError(400, 'invalid message length');
  }

  const msg = getMessageDetails(ogMessageId);

  if (msg === null) {
    throw HTTPError(400, 'invalid message id');
  }

  let newMessage = '';
  if (!msg.isDm) {
    if (!data.channels[msg.listIndex].memberIds.includes(uId)) {
      throw HTTPError(400, 'auth user not in og message channel');
    }
    newMessage += data.channels[msg.listIndex].channelmessages[msg.messageIndex].message;
  } else {
    if (!data.dms[msg.listIndex].members.includes(uId)) {
      throw HTTPError(400, 'auth user not in og message dm');
    }
    newMessage += data.dms[msg.listIndex].messages[msg.messageIndex].message;
  }

  newMessage += '```';
  newMessage += message;
  newMessage += '```';
  let sharedMessageId = 0;

  sharedMessageId = sendMsg(token, channelId, dmId, newMessage).messageId;

  return { sharedMessageId: sharedMessageId };
}

function messageReactV1(token: string, messageId: number, reactId: number) {
  const data = getData();
  const uId = getUserId(token);
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid auth user id');
  }

  const msg = getMessageDetails(messageId);

  if (msg === null) {
    throw HTTPError(400, 'invalid message id');
  }

  if (reactId !== 1) {
    throw HTTPError(400, 'reactId does not exist');
  }

  let isMember = false;
  let reactCodeExist = false;
  if (!msg.isDm) {
    if (!data.channels[msg.listIndex].memberIds.includes(uId)) {
      throw HTTPError(400, 'auth user not in message channel');
    }
    for (const reaction of data.channels[msg.listIndex].channelmessages[msg.messageIndex].reacts) {
      if (reaction.reactId === reactId) {
        if (reaction.uIds.includes(uId)) {
          throw HTTPError(400, 'auth user already reacted');
        }
        reaction.uIds.push(uId);
        reactCodeExist = true;
        break;
      }
    }
    if (isInChannel(msg.uId, data.channels[msg.listIndex].channelId)) {
      isMember = true;
    }
    if (!reactCodeExist) {
      data.channels[msg.listIndex].channelmessages[msg.messageIndex].reacts.push({
        reactId: reactId,
        uIds: [uId],
        isThisUserReacted: true,
      });
    }
  } else {
    if (!data.dms[msg.listIndex].members.includes(uId)) {
      throw HTTPError(400, 'auth user not in message dm');
    }
    for (const reaction of data.dms[msg.listIndex].messages[msg.messageIndex].reacts) {
      if (reaction.reactId === reactId) {
        if (reaction.uIds.includes(uId)) {
          throw HTTPError(400, 'auth user already reacted');
        }
        reaction.uIds.push(uId);
        reactCodeExist = true;
        break;
      }
    }
    if (isInDm(msg.uId, data.dms[msg.listIndex].dmId)) {
      isMember = true;
    }
    if (!reactCodeExist) {
      data.dms[msg.listIndex].messages[msg.messageIndex].reacts.push({
        reactId: reactId,
        uIds: [uId],
        isThisUserReacted: true,
      });
    }
  }

  data.reactDetails.push({
    authUserId: uId, // reactor
    isDm: msg.isDm,
    listId: (msg.isDm) ? data.dms[msg.listIndex].dmId : data.channels[msg.listIndex].channelId,
    messageId: messageId,
    senderId: msg.uId, // sender
    timeCounter: data.counter,
    isSenderMember: isMember,
  });
  data.counter++;
  setData(data);
  return {};
}

function messageUnreactV1(token: string, messageId: number, reactId: number) {
  const data = getData();
  const uId = getUserId(token);
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid auth user id');
  }

  const msg = getMessageDetails(messageId);

  if (msg === null) {
    throw HTTPError(400, 'invalid message id');
  }

  if (reactId !== 1) {
    throw HTTPError(400, 'reactId does not exist');
  }

  if (!msg.isDm) {
    if (!data.channels[msg.listIndex].memberIds.includes(uId)) {
      throw HTTPError(400, 'auth user not in message channel');
    }
    for (const reaction of data.channels[msg.listIndex].channelmessages[msg.messageIndex].reacts) {
      if (reaction.reactId === reactId) {
        if (reaction.uIds.includes(uId)) {
          reaction.uIds.splice(reaction.uIds.indexOf(uId), 1);
          setData(data);
          return {};
        }
      }
    }
    throw HTTPError(400, 'auth user did not react');
  } else {
    if (!data.dms[msg.listIndex].members.includes(uId)) {
      throw HTTPError(400, 'auth user not in message dm');
    }
    for (const reaction of data.dms[msg.listIndex].messages[msg.messageIndex].reacts) {
      if (reaction.reactId === reactId) {
        if (reaction.uIds.includes(uId)) {
          reaction.uIds.splice(reaction.uIds.indexOf(uId), 1);
          setData(data);
          return {};
        }
      }
    }
    throw HTTPError(400, 'auth user did not react');
  }
}

function messagePinV1(token: string, messageId: number) {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid auth user id');
  }
  const authUserId = getUserId(token);

  const msg = getMessageDetails(messageId);

  if (msg === null) {
    throw HTTPError(400, 'invalid message id');
  }
  if (!msg.isDm) {
    if (!data.channels[msg.listIndex].memberIds.includes(authUserId)) {
      throw HTTPError(400, 'auth user not in og message channel');
    }
    if (!data.channels[msg.listIndex].ownerIds.includes(authUserId) && !isGlobalOwner(authUserId)) {
      throw HTTPError(403, 'auth user does not have owner perms');
    }
    if (data.channels[msg.listIndex].channelmessages[msg.messageIndex].isPinned) {
      throw HTTPError(400, 'message already pinned');
    }
    data.channels[msg.listIndex].channelmessages[msg.messageIndex].isPinned = true;
    setData(data);
    return {};
  } else {
    if (!data.dms[msg.listIndex].members.includes(authUserId)) {
      throw HTTPError(400, 'auth user not in og message dm');
    }
    if (data.dms[msg.listIndex].owner !== authUserId) {
      throw HTTPError(403, 'auth user does not have owner perms');
    }
    if (data.dms[msg.listIndex].messages[msg.messageIndex].isPinned) {
      throw HTTPError(400, 'message already pinned');
    }
    data.dms[msg.listIndex].messages[msg.messageIndex].isPinned = true;
    setData(data);
    return {};
  }
}

function messageUnpinV1(token: string, messageId: number) {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid auth user id');
  }
  const authUserId = getUserId(token);

  const msg = getMessageDetails(messageId);

  if (msg === null) {
    throw HTTPError(400, 'invalid message id');
  }
  if (!msg.isDm) {
    if (!data.channels[msg.listIndex].memberIds.includes(authUserId)) {
      throw HTTPError(400, 'auth user not in og message channel');
    }
    if (!data.channels[msg.listIndex].ownerIds.includes(authUserId) && !isGlobalOwner(authUserId)) {
      throw HTTPError(403, 'auth user does not have owner perms');
    }
    if (!data.channels[msg.listIndex].channelmessages[msg.messageIndex].isPinned) {
      throw HTTPError(400, 'message not pinned');
    }
    data.channels[msg.listIndex].channelmessages[msg.messageIndex].isPinned = false;
    setData(data);
    return {};
  } else {
    if (!data.dms[msg.listIndex].members.includes(authUserId)) {
      throw HTTPError(400, 'auth user not in og message dm');
    }
    if (data.dms[msg.listIndex].owner !== authUserId) {
      throw HTTPError(403, 'auth user does not have owner perms');
    }
    if (!data.dms[msg.listIndex].messages[msg.messageIndex].isPinned) {
      throw HTTPError(400, 'message not pinned');
    }
    data.dms[msg.listIndex].messages[msg.messageIndex].isPinned = false;
    setData(data);
    return {};
  }
}

function messageSendlaterV1(token: string, channelId: number, message: string, timeSent: number) {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid auth user id');
  }
  const authUserId = getUserId(token);

  if (!isValidChannel(channelId)) {
    throw HTTPError(400, 'invalid channel id');
  }

  if (!isInChannel(authUserId, channelId)) {
    throw HTTPError(403, 'auth user not in channel');
  }

  if (message.length < 1 || message.length > 1000) {
    throw HTTPError(400, 'invalid message length');
  }

  if (timeSent < requestTimesent()) {
    throw HTTPError(400, 'time invalid');
  }
  setTimeout(() => sendMsg(token, channelId, -1, message), (timeSent - requestTimesent()) * 1000);
  return { messageId: data.messageDetails.length };
}

function messageSendlaterdmV1(token: string, dmId: number, message: string, timeSent: number) {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'invalid auth user id');
  }
  const authUserId = getUserId(token);

  if (!isDmValid(dmId)) {
    throw HTTPError(400, 'invalid dm id');
  }

  if (!isInDm(authUserId, dmId)) {
    throw HTTPError(403, 'auth user not in channel');
  }

  if (message.length < 1 || message.length > 1000) {
    throw HTTPError(400, 'invalid message length');
  }

  if (timeSent < requestTimesent()) {
    throw HTTPError(400, 'time invalid');
  }
  setTimeout(() => sendMsg(token, -1, dmId, message), (timeSent - requestTimesent()) * 1000);
  return { messageId: data.messageDetails.length };
}

// helper function to send msg without error checking
function sendMsg(token: string, channelId: number, dmId: number, message: string) {
  const data = getData();
  const authUserId = getUserId(token);
  let isDm = false;

  const messageId = data.messageDetails.length;
  const react: reactions[] = [];
  const allTags = getTags(message);
  const tags: number[] = [];

  const newMessage = {
    messageId: messageId,
    uId: authUserId,
    message: message,
    timeSent: requestTimesent(),
    reacts: react,
    isPinned: false,
    tags: tags,
  };

  if (channelId === -1) {
    isDm = true;
    const dmIndex = getDmIndex(dmId);

    for (const i in allTags) {
      if (isInDm(allTags[i], dmId)) {
        newMessage.tags.push(allTags[i]);
      }
    }
    data.dms[dmIndex].messages.push(newMessage);
  } else { // dmId === -1
    isDm = false;
    const cIndex = getChannelIndex(channelId);

    if (!data.channels[cIndex].standupDetails.isActiveStandup) {
      for (const i in allTags) {
        if (isInChannel(allTags[i], channelId)) {
          newMessage.tags.push(allTags[i]);
        }
      }
    }
    data.channels[cIndex].channelmessages.push(newMessage);
  }

  data.messageDetails.push({
    uId: authUserId,
    message: message,
    messageId: messageId,
    isDm: isDm,
    listId: (isDm) ? dmId : channelId,
    tags: newMessage.tags,
    timeCounter: data.counter,
  });

  data.counter++;
  setData(data);
  // Updating userStats
  updateUserStats(authUserId, 'msgs', 'add', newMessage.timeSent);
  // Updating workspace
  updateWorkSpace('msgs', 'add', newMessage.timeSent);
  return { messageId: messageId };
}

export {
  messageSendV2, messageEditV2, messageRemoveV2, messageSenddmV2,
  messageShareV1, messageReactV1, messageUnreactV1, messagePinV1,
  messageUnpinV1, messageSendlaterV1, messageSendlaterdmV1
};
