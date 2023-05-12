import {
  messageSend, messageEdit, messageRemove, clear, dmCreate,
  dmMessages, channelMessages, channelJoin
} from './testhelpers';
import { authRegister, authLogout } from './testhelpers';
import { channelsCreate } from './testhelpers';
import { messageSendDm, messageShare } from './testhelpers';
import { messageReact, messageUnreact } from './testhelpers';
import { messagePin, messageUnpin } from './testhelpers';
import { messageSendlater, messageSendlaterdm } from './testhelpers';
const requestTime = () => Math.floor((new Date()).getTime() / 1000);

clear();
// Testing for message/send/v1
describe('/message/send/v1 success', () => {
  test('Successful message send to channel', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const messageId1 = messageSend(auth.token, channelId.channelId, 'helloo');
    const messageId2 = messageSend(auth.token, channelId.channelId, 'there');
    expect(channelMessages(auth.token, channelId.channelId, 0)).toStrictEqual({
      messages: [
        {
          messageId: messageId2.messageId,
          uId: auth.authUserId,
          message: 'there',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: messageId1.messageId,
          uId: auth.authUserId,
          message: 'helloo',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        }
      ],
      start: 0,
      end: -1,
    });
  });
});

describe('Testing errors for /message/send/v1', () => {
  test('Invalid channel', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const token = auth.token;
    const channelId = channelsCreate(token, 'Dog Channel', true);
    const invalidChannelId = channelId + 1;
    const check = messageSend(token, invalidChannelId, 'helloo');
    expect(check).toStrictEqual(400);
  });

  test('Testing length of message - length = 0', () => {
    clear();
    const auth = authRegister('wateryeung0805@gmail.com', 'waterYYds1', 'Water', 'Yeung');
    const channelId = channelsCreate(auth.token, 'Water is smart', true);

    expect(messageSend(auth.token, channelId.channelId, '')).toStrictEqual(400);
  });

  test('Testing length of message - length > 1000', () => {
    clear();
    const auth = authRegister('wateryeung0805@gmail.com', 'waterYYds1', 'Water', 'Yeung');
    const token = auth.token;
    const channelId = channelsCreate(token, 'Water is smart', true);

    const invalidMessage = 'h';

    const check = messageSend(token, channelId.channelId, invalidMessage.repeat(1001));
    expect(check).toStrictEqual(400);
  });

  test('Testing user is not a member of the valid channel ', () => {
    clear();
    const auth1 = authRegister('Henryyeung@gmail.com', 'TurtleCute1', 'Henry', 'Yeung');
    const auth2 = authRegister('Niki@gmail.com', 'breadYum2', 'Niki', 'Huang');

    const channelId = channelsCreate(auth1.token, 'turtle live show', true);
    expect(messageSend(auth2.token, channelId.channelId, 'leijou')).toStrictEqual(403);
  });

  test('Testing invalid token', () => {
    clear();
    const auth = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const token = auth.token;
    const channelId = channelsCreate(token, 'hk channel', true);

    authLogout(token);
    expect(messageSend(token, channelId.channelId, 'wow')).toStrictEqual(403);
  });
});

// Testing for message/senddm/v1
describe('message/senddm/v1 success', () => {
  test('success statement', () => {
    clear();
    const auth1 = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const auth2 = authRegister('Ericchen@icloud.com', 'Ntu123456', 'Eric', 'Chen');

    const dmId = dmCreate(auth1.token, [auth2.authUserId]);
    const message1 = messageSendDm(auth1.token, dmId.dmId, 'meow1');
    const message2 = messageSendDm(auth2.token, dmId.dmId, 'meow2');
    expect(message1).toStrictEqual({ messageId: expect.any(Number) });
    expect(message2).toStrictEqual({ messageId: expect.any(Number) });
    expect(dmMessages(auth1.token, dmId.dmId, 0)).toStrictEqual({
      messages: [
        {
          messageId: message2.messageId,
          uId: auth2.authUserId,
          message: 'meow2',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: message1.messageId,
          uId: auth1.authUserId,
          message: 'meow1',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        }
      ],
      start: 0,
      end: -1,
    });
  });
});

describe('Error checking message/senddm/v1', () => {
  test('Testing dmId does not refer to a valid DM', () => {
    clear();
    const auth = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const dm = dmCreate(auth.token, []);
    const invalidDmId = dm.dmId + 1;
    expect(messageSendDm(auth.token, invalidDmId, 'meow')).toStrictEqual(400);
  });

  test('Testing length of message is over 1000 char', () => {
    clear();
    const auth = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const dm = dmCreate(auth.token, []);

    const invalidMessage = 'h';

    const check = messageSendDm(auth.token, dm.dmId, invalidMessage.repeat(1001));
    expect(check).toStrictEqual(400);
  });

  test('Testing length of message is less than 1 char', () => {
    clear();
    const auth = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const dm = dmCreate(auth.token, []);
    expect(messageSendDm(auth.token, dm.dmId, '')).toStrictEqual(400);
  });

  test('Testing dmld is valid and non member tries to post', () => {
    clear();
    const auth1 = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const auth2 = authRegister('Ericchen@icloud.com', 'Ntu123456', 'Eric', 'Chen');
    const auth3 = authRegister('Roywu@gmail.com', 'Sanfransisco3', 'Roy', 'Wu');
    const auth4 = authRegister('ray@icloud.com', 'gainWeight4', 'Ray', 'Chiu');

    const dm = dmCreate(auth1.token, [auth3.authUserId, auth4.authUserId]);
    expect(messageSendDm(auth2.token, dm.dmId, 'meow')).toStrictEqual(403);
  });

  test('Testing invalid token', () => {
    clear();
    const auth = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const dm = dmCreate(auth.token, []);
    const invalidToken = auth.token + 'wassup';
    expect(messageSendDm(invalidToken, dm.dmId, 'meow')).toStrictEqual(403);
  });
});

// Testing for message/edit/v1
describe('/message/edit/v1 success', () => {
  test('Successful message edit in CHANNEL', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo@ninayeh');
    const newMsg = messageEdit(auth.token, messageId.messageId, 'edited!@ninayeh');
    expect(newMsg).toStrictEqual({});
    expect(channelMessages(auth.token, channelId.channelId, 0)).toStrictEqual({
      messages: [
        {
          messageId: messageId.messageId,
          uId: auth.authUserId,
          message: 'edited!@ninayeh',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        }
      ],
      start: 0,
      end: -1,
    });
  });

  test('Successful message edit in DM', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const dm = dmCreate(auth.token, []);
    const messageId = messageSendDm(auth.token, dm.dmId, 'helloo@ninayeh');
    expect(messageEdit(auth.token, messageId.messageId, 'edited!@ninayeh')).toStrictEqual({});
    expect(dmMessages(auth.token, dm.dmId, 0)).toStrictEqual({
      messages: [
        {
          messageId: messageId.messageId,
          uId: auth.authUserId,
          message: 'edited!@ninayeh',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        }
      ],
      start: 0,
      end: -1,
    });
  });
});

describe('Testing errors for /message/edit/v1', () => {
  test('Testing length of message > 1000', () => {
    clear();
    const auth = authRegister('wateryeung0805@gmail.com', 'waterYYds1', 'Water', 'Yeung');
    const channelId = channelsCreate(auth.token, 'Waterrr', true);
    const dm = dmCreate(auth.token, []);
    const messageId = messageSend(auth.token, channelId.channelId, 'happy');
    const messageIdDm = messageSendDm(auth.token, dm.dmId, 'lolerbears');

    const invalidMessage = 'h';

    const check1 = messageEdit(auth.token, messageId.messageId, invalidMessage.repeat(1001));
    expect(check1).toStrictEqual(400);
    const check2 = messageEdit(auth.token, messageIdDm.messageId, invalidMessage.repeat(1001));
    expect(check2).toStrictEqual(400);
  });

  test('Global owner cannot edit member message in DM', () => {
    clear();
    const globalOwner = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const dmOwner = authRegister('Jackychan@gmail.com', 'passwordhehe', 'Jacky', 'Chan');
    const member = authRegister('Peter@gmail.com', 'drink1234', 'Peter', 'He');

    const dm = dmCreate(dmOwner.token, [globalOwner.authUserId, member.authUserId]);
    const messageId = messageSendDm(member.token, dm.dmId, 'great');
    expect(messageEdit(globalOwner.token, messageId.messageId, 'edited!')).toStrictEqual(403);
  });

  test('Empty string edit deletes message, cannot edit deleted message', () => {
    clear();
    const globalOwner = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');

    const channelId = channelsCreate(globalOwner.token, 'hk channel', true);
    const messageId = messageSend(globalOwner.token, channelId.channelId, 'great');
    // edit empty string (removes message)
    expect(messageEdit(globalOwner.token, messageId.messageId, '')).toStrictEqual({});
    expect(channelMessages(globalOwner.token, channelId.channelId, 0)).toStrictEqual({
      messages: [],
      start: 0,
      end: -1,
    });
    // cannot edit deleted message
    expect(messageEdit(globalOwner.token, messageId.messageId, 'test')).toStrictEqual(400);
  });

  test('Member cannot edit globalOwner message in both channel and dm', () => {
    clear();
    const globalOwner = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const channelId = channelsCreate(globalOwner.token, 'hk channel', true);
    const dmOwner = authRegister('Jackychan@gmail.com', 'passwordhehe', 'Jacky', 'Chan');
    const member = authRegister('Peter@gmail.com', 'drink1234', 'Peter', 'He');
    const nonmember = authRegister('Peter@sadgmail.com', 'drink1234as', 'Peteras', 'Hesda');

    const dm = dmCreate(dmOwner.token, [globalOwner.authUserId, member.authUserId]);
    const messageId = messageSendDm(globalOwner.token, dm.dmId, 'great');
    const channelmessageId = messageSend(globalOwner.token, channelId.channelId, 'great');
    expect(messageEdit(member.token, messageId.messageId, 'edited!')).toStrictEqual(403);
    expect(messageEdit(nonmember.token, messageId.messageId, 'edited!')).toStrictEqual(400);
    expect(messageEdit(member.token, channelmessageId.messageId, 'edited!')).toStrictEqual(400);
    channelJoin(member.token, channelId.channelId);
    expect(messageEdit(member.token, channelmessageId.messageId, 'edited!')).toStrictEqual(403);
  });

  test('Testing invalid token', () => {
    clear();
    const auth = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', ' Tony', 'Yeung');
    const channelId = channelsCreate(auth.token, 'hk channel', true);
    const messageId = messageSend(auth.token, channelId.channelId, 'Meow');

    authLogout(auth.token);
    expect(messageEdit(auth.token, messageId.messageId, 'Hi')).toStrictEqual(403);
  });
});

// Testing for message/remove/v1
describe('message/remove/v1 SUCCESS', () => {
  test('poster removing message from CHANNEL', () => {
    clear();
    const auth = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const channelId = channelsCreate(auth.token, 'icl channel', true);
    const message = messageSend(auth.token, channelId.channelId, 'nice');
    expect(messageRemove(auth.token, message.messageId)).toStrictEqual({});
    expect(channelMessages(auth.token, channelId.channelId, 0)).toStrictEqual({
      messages: [],
      start: 0,
      end: -1,
    });
  });

  test('owner removing member message from DM', () => {
    clear();
    const dmOwner = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const member = authRegister('Ericchen@icloud.com', 'Ntu123456', 'Eric', 'Chen');

    const dm = dmCreate(dmOwner.token, [member.authUserId]);
    const message = messageSendDm(member.token, dm.dmId, 'remove my message pls');

    expect(messageRemove(dmOwner.token, message.messageId)).toStrictEqual({});
    expect(dmMessages(dmOwner.token, dm.dmId, 0)).toStrictEqual({
      messages: [],
      start: 0,
      end: -1,
    });
  });
});

describe('Error checking /message/remove/v1', () => {
  test('Testing messageId does not refer to valid message within channel/dm that authorised user join', () => {
    clear();
    const auth = authRegister('lala0110@gmail.com', 'lala0110', 'Lala', 'Yeh');
    const channelId = channelsCreate(auth.token, 'eat channel', true);
    const message = messageSend(auth.token, channelId.channelId, 'bark');

    const invalidMessageId = message.messageId + 1;
    expect(messageRemove(auth.token, invalidMessageId)).toStrictEqual(400);
  });

  test('user making the request not in channel', () => {
    clear();
    const auth1 = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const auth2 = authRegister('Ericchen@icloud.com', 'Ntu123456', 'Eric', 'Chen');

    const channelId = channelsCreate(auth1.token, 'channel', true);
    const message = messageSend(auth1.token, channelId.channelId, 'ntu band');
    expect(messageRemove(auth2.token, message.messageId)).toStrictEqual(400);
  });

  test('Global owner (non-owner) cannot remove member message in DM', () => {
    clear();
    const globalOwner = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const dmOwner = authRegister('Jackychan@gmail.com', 'passwordhehe', 'Jacky', 'Chan');
    const member = authRegister('Peter@gmail.com', 'drink1234', 'Peter', 'He');

    const dm = dmCreate(dmOwner.token, [globalOwner.authUserId, member.authUserId]);
    const messageId = messageSendDm(member.token, dm.dmId, 'try to remove me');
    expect(messageRemove(globalOwner.token, messageId.messageId)).toStrictEqual(403);
  });

  test('Cannot remove deleted message (via edit to empty string)', () => {
    clear();
    const globalOwner = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');

    const channelId = channelsCreate(globalOwner.token, 'hk channel', true);
    const messageId = messageSend(globalOwner.token, channelId.channelId, 'great');
    // edit empty string (removes message)
    expect(messageEdit(globalOwner.token, messageId.messageId, '')).toStrictEqual({});
    // cannot remove deleted message
    expect(messageRemove(globalOwner.token, messageId.messageId)).toStrictEqual(400);
  });

  test('Testing invalid token', () => {
    clear();
    const auth = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const channelId = channelsCreate(auth.token, 'icl channel', true);
    const message = messageSend(auth.token, channelId.channelId, 'nice');

    const invalidToken = auth.token + 'yoo';
    expect(messageRemove(invalidToken, message.messageId)).toStrictEqual(403);
    clear();
  });

  test('user not in dm', () => {
    clear();
    const auth1 = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const auth2 = authRegister('Ericchen@icloud.com', 'Ntu123456', 'Eric', 'Chen');

    const dm = dmCreate(auth1.token, []);
    const message = messageSendDm(auth1.token, dm.dmId, 'ntu band');
    expect(messageRemove(auth2.token, message.messageId)).toStrictEqual(400);
  });

  test('error 403: authorised user does not have owner perms in channel, msg not sent by them', () => {
    clear();
    const auth1 = authRegister('Tonyyeung0905@gmail.com', 'HKnumber1', 'Tony', 'Yeung');
    const auth2 = authRegister('Ericchen@icloud.com', 'Ntu123456', 'Eric', 'Chen');

    const channelId = channelsCreate(auth1.token, 'channel', true);
    channelJoin(auth2.token, channelId.channelId);
    const message = messageSend(auth1.token, channelId.channelId, 'ntu band');
    expect(messageRemove(auth2.token, message.messageId)).toStrictEqual(403);
  });
});

// Testing for message/share/v1 failed cases
describe('/message/share/v1 failes', () => {
  test('both channelid and dmid are invalid', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    expect(messageShare('lololtoken', messageId.messageId, '', -1, -1)).toStrictEqual(403);
    expect(messageShare(auth.token, messageId.messageId, '', -1, -1)).toStrictEqual(400);
  });

  test('neither channelId nor dmId are -1', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    expect(messageShare(auth.token, messageId.messageId, '', 0, 0)).toStrictEqual(400);
    expect(messageShare(auth.token, -1000, '', channelId.channelId, -1)).toStrictEqual(400);
  });

  test('user cannot share FROM/TO unjoined channel/dm', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const member = authRegister('Nina10803@icloud.com', 'Nina011803', 'Ni111na', '11Yeh');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const channel2 = channelsCreate(member.token, 'Dog11 Channel', true);
    const dmId = dmCreate(auth.token, []);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    const dmMsgId = messageSendDm(auth.token, dmId.dmId, 'helloo');
    // member not in ogmessage channel
    expect(messageShare(member.token, messageId.messageId, '', channel2.channelId, -1)).toStrictEqual(400);
    // member not in sharing message dm
    expect(messageShare(member.token, messageId.messageId, '', -1, dmId.dmId)).toStrictEqual(403);
    // member not in sharing message channel
    expect(messageShare(member.token, dmMsgId.messageId, '', channelId.channelId, -1)).toStrictEqual(403);
    // member not in ogmessage dm
    expect(messageShare(member.token, dmMsgId.messageId, '', channel2.channelId, -1)).toStrictEqual(400);
  });

  test('message length > 1000', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');

    const invalidMessage = 'h';
    expect(messageShare(auth.token, messageId.messageId, invalidMessage.repeat(1001), channelId.channelId, -1)).toStrictEqual(400);
  });

  test('valid channel/dm but auth user not in channel/dm', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const member = authRegister('Nina10803@icloud.com', 'Nina011803', 'Ni111na', '11Yeh');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const channel2 = channelsCreate(member.token, 'Dog11 Channel', true);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    expect(messageShare(auth.token, messageId.messageId, 'substring message', channel2.channelId, -1)).toStrictEqual(403);
  });
});

// Testing for message/share/v1 non failure cases
describe('/message/share/v1 success', () => {
  test('Successful message share in same channel and different channel and to dm', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const channel2 = channelsCreate(auth.token, 'Dog11 Channel', true);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    const dmId = dmCreate(auth.token, []);
    expect(messageShare(auth.token, messageId.messageId, 'substring message', channelId.channelId, -1)).toStrictEqual({ sharedMessageId: expect.any(Number) });
    expect(messageShare(auth.token, messageId.messageId, 'substring message2', channel2.channelId, -1)).toStrictEqual({ sharedMessageId: expect.any(Number) });
    expect(messageShare(auth.token, messageId.messageId, 'substring message3', -1, dmId.dmId)).toStrictEqual({ sharedMessageId: expect.any(Number) });
  });

  test('Successful message share in same dm and different dm and to channel', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const dmId = dmCreate(auth.token, []);
    const dm2 = dmCreate(auth.token, []);
    const messageId = messageSendDm(auth.token, dmId.dmId, 'helloo');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    expect(messageShare(auth.token, messageId.messageId, 'substring message', -1, dmId.dmId)).toStrictEqual({ sharedMessageId: expect.any(Number) });
    expect(messageShare(auth.token, messageId.messageId, 'substring message2', -1, dm2.dmId)).toStrictEqual({ sharedMessageId: expect.any(Number) });
    expect(messageShare(auth.token, messageId.messageId, 'substring message3', channelId.channelId, -1)).toStrictEqual({ sharedMessageId: expect.any(Number) });
  });
});

// Testing for message/react/v1 and unreact failed cases
describe('failed cases', () => {
  test('message not in channel that includes user', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const dm = dmCreate(auth.token, []);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    const dmMessageId = messageSendDm(auth.token, dm.dmId, 'helloo');
    const nonmember = authRegister('Nina080113@icloud.com', 'Nina110803', 'Nin11a', 'Y11eh');
    expect(messageReact(nonmember.token, messageId.messageId, 1)).toStrictEqual(400);
    expect(messageReact(nonmember.token, dmMessageId.messageId, 1)).toStrictEqual(400);
  });

  test('token / react id invalid(not 1)', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    const dm = dmCreate(auth.token, []);
    const dmMessageId = messageSendDm(auth.token, dm.dmId, 'helloo');
    expect(messageReact(auth.token, messageId.messageId, 11)).toStrictEqual(400);
    expect(messageReact('fake token', messageId.messageId, 11)).toStrictEqual(403);
    expect(messageReact(auth.token, dmMessageId.messageId, 11)).toStrictEqual(400);
  });

  test('messageId invalid / auth user already reacted with react id', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const nonmember = authRegister('Nina0803sad@icloud.com', 'Nidsana0803', 'Nidsana', 'Ydsah');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    expect(messageUnreact(auth.token, messageId.messageId, 1)).toStrictEqual(400);
    expect(messageReact(auth.token, -1000, 1)).toStrictEqual(400);
    expect(messageReact(auth.token, messageId.messageId, 1)).toStrictEqual({});
    expect(messageUnreact(auth.token, messageId.messageId, 123)).toStrictEqual(400);
    expect(messageReact(auth.token, messageId.messageId, 1)).toStrictEqual(400);

    const dm = dmCreate(auth.token, []);
    const dmMessageId = messageSendDm(auth.token, dm.dmId, 'helloo');
    expect(messageUnreact(auth.token, dmMessageId.messageId, 1)).toStrictEqual(400);

    expect(messageReact(auth.token, dmMessageId.messageId, 1)).toStrictEqual({});
    expect(messageReact(auth.token, dmMessageId.messageId, 1)).toStrictEqual(400);

    expect(messageUnreact(nonmember.token, messageId.messageId, 1)).toStrictEqual(400);
    expect(messageUnreact(nonmember.token, dmMessageId.messageId, 1)).toStrictEqual(400);
  });
});

// Testing for message/react/v1 and unreact non failure cases
describe('success cases', () => {
  test('auth user and member react and unreact to same message in channel', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const member = authRegister('Nina080113@icloud.com', 'Nina110803', 'Nin11a', 'Y11eh');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    channelJoin(member.token, channelId.channelId);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    expect(messageReact(auth.token, messageId.messageId, 1)).toStrictEqual({});
    expect(messageReact(member.token, messageId.messageId, 1)).toStrictEqual({});
    expect(messageUnreact('fake token', messageId.messageId, 1)).toStrictEqual(403);
    expect(messageUnreact(auth.token, -190, 1)).toStrictEqual(400);
    expect(messageUnreact(auth.token, messageId.messageId, 1)).toStrictEqual({});
    expect(messageUnreact(member.token, messageId.messageId, 1)).toStrictEqual({});
    // add check to see if reaction exists
  });

  test('auth user and member react and unreact to same message in dm', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const member = authRegister('Nina080113@icloud.com', 'Nina110803', 'Nin11a', 'Y11eh');
    const dm = dmCreate(auth.token, [member.authUserId]);
    const dmMessageId = messageSendDm(auth.token, dm.dmId, 'helloo');
    expect(messageReact(auth.token, dmMessageId.messageId, 1)).toStrictEqual({});
    expect(messageUnreact(auth.token, dmMessageId.messageId, 1)).toStrictEqual({});
    expect(messageReact(member.token, dmMessageId.messageId, 1)).toStrictEqual({});
    expect(messageUnreact(member.token, dmMessageId.messageId, 1)).toStrictEqual({});
    // add check to see if reaction exists
  });
});

// Testing for message/pin/unpin/v1 failed cases
describe('/message/pin/unpin/v1 failes', () => {
  test('user not in messageid channel/dm', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const nonmember = authRegister('Nin11a0803@icloud.com', 'Nina080311', 'Nin1111', 'Yeherd');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    const dm = dmCreate(auth.token, []);
    const dmMessageId = messageSendDm(auth.token, dm.dmId, 'helloo');
    expect(messagePin('fake', messageId.messageId)).toStrictEqual(403);
    expect(messageUnpin('fake', messageId.messageId)).toStrictEqual(403);
    expect(messagePin(nonmember.token, messageId.messageId)).toStrictEqual(400);
    expect(messageUnpin(nonmember.token, messageId.messageId)).toStrictEqual(400);
    expect(messagePin(nonmember.token, dmMessageId.messageId)).toStrictEqual(400);
    expect(messageUnpin(nonmember.token, dmMessageId.messageId)).toStrictEqual(400);
  });

  test('messageid already pinned/unpinned', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    const dm = dmCreate(auth.token, []);
    const dmMessageId = messageSendDm(auth.token, dm.dmId, 'helloo');
    expect(messagePin(auth.token, -199)).toStrictEqual(400);
    expect(messageUnpin(auth.token, -123)).toStrictEqual(400);
    expect(messagePin(auth.token, messageId.messageId)).toStrictEqual({});
    expect(messagePin(auth.token, messageId.messageId)).toStrictEqual(400);
    expect(messageUnpin(auth.token, messageId.messageId)).toStrictEqual({});
    expect(messageUnpin(auth.token, messageId.messageId)).toStrictEqual(400);
    expect(messagePin(auth.token, dmMessageId.messageId)).toStrictEqual({});
    expect(messagePin(auth.token, dmMessageId.messageId)).toStrictEqual(400);
    expect(messageUnpin(auth.token, dmMessageId.messageId)).toStrictEqual({});
    expect(messageUnpin(auth.token, dmMessageId.messageId)).toStrictEqual(400);
  });

  test('authuser doesnt have owner perms in channel/dm', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const member = authRegister('Nin11a0803@icloud.com', 'Nina080311', 'Nin1111', 'Yeherd');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    channelJoin(member.token, channelId.channelId);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    const dm = dmCreate(auth.token, [member.authUserId]);
    const dmMessageId = messageSendDm(auth.token, dm.dmId, 'helloo');
    expect(messagePin(member.token, messageId.messageId)).toStrictEqual(403);
    expect(messageUnpin(member.token, messageId.messageId)).toStrictEqual(403);
    expect(messagePin(member.token, dmMessageId.messageId)).toStrictEqual(403);
    expect(messageUnpin(member.token, dmMessageId.messageId)).toStrictEqual(403);
  });
});

// Testing for message/pin/unpin/v1 non failure cases
describe('/message/pin/unpin/v1 success', () => {
  test('Successful message pin/unpin in channel and in dm', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const member = authRegister('Nin11a0803@icloud.com', 'Nina080311', 'Nin1111', 'Yeherd');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    channelJoin(member.token, channelId.channelId);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    const dm = dmCreate(auth.token, [member.authUserId]);
    const dmMessageId = messageSendDm(auth.token, dm.dmId, 'helloo');
    expect(messagePin(auth.token, messageId.messageId)).toStrictEqual({});
    expect(messageUnpin(auth.token, messageId.messageId)).toStrictEqual({});
    expect(messagePin(auth.token, dmMessageId.messageId)).toStrictEqual({});
    expect(messageUnpin(auth.token, dmMessageId.messageId)).toStrictEqual({});
  });

  test('Successful message pin/unpin by global owner in channel (failed in dm)', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const member = authRegister('Nin11a0803@icloud.com', 'Nina080311', 'Nin1111', 'Yeherd');
    const channelId = channelsCreate(member.token, 'Dog Channel', true);
    channelJoin(auth.token, channelId.channelId);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    const dm = dmCreate(member.token, [auth.authUserId]);
    const dmMessageId = messageSendDm(auth.token, dm.dmId, 'helloo');
    expect(messagePin(auth.token, messageId.messageId)).toStrictEqual({});
    expect(messageUnpin(auth.token, messageId.messageId)).toStrictEqual({});
    expect(messagePin(auth.token, dmMessageId.messageId)).toStrictEqual(403);
    expect(messageUnpin(auth.token, dmMessageId.messageId)).toStrictEqual(403);
  });

  test('Successful message pin/unpin by different person in channel', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const member = authRegister('Nin11a0803@icloud.com', 'Nina080311', 'Nin1111', 'Yeherd');
    const channelId = channelsCreate(member.token, 'Dog Channel', true);
    channelJoin(auth.token, channelId.channelId);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    expect(messagePin(auth.token, messageId.messageId)).toStrictEqual({});
    expect(messageUnpin(member.token, messageId.messageId)).toStrictEqual({});
    clear();
  });
});

// Testing for message/sendlater failed cases
describe('/message/sendlater fails', () => {
  test('invalid channel/dm', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const member = authRegister('Nin11a0803@icloud.com', 'Nina080311', 'Nin1111', 'Yeherd');
    const dm = dmCreate(member.token, [auth.authUserId]);
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    expect(messageSendlaterdm('fake', channelId.channelId, 'hiiiiii', requestTime() + 1)).toStrictEqual(403);
    expect(messageSendlater('fake', channelId.channelId, 'hiiiiii', requestTime() + 1)).toStrictEqual(403);
    expect(messageSendlater(auth.token, channelId.channelId - 10, 'hiiiiii', requestTime() + 1)).toStrictEqual(400);
    expect(messageSendlaterdm(auth.token, dm.dmId - 10, 'hiiiiii', requestTime() + 1)).toStrictEqual(400);
  });

  test('user not in channel/dm', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const member = authRegister('Nin11a0803@icloud.com', 'Nina080311', 'Nin1111', 'Yeherd');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const dm = dmCreate(member.token, []);
    expect(messageSendlater(member.token, channelId.channelId, 'hiiiiii', requestTime() + 1)).toStrictEqual(403);
    expect(messageSendlaterdm(auth.token, dm.dmId, 'hiiiiii', requestTime() + 1)).toStrictEqual(403);
  });

  test('invalid message length', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const member = authRegister('Nin11a0803@icloud.com', 'Nina080311', 'Nin1111', 'Yeherd');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const dm = dmCreate(member.token, []);
    let invalidMessage = '';
    expect(messageSendlater(auth.token, channelId.channelId, invalidMessage, requestTime() + 1)).toStrictEqual(400);
    expect(messageSendlaterdm(member.token, dm.dmId, invalidMessage, requestTime() + 1)).toStrictEqual(400);

    invalidMessage = 'h';
    expect(messageSendlater(auth.token, channelId.channelId, invalidMessage.repeat(1001), requestTime() + 1)).toStrictEqual(400);
    expect(messageSendlaterdm(member.token, dm.dmId, invalidMessage.repeat(1001), requestTime() + 1)).toStrictEqual(400);
  });

  test('invalid time(time passed)', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const member = authRegister('Nin11a0803@icloud.com', 'Nina080311', 'Nin1111', 'Yeherd');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const dm = dmCreate(member.token, []);
    expect(messageSendlater(auth.token, channelId.channelId, 'invalidMessage', requestTime() - 5)).toStrictEqual(400);
    expect(messageSendlaterdm(member.token, dm.dmId, 'invalidMessage', requestTime() - 5)).toStrictEqual(400);
  });
});

// Testing for message/sendlater non failure cases
describe('/message/sendlater success', () => {
  test('Successful message sendlater in channel and in dm (dosent exist after call, appears after timeout)', () => {
    clear();
    const auth = authRegister('Nina0803@icloud.com', 'Nina0803', 'Nina', 'Yeh');
    const member = authRegister('Nin11a0803@icloud.com', 'Nina080311', 'Nin1111', 'Yeherd');
    const channelId = channelsCreate(auth.token, 'Dog Channel', true);
    const messageId = messageSend(auth.token, channelId.channelId, 'helloo');
    const dm = dmCreate(member.token, []);
    messageSendDm(member.token, dm.dmId, 'helloo');

    const timeSend = requestTime() + 1;
    const msgChannel = messageSendlater(auth.token, channelId.channelId, 'invalidMessage', timeSend);
    const msgDm = messageSendlaterdm(member.token, dm.dmId, 'invalidMessage', timeSend + 1);
    expect(msgChannel).toStrictEqual({ messageId: expect.any(Number) });
    expect(msgDm).toStrictEqual({ messageId: expect.any(Number) });
    expect(channelMessages(auth.token, channelId.channelId, 0)).toStrictEqual({
      messages: [
        {
          messageId: messageId.messageId,
          uId: auth.authUserId,
          message: 'helloo',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        }
      ],
      start: 0,
      end: -1,
    });
    while (timeSend >= requestTime()) {
      continue;
    }
    expect(channelMessages(auth.token, channelId.channelId, 0)).toStrictEqual({
      messages: [
        {
          messageId: msgChannel.messageId,
          uId: auth.authUserId,
          message: 'invalidMessage',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        },
        {
          messageId: messageId.messageId,
          uId: auth.authUserId,
          message: 'helloo',
          timeSent: expect.any(Number),
          reacts: [],
          isPinned: false,
        }
      ],
      start: 0,
      end: -1,
    });
  });
  clear();
});
