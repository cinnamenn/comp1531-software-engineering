import { getData, setData } from './dataStore';
import HTTPError from 'http-errors';

import { isGlobalOwner, getUserId, isValidToken, isValidUser, isInChannel, isInDm } from './global';
import { channelLeaveV2 } from './channel';
import { dmLeaveV2 } from './dm';

import { message, user } from './dataStore';

/**
  * Given a user by their uId, removes them from the Beans.
  *
  * @param {String} token - a valid token
  * @param {number} uId - a valid uId to be removed
  *
  * @returns {} - Success returns empty object
  * @throws
  *   error 400 when
  *     -> uId not valid uID
  *     -> uID refers to the only global owner
  *   error 403 when
  *     -> the authorised user is not a global owner
*/
function adminUserRemoveV1(token: string, uId: number) {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'token does not exist');
  }
  if (!isGlobalOwner(getUserId(token))) {
    throw HTTPError(403, 'auth user is not global owner');
  }

  if (!isValidUser(uId)) {
    throw HTTPError(400, 'user does not exist/isremoved');
  }

  // check is uId is only global owner
  let globalOwnerCount = 0;
  for (const user of data.users) {
    if (isGlobalOwner(user.uId)) {
      globalOwnerCount++;
    }
  }

  if (globalOwnerCount === 1 && isGlobalOwner(uId)) {
    throw HTTPError(400, 'uId is only global owner');
  }

  // user leaving from all channels(editing all messages)
  for (const channel of data.channels) {
    if (isInChannel(uId, channel.channelId)) {
      // editing channel message sent by uid to : Removed user
      channel.channelmessages.forEach((msg: message) => {
        if (msg.uId === uId) {
          msg.message = 'Removed user';
        }
      });
      channelLeaveV2(token, channel.channelId);
    }
  }

  // user leaving all dms(editing all messages)
  for (const dm of data.dms) {
    if (isInDm(uId, dm.dmId)) {
      // editing dm message sent by uid to : Removed user
      dm.messages.forEach((msg: message) => {
        if (msg.uId === uId) {
          msg.message = 'Removed user';
        }
      });
      dmLeaveV2(token, dm.dmId);
    }
  }

  const userIndex = data.users.findIndex((userob: user) => userob.uId === uId);
  const removedUser = data.users[userIndex];
  removedUser.isRemoved = true;
  removedUser.nameFirst = 'Removed';
  removedUser.nameLast = 'user';
  removedUser.email = '';
  removedUser.handleStr = '';

  setData(data);
  return {};
}

/**
  * Given a user by their uID, sets their permissions to new permissions
  * described by permissionId.
  *
  * @param {String} token - a valid token
  * @param {number} uId - a valid uId to be removed
  * @param {number} permissionId - a valid permissionId (1 for owner perms,
  *  2 for member perms)
  *
  * @returns {} - Success returns empty object
  * @throws
  *   error 400 on
  *     -> uId does not refer to a valid user
  *     -> uId refers to a user who is the only global owner and they are being demoted to a user
  *     -> permissionId is invalid
  *     -> the user already has the permissions level of permissionId
  *   error 403 on
  *     -> the authorised user is not a global owner
*/
function adminUserpermissionChangeV1(token: string, uId: number, permissionId: number) {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'token does not exist');
  }
  if (!isGlobalOwner(getUserId(token))) {
    throw HTTPError(403, 'auth user is not global owner');
  }

  if (!isValidUser(uId)) {
    throw HTTPError(400, 'user does not exist');
  }

  const userToChange = data.users.find((user: user) => user.uId === uId);

  if (permissionId === 1) {
    if (userToChange.isGlobalOwner) {
      throw HTTPError(400, 'user already has owner perms');
    } else {
      userToChange.isGlobalOwner = true;
    }
  } else if (permissionId === 2) {
    if (!userToChange.isGlobalOwner) {
      throw HTTPError(400, 'user already has member perms');
    } else {
      let globalOwnerCount = 0;
      for (const user of data.users) {
        if (isGlobalOwner(user.uId)) {
          globalOwnerCount++;
        }
      }
      if (globalOwnerCount === 1 && isGlobalOwner(uId)) {
        throw HTTPError(400, 'uId is only global owner');
      }
      userToChange.isGlobalOwner = false;
    }
  } else {
    throw HTTPError(400, 'permission code invalid');
  }

  setData(data);
  return {};
}

export {
  adminUserRemoveV1,
  adminUserpermissionChangeV1
};
