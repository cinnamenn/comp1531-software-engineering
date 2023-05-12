import { getData, setData } from './dataStore';
import { validEmail, validName, isValidToken, hashOf } from './global';
import { user as userType } from './dataStore';
import HTTPError from 'http-errors';
import { port } from './config.json';

/**
* Allows user to login with email and password that they have registered
* returns a userId if valid and error if invalid
*
* @param {String} email - User enters a valid email address
* @param {String} password - User input password that is >= 6 characters long
*
* @returns {Object { authUserId: Number, token: String }} - Returns a valid authUserId and token
* @throws
*   error 400 when
*     -> email entered does not belong to a user
*     -> password is not correct
*/

function authLoginV3(email: string, password: string) {
  const data = getData();

  for (const user of data.users) {
    if (user.email === email) {
      if (user.password === hashOf(password) && !user.isRemoved) {
        const token = generateToken();
        const hashedToken = hashOf(token);
        user.tokens.push(hashedToken);
        data.sessionIds.push(hashedToken);
        setData(data);
        return { token: token, authUserId: user.uId };
      }
      throw HTTPError(400, 'Incorrect password');
    }
  }

  throw HTTPError(400, 'Email does not belong to user');
}

/**
  * Allows user to register with email, password, first name, and last name
  * returns a userId if valid
  *
  * @param {String} email - User enters a valid email address
  * @param {String} password - User input password that's >= 6 characters long
  * @param {String} nameFirst - User input name that's 1-50 characters long
  * @param {String} nameLast - User input name that's 1-50 characters long
  *
  * @returns {Object { authUserId: Number, token: String }} - Returns a valid authUserId and token
  * @throws
  *   error 400 when
  *     -> email entered is not a valid email
  *     -> email is already being used by another user
  *     -> length of password is less than 6 characters
  *     -> length of nameFirst is not between 1 and 50 characters inclusive
  *     -> length of nameLast is not between 1 and 50 characters inclusive
*/

function authRegisterV3(email: string, password: string, nameFirst: string, nameLast: string) {
  const data = getData();

  if (!validEmail(email) || !validPass(password) || !validName(nameFirst) ||
    !validName(nameLast) || sameEmail(email)) {
    throw HTTPError(400, 'Something is invalid / same email as another user');
  }

  const handle = getHandleStr(nameFirst, nameLast);
  const handleStr = validHandle(handle);

  const token = generateToken();
  const hashedToken = hashOf(token);
  const hashedPass = hashOf(password);
  data.sessionIds.push(hashedToken);

  data.users.push({
    uId: data.users.length,
    nameFirst: nameFirst,
    nameLast: nameLast,
    email: email,
    password: hashedPass,
    handleStr: handleStr,
    isGlobalOwner: false,
    isRemoved: false,
    tokens: [hashedToken],
    userStats: {
      channelsJoined: [{ numChannelsJoined: 0, timeStamp: 0 }],
      dmsJoined: [{ numDmsJoined: 0, timeStamp: 0 }],
      messagesSent: [{ numMessagesSent: 0, timeStamp: 0 }],
      involvementRate: 0,
    },
    profileImgUrl: `http://localhost:${port}/static/default/default.jpg`,
  });

  if (data.users.length === 1) {
    data.users[0].isGlobalOwner = true;
  }

  setData(data);
  return { authUserId: data.users[data.users.length - 1].uId, token: token };
}

/**
  * Allows a user to logout when provided a valid token
  * returns nothing if valid
  *
  * @param {String} token - User enters a valid token
  *
  * @returns {{}} - Returns nothing if valid
  * @returns {{error: 'error'}} - on error
*/

function authLogoutV2(token: string) {
  const data = getData();

  if (!isValidToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }
  const hashedToken = hashOf(token);
  for (const user of data.users) {
    for (const index in user.tokens) {
      if (user.tokens[index] === hashedToken) {
        user.tokens.splice(parseInt(index), 1);
        break;
      }
    }
  }

  data.sessionIds.splice(data.sessionIds.indexOf(hashedToken), 1);
  setData(data);
  return {};
}

/**
  * When a valid email that is registered to a user is passed in
  * send them an email that contains a secret reset code
  * returns nothing if valid
  *
  * @param {String} email - User enters a valid email to a registered user
  *
  * @returns {{}} - Returns nothing
  *
*/

function authPasswordRequestV1(email: string) {
  const data = getData();
  const user = data.users.find((user: userType) => user.email === email);
  if (!user) {
    return {};
  }
  const sessionToRemove = user.tokens;
  user.tokens = [];
  for (const session of sessionToRemove) {
    for (const i in data.sessionIds) {
      if (session === data.sessionIds[i]) {
        data.sessionIds.splice(parseInt(i), 1);
      }
    }
  }
  setData(data);

  // send password rest code to users email
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
      user: 'T13ABOOST@outlook.com',
      pass: 'Haois100%sexy'
    }
  });

  const resetCode = `${genRandomStr()}${user.uId}`;

  const mailOptions = {
    from: '"T13ABOOST" <T13ABOOST@outlook.com> ',
    to: email,
    subject: 'This is your new password reset code',
    text: resetCode,
  };
  transporter.sendMail(mailOptions, function (info: any) {
    console.log('Email send: ' + info.response);
  });

  return {};
}

/**
  * Allows a user to reset their password when provided a valid
  * resetCode and newPassword string
  * returns nothing if valid
  *
  * @param {String} resetCode - User enters a valid resetCode
  * @param {String} newPassword - User enters a valid password
  *
  * @returns {{}} - Returns nothing if valid
  * @returns {{error: 'error'}} - on error
*/

function authPasswordResetV1(resetCode: string, newPassword: string) {
  const data = getData();
  const uId = parseInt(resetCode.slice(20));
  const user = data.users.find((item: { uId: number; }) => item.uId === uId);

  if (newPassword.length < 6) {
    throw HTTPError(400, 'Password length must be 6 or greater');
  }
  if (user === undefined) {
    throw HTTPError(400, 'Invalid resetCode');
  }
  user.password = hashOf(newPassword);
  setData(data);
  return {};
}

function generateToken() {
  const data = getData();
  return String(data.sessionIds.length);
}

// Helper function to generate a valid handle string
function getHandleStr(nameFirst: string, nameLast: string) {
  // Given a first and last name
  // return a handle that concats together both names
  // without any uppercase, whitespace, and special characters
  const name1 = nameFirst.toLowerCase().replace(/[0-9]|\W/g, '');
  const name2 = nameLast.toLowerCase().replace(/[0-9]|\W/g, '');

  const result = name1.concat(name2);

  const handleStr = result.substring(0, 20);

  return handleStr;
}

// Helper function to get valid password
function validPass(password: string) {
  if (password.match(/.{6,}/)) {
    return true;
  } else {
    return false;
  }
}

// Helper function to get valid handle string
function validHandle(handle: string) {
  const data = getData();
  let tempHandle = handle;
  let suffix = 0;
  for (let i = 0; i < data.users.length; i++) {
    if (tempHandle === data.users[i].handleStr) {
      tempHandle = handle + String(suffix);
      suffix += 1;
    }
  }
  handle = tempHandle;
  return handle;
}

function sameEmail(email: string) {
  const data = getData();

  for (let i = 0; i < data.users.length; i++) {
    if (email === data.users[i].email) {
      return true;
    }
  }
  return false;
}

// Generates a random string with a length of 20
function genRandomStr() {
  const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let randStr = '';
  for (let i = 0; i < 20; i++) {
    randStr += char.charAt(Math.floor(Math.random() * char.length));
  }
  return randStr;
}

export {
  authLoginV3,
  authRegisterV3,
  authLogoutV2,
  authPasswordRequestV1,
  authPasswordResetV1
};
