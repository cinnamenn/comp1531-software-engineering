import { getData, setData, Reacts } from './dataStore';
import {
  isValidUser, isValidChannel, isGlobalOwner, isValidToken,
  getUserId, isInChannel, isChannelOwner, isOnlyOwner, updateUserStats
} from './global';
import HTTPError from 'http-errors';
const requestTimesent = () => Math.floor((new Date()).getTime() / 1000);

/**
  * Given a channelId of a channel that the authorised user can join,
  * adds them to that channel.
  *
  * @param {string} token - a valid token
  * @param {integer} channelId - a valid channelId from dataStore
  *
  * @returns {} - return empty
  * @throws
  *   error 400 when
  *     -> channelId does not refer to a valid channel
  *     -> the authorised user is already a member of the channel
  *   error 403 when
  *     -> channelId refers to a channel that is private and the authorised
  *        user is not already a channel member and is not a global owner
*/

function channelJoinV3(token: string, channelId: number) {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  const authUserId = getUserId(token);

  for (const channel of data.channels) {
    if (channelId === channel.channelId) {
      if (channel.isPublic === false) { // private channel
        if (!isGlobalOwner(authUserId)) {
          throw HTTPError(403, 'Not a global owner');
        }
      }
      for (const member of channel.memberIds) {
        if (authUserId === member) { // already a member
          throw HTTPError(400, 'Already a member');
        }
      }
      channel.memberIds.push(authUserId); // add member

      setData(data);
      // edit userStats
      updateUserStats(authUserId, 'channels', 'add', requestTimesent());
      return {};
    }
  }

  throw HTTPError(400, 'Invalid channelId');
}

/**
  * The authUser invites a user with uId to join a channel with channelId.
  * Once invited, the user is added to the channel immediately.
  *
  * @param {string} token - a valid token
  * @param {integer} channelId - a valid channelId from dataStore
  * @param {integer} uId - a valid uId from dataStore
  *
  * @returns {} - return empty
  * @throws
  *   error 400 when
  *     -> channelId does not refer to a valid channel
  *     -> uId does not refer to a valid user
  *     -> uId refers to a user who is already a member of the channel
  *   error 403 when
  *     -> channelId is valid and the authorised user is not a member of the channel
*/

function channelInviteV3(token: string, channelId: number, uId: number) {
  const data = getData();

  if (!isValidUser(uId)) {
    throw HTTPError(400, 'Invalid uId');
  } else if (!isValidChannel(channelId)) {
    throw HTTPError(400, 'Invalid channel ');
  } else if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  const authUserId = getUserId(token);

  let authMember = false;
  for (const channel of data.channels) {
    if (channelId === channel.channelId) {
      for (const member of channel.memberIds) {
        if (uId === member) { // already a member
          throw HTTPError(400, 'Already a member');
        }
        if (authUserId === member && !authMember) { // inviter not a member check
          authMember = true;
        }
      }
      if (!authMember) { // the authUser who's inviting is not a member
        throw HTTPError(403, 'Authorised user not a member of channel');
      }

      channel.memberIds.push(uId); // add member
      data.inviteDetails.push({
        uId: authUserId,
        isDm: false,
        listId: channelId,
        invited: uId,
        timeCounter: data.counter,
      });
      data.counter++;

      setData(data);
      // edit userStats
      updateUserStats(uId, 'channels', 'add', requestTimesent());
      return {};
    }
  }
}

/**
  * Given a channel with ID channelId that the authorised user is a member of,
  * returns up to 50 messages between index "start" and "start + 50". Message
  * with index 0 (i.e. the first element in the returned array of messages)
  * is the most recent message in the channel. This function returns a new
  * index "end". If there are more messages to return after thisfunction call,
  * "end" equals "start + 50". If this function has returned the least recent
  * messages in the channel, "end" equals -1 to indicate that there are no more
  *  messages to load after this return.
  *
  * @param {integer} authUserId - a valid authUserId from dataStore
  * @param {integer} channelId - a valid channelId from dataStore
  * @param {integer} start - a start index
  *
  * @returns { messages:
  *            start:
  *            end:
  *           } - returns array of objects containing
  *               message details, start integer and end integer
  * @throws
  *   error 400 when
  *     -> channelId does not refer to a valid channel
  *     -> start is greater than the total number of messages in the channel
  *   error 403 when
  *     -> channelId is valid and the authorised user is not a member of the channel
*/

function channelMessagesV3(token: string, channelId: number, start: number) {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  const authUserId = getUserId(token);

  if (start < 0) {
    throw HTTPError(400, 'Start cannot be negative');
  }

  let isValid = false;
  let index = 0;
  for (const i in data.channels) {
    if (data.channels[i].channelId === channelId) {
      isValid = true;
      index = parseInt(i);
      break;
    }
  }

  if (!isValid) {
    throw HTTPError(400, 'Invalid channelId');
  }

  // checking if user is part of channel
  if (!(authUserId in data.channels[index].memberIds)) {
    throw HTTPError(403, 'Authorised user not a member of channel');
  }

  // getting amount of msgs in channel
  const amountOfMsgs = data.channels[index].channelmessages.length;
  let end = 0;

  if (start > amountOfMsgs) {
    throw HTTPError(400, 'Start is greater than total messages in channel');
  }

  let count = 0;
  let isMore = false;
  const list = [];
  if (amountOfMsgs > 0) {
    for (const msg of data.channels[index].channelmessages) {
      if (count === 50) {
        isMore = true;
        break;
      }

      const reacts: Reacts[] = [];
      for (const react of msg.reacts) {
        reacts.push({
          reactId: react.reactId,
          uIds: react.uIds,
          isThisUserReacted: !!(react.uIds.includes(authUserId)),
        });
      }
      list.unshift({
        uId: msg.uId,
        message: msg.message,
        messageId: msg.messageId,
        timeSent: msg.timeSent,
        reacts: reacts,
        isPinned: msg.isPinned,
      });
      count++;
    }
  }

  if (isMore) {
    end = start + 50;
  } else {
    end = -1;
  }

  return {
    messages: list,
    start: start,
    end: end,
  };
}

/**
  * Given a channel with ID channelId that the authorised user is a
  * member of, provides basic details about the channel.
  *
  * @param {string} token - a valid authUserId from dataStore
  * @param {integer} channelId - a valid channelId from dataStore
  *
  * @returns { name:
  *            isPublic:
  *            ownerMembers:
  *            allMembers:
  *          } - returns basic channel info
  * @throws
  *   error 400 when
  *     -> channelId does not refer to a valid channel
  *   error 403 when
  *     -> channelId is valid and the authorised user is not a member of the channel
*/

function channelDetailsV3(token: string, channelId: number) {
  const data = getData();
  const uId = getUserId(token);

  // checking if channelId is valid
  let channelCheck = false;
  let channelPos = 0;
  for (const chans in data.channels) {
    if (data.channels[chans].channelId === channelId) {
      channelCheck = true;
      channelPos = parseInt(chans);
    }
  }

  if (channelCheck === false) {
    throw HTTPError(400, 'Invalid channelId');
  } else if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  } else if (!isInChannel(uId, channelId)) {
    throw HTTPError(403, 'Invalid token / not in channel');
  }

  const arrayOwners = [];
  for (const membs of data.channels[channelPos].ownerIds) {
    for (const users of data.users) {
      if (users.isRemoved) {
        continue;
      }
      if (users.uId === membs) {
        arrayOwners.push({
          uId: users.uId,
          email: users.email,
          nameFirst: users.nameFirst,
          nameLast: users.nameLast,
          handleStr: users.handleStr,
        });
      }
    }
  }

  const arrayMemb = [];
  for (const membs of data.channels[channelPos].memberIds) {
    for (const users of data.users) {
      if (users.isRemoved) {
        continue;
      }
      if (users.uId === membs) {
        arrayMemb.push({
          uId: users.uId,
          email: users.email,
          nameFirst: users.nameFirst,
          nameLast: users.nameLast,
          handleStr: users.handleStr,
        });
      }
    }
  }

  return {
    name: data.channels[channelPos].name,
    isPublic: data.channels[channelPos].isPublic,
    ownerMembers: arrayOwners,
    allMembers: arrayMemb,
  };
}

/**
  * Given a channel with ID channelId that the authorised user is a
  * member of, remove them as a member of the channel.
  *
  * @param {string} token - a valid token
  * @param {integer} channelId - a valid channelId from dataStore
  *
  * @returns {} - return empty
  * @throws
  *   error 400 when
  *     -> channelId does not refer to a valid channel
  *     -> the authorised user is the starter of an active standup in the channel
  *   error 403 when
  *     -> channelId is valid and the authorised user is not a member of the channel
*/

function channelLeaveV2(token: string, channelId: number) {
  const data = getData();
  const uId = getUserId(token);

  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  } else if (!isValidChannel(channelId)) {
    throw HTTPError(400, 'Invalid channel');
  } else if (!isInChannel(uId, channelId)) {
    throw HTTPError(403, 'Authorised user not member of channel');
  }

  // if owner, remove from ownerids and memberids
  // if normal member, remove from memberids
  for (const channel of data.channels) {
    if (channelId === channel.channelId) {
      if (channel.standupDetails.authUserId === uId) {
        throw HTTPError(400, 'Auth user is starter of active standup in this channel');
      }
      for (const index in channel.ownerIds) {
        if (channel.ownerIds[index] === uId) {
          channel.ownerIds.splice(parseInt(index), 1);
          break;
        }
      }
      for (const index in channel.memberIds) {
        if (channel.memberIds[index] === uId) {
          channel.memberIds.splice(parseInt(index), 1);
          break;
        }
      }
      break;
    }
  }

  setData(data);
  // edit userStats
  updateUserStats(uId, 'channels', '', 0);
  return {};
}

/**
  * Make user with user id uId an owner of the channel.
  *
  * @param {string} token - a valid token
  * @param {integer} channelId - a valid channelId from dataStore
  *
  * @returns {} - return empty
  * @throws
  *   error 400 when
  *     -> channelId does not refer to a valid channel
  *     -> uId does not refer to a valid user
  *     -> uId refers to a user who is not a member of the channel
  *     -> uId refers to a user who is already an owner of the channel
  *   error 403 when
  *     -> channelId is valid and the authorised user does not have owner permissions in the channel
*/

function channelAddOwnerV2(token: string, channelId: number, uId: number) {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  } else if (!isValidChannel(channelId)) {
    throw HTTPError(400, 'Invalid channelId');
  } else if (!isValidUser(uId)) {
    throw HTTPError(400, 'Invalid uId');
  } else if (!isInChannel(uId, channelId)) {
    throw HTTPError(400, 'Authorised user not member of channel');
  } else if (isChannelOwner(uId, channelId)) {
    throw HTTPError(400, 'uId already a channel owner');
  }

  const authUserId = getUserId(token);
  // authUserId no owner perms
  if (!isGlobalOwner(authUserId) && !isChannelOwner(authUserId, channelId)) {
    throw HTTPError(403, 'No owner permissions');
  }

  for (const channel of data.channels) {
    if (channelId === channel.channelId) {
      channel.ownerIds.push(uId);
      break;
    }
  }
  setData(data);
  return {};
}

/**
  * Remove user with user id uId as an owner of the channel.
  *
  * @param {string} token - a valid token
  * @param {integer} channelId - a valid channelId from dataStore
  *
  * @returns {} - return empty
  * @throws
  *   error 400 when
  *     -> channelId does not refer to a valid channel
  *     -> uId does not refer to a valid user
  *     -> uId refers to a user who is not an owner of the channel
  *     -> uId refers to a user who is currently the only owner of the channel
  *   error 403 when
  *     -> channelId is valid and the authorised user does not have owner permissions in the channel
*/

function channelRemoveOwnerV2(token: string, channelId: number, uId: number) {
  const data = getData();
  // Invalid token, channelId, uId, and not a channelOwner
  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  } else if (!isValidChannel(channelId)) {
    throw HTTPError(400, 'Invalid channelId');
  } else if (!isValidUser(uId)) {
    throw HTTPError(400, 'Invalid uId');
  } else if (!isChannelOwner(uId, channelId)) {
    throw HTTPError(400, 'uId not a channel owner');
  }
  const authUserId = getUserId(token);
  // non member (global owner or not) cannot remove owner
  if (!isInChannel(authUserId, channelId)) {
    throw HTTPError(403, 'Authorised user not member of channel');
  }

  // Only owner in channel
  if (isOnlyOwner(uId, channelId)) {
    throw HTTPError(400, 'Cannot remove only owner in channel');
  }

  // authUserId no owner perms (not global owner and not channel owner)
  if (!isGlobalOwner(authUserId) && !isChannelOwner(authUserId, channelId)) {
    throw HTTPError(403, 'No owner permissions');
  }

  for (const channel of data.channels) {
    if (channelId === channel.channelId) {
      for (const index in channel.ownerIds) {
        if (channel.ownerIds[index] === uId) {
          channel.ownerIds.splice(parseInt(index), 1);
          break;
        }
      }
      break;
    }
  }
  setData(data);
  return {};
}

export {
  channelJoinV3,
  channelInviteV3,
  channelMessagesV3,
  channelDetailsV3,
  channelLeaveV2,
  channelAddOwnerV2,
  channelRemoveOwnerV2
};
