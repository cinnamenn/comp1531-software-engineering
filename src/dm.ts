import { getData, setData, Reacts } from './dataStore';
import {
  isValidToken, isValidUser, getUserId, isDmValid, isDmMember, updateUserStats, updateWorkSpace
} from './global';
import HTTPError from 'http-errors';
const requestTimesent = () => Math.floor((new Date()).getTime() / 1000);
/**
  * uIds contains the user(s) that this DM is directed to, and will not include
  * the creator. The creator is the owner of the DM. name should be automatically
  * generated based on the users that are in this DM. The name should be an
  * alphabetically-sorted, comma-and-space-separated list of user handles,
  * e.g. 'ahandle1, bhandle2, chandle3'. An empty uIds list indicates the
  * creator is the only member of the DM.
  *
  * @param {string} token - a valid token from datStore
  * @param {integer} uId - an array of uIds from dataStore
  *
  * @returns { dmId:
  *             } - returns an object containing dmId
 * @returns {error} - return error object in invalid cases
**/

function dmCreateV2(token: string, uIds: number[]) {
  const data = getData();

  // Is the token valid
  if (isValidToken(token) === false) {
    throw HTTPError(403, 'invalid auth user id');
  }

  // Are all the uids valid
  for (const uid of uIds) {
    if (!isValidUser(uid)) {
      throw HTTPError(400, 'invalid user id');
    }
  }

  // Are there any duplicate uids
  for (let i = 0; i < uIds.length; i++) {
    for (let j = 0; j < uIds.length; j++) {
      if (j !== i && uIds[j] === uIds[i]) {
        throw HTTPError(400, 'user id duplication');
      }
    }
  }

  const ownerId = getUserId(token);
  // Sorting names
  // Pushing owners name
  const ownerName = data.users[ownerId].handleStr;
  const array = [];
  array.push(ownerName);
  // Pushing members names
  for (const uids of uIds) {
    array.push(data.users[uids].handleStr);
  }

  array.sort();

  // Creating name
  let name = array[0];
  for (let i = 1; i < array.length; i++) {
    name = name + ', ' + array[i];
  }

  // Creating members array
  const membersArray = [];
  membersArray[0] = ownerId;
  for (let i = 0; i < uIds.length; i++) {
    membersArray[i + 1] = uIds[i];
  }

  // Creating dm
  data.dms.push({
    dmId: data.dms.length,
    name: name,
    owner: ownerId,
    members: membersArray,
    messages: [],
  });
  data.inviteDetails.push({
    uId: ownerId,
    isDm: true,
    listId: data.dms.length - 1,
    invited: uIds, // an array
    timeCounter: data.counter,
  });
  data.counter++;

  setData(data);
  const time = requestTimesent();
  // Updating userStatus of all users
  for (const members of membersArray) {
    updateUserStats(members, 'dms', 'add', time);
  }
  // Updating workspace
  updateWorkSpace('dms', 'add', time);
  return { dmId: data.dms.length - 1 };
}

/**
  * Returns a list of DMs that the user is a member of
  *
  * @param {string} token - a valid token from datStore
  *
  * @returns { dms
  *             } - returns an object containing an array
  *              of {dmId: , name: }
  * @returns {error} - return error object in invalid cases
*/

function dmListV2(token: string) {
  const data = getData();

  // Checking if token is valid
  if (isValidToken(token) === false) {
    throw HTTPError(403, 'invalid auth user id');
  }

  const id = getUserId(token);
  const array = [];

  // Storing all relevant dms in array
  for (const Dms of data.dms) {
    for (const uids of Dms.members) {
      if (uids === id) {
        array.push({
          dmId: Dms.dmId,
          name: Dms.name,
        });
      }
    }
  }

  return { dms: array };
}

/**
  * Remove an existing DM, so all members are no longer in the DM.
  * This can only be done by the original creator of the DM.
  *
  * @param {string} token - a valid token from datStore
  * @param {integer} dmId - a valid dmId from dataStore
  *
  * @returns {} - returns empty object on success
  * @returns {error} - return error object in invalid cases
*/

function dmRemoveV2(token: string, dmId: number) {
  const data = getData();

  // Checking if token is valid
  if (isValidToken(token) === false) {
    throw HTTPError(403, 'invalid auth user id');
  }

  // Checking if dmId is valid
  if (isDmValid(dmId) === false) {
    throw HTTPError(400, 'invalid dm id');
  }

  // Checking that token user is apart of dm
  const userId = getUserId(token);
  if (isDmMember(userId, dmId) === false) {
    throw HTTPError(403, 'auth user not member');
  }

  // Checking that the token belongs to the owner
  if (data.dms[dmId].owner !== userId) {
    throw HTTPError(403, 'auth user not owner');
  }

  const length = data.dms[dmId].messages.length;

  const copy = [...data.dms[dmId].members];

  // remove dms
  data.dms.splice(dmId, 1);

  setData(data);
  // Updating userStatus
  for (const members of copy) {
    updateUserStats(members, 'dms', '', 0);
  }
  // Updating workspace

  // const index = getDmIndex(dmId);
  if (length > 0) {
    updateWorkSpace('msgs', 'remove', requestTimesent(), length);
  }

  updateWorkSpace('dms', '', requestTimesent());
  return {};
}

/**
  * Given a DM with ID dmId that the authorised user is a
  * member of, provide basic details about the DM.
  *
  * @param {string} token - a valid token from datStore
  * @param {integer} dmId - a valid dmId from dataStore
  *
  * @returns {name
  *           members
  *           } - returns object containing
  *                       dm name and dm members
  * @returns {error} - return error object in invalid cases
*/

function dmDetailsV2(token: string, dmId: number) {
  const data = getData();

  // Checking if token is valid
  if (isValidToken(token) === false) {
    throw HTTPError(403, 'invalid auth user id');
  }

  // Checking if dmId is valid
  if (isDmValid(dmId) === false) {
    throw HTTPError(400, 'invalid dm id');
  }

  // Checking that token user is apart of dm
  const userId = getUserId(token);
  if (isDmMember(userId, dmId) === false) {
    throw HTTPError(403, 'auth user not member');
  }

  // Creating array of users
  const memberArray = [];

  for (const uids of data.dms[dmId].members) {
    if (!isValidUser(uids)) {
      continue;
    }
    memberArray.push({
      uId: data.users[uids].uId,
      email: data.users[uids].email,
      nameFirst: data.users[uids].nameFirst,
      nameLast: data.users[uids].nameLast,
      handleStr: data.users[uids].handleStr,
    });
  }

  return {
    name: data.dms[dmId].name,
    members: memberArray,
  };
}

/**
  * Given a DM ID, the user is removed as a member of this DM.
  * The creator is allowed to leave and the DM will still exist if this
  * happens. This does not update the name of the DM.
  *
  * @param {string} token - a valid token from datStore
  * @param {integer} dmId - a valid dmId from dataStore
  *
  * @returns {} - returns empty object
  * @returns {error} - return error object in invalid cases
*/

function dmLeaveV2(token: string, dmId: number) {
  const data = getData();

  // Checking if token is valid
  if (isValidToken(token) === false) {
    throw HTTPError(403, 'invalid auth user id');
  }

  // Checking if dmId is valid
  if (isDmValid(dmId) === false) {
    throw HTTPError(400, 'invalid dm id');
  }

  // Checking that token user is apart of dm
  const userId = getUserId(token);
  if (isDmMember(userId, dmId) === false) {
    throw HTTPError(403, 'auth user not member');
  }

  // Remove member from DM
  for (const i in data.dms[dmId].members) {
    if (userId === data.dms[dmId].members[i]) {
      data.dms[dmId].members.splice(parseInt(i), 1);
      break;
    }
  }

  setData(data);
  // Updating userStats
  updateUserStats(userId, 'dms', '', requestTimesent());
  return {};
}

/**
  * Given a DM with ID dmId that the authorised user is a member of, return
  * up to 50 messages between index "start" and "start + 50". Message with
  * index 0 is the most recent message in the DM. This function returns a
  * new index "end" which is the value of "start + 50", or, if this function
  * has returned the least recent messages in the DM, returns -1 in "end"
  * to indicate there are no more messages to load after this return.
  *
  * @param {string} token - a valid token from datStore
  * @param {integer} dmId - a valid dmId from dataStore
  * @param {integer} start - an integer marking the start index
  *
  * @returns {messages
  *           start
  *           end
  *           } - returns object containing array of messages
  *             start index and end index
  * @returns {error} - return error object in invalid cases
*/

function dmMessagesV2(token: string, dmId: number, start: number) {
  const data = getData();

  // Checking if token is valid
  if (isValidToken(token) === false) {
    throw HTTPError(403, 'invalid auth user id');
  }

  // Checking if dmId is valid
  if (isDmValid(dmId) === false) {
    throw HTTPError(400, 'invalid dm id');
  }

  // Checking that token user is apart of dm
  const userId = getUserId(token);
  if (isDmMember(userId, dmId) === false) {
    throw HTTPError(403, 'auth user not member');
  }

  // Checking that start is less than the number of messages in dms
  if (start > data.dms[dmId].messages.length) {
    throw HTTPError(400, 'start greater than total messages');
  }

  const messages = [];
  for (let i = start; i < start + 50 && i < data.dms[dmId].messages.length; i++) {
    const msg = data.dms[dmId].messages[i];

    const reacts: Reacts[] = [];
    for (const react of msg.reacts) {
      reacts.push({
        reactId: react.reactId,
        uIds: react.uIds,
        isThisUserReacted: !!(react.uIds.includes(userId)),
      });
    }
    messages.unshift({
      uId: msg.uId,
      messageId: msg.messageId,
      message: msg.message,
      timeSent: msg.timeSent,
      reacts: reacts,
      isPinned: msg.isPinned,
    });
  }

  let end = start + 50;
  if (start + 50 >= data.dms[dmId].messages.length) {
    end = -1;
  }

  return {
    messages: messages,
    start: start,
    end: end,
  };
}

export {
  dmCreateV2,
  dmListV2,
  dmRemoveV2,
  dmDetailsV2,
  dmLeaveV2,
  dmMessagesV2
};
