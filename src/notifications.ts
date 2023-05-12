import { getData } from './dataStore';
import { getUserId, isValidToken, isInChannel, isInDm } from './global';
import { getChannelDetails, getDmDetails } from './global';
import { userProfileV3 } from './users';

import HTTPError from 'http-errors';

type NotifArr = {
  channelId: number;
  dmId: number;
  notificationMessage: string;
  timeCounter: number;
}

function getTaggedNotif(token: string) {
  const data = getData();
  const uId = getUserId(token);
  const arr = [];

  for (const msg of data.messageDetails) {
    for (const tag of msg.tags) {
      if (uId === tag) {
        const tagger = userProfileV3(token, msg.uId);
        const handle = tagger.user.handleStr;
        if (msg.isDm) { // get DM details
          const dm = getDmDetails(msg.listId);
          const message = msg.message;
          const slicedMessage = message.substring(0, 20);
          arr.push({
            channelId: -1,
            dmId: msg.listId,
            notificationMessage: `${handle} tagged you in ${dm.name}: ${slicedMessage}`,
            timeCounter: msg.timeCounter,
          });
        } else { // get channel details
          const channel = getChannelDetails(msg.listId);
          const message = msg.message;
          const slicedMessage = message.substring(0, 20);
          arr.push({
            channelId: msg.listId,
            dmId: -1,
            notificationMessage: `${handle} tagged you in ${channel.name}: ${slicedMessage}`,
            timeCounter: msg.timeCounter,
          });
        }
        break;
      }
    }
  }

  return arr;
}

function getInvitedNotif(token: string, arr: Array<NotifArr>) {
  const data = getData();
  const uId = getUserId(token);

  for (const i of data.inviteDetails) {
    const tagger = userProfileV3(token, i.uId);
    const handle = tagger.user.handleStr;
    if (!i.isDm) {
      if (uId === i.invited) {
        const channel = getChannelDetails(i.listId);
        arr.push({
          channelId: i.listId,
          dmId: -1,
          notificationMessage: `${handle} added you to ${channel.name}`,
          timeCounter: i.timeCounter,
        });
      }
    } else { // is DM, iterate through invited
      for (const j of i.invited) {
        if (uId === j) {
          const dm = getDmDetails(i.listId);
          arr.push({
            channelId: -1,
            dmId: i.listId,
            notificationMessage: `${handle} added you to ${dm.name}`,
            timeCounter: i.timeCounter,
          });
        }
      }
    }
  }

  return arr;
}

function getReactNotif(token: string, arr: Array<NotifArr>) {
  const data = getData();
  const uId = getUserId(token);

  for (const i of data.reactDetails) {
    if (i.isSenderMember) {
      const reactor = userProfileV3(token, i.authUserId);
      const handle = reactor.user.handleStr;
      if (uId === i.senderId) {
        if (i.isDm) {
          if (isInDm(uId, i.listId)) {
            const dm = getDmDetails(i.listId);
            arr.push({
              channelId: -1,
              dmId: i.listId,
              notificationMessage: `${handle} reacted to your message in ${dm.name}`,
              timeCounter: i.timeCounter,
            });
          }
        } else {
          if (isInChannel(uId, i.listId)) {
            const channel = getChannelDetails(i.listId);
            // console.log(channel);
            arr.push({
              channelId: i.listId,
              dmId: -1,
              notificationMessage: `${handle} reacted to your message in ${channel.name}`,
              timeCounter: i.timeCounter,
            });
          }
        }
      }
    }
  }
  return arr;
}

/**
  * Returns the user's most recent 20 notifications,
  * ordered from most recent to least recent.
  *
  * @param {string} token - a valid token
  *
  * @returns {notifications {channelId: number, dmId: number,
  * notificationMessage: string} } - object notifications
*/

export function getNotificationsV1(token: string) {
  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  const arr = getReactNotif(token, getInvitedNotif(token, getTaggedNotif(token)));

  // sort arr by latest notif coming first!
  arr.sort((a, b) => b.timeCounter - a.timeCounter);
  // delete not needed key for returning
  for (const i of arr) {
    delete i.timeCounter;
  }

  if (arr.length > 20) {
    return {
      notifications: arr.slice(0, 20)
    };
  }
  return {
    notifications: arr
  };
}
