import {
  authRegister, channelsCreate,
  clear, standupStart,
  channelMessages, userProfile, standupActive, standupSend
} from './testhelpers';

const requestTime = () => Math.floor((new Date()).getTime() / 1000);

clear();

// Tests for /standup/start/v1
describe('/standup/start/v1 ', () => {
  test('success standup start', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    const timeNow = requestTime();
    const time = standupStart(globalOwnerId.token, channel.channelId, 1);
    expect(time.timeFinish).toBeGreaterThanOrEqual(timeNow + 1);
    expect(time.timeFinish).toBeLessThanOrEqual(timeNow + 2);
    while (time.timeFinish >= requestTime()) {
      continue;
    }
  });

  test('error 403: invalid token', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    expect(standupStart(globalOwnerId.token + 'hi', channel.channelId, 2)).toEqual(403);
  });

  test('error 400: invalid channelId', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    expect(standupStart(globalOwnerId.token, channel.channelId + 1, 2)).toEqual(400);
  });

  test('error 400: negative length', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    expect(standupStart(globalOwnerId.token, channel.channelId, -1)).toEqual(400);
  });

  test('error 400: active standup currently running', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    const time = standupStart(globalOwnerId.token, channel.channelId, 2);
    expect(standupStart(globalOwnerId.token, channel.channelId, 2)).toEqual(400);
    while (time.timeFinish >= requestTime()) {
      continue;
    }
  });

  test('error 403: authorised user not a member of channel', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    const random = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    expect(standupStart(random.token, channel.channelId, 3)).toEqual(403);
  });
});

// Tests for /standup/active/v1
describe('/standup/active/v1 ', () => {
  test('success with active standup', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    const timeFinish = standupStart(globalOwnerId.token, channel.channelId, 2);

    expect(standupActive(globalOwnerId.token, channel.channelId)).toEqual({
      isActive: true,
      timeFinish: timeFinish.timeFinish,
    });
    while (timeFinish.timeFinish >= requestTime()) {
      continue;
    }
    expect(standupActive(globalOwnerId.token, channel.channelId)).toEqual({
      isActive: false,
      timeFinish: null,
    });
  });

  test('error 400: invalid channelId', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    const time = standupStart(globalOwnerId.token, channel.channelId, 1);
    expect(standupActive(globalOwnerId.token, channel.channelId + 1)).toEqual(400);
    while (time.timeFinish >= requestTime()) {
      continue;
    }
  });

  test('error 403: invalid token', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    const time = standupStart(globalOwnerId.token, channel.channelId, 1);
    expect(standupActive(globalOwnerId.token + 'hi', channel.channelId)).toEqual(403);
    while (time.timeFinish >= requestTime()) {
      continue;
    }
  });

  test('error 403: Authorised user not member of channel', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    const random = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const time = standupStart(globalOwnerId.token, channel.channelId, 1);
    expect(standupActive(random.token, channel.channelId)).toEqual(403);
    while (time.timeFinish >= requestTime()) {
      continue;
    }
  });

  test('success with inactive standup', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    expect(standupActive(globalOwnerId.token, channel.channelId)).toEqual({
      isActive: false,
      timeFinish: null,
    });
  });
});

describe('/standup/send/v1 ', () => {
  test('success send', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    const owner = userProfile(globalOwnerId.token, globalOwnerId.authUserId);
    const handle1 = owner.user.handleStr;
    standupStart(globalOwnerId.token, channel.channelId, 1);

    const request = requestTime();
    expect(standupSend(globalOwnerId.token, channel.channelId, 'hellothere!')).toEqual({});
    expect(standupSend(globalOwnerId.token, channel.channelId, 'bye!')).toEqual({});

    while (requestTime() <= request + 1) {
      continue;
    }

    expect(channelMessages(globalOwnerId.token, channel.channelId, 0)).toEqual({
      messages: [
        {
          messageId: expect.any(Number),
          uId: globalOwnerId.authUserId,
          message: `${handle1}: hellothere!\n${handle1}: bye!`,
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        }
      ],
      start: 0,
      end: -1
    });
  });

  test('error 400: no active standup running', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    expect(standupSend(globalOwnerId.token, channel.channelId, 'hello')).toEqual(400);
  });
  test('error 400: invalid channelId', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    const time = standupStart(globalOwnerId.token, channel.channelId, 1);
    expect(standupSend(globalOwnerId.token, channel.channelId + 1, 'hello')).toEqual(400);
    while (time.timeFinish >= requestTime()) {
      continue;
    }
  });

  test('error 400: message over 1000 characters', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    const time = standupStart(globalOwnerId.token, channel.channelId, 1);
    expect(standupSend(globalOwnerId.token, channel.channelId, `dsasdasdasdasda
    dsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadas
    dsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadas
    dsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadas
    dsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadas
    dsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadas
    dsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadas
    dsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadas
    dsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadas
    dsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadas
    dsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadas
    dsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadas
    dsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadasdsdsasdsdasddsdsadasdadas
    dsdsasdsdasddsdsadasd`)).toEqual(400);
    while (time.timeFinish >= requestTime()) {
      continue;
    }
  });

  test('error 403: authorised user not member of channel', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    const random = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const time = standupStart(globalOwnerId.token, channel.channelId, 1);
    expect(standupSend(random.token, channel.channelId, 'hello')).toEqual(403);
    while (time.timeFinish >= requestTime()) {
      continue;
    }
  });

  test('error 403: invalid token', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    const time = standupStart(globalOwnerId.token, channel.channelId, 1);
    expect(standupSend(globalOwnerId.token + 'hi', channel.channelId, 'hello')).toEqual(403);
    while (time.timeFinish >= requestTime()) {
      continue;
    }
  });

  test('success send empty string', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channel = channelsCreate(globalOwnerId.token, 'testingStandup', true);
    const time = standupStart(globalOwnerId.token, channel.channelId, 1);
    expect(standupSend(globalOwnerId.token, channel.channelId, '')).toEqual({});
    while (time.timeFinish >= requestTime()) {
      continue;
    }
  });
});
