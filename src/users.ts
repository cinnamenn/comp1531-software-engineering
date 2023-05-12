import { getData, setData } from './dataStore';
import { getUserId, isValidToken } from './global';
import {
  validName, validEmail, anotherUserEmail, alphanumeric,
  isValidHandleLength, anotherUserHandle, hashOf
} from './global';
import { user as userType } from './dataStore';
import HTTPError from 'http-errors';
import { port } from './config.json';
import request from 'sync-request';
import fs from 'fs';
const Jimp = require('jimp');
const sizeOf = require('image-size');

/**
  * For a valid user, returns information about their user ID, email,
  * first name, last name, and handle
  *
  * @param {string} token - a valid token
  * @param {integer} uId - a valid uId from dataStore
  *
  * @returns {Object {uId: integer, email: string, nameFirst: string,
 * nameLast: string, handleStr: string, profileImgUrl: string} } - object user details
 *
 * @returns {error} - return error object in invalid cases
*/

function userProfileV3(token: string, uId: number) {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  for (const user of data.users) {
    if (uId === user.uId) {
      return {
        user: {
          uId: uId,
          email: user.email,
          nameFirst: user.nameFirst,
          nameLast: user.nameLast,
          handleStr: user.handleStr,
          profileImgUrl: user.profileImgUrl
        }
      };
    }
  }
  throw HTTPError(400, 'Invalid uId');
}

/**
  * Returns a list of all users and their associated details.
  *
  * @param {string} token - a valid token
  *
  * @returns {Array<user>: {uId: integer, email: string, nameFirst: string,
 * nameLast: string, handleStr: string, profileImgUrl: string} } - object user details
 *
 * @returns {error} - return error object in invalid cases
*/

function usersAllV2(token: string) {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  const userArr = [];
  for (const user of data.users) {
    if (user.isRemoved) {
      continue;
    }
    userArr.push({
      uId: user.uId,
      email: user.email,
      nameFirst: user.nameFirst,
      nameLast: user.nameLast,
      handleStr: user.handleStr,
      profileImgUrl: user.profileImgUrl
    });
  }

  return { users: userArr };
}

/**
  * Updates the authorised user's first and last name.
  *
  * @param {string} token - a valid token
  * @param {string} nameFirst - a valid nameFirst
  * @param {string} nameLast - a valid nameLast
  *
  * @returns {} - empty object
 *
 * @returns {error} - return error object in invalid cases
*/

function userSetNameV2(token: string, nameFirst: string, nameLast: string) {
  const data = getData();
  // invalid token
  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }
  // Invalid cases: nameFirst & nameLast > 50 || < 1
  if (!validName(nameFirst) || !validName(nameLast)) {
    throw HTTPError(400, 'Invalid nameFirst/nameLast');
  }

  // change nameFirst and nameLast
  for (const user of data.users) {
    if (user.tokens.includes(hashOf(token))) {
      user.nameFirst = nameFirst;
      user.nameLast = nameLast;
      break;
    }
  }

  setData(data);
  return {};
}

/**
  * Update the authorised user's email address
  *
  * @param {string} token - a valid token
  * @param {string} email - a valid email
  *
  * @returns {} - empty object
 *
 * @returns {error} - return error object in invalid cases
*/

function userSetEmailV2(token: string, email: string) {
  const data = getData();
  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  } else if (!validEmail(email) || anotherUserEmail(token, email)) {
    throw HTTPError(400, 'Invalid email');
  }

  // change email
  for (const user of data.users) {
    if (user.tokens.includes(hashOf(token))) {
      user.email = email;
      break;
    }
  }

  setData(data);
  return {};
}

/**
  * Update the authorised user's handle (i.e. display name)
  *
  * @param {string} token - a valid token
  * @param {string} handleStr - a valid handle string
  *
  * @returns {} - empty object
 *
 * @returns {error} - return error object in invalid cases
*/

function userSetHandleV2(token: string, handleStr: string) {
  const data = getData();
  // invalid token, length of handleStr, non-alphanumeric, handle already in use
  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  } else if (!alphanumeric(handleStr) || !isValidHandleLength(handleStr) ||
    anotherUserHandle(token, handleStr)) {
    throw HTTPError(400, 'Invalid handleStr');
  }

  // change handle
  for (const user of data.users) {
    if (user.tokens.includes(hashOf(token))) {
      user.handleStr = handleStr;
      break;
    }
  }

  setData(data);
  return {};
}

/**
  * Fetches the required statistics about this user's use of UNSW Beans.
  *
  * @param {String} token - a valid token
  *
  * @returns {Object of shape {
  *   channelsJoined: [{numChannelsJoined, timeStamp}],
  *   dmsJoined: [{numDmsJoined, timeStamp}],
  *   messagesSent: [{numMessagesSent, timeStamp}],
  *   involvementRate
  * }} - object userStats
  *
  * @throws
  *   error 403 on
  *     -> invalid token
*/

function userStatsV1(token: string) {
  const data = getData();
  // invalid token
  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  const uId = getUserId(token);
  const userIndex = data.users.findIndex((userobj: userType) => userobj.uId === uId);

  // Calculating involvement
  // sum(numChannelsJoined, numDmsJoined, numMsgsSent) / sum(numChannels, numDms, numMsgs)
  const msgsLen = data.workspaceStats.messagesExist.length - 1;
  const denom = data.channels.length + data.dms.length + data.workspaceStats.messagesExist[msgsLen].numMessagesExist;
  let involvement = 0;
  // Calculating involvement if denom != 0
  if (denom) {
    // Finding number of involved channels, dms and msgs sent
    // Finding length of each array in userStatus
    const chLength = data.users[userIndex].userStats.channelsJoined.length - 1;
    const dmsLength = data.users[userIndex].userStats.dmsJoined.length - 1;
    const msgsLength = data.users[userIndex].userStats.messagesSent.length - 1;
    // Finding value of latest element in each array in userStatus
    const chFinal = data.users[userIndex].userStats.channelsJoined[chLength].numChannelsJoined;
    const dmsFinal = data.users[userIndex].userStats.dmsJoined[dmsLength].numDmsJoined;
    const msgsFinal = data.users[userIndex].userStats.messagesSent[msgsLength].numMessagesSent;

    const numer = chFinal + dmsFinal + msgsFinal;
    involvement = numer / denom;
  }

  // Setting involvement to 1 if greater than 1
  if (involvement > 1) {
    involvement = 1;
  }

  const obj = {
    channelsJoined: data.users[userIndex].userStats.channelsJoined,
    dmsJoined: data.users[userIndex].userStats.dmsJoined,
    messagesSent: data.users[userIndex].userStats.messagesSent,
    involvementRate: involvement,
  };
  return obj;
}

/**
  * Fetches the required statistics about the workspace's use of UNSW Beans.
  *
  * @param {String} token - a valid token
  *
  * @returns {Object of shape {
  *   channelsExist: [{numChannelsExist, timeStamp}],
  *   dmsExist: [{numDmsExist, timeStamp}],
  *   messagesExist: [{numMessagesExist, timeStamp}],
  *   utilizationRate
  * }} - object workspaceStats
  *
  * @throws
  *   error 403 on
  *     -> invalid token
*/

function usersStatsV1(token: string) {
  const data = getData();

  // Finding utilisation rate
  // Finding the number of users who have joined at least one channel or dm
  const numusers = data.users.length;
  let usersJ = 0;
  for (const members of data.users) {
    if (members.userStats.channelsJoined.length > 1 || members.userStats.dmsJoined.length > 1) {
      usersJ++;
    }
  }
  // Caclulating utilisation rate
  // numUsersWhoHaveJoinedAtLeastOneChannelOrDm / numUsers
  const util = usersJ / numusers;

  const obj = {
    channelsExist: data.workspaceStats.channelsExist,
    dmsExist: data.workspaceStats.dmsExist,
    messagesExist: data.workspaceStats.messagesExist,
    utilizationRate: util,
  };
  return obj;
}

/**
  * Fetches the required statistics about the workspace's use of UNSW Beans.
  *
  * @param {String} token - a valid token
  * @param {String} imgUrl - a url as a string
  * @param {Number} xStart - a starting x-coordinate
  * @param {Number} yStart - a starting y-coordinate
  * @param {Number} xEnd - an ending x-coordinate
  * @param {Number} yEnd - an ending y-coordinate
  *
  * @returns {} - Empty object on success
  *
  * @throws
  *   error 400 on
  *     -> imgUrl returns HTTP status other than 200
  *     -> xStart, yStart, xEnd, yEnd are not within dimensions at image url
  *     -> xEnd <= xStart or yEnd <= yStart
  *     -> image uploaded is not a jpg
  *   error 403 on
  *     -> invalid token
*/

function userUploadPhotoV1(token: string, imgUrl: string, xStart: number, yStart: number, xEnd: number, yEnd: number) {
  // Error throwing
  // Invalid token
  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }
  //  File is not a .jpg file
  if (!(/\.jpg$/.test(imgUrl))) {
    throw HTTPError(400, 'File is not a jpg file');
  }

  // Getting the image
  const ogImg = request(
    'GET',
    imgUrl
  );
  // Error if there is issue retrieving image
  if (ogImg.statusCode !== 200) {
    throw HTTPError(400, 'Error when retrieving image');
  }

  // Saving image in static folder
  const body = ogImg.getBody();
  fs.writeFileSync('static/img.jpg', body, { flag: 'w' });

  // Getting image height to check error of crop dimensions
  const dimensions = sizeOf('static/img.jpg');

  // console.log(dimensions.width, dimensions.height);
  if (xStart > dimensions.width || xEnd > dimensions.width || yStart > dimensions.width || yEnd > dimensions.width ||
    xStart < 0 || xEnd < 0 || yStart < 0 || yEnd < 0 || xEnd <= xStart || yEnd <= yStart) {
    throw HTTPError(400, 'Invalid crop dimensions');
  }

  // Getting the uId for later use when storing data
  const uId = getUserId(token);
  crop(xStart, yStart, xEnd, yEnd, uId);

  return {};
}

// Generate random string
function generateString(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

async function crop(xStart: number, yStart: number, xEnd: number,
  yEnd: number, uId: number) {
  const data = getData();
  const image = await Jimp.read('static/img.jpg'); // Reading Image
  const randostr = generateString(20); // Generating random string for url
  // Cropping image and saving it to static folder
  image.crop(xStart, yStart, xEnd, yEnd)
    .write(`static/${randostr}.jpg`);
  // Assigining users .profileImgUrl to the url generated

  const generatedurl = `http://localhost:${port}/static/${randostr}.jpg`;
  data.users[uId].profileImgUrl = generatedurl;

  setData(data);
}

export { userProfileV3, usersAllV2, userSetNameV2, userSetEmailV2, userSetHandleV2, userStatsV1, usersStatsV1, userUploadPhotoV1 };
