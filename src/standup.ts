import { getData, setData, message } from './dataStore';
import {
  getUserId, isValidToken, isInChannel, getChannel, updateUserStats,
  updateWorkSpace
} from './global';
import { userProfileV3 } from './users';
import HTTPError from 'http-errors';

const requestTime = () => Math.floor((new Date()).getTime() / 1000);

/**
  *
  * For a given channel, starts a standup period lasting length seconds.
  *
  * @param {string} token - a valid token
  * @param {number} channelId - a valid channelId
  * @param {number} length - length of standup
  *
  * @returns {timeFinish: number} - the time that standup finishes
*/

export function standupStartV1(token: string, channelId: number, length: number) {
  const finishTime = requestTime() + length;
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }
  const channel = getChannel(channelId, data.channels);
  if (!channel) {
    throw HTTPError(400, 'Invalid channelId');
  }
  if (length <= 0) {
    throw HTTPError(400, 'Length cannot be negative');
  }
  if (channel.standupDetails.isActiveStandup) {
    throw HTTPError(400, 'Active standup currently running');
  }
  const uId = getUserId(token);
  if (!isInChannel(uId, channelId)) {
    throw HTTPError(403, 'Authorised user not member of channel');
  }

  const index = data.channels.indexOf(channel);
  data.channels[index].standupDetails.authUserId = uId;
  data.channels[index].standupDetails.isActiveStandup = true;
  data.channels[index].standupDetails.timeFinish = finishTime;
  setData(data);

  // sleep for length duration, then send messages to channel
  setTimeout(() => { sendMessagesToChannel(channelId, index, uId); }, length * 1000);

  return { timeFinish: finishTime };
}

/**
  *
  * For a given channel, returns whether a standup is active in it,
  * and what time the standup finishes.
  *
  * @param {string} token - a valid token
  * @param {number} channelId - a valid channelId
  *
  * @returns {isActive: boolean
  *           timeFinish: number
  *           } - if the standup is active AND
  *             - the time that standup finishes
*/

export function standupActiveV1(token: string, channelId: number) {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }
  const channel = getChannel(channelId, data.channels);
  if (channel === null) {
    throw HTTPError(400, 'Invalid channelId');
  }
  const uId = getUserId(token);
  if (!isInChannel(uId, channelId)) {
    throw HTTPError(403, 'Authorised user not member of channel');
  }

  const finishTime = channel.standupDetails.timeFinish;
  const status: boolean = channel.standupDetails.isActiveStandup;
  return {
    isActive: status,
    timeFinish: (!status) ? null : finishTime,
  };
}

/**
  *
  * For a given channel, if a standup is currently active in the channel,
  * sends a message to get buffered in the standup queue.
  *
  * @param {string} token - a valid token
  * @param {number} channelId - a valid channelId
  * @param {string} message - a valid message
  *
  * @returns {} - empty object
*/

export function standupSendV1(token: string, channelId: number, message: string) {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }
  const channel = getChannel(channelId, data.channels);
  if (!channel) {
    throw HTTPError(400, 'Invalid channelId');
  }
  if (message.length > 1000) {
    throw HTTPError(400, 'Length cannot be over 1000 character');
  }
  if (!channel.standupDetails.isActiveStandup) {
    throw HTTPError(400, 'No active standup currently running');
  }
  const uId = getUserId(token);
  if (!isInChannel(uId, channelId)) {
    throw HTTPError(403, 'Authorised user not member of channel');
  }

  if (message.length !== 0) {
    const user = userProfileV3(token, uId);
    const handle = user.user.handleStr;

    const output = `${handle}: ${message}`;

    const index = data.channels.indexOf(channel);
    data.channels[index].standupDetails.standupMessages.push(output);
    setData(data);
  }

  return {};
}

// Helper function that sends message to channel after end of standupStart
function sendMessagesToChannel(channelId: number, index: number, uId: number) {
  const data = getData();
  const standupChannel = data.channels[index].standupDetails;
  let msgObj = null;
  let msgsExist = false;

  if (standupChannel.standupMessages.length !== 0) {
    msgsExist = true;
    let finalOutput = '';
    for (let i = 0; i < standupChannel.standupMessages.length - 1; i++) {
      finalOutput += (standupChannel.standupMessages[i] + '\n');
    }
    // don't print newline for last message
    finalOutput += standupChannel.standupMessages[(standupChannel.standupMessages.length) - 1];

    const messageId = data.messageDetails.length;

    const newMessage: message = {
      messageId: messageId,
      uId: uId,
      message: finalOutput,
      timeSent: requestTime(),
      reacts: [],
      isPinned: false,
      tags: [],
    };

    msgObj = newMessage;

    data.channels[index].channelmessages.push(newMessage);
    data.messageDetails.push({
      uId: uId,
      message: finalOutput,
      messageId: messageId,
      isDm: false,
      listId: channelId,
      tags: [],
    });
  }
  // no longer active
  standupChannel.authUserId = null;
  standupChannel.isActiveStandup = false;
  standupChannel.standupMessages = [];
  standupChannel.timeFinish = null;
  setData(data);
  if (msgsExist) {
    updateUserStats(uId, 'msgs', 'add', msgObj.timeSent);
    updateWorkSpace('msgs', 'add', msgObj.timeSent);
  }
  return {};
}
