import {
  authRegister, channelsCreate, dmCreate,
  clear, channelMessages, dmMessages,
  adminUserRemove, messageSend, channelInvite,
  adminUserpermissionChange, messageSendDm, userProfile, usersAll
} from './testhelpers';
import { port } from './config.json';

// test failed cases for adminuserremove
describe('/admin/user/remove/v1 failed cases', () => {
  test('token invalid', () => {
    clear();
    authRegister('foo@bar.com', 'password', 'James', 'Charles');
    expect(adminUserRemove('fake', -10)).toStrictEqual(403);
  });

  test('uId invalid does not exist/already removed', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const user1 = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    expect(adminUserRemove(globalOwnerId.token, -10)).toStrictEqual(400);
    expect(adminUserRemove(globalOwnerId.token, user1.authUserId)).toStrictEqual({});
    expect(adminUserRemove(globalOwnerId.token, user1.authUserId)).toStrictEqual(400);
  });

  test('uId is only global owner', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    expect(adminUserRemove(globalOwnerId.token, globalOwnerId.authUserId)).toStrictEqual(400);
  });

  test('auth user is not global owner', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const user1 = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    expect(adminUserRemove(user1.token, globalOwnerId.authUserId)).toStrictEqual(403);
    expect(adminUserRemove(user1.token, user1.authUserId)).toStrictEqual(403);
  });
});

// test success cases for adminuserremove
describe('/admin/user/remove/v1 success cases', () => {
  test('global owner removing normal user', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const user1 = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channel1 = channelsCreate(user1.token, 'testingTagging', true);
    const msgId = messageSend(user1.token, channel1.channelId, '@willywonka@jamescharles hello!');
    channelInvite(user1.token, channel1.channelId, globalOwnerId.authUserId);

    const dm1 = dmCreate(user1.token, [globalOwnerId.authUserId]);
    const dmMsgId = messageSendDm(user1.token, dm1.dmId, 'msgtodel');

    expect(adminUserRemove(globalOwnerId.token, user1.authUserId)).toStrictEqual({});

    expect(channelMessages(globalOwnerId.token, channel1.channelId, 0)).toStrictEqual({
      messages: [
        {
          messageId: msgId.messageId,
          uId: user1.authUserId,
          message: 'Removed user',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        }
      ],
      start: 0,
      end: -1,
    });
    expect(dmMessages(globalOwnerId.token, dm1.dmId, 0)).toStrictEqual({
      messages: [
        {
          messageId: dmMsgId.messageId,
          uId: user1.authUserId,
          message: 'Removed user',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        }
      ],
      start: 0,
      end: -1,
    });
    expect(channelsCreate(user1.token, 'cannot exist channel', true)).toStrictEqual(403);
    expect(userProfile(globalOwnerId.token, user1.authUserId)).toStrictEqual({
      user: {
        uId: user1.authUserId,
        email: '',
        nameFirst: 'Removed',
        nameLast: 'user',
        handleStr: '',
        profileImgUrl: `http://localhost:${port}/static/default/default.jpg`,
      }
    });
    expect(usersAll(globalOwnerId.token)).toStrictEqual({
      users: [
        {
          uId: globalOwnerId.authUserId,
          email: 'foo@bar.com',
          nameFirst: 'James',
          nameLast: 'Charles',
          handleStr: expect.any(String),
          profileImgUrl: `http://localhost:${port}/static/default/default.jpg`,
        }
      ]
    });
  });

  test('global owner removing another global owner', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const user1 = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    expect(adminUserpermissionChange(globalOwnerId.token, user1.authUserId, 1)).toStrictEqual({});
    expect(adminUserRemove(globalOwnerId.token, user1.authUserId)).toStrictEqual({});
    expect(channelsCreate(user1.token, 'cannot exist channel', true)).toStrictEqual(403);
  });
});

// test failed cases for adminuserpermissionchange
describe('/admin/userpermission/change/v1 failed cases', () => {
  test('token & uId invalid does not exist/already removed, code invalid', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const user1 = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    expect(adminUserRemove('fake token', user1.authUserId)).toStrictEqual(403);
    expect(adminUserRemove(globalOwnerId.token, user1.authUserId)).toStrictEqual({});
    expect(adminUserpermissionChange('fake token', user1.authUserId, 2)).toStrictEqual(403);
    expect(adminUserpermissionChange(globalOwnerId.token, user1.authUserId, 2)).toStrictEqual(400);
    expect(adminUserpermissionChange(globalOwnerId.token, user1.authUserId, 1)).toStrictEqual(400);
  });

  test('uId is only global owner and being demoted to user', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    expect(adminUserpermissionChange(globalOwnerId.token, globalOwnerId.authUserId, 2)).toStrictEqual(400);
  });

  test('auth user is not global owner', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const user1 = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    expect(adminUserpermissionChange(user1.token, globalOwnerId.authUserId, 1)).toStrictEqual(403);
    expect(adminUserpermissionChange(user1.token, globalOwnerId.authUserId, 2)).toStrictEqual(403);
    expect(adminUserpermissionChange(user1.token, user1.authUserId, 1)).toStrictEqual(403);
    expect(adminUserpermissionChange(user1.token, user1.authUserId, 2)).toStrictEqual(403);
  });

  test('permissionId is invalid/same as current permission', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const user1 = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    expect(adminUserpermissionChange(globalOwnerId.token, user1.authUserId, 111)).toStrictEqual(400);
    expect(adminUserpermissionChange(globalOwnerId.token, user1.authUserId, 2)).toStrictEqual(400);
    expect(adminUserpermissionChange(globalOwnerId.token, globalOwnerId.authUserId, 1)).toStrictEqual(400);
  });
});

// test success cases for adminuserremove
describe('/admin/userpermission/change/v1 success cases', () => {
  test('global owner promoting normal user and then demoting him self', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');
    const user1 = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    expect(adminUserpermissionChange(globalOwnerId.token, user1.authUserId, 1)).toStrictEqual({});
    expect(adminUserpermissionChange(globalOwnerId.token, globalOwnerId.authUserId, 2)).toStrictEqual({});
    expect(adminUserpermissionChange(user1.token, globalOwnerId.authUserId, 1)).toStrictEqual({});
    expect(adminUserpermissionChange(user1.token, user1.authUserId, 2)).toStrictEqual({});
  });
});
