import { authRegister, authLogout } from './testhelpers';
import { channelsCreate, channelsList, channelsListAll, channelLeave } from './testhelpers';
import { clear } from './testhelpers';

clear();

describe('channelsCreateV3 tests:', () => {
  test('Testing for logged out user', () => {
    clear();
    const person = authRegister('hao@mail.com', '123456', 'hao', 'yang');
    authLogout(person.token);

    expect(channelsCreate(person.token, 'asdsadadsdsadsa', true)).toStrictEqual(403);
  });

  test('Testing for invalid name(smaller than 1)', () => {
    clear();
    const person = authRegister('hao@mail.com', '123456', 'hao', 'yang');

    expect(channelsCreate(person.token, '', true)).toStrictEqual(400);
    expect(channelsCreate(person.token, '', false)).toStrictEqual(400);
  });

  test('Testing for invalid name(greater than 20)', () => {
    clear();
    const person = authRegister('hao@mail.com', '1234512345', 'hao', 'yang');

    expect(channelsCreate(person.token, '1234567890qwertyuiopa', true)).toStrictEqual(400);
    expect(channelsCreate(person.token, '1234567890qwertyuiopa', false)).toStrictEqual(400);
  });

  test('Testing for invalid user', () => {
    clear();
    const person = authRegister('hao@mail.com', '1234512345', 'hao', 'yang');
    clear();

    expect(channelsCreate(person.token, 'hao/channel', true)).toStrictEqual(403);
  });

  test('Testing for successful channel creation public & private', () => {
    clear();
    const person = authRegister('hao@mail.com', '1234512345', 'hao', 'yang');

    expect(channelsCreate(person.token, 'hao/channel', true)).toStrictEqual(
      {
        channelId: expect.any(Number),
      }
    );
    expect(channelsCreate(person.token, 'hao/channel/private', false)).toStrictEqual(
      {
        channelId: expect.any(Number),
      }
    );
  });
});

describe('channelsListV3 tests:', () => {
  test('Testing for invalid authUserId', () => {
    clear();

    const person = authRegister('hao@mail.com', '1234512345', 'hao', 'yang');
    clear();

    expect(channelsList(person.token)).toStrictEqual(403);
  });

  test('Testing for valid input(not in any channel)', () => {
    clear();

    const person = authRegister('hao@mail.com', '1234512345', 'hao', 'yang');
    const person2 = authRegister('ethan@mail.com', '5678956789', 'ethan', 'chew');

    channelsCreate(person2.token, 'person2/channel1', true);

    expect(channelsList(person.token)).toStrictEqual({
      channels: []
    });
  });

  test('Testing for successful creation', () => {
    clear();

    const person = authRegister('hao@mail.com', '1234512345', 'hao', 'yang');
    const person2 = authRegister('ethan@mail.com', '5678956789', 'ethan', 'chew');

    const channel1 = channelsCreate(person.token, 'hao/channel1', true);
    const channel2 = channelsCreate(person.token, 'hao/channel2', true);
    const channel3 = channelsCreate(person.token, 'hao/channel3', false);
    channelsCreate(person2.token, 'ethan/channel1', true);

    expect(channelsList(person.token)).toStrictEqual(
      {
        channels: [
          {
            channelId: channel1.channelId,
            name: 'hao/channel1',
          },
          {
            channelId: channel2.channelId,
            name: 'hao/channel2',
          },
          {
            channelId: channel3.channelId,
            name: 'hao/channel3',
          },
        ]
      }
    );
  });

  test('Test after leaving channel', () => {
    clear();

    const person = authRegister('hao@mail.com', '1234512345', 'hao', 'yang');
    const channel = channelsCreate(person.token, 'hao/channel1', true);
    channelLeave(person.token, channel.channelId);
    expect(channelsList(person.token)).toStrictEqual({ channels: [] });
  });
});

// Testing for channelsListAll
describe('Testing channelsListAllV2 standard', () => {
  test('Test that the baseline function works', () => {
    clear();

    authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelIdPublic = channelsCreate(channelOwnerId.token, 'Boost', true);

    expect(channelsListAll(channelOwnerId.token)).toStrictEqual({
      channels: [
        {
          channelId: channelIdPublic.channelId,
          name: 'Boost',
        }
      ]
    });
  });

  test('test that function works with more than one channel including a private channel', () => {
    clear();

    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelIdPublic = channelsCreate(channelOwnerId.token, 'Boost', true);
    const channelIdPrivate = channelsCreate(channelOwnerId.token, 'priv_channel', false);

    expect(channelsListAll(globalOwnerId.token)).toStrictEqual({
      channels: [
        {
          channelId: channelIdPublic.channelId,
          name: 'Boost',
        },
        {
          channelId: channelIdPrivate.channelId,
          name: 'priv_channel',
        }
      ]
    });
  });
});

describe('Testing the edge cases', () => {
  test('Test for when authuserId is invalid', () => {
    clear();

    const fakeUser = '-20';

    expect(channelsListAll(fakeUser)).toStrictEqual(403);
  });

  test('Test for when there are no channels in existence yet', () => {
    clear();

    const user = authRegister('foo@bar.com', 'password', 'James', 'Charles');

    expect(channelsListAll(user.token)).toStrictEqual({
      channels: []
    });
    clear();
  });
});
