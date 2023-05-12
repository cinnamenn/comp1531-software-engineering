import {
  authRegister, authLogout, userProfile, clear, dmRemove, messageRemove, messageEdit,
  usersAll, userSetName, userSetEmail, userSetHandle, channelsCreate, channelJoin, dmCreate,
  userStats, usersStats, messageSend, messageSendDm, channelLeave, dmLeave, adminUserRemove,
  userUploadPhoto
} from './testhelpers';
import { port } from './config.json';

clear();
describe('Testing userProfileV3', () => {
  test('Testing for valid user', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const member2 = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');

    expect(userProfile(member1.token, member2.authUserId)).toStrictEqual({
      user: {
        uId: member2.authUserId,
        email: 'chicken@bar.com',
        nameFirst: 'Ronald',
        nameLast: 'Mcdonald',
        handleStr: expect.any(String),
        profileImgUrl: `http://localhost:${port}/static/default/default.jpg`,
      }
    });
  });
});

describe('Error checking userProfileV3', () => {
  test('Testing for invalid users', () => {
    clear();
    const member = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const invalidMember = member.authUserId + 1;
    const invalidToken = member.token + 'bruh';

    // valid token, invalid uId
    expect(userProfile(member.token, invalidMember)).toStrictEqual(400);

    // invalid token, valid uId
    expect(userProfile(invalidToken, member.authUserId)).toStrictEqual(403);
  });

  test('Testing invalid userProfile following a successful authLogout', () => {
    clear();
    const user = authRegister('p.file@gmail.com', 'Bob100', 'Peter', 'File');
    expect(userProfile(user.token, user.authUserId)).toStrictEqual({
      user: {
        uId: user.authUserId,
        email: 'p.file@gmail.com',
        nameFirst: 'Peter',
        nameLast: 'File',
        handleStr: expect.any(String),
        profileImgUrl: `http://localhost:${port}/static/default/default.jpg`,
      }
    });
    expect(authLogout(user.token)).toStrictEqual({});
    expect(userProfile(user.token, user.authUserId)).toStrictEqual(403);
  });
});

describe('Testing usersAllV1', () => {
  test('Returns list of all users and their details, and test admin remove', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const member2 = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');

    expect(usersAll(member1.token)).toStrictEqual({
      users: [
        {
          uId: member1.authUserId,
          email: 'foo@bar.com',
          nameFirst: 'James',
          nameLast: 'Charles',
          handleStr: expect.any(String),
          profileImgUrl: `http://localhost:${port}/static/default/default.jpg`,
        },
        {
          uId: member2.authUserId,
          email: 'chicken@bar.com',
          nameFirst: 'Ronald',
          nameLast: 'Mcdonald',
          handleStr: expect.any(String),
          profileImgUrl: `http://localhost:${port}/static/default/default.jpg`
        },
      ],
    });

    adminUserRemove(member1.token, member2.authUserId);

    expect(usersAll(member1.token)).toStrictEqual({
      users: [
        {
          uId: member1.authUserId,
          email: 'foo@bar.com',
          nameFirst: 'James',
          nameLast: 'Charles',
          handleStr: expect.any(String),
          profileImgUrl: `http://localhost:${port}/static/default/default.jpg`
        },
      ],
    });
  });
});

describe('Error checking usersAllV1', () => {
  test('Invalid token', () => {
    clear();
    const member = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const invalidToken = member.token + 'lolol';

    expect(usersAll(invalidToken)).toStrictEqual(403);
  });
});

describe('Testing userSetNameV1', () => {
  test('Succesfully setting nameFirst and nameLast', () => {
    clear();
    const member = authRegister('foo@bar.com', 'password', 'James', 'Charles');

    expect(userSetName(member.token, 'Jamie', 'Charlie')).toStrictEqual({});
    expect(userProfile(member.token, member.authUserId)).toStrictEqual({
      user: {
        uId: member.authUserId,
        email: 'foo@bar.com',
        nameFirst: 'Jamie',
        nameLast: 'Charlie',
        handleStr: expect.any(String),
        profileImgUrl: `http://localhost:${port}/static/default/default.jpg`
      }
    });
  });

  test('Succesfully setting nameFirst, not changing nameLast', () => {
    clear();
    const member = authRegister('foo@bar.com', 'password', 'James', 'Charles');

    expect(userSetName(member.token, 'Jamie', 'Charles')).toStrictEqual({});
    expect(userProfile(member.token, member.authUserId)).toStrictEqual({
      user: {
        uId: member.authUserId,
        email: 'foo@bar.com',
        nameFirst: 'Jamie',
        nameLast: 'Charles',
        handleStr: expect.any(String),
        profileImgUrl: `http://localhost:${port}/static/default/default.jpg`
      }
    });
  });

  test('Succesfully setting nameLast, not changing nameFirst', () => {
    clear();
    const member = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    expect(userSetName(member.token, 'James', 'Charlie')).toStrictEqual({});
    expect(userProfile(member.token, member.authUserId)).toStrictEqual({
      user: {
        uId: member.authUserId,
        email: 'foo@bar.com',
        nameFirst: 'James',
        nameLast: 'Charlie',
        handleStr: expect.any(String),
        profileImgUrl: `http://localhost:${port}/static/default/default.jpg`
      }
    });
  });

  test('1 letter name', () => {
    clear();
    const member = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    expect(userSetName(member.token, 'h', 'i')).toStrictEqual({});
    expect(userProfile(member.token, member.authUserId)).toStrictEqual({
      user: {
        uId: member.authUserId,
        email: 'foo@bar.com',
        nameFirst: 'h',
        nameLast: 'i',
        handleStr: expect.any(String),
        profileImgUrl: `http://localhost:${port}/static/default/default.jpg`
      }
    });
  });

  test('51 letters name', () => {
    clear();
    const member = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    expect(userSetName(member.token, 'dsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsds',
      'blalalallalalalalallalalalallalalalallalalalalalal')).toStrictEqual({});
    expect(userProfile(member.token, member.authUserId)).toStrictEqual({
      user: {
        uId: member.authUserId,
        email: 'foo@bar.com',
        nameFirst: 'dsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsds',
        nameLast: 'blalalallalalalalallalalalallalalalallalalalalalal',
        handleStr: expect.any(String),
        profileImgUrl: `http://localhost:${port}/static/default/default.jpg`
      }
    });
  });
});

describe('Error checking userSetNameV1', () => {
  test('Invalid token', () => {
    clear();
    const member = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const invalidToken = member.token + 'lolol';

    expect(userSetName(invalidToken, 'Jamie', 'Charlie')).toStrictEqual(403);
  });

  test('Invalid nameFirst', () => {
    clear();
    const member = authRegister('foo@bar.com', 'password', 'James', 'Charles');

    expect(userSetName(member.token, '', 'Charlie')).toStrictEqual(400);
    expect(userSetName(member.token, 'dsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsd',
      'Charlie')).toStrictEqual(400);
  });

  test('Invalid nameLast', () => {
    clear();
    const member = authRegister('foo@bar.com', 'password', 'James', 'Charles');

    expect(userSetName(member.token, 'Jamie', '')).toStrictEqual(400);
    expect(userSetName(member.token, 'Jamie',
      'dsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsd')).toStrictEqual(400);
  });
});

describe('Testing userSetEmailV1', () => {
  test('Successfully updating two emails', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');

    expect(userSetEmail(member1.token, 'aintnofoo@bar.com')).toStrictEqual({});

    expect(usersAll(member1.token)).toStrictEqual({
      users: [
        {
          uId: member1.authUserId,
          email: 'aintnofoo@bar.com',
          nameFirst: 'James',
          nameLast: 'Charles',
          handleStr: expect.any(String),
          profileImgUrl: `http://localhost:${port}/static/default/default.jpg`
        },
      ],
    });
  });
});

describe('Error checking userSetEmailV1', () => {
  test('Invalid token and emails', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');

    const invalidToken = member1.token + 'lolol';

    expect(userSetEmail(invalidToken, 'aintnofoo@bar.com')).toStrictEqual(403);

    expect(userSetEmail(member1.token, '@bar.com')).toStrictEqual(400);
    expect(userSetEmail(member1.token, '@bar@chicken.com')).toStrictEqual(400);
    expect(userSetEmail(member1.token, 'chicken.com')).toStrictEqual(400);
    expect(userSetEmail(member1.token, 'chicken')).toStrictEqual(400);
    expect(userSetEmail(member1.token, '')).toStrictEqual(400);
  });

  test('Email already in use', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');

    expect(userSetEmail(member1.token, 'chicken@bar.com')).toStrictEqual(400);
  });
});

describe('Testing userSetHandleV1', () => {
  test('Successfully updating two handles', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const member2 = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');

    expect(userSetHandle(member1.token, 'ja3')).toStrictEqual({});
    expect(userSetHandle(member2.token, 'ronalddddddddddddddd')).toStrictEqual({});
    expect(usersAll(member1.token)).toStrictEqual({
      users: [
        {
          uId: member1.authUserId,
          email: 'foo@bar.com',
          nameFirst: 'James',
          nameLast: 'Charles',
          handleStr: 'ja3',
          profileImgUrl: `http://localhost:${port}/static/default/default.jpg`
        },
        {
          uId: member2.authUserId,
          email: 'chicken@bar.com',
          nameFirst: 'Ronald',
          nameLast: 'Mcdonald',
          handleStr: 'ronalddddddddddddddd',
          profileImgUrl: `http://localhost:${port}/static/default/default.jpg`
        },
      ],
    });
  });
});

describe('Error checking userSetHandleV1', () => {
  test('Invalid token, length of handleStr, non-alphanumeric characters, spacings, empty strings', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');

    const invalidToken = member1.token + 'lolol';
    // invalid token
    expect(userSetHandle(invalidToken, 'jameshehe123')).toStrictEqual(403);
    // invalid length: 2 characters
    expect(userSetHandle(member1.token, 'ja')).toStrictEqual(400);
    // invalid length: 21 characters
    expect(userSetHandle(member1.token, 'jaaaaaaaaaaamesssssss')).toStrictEqual(400);
    // non-alphanumeric characters
    expect(userSetHandle(member1.token, 'james@foo')).toStrictEqual(400);
    // space in between
    expect(userSetHandle(member1.token, 'james charlesteehee')).toStrictEqual(400);
    // empty string
    expect(userSetHandle(member1.token, '')).toStrictEqual(400);
  });

  test('handleStr already in use', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const member2 = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');

    // member2 trying to change handle
    // get handleStr using userProfile function
    const member1Details = userProfile(member2.token, member1.authUserId);

    expect(userSetHandle(member2.token, member1Details.user.handleStr)).toStrictEqual(400);
    clear();
  });
});

describe('Testing userStatsV1', () => {
  test('Successfully returning stats of user', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const member2 = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');
    // Creating channels to test stats
    const channel1 = channelsCreate(member1.token, 'channel1', true);
    channelsCreate(member1.token, 'channel2', false);
    channelJoin(member2.token, channel1.channelId);
    // Creating dm to test stats
    const dm = dmCreate(member1.token, [member2.authUserId]);
    // Creating messages to test stats
    messageSend(member1.token, channel1.channelId, 'hello there');
    messageSendDm(member2.token, dm.dmId, 'yep');

    // Testing user stats of member 1
    expect(userStats(member1.token)).toStrictEqual({
      channelsJoined: [
        { numChannelsJoined: 0, timeStamp: expect.any(Number) },
        { numChannelsJoined: 1, timeStamp: expect.any(Number) },
        { numChannelsJoined: 2, timeStamp: expect.any(Number) },
      ],
      dmsJoined: [
        { numDmsJoined: 0, timeStamp: expect.any(Number) },
        { numDmsJoined: 1, timeStamp: expect.any(Number) },
      ],
      messagesSent: [
        { numMessagesSent: 0, timeStamp: expect.any(Number) },
        { numMessagesSent: 1, timeStamp: expect.any(Number) },
      ],
      involvementRate: 4 / 5,
    });

    // Testing user stats of member 2
    expect(userStats(member2.token)).toStrictEqual({
      channelsJoined: [
        { numChannelsJoined: 0, timeStamp: expect.any(Number) },
        { numChannelsJoined: 1, timeStamp: expect.any(Number) },
      ],
      dmsJoined: [
        { numDmsJoined: 0, timeStamp: expect.any(Number) },
        { numDmsJoined: 1, timeStamp: expect.any(Number) },
      ],
      messagesSent: [
        { numMessagesSent: 0, timeStamp: expect.any(Number) },
        { numMessagesSent: 1, timeStamp: expect.any(Number) }
      ],
      involvementRate: 3 / 5,
    });
  });

  test('Testing user/stats with channelleave and dmremove/leave', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const member2 = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');
    // Creating channels to test stats
    const channel1 = channelsCreate(member1.token, 'channel1', true);
    channelsCreate(member1.token, 'channel2', false);
    channelJoin(member2.token, channel1.channelId);
    // Creating dm to test stats
    const dm = dmCreate(member1.token, [member2.authUserId]);
    // Creating messages to test stats
    messageSend(member1.token, channel1.channelId, 'hello there');
    messageSendDm(member2.token, dm.dmId, 'yep');
    // Leaving channels and dms to test userStats
    channelLeave(member2.token, channel1.channelId);
    dmLeave(member2.token, dm.dmId);

    expect(userStats(member2.token)).toStrictEqual({
      channelsJoined: [
        { numChannelsJoined: 0, timeStamp: expect.any(Number) },
        { numChannelsJoined: 1, timeStamp: expect.any(Number) },
        { numChannelsJoined: 0, timeStamp: expect.any(Number) },
      ],
      dmsJoined: [
        { numDmsJoined: 0, timeStamp: expect.any(Number) },
        { numDmsJoined: 1, timeStamp: expect.any(Number) },
        { numDmsJoined: 0, timeStamp: expect.any(Number) },
      ],
      messagesSent: [
        { numMessagesSent: 0, timeStamp: expect.any(Number) },
        { numMessagesSent: 1, timeStamp: expect.any(Number) }
      ],
      involvementRate: 1 / 5,
    });
  });
});

describe('Error checking userStatsV1', () => {
  test('Invalid token', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');

    const invalidToken = member1.token + 'lolol';
    // invalid token
    expect(userStats(invalidToken)).toStrictEqual(403);
  });
});

describe('Testing usersStatsV1', () => {
  test('Successfully returning stats of workspace, and removing messages/dms', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const member2 = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');
    // Creating channels to test stats
    const channel1 = channelsCreate(member1.token, 'channel1', true);
    channelsCreate(member1.token, 'channel2', false);
    // Creating dm to test stats
    const dm = dmCreate(member1.token, [member2.authUserId]);

    // Testing user stats of member 1
    expect(usersStats(member1.token)).toStrictEqual({
      channelsExist: [
        { numChannelsExist: 0, timeStamp: expect.any(Number) },
        { numChannelsExist: 1, timeStamp: expect.any(Number) },
        { numChannelsExist: 2, timeStamp: expect.any(Number) }],
      dmsExist: [
        { numDmsExist: 0, timeStamp: expect.any(Number) },
        { numDmsExist: 1, timeStamp: expect.any(Number) }],
      messagesExist: [{ numMessagesExist: 0, timeStamp: expect.any(Number) }],
      utilizationRate: 1,
    });

    // messageSendDm, DmRemove tracked
    messageSendDm(member1.token, dm.dmId, 'hello1');
    messageSendDm(member1.token, dm.dmId, 'hello2');
    dmRemove(member1.token, dm.dmId);

    expect(usersStats(member1.token)).toStrictEqual({
      channelsExist: [
        { numChannelsExist: 0, timeStamp: expect.any(Number) },
        { numChannelsExist: 1, timeStamp: expect.any(Number) },
        { numChannelsExist: 2, timeStamp: expect.any(Number) }],
      dmsExist: [
        { numDmsExist: 0, timeStamp: expect.any(Number) },
        { numDmsExist: 1, timeStamp: expect.any(Number) },
        { numDmsExist: 0, timeStamp: expect.any(Number) }],
      messagesExist: [
        { numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) },
        { numMessagesExist: 2, timeStamp: expect.any(Number) },
        { numMessagesExist: 0, timeStamp: expect.any(Number) }],
      utilizationRate: 1,
    });

    // message removed tracked
    const msg = messageSend(member1.token, channel1.channelId, 'hello');
    messageRemove(member1.token, msg.messageId);
    const stats = usersStats(member1.token);
    expect(stats.messagesExist).toStrictEqual(
      [{ numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) },
        { numMessagesExist: 2, timeStamp: expect.any(Number) },
        { numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) },
        { numMessagesExist: 0, timeStamp: expect.any(Number) }]
    );

    // message edited to removed tracked
    const msg2 = messageSend(member1.token, channel1.channelId, 'hello');
    messageEdit(member1.token, msg2.messageId, '');
    const stats2 = usersStats(member1.token);
    expect(stats2.messagesExist).toStrictEqual(
      [{ numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) },
        { numMessagesExist: 2, timeStamp: expect.any(Number) },
        { numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) },
        { numMessagesExist: 0, timeStamp: expect.any(Number) },
        { numMessagesExist: 1, timeStamp: expect.any(Number) },
        { numMessagesExist: 0, timeStamp: expect.any(Number) }]
    );
  });
});

// Testing user/profile/uploadphoto
describe('Testing user/profile/uploadphoto/v1', () => {
  test('Testing basic', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const baseURL = 'http://www.traveller.com.au/content/dam/images/h/1/p/q/1/k/image.related.articleLeadwide.620x349.h1pq27.png/1596176460724.jpg';

    expect(userUploadPhoto(member1.token, baseURL, 0, 0, 100, 200)).toStrictEqual({});
  });
});

describe('Testing errors for user/profile/uploadphoto/v1', () => {
  test('Invalid token', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const fakeToken = member1.token + 'yup';
    const baseURL = 'http://www.traveller.com.au/content/dam/images/h/1/p/q/1/k/image.related.articleLeadwide.620x349.h1pq27.png/1596176460724.jpg';

    expect(userUploadPhoto(fakeToken, baseURL, 0, 0, 100, 200)).toStrictEqual(403);
  });

  test('File not a jpg', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const baseURL = 'http://www.traveller.com.au/content/dam/images/h/1/p/q/1/k/image.related.articleLeadwide.620x349.h1pq27.png/1596176460724.png';

    expect(userUploadPhoto(member1.token, baseURL, 0, 0, 100, 200)).toStrictEqual(400);
  });

  test('Cropping is not within appropriate dimensions', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const baseURL = 'http://www.traveller.com.au/content/dam/images/h/1/p/q/1/k/image.related.articleLeadwide.620x349.h1pq27.png/1596176460724.jpg';

    expect(userUploadPhoto(member1.token, baseURL, -1000, 0, 0, 0)).toStrictEqual(400);
    expect(userUploadPhoto(member1.token, baseURL, 0, -1000, 0, 0)).toStrictEqual(400);
    expect(userUploadPhoto(member1.token, baseURL, 0, 0, -1000, 0)).toStrictEqual(400);
    expect(userUploadPhoto(member1.token, baseURL, 0, 0, 0, -1000)).toStrictEqual(400);

    // xEnd <= xStart
    expect(userUploadPhoto(member1.token, baseURL, 200, 100, 100, 200)).toStrictEqual(400);
    // yEnd <= yStart
    expect(userUploadPhoto(member1.token, baseURL, 100, 200, 100, 100)).toStrictEqual(400);
  });

  test('Error when retrieving image', () => {
    clear();
    const member1 = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    // correct domain, bad route
    const baseURL = 'http://www.traveller.com.au/content/dam/images/h/1/p/q/1/k/articleLeadwide.620x349.h1pq27.png/1596176460725.jpg';
    expect(userUploadPhoto(member1.token, baseURL, 0, 0, 100, 200)).toStrictEqual(400);
  });
});
