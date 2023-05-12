import {
  authRegister, authLogout, channelsCreate, channelDetails,
  channelJoin, channelInvite, clear,
  channelMessages, channelLeave, channelAddOwner,
  channelRemoveOwner, messageSend, standupStart
} from './testhelpers';
const requestTime = () => Math.floor((new Date()).getTime() / 1000);

clear();

describe('Testing that channelDetailsV2 works standard', () => {
  test('when given id, returns relevant info of channels if the user is apart of it', () => {
    clear();
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelIdPublic = channelsCreate(channelOwnerId.token, 'Boost', true);

    expect(channelDetails(channelOwnerId.token, channelIdPublic.channelId)).toEqual(
      {
        name: 'Boost',
        isPublic: true,
        ownerMembers: [
          {
            uId: channelOwnerId.authUserId,
            email: 'chocolate@bar.com',
            nameFirst: 'Willy',
            nameLast: 'Wonka',
            handleStr: expect.any(String),
          },
        ],
        allMembers: [
          {
            uId: channelOwnerId.authUserId,
            email: 'chocolate@bar.com',
            nameFirst: 'Willy',
            nameLast: 'Wonka',
            handleStr: expect.any(String),
          },
        ],
      }
    );
  });

  test('works with priv channel and member even if there are multiple channels', () => {
    clear();
    const channelOwnerPrivId = authRegister('pollos@hhm.com', 'g00dpassword54', 'Gus', 'Fring');
    const channelIdPriv = channelsCreate(channelOwnerPrivId.token, 'Priv', false);

    expect(channelDetails(channelOwnerPrivId.token, channelIdPriv.channelId)).toEqual(
      {
        name: 'Priv',
        isPublic: false,
        ownerMembers: [
          {
            uId: channelOwnerPrivId.authUserId,
            email: 'pollos@hhm.com',
            nameFirst: 'Gus',
            nameLast: 'Fring',
            handleStr: expect.any(String),
          }
        ],
        allMembers: [
          {
            uId: channelOwnerPrivId.authUserId,
            email: 'pollos@hhm.com',
            nameFirst: 'Gus',
            nameLast: 'Fring',
            handleStr: expect.any(String),
          }
        ],
      }
    );
  });
});

describe('Testing channelDetailsV2 edge cases', () => {
  test('Testing when channelId does not refer to a valid channel', () => {
    clear();
    const channelOwnerPrivId = authRegister('pollos@hhm.com', 'g00dpassword54', 'Gus', 'Fring');
    const channelIdPriv = channelsCreate(channelOwnerPrivId.token, 'Priv', false);
    const fakeChannelId = channelIdPriv.channelId - 1;

    expect(channelDetails(channelOwnerPrivId.token, fakeChannelId)).toEqual(400);
  });

  test('Testing invalid token', () => {
    clear();
    const channelOwnerPrivId = authRegister('pollos@hhm.com', 'g00dpassword54', 'Gus', 'Fring');
    const channelIdPriv = channelsCreate(channelOwnerPrivId.token, 'Priv', false);

    const fakeToken = channelOwnerPrivId.token + 'hi';

    expect(channelDetails(fakeToken, channelIdPriv.channelId)).toEqual(403);
  });

  test('Testing when Id is valid but user is not a member of the channel', () => {
    clear();
    const tempUserId = authRegister('heisenberg@hhm.com', 'AnotherPasword1', 'Walter', 'White');
    const channelOwnerPublicId = authRegister('pollos@hhm.com', 'g00dpassword54', 'Gus', 'Fring');
    const channelIdPublic = channelsCreate(channelOwnerPublicId.token, 'Public', true);

    expect(channelDetails(tempUserId.token, channelIdPublic.channelId)).toEqual(403);
  });
});

// channelJoin
describe('Testing channelJoinV2', () => {
  test('Normal joining procedures for public channel, and displaying via channelDetails', () => {
    clear();
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelIdPublic = channelsCreate(channelOwnerId.token, 'Boost', true);

    const memberId = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');
    expect(channelJoin(memberId.token, channelIdPublic.channelId)).toStrictEqual({});
    expect(channelDetails(channelOwnerId.token, channelIdPublic.channelId)).toStrictEqual({
      name: 'Boost',
      isPublic: true,
      ownerMembers: [
        {
          uId: channelOwnerId.authUserId,
          email: 'chocolate@bar.com',
          nameFirst: 'Willy',
          nameLast: 'Wonka',
          handleStr: expect.any(String),
        }
      ],
      allMembers: [
        {
          uId: channelOwnerId.authUserId,
          email: 'chocolate@bar.com',
          nameFirst: 'Willy',
          nameLast: 'Wonka',
          handleStr: expect.any(String),
        },
        {
          uId: memberId.authUserId,
          email: 'chicken@bar.com',
          nameFirst: 'Ronald',
          nameLast: 'Mcdonald',
          handleStr: expect.any(String),
        }
      ],
    });
  });

  test('Global owner joining private channel', () => {
    clear();
    const globalOwnerId = authRegister('foo@bar.com', 'password', 'James', 'Charles');

    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelIdPrivate = channelsCreate(channelOwnerId.token, 'BoostPrivate', false);

    expect(channelJoin(globalOwnerId.token, channelIdPrivate.channelId)).toStrictEqual({});
    expect(channelDetails(channelOwnerId.token, channelIdPrivate.channelId)).toStrictEqual({
      name: 'BoostPrivate',
      isPublic: false,
      ownerMembers: [
        {
          uId: channelOwnerId.authUserId,
          email: 'chocolate@bar.com',
          nameFirst: 'Willy',
          nameLast: 'Wonka',
          handleStr: expect.any(String),
        }
      ],
      allMembers: [
        {
          uId: channelOwnerId.authUserId,
          email: 'chocolate@bar.com',
          nameFirst: 'Willy',
          nameLast: 'Wonka',
          handleStr: expect.any(String),
        },
        {
          uId: globalOwnerId.authUserId,
          email: 'foo@bar.com',
          nameFirst: 'James',
          nameLast: 'Charles',
          handleStr: expect.any(String),
        }
      ],
    });
  });
});

describe('Error checking channelJoinV2', () => {
  test('Testing invalid token & channelId', () => {
    clear();
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelId = channelsCreate(channelOwnerId.token, 'Boost', true);

    const memberId = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');
    const invalidMemberToken = memberId.token + channelOwnerId.token;

    const invalidChannelId = channelId.channelId + 1;
    expect(channelJoin(invalidMemberToken, channelId.channelId)).toStrictEqual(403); // invalid token
    expect(channelJoin(memberId.token, invalidChannelId)).toStrictEqual(400); // invalid channelId
  });

  test('Testing normal user cannot join private channel', () => {
    clear();
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelId = channelsCreate(channelOwnerId.token, 'BoostPrivate', false); // private channel

    const memberId = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');
    expect(channelJoin(memberId.token, channelId.channelId)).toStrictEqual(403); // can't join private channel
  });

  test('Testing cannot join if already in channel', () => {
    clear();
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelId = channelsCreate(channelOwnerId.token, 'BoostPrivate', false); // private channel

    expect(channelJoin(channelOwnerId.token, channelId.channelId)).toStrictEqual(400); // can't join channel
  });

  test('Testing user logged out cannot join channel', () => {
    clear();
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelId = channelsCreate(channelOwnerId.token, 'BoostPrivate', true); // public channel

    const memberId = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');
    authLogout(memberId.token);
    expect(channelJoin(memberId.token, channelId.channelId)).toStrictEqual(403); // can't join channel
  });
});

describe('Testing channelInviteV2', () => {
  test('Testing normal invitation procedures with public channel', () => {
    clear();
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelId = channelsCreate(channelOwnerId.token, 'Boost', true);

    const memberId = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald'); // normal user
    expect(channelInvite(channelOwnerId.token, channelId.channelId, memberId.authUserId)).toStrictEqual({});
    expect(channelDetails(channelOwnerId.token, channelId.channelId)).toStrictEqual({
      name: 'Boost',
      isPublic: true,
      ownerMembers: [
        {
          uId: channelOwnerId.authUserId,
          email: 'chocolate@bar.com',
          nameFirst: 'Willy',
          nameLast: 'Wonka',
          handleStr: expect.any(String),
        }
      ],
      allMembers: [
        {
          uId: channelOwnerId.authUserId,
          email: 'chocolate@bar.com',
          nameFirst: 'Willy',
          nameLast: 'Wonka',
          handleStr: expect.any(String),
        },
        {
          uId: memberId.authUserId,
          email: 'chicken@bar.com',
          nameFirst: 'Ronald',
          nameLast: 'Mcdonald',
          handleStr: expect.any(String),
        }
      ],
    });
  });
});

describe('Error checking channelInviteV2', () => {
  test('Testing invalid token, channelId, and uId, and duplicate invite', () => {
    clear();
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelId = channelsCreate(channelOwnerId.token, 'Boost', true);
    const memberId = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');

    let invalidMemberId = memberId.authUserId + 1;
    if (invalidMemberId === channelOwnerId.authUserId) {
      invalidMemberId++;
    }

    const invalidToken = memberId.token + channelOwnerId.token;

    const invalidChannelId = channelId.channelId + 1;

    expect(channelInvite(invalidToken, channelId.channelId, memberId.authUserId)).toStrictEqual(403);
    expect(channelInvite(channelOwnerId.token, invalidChannelId, memberId.authUserId)).toStrictEqual(400);
    expect(channelInvite(channelOwnerId.token, channelId.channelId, invalidMemberId)).toStrictEqual(400);

    channelInvite(channelOwnerId.token, channelId.channelId, memberId.authUserId); // channel owner invites normal user
    expect(channelInvite(channelOwnerId.token, channelId.channelId, memberId.authUserId)).toStrictEqual(400); // invites again
  });

  test('Non-member inviting a non-member, and inviting itself', () => {
    clear();
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelId = channelsCreate(channelOwnerId.token, 'Boost', true);

    const nonMember1 = authRegister('ethan@bar.com', 'okpassword', 'Ethan', 'Chew');
    const nonMember2 = authRegister('john@bar.com', 'decentpassword', 'John', 'Wick');
    expect(channelInvite(nonMember1.token, channelId.channelId, nonMember2.authUserId)).toStrictEqual(403);
    expect(channelInvite(nonMember1.token, channelId.channelId, nonMember1.authUserId)).toStrictEqual(403);
  });

  test('globalowner(nonmember) inviting non-member, and inviting itself', () => {
    clear();
    const globalowner = authRegister('ahahahahahahaha@bar.com', 'g00dsdadpassword', 'itsme', 'mario');
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelId = channelsCreate(channelOwnerId.token, 'Boost', true);

    const nonMember1 = authRegister('ethan@bar.com', 'okpassword', 'Ethan', 'Chew');
    expect(channelInvite(globalowner.token, channelId.channelId, nonMember1.authUserId)).toStrictEqual(403);
    expect(channelInvite(globalowner.token, channelId.channelId, globalowner.authUserId)).toStrictEqual(403);
  });
});

// channelMessages
describe('test block for channelMessagesV2', () => {
  test('invalid token', () => {
    clear();

    const personId = authRegister('ethanchew@mail.com', 'paswword123', 'ethan', 'chew');
    const channelId = channelsCreate(personId.token, 'achannel', true);

    expect(channelMessages(personId.token + 'hi', channelId.channelId, 0)).toStrictEqual(403);
  });

  test('invalid input(user not in channel)', () => {
    clear();

    const personId = authRegister('ethanchew@mail.com', 'paswword123', 'ethan', 'chew');
    const person2 = authRegister('donaldduck@mail.com', 'duck4life', 'donald', 'duck');
    const channelId = channelsCreate(personId.token, 'achannel', true);

    expect(channelMessages(person2.token, channelId.channelId, 0)).toStrictEqual(403);
  });

  test('testing for invalid channelId/input(start > amount)', () => {
    clear();

    const personId = authRegister('tony@mail.com', 'tonytony1', 'tony', 'yeung');
    const channelId = channelsCreate(personId.token, 'tonyschannel', true);

    expect(channelMessages(personId.token, -1000, 0)).toStrictEqual(400);
    expect(channelMessages(personId.token, channelId.channelId, 1)).toStrictEqual(400);
  });

  test('testing for invalid input(start < 0)', () => {
    clear();

    const personId = authRegister('tony@mail.com', 'tonytony1', 'tony', 'yeung');
    const channelId = channelsCreate(personId.token, 'tonyschannel', true);

    expect(channelMessages(personId.token, channelId.channelId, -10)).toStrictEqual(400);
  });

  test('testing for valid input(empty messages)', () => {
    clear();

    const personId = authRegister('tony@mail.com', 'tonytony1', 'tony', 'yeung');
    const channelId = channelsCreate(personId.token, 'tonyschannel', true);

    const res = channelMessages(personId.token, channelId.channelId, 0);
    expect(res.start).toBe(0);
    expect(channelMessages(personId.token, channelId.channelId, 0)).toStrictEqual({
      messages: [],
      start: 0,
      end: -1,
    });
  });

  test('testing for valid input > 50 msgs', () => {
    clear();

    const personId = authRegister('tony@mail.com', 'tonytony1', 'tony', 'yeung');
    const channelId = channelsCreate(personId.token, 'tonyschannel', true);

    for (let i = 0; i < 51; i++) {
      messageSend(personId.token, channelId.channelId, 'hi');
    }
    expect(channelMessages(personId.token, channelId.channelId, 0)).toStrictEqual({
      messages: expect.any(Array<string>),
      start: 0,
      end: 50,
    });
  });
});

// channelLeaveV1
describe('Testing channelLeaveV1 success', () => {
  test('Testing channel owner leaving channel, and channel remaining', () => {
    clear();
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const memberId = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');

    const channelId = channelsCreate(channelOwnerId.token, 'Boost', true);
    channelJoin(memberId.token, channelId.channelId);

    expect(channelLeave(channelOwnerId.token, channelId.channelId)).toStrictEqual({});

    // expect error since channelOwner no longer in channel
    expect(channelDetails(channelOwnerId.token, channelId.channelId)).toStrictEqual(403);
    // member calls channelDetails
    expect(channelDetails(memberId.token, channelId.channelId)).toStrictEqual({
      name: 'Boost',
      isPublic: true,
      ownerMembers: [],
      allMembers: [
        {
          uId: memberId.authUserId,
          email: 'chicken@bar.com',
          nameFirst: 'Ronald',
          nameLast: 'Mcdonald',
          handleStr: expect.any(String),
        }
      ],
    });
  });
});

describe('Error checking channelLeaveV1', () => {
  test('Invalid channelId, token(non-existent), and not a member', () => {
    clear();
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelId = channelsCreate(channelOwnerId.token, 'Boost', true);

    const nonMember = authRegister('john@bar.com', 'decentpassword', 'John', 'Wick');

    const invalidChannelId = channelId.channelId + 1;
    const invalidToken = channelOwnerId.token + nonMember.token;

    expect(channelLeave(channelOwnerId.token, invalidChannelId)).toStrictEqual(400); // invalid channel
    expect(channelLeave(invalidToken, channelId.channelId)).toStrictEqual(403); // invalid token
    expect(channelLeave(nonMember.token, channelId.channelId)).toStrictEqual(403); // nonMember
  });
  test('Authorised user is starter of active standup in channel', () => {
    clear();
    const channelOwnerId = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channelId = channelsCreate(channelOwnerId.token, 'Boost', true);
    const time = standupStart(channelOwnerId.token, channelId.channelId, 1);
    expect(channelLeave(channelOwnerId.token, channelId.channelId)).toStrictEqual(400);
    while (time.timeFinish >= requestTime()) {
      continue;
    }
    expect(channelLeave(channelOwnerId.token, channelId.channelId)).toStrictEqual({});
  });
});

// channelAddOwnerV1
describe('Testing channelAddOwnerV1 success', () => {
  test('Channel Owner successfuly make member an owner of a channel', () => {
    clear();
    const channelOwner = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const member = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');

    const channel = channelsCreate(channelOwner.token, 'Boost', true);
    channelJoin(member.token, channel.channelId);

    expect(channelAddOwner(channelOwner.token, channel.channelId, member.authUserId)).toStrictEqual({});
    expect(channelDetails(channelOwner.token, channel.channelId)).toStrictEqual({
      name: 'Boost',
      isPublic: true,
      ownerMembers: [
        {
          uId: channelOwner.authUserId,
          email: 'chocolate@bar.com',
          nameFirst: 'Willy',
          nameLast: 'Wonka',
          handleStr: expect.any(String),
        },
        {
          uId: member.authUserId,
          email: 'chicken@bar.com',
          nameFirst: 'Ronald',
          nameLast: 'Mcdonald',
          handleStr: expect.any(String),
        }
      ],
      allMembers: [
        {
          uId: channelOwner.authUserId,
          email: 'chocolate@bar.com',
          nameFirst: 'Willy',
          nameLast: 'Wonka',
          handleStr: expect.any(String),
        },
        {
          uId: member.authUserId,
          email: 'chicken@bar.com',
          nameFirst: 'Ronald',
          nameLast: 'Mcdonald',
          handleStr: expect.any(String),
        }
      ],
    });
  });

  test('Global Owner (regular member with channel perms) successfuly make member an owner of a channel', () => {
    clear();
    const globalOwner = authRegister('ahahahahahahaha@bar.com', 'g00dsdadpassword', 'itsme', 'mario');
    const channelOwner = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const member = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');

    const channel = channelsCreate(channelOwner.token, 'Boost', true);
    channelJoin(member.token, channel.channelId);
    channelJoin(globalOwner.token, channel.channelId);

    expect(channelAddOwner(globalOwner.token, channel.channelId, member.authUserId)).toStrictEqual({});
    expect(channelDetails(channelOwner.token, channel.channelId)).toStrictEqual({
      name: 'Boost',
      isPublic: true,
      ownerMembers: [
        {
          uId: channelOwner.authUserId,
          email: 'chocolate@bar.com',
          nameFirst: 'Willy',
          nameLast: 'Wonka',
          handleStr: expect.any(String),
        },
        {
          uId: member.authUserId,
          email: 'chicken@bar.com',
          nameFirst: 'Ronald',
          nameLast: 'Mcdonald',
          handleStr: expect.any(String),
        },

      ],
      allMembers: [
        {
          uId: channelOwner.authUserId,
          email: 'chocolate@bar.com',
          nameFirst: 'Willy',
          nameLast: 'Wonka',
          handleStr: expect.any(String),
        },
        {
          uId: member.authUserId,
          email: 'chicken@bar.com',
          nameFirst: 'Ronald',
          nameLast: 'Mcdonald',
          handleStr: expect.any(String),
        },
        {
          uId: globalOwner.authUserId,
          email: 'ahahahahahahaha@bar.com',
          nameFirst: 'itsme',
          nameLast: 'mario',
          handleStr: expect.any(String),
        }
      ],
    });
  });
});

describe('Error checking channelAddOwnerV1', () => {
  test('Invalid channelId, token, and uId', () => {
    clear();
    const channelOwner = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channel = channelsCreate(channelOwner.token, 'Boost', true);

    const member = authRegister('john@bar.com', 'decentpassword', 'John', 'Wick');
    channelJoin(member.token, channel.channelId);

    const invalidChannel = channel.channelId + 1;
    const invalidToken = channelOwner.token + member.token;

    let invalidUser = channelOwner.authUserId + 3;
    if (invalidUser === member.authUserId) {
      invalidUser += 2;
    }
    // invalid channel
    expect(channelAddOwner(channelOwner.token, invalidChannel, member.authUserId)).toStrictEqual(400);
    // invalid token
    expect(channelAddOwner(invalidToken, channel.channelId, member.authUserId)).toStrictEqual(403);
    // invalid uId
    expect(channelAddOwner(channelOwner.token, channel.channelId, invalidUser)).toStrictEqual(400);
  });

  test('uId not a member, uId already an owner, authorised user no perms', () => {
    clear();
    const channelOwner = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channel = channelsCreate(channelOwner.token, 'Boost', true);

    const user = authRegister('john@bar.com', 'decentpassword', 'John', 'Wick');
    // not a member of channel
    expect(channelAddOwner(channelOwner.token, channel.channelId, user.authUserId)).toStrictEqual(400);
    // already an owner
    expect(channelAddOwner(channelOwner.token, channel.channelId, channelOwner.authUserId)).toStrictEqual(400);

    channelJoin(user.token, channel.channelId);

    const anotherUser = authRegister('joanna@bar.com', 'johnwickssister', 'Joanna', 'Wick');
    channelJoin(anotherUser.token, channel.channelId);
    // no channel perms
    expect(channelAddOwner(user.token, channel.channelId, anotherUser.authUserId)).toStrictEqual(403);
  });

  test('globalowner while not a member of channel cannot add owner of member in public nor private channel', () => {
    clear();
    const globalOwner = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');

    const user = authRegister('john@bar.com', 'decentpassword', 'John', 'Wick');
    const user2 = authRegister('john1@bar.com', 'decentp2assword', 'John2', 'Wick2');
    const channel = channelsCreate(user.token, 'Boost', true);
    const channel2 = channelsCreate(user.token, 'Boost/priv', false);
    // global owner non member can't add to public channel
    expect(channelAddOwner(globalOwner.token, channel.channelId, user2.authUserId)).toStrictEqual(400);
    // global owner non member can't add to priv channel
    expect(channelAddOwner(globalOwner.token, channel2.channelId, user2.authUserId)).toStrictEqual(400);
  });

  test('member tries to add channelOwner', () => {
    clear();
    const channelOwner = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channel = channelsCreate(channelOwner.token, 'Boost', true);

    const member = authRegister('john1@bar.com', 'decentp2assword', 'John2', 'Wick2');
    channelJoin(member.token, channel.channelId);

    expect(channelAddOwner(member.token, channel.channelId, channelOwner.authUserId)).toStrictEqual(400);
  });
});

// channelRemoveOwnerV1
describe('Testing channelRemoveOwnerV1 success', () => {
  test('Channel Owner successfuly remove an owner of a channel', () => {
    clear();
    const channelOwner = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const member = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');

    const channel = channelsCreate(channelOwner.token, 'Boost', true);
    channelJoin(member.token, channel.channelId);
    channelAddOwner(channelOwner.token, channel.channelId, member.authUserId);
    expect(channelRemoveOwner(channelOwner.token, channel.channelId, member.authUserId)).toStrictEqual({});
    expect(channelDetails(channelOwner.token, channel.channelId)).toStrictEqual({
      name: 'Boost',
      isPublic: true,
      ownerMembers: [
        {
          uId: channelOwner.authUserId,
          email: 'chocolate@bar.com',
          nameFirst: 'Willy',
          nameLast: 'Wonka',
          handleStr: expect.any(String),
        }
      ],
      allMembers: [
        {
          uId: channelOwner.authUserId,
          email: 'chocolate@bar.com',
          nameFirst: 'Willy',
          nameLast: 'Wonka',
          handleStr: expect.any(String),
        },
        {
          uId: member.authUserId,
          email: 'chicken@bar.com',
          nameFirst: 'Ronald',
          nameLast: 'Mcdonald',
          handleStr: expect.any(String),
        }
      ],
    });
  });

  test('Global Owner (not a channel owner) successfully remove channelOwner', () => {
    clear();
    const globalOwner = authRegister('ahahahahahahaha@bar.com', 'g00dsdadpassword', 'itsme', 'mario');
    const channelOwner = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const member = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');

    const channel = channelsCreate(channelOwner.token, 'Boost', true);
    channelJoin(member.token, channel.channelId);
    channelJoin(globalOwner.token, channel.channelId);

    channelAddOwner(channelOwner.token, channel.channelId, member.authUserId);

    // globalOwner remove original channelOwner
    expect(channelRemoveOwner(globalOwner.token, channel.channelId, channelOwner.authUserId)).toStrictEqual({});
    expect(channelDetails(channelOwner.token, channel.channelId)).toStrictEqual({
      name: 'Boost',
      isPublic: true,
      ownerMembers: [
        {
          uId: member.authUserId,
          email: 'chicken@bar.com',
          nameFirst: 'Ronald',
          nameLast: 'Mcdonald',
          handleStr: expect.any(String),
        }
      ],
      allMembers: [
        {
          uId: channelOwner.authUserId,
          email: 'chocolate@bar.com',
          nameFirst: 'Willy',
          nameLast: 'Wonka',
          handleStr: expect.any(String),
        },
        {
          uId: member.authUserId,
          email: 'chicken@bar.com',
          nameFirst: 'Ronald',
          nameLast: 'Mcdonald',
          handleStr: expect.any(String),
        },
        {
          uId: globalOwner.authUserId,
          email: 'ahahahahahahaha@bar.com',
          nameFirst: 'itsme',
          nameLast: 'mario',
          handleStr: expect.any(String),
        }
      ],
    });
  });
});

describe('Error checking channelRemoveOwnerV1', () => {
  test('Invalid channelId, token, and uId', () => {
    clear();
    const channelOwner = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channel = channelsCreate(channelOwner.token, 'Boost', true);

    const member = authRegister('john@bar.com', 'decentpassword', 'John', 'Wick');
    channelJoin(member.token, channel.channelId);
    channelAddOwner(channelOwner.token, channel.channelId, member.authUserId);

    const invalidChannel = channel.channelId + 1;
    const invalidToken = channelOwner.token + member.token;

    let invalidUser = channelOwner.authUserId + 3;
    if (invalidUser === member.authUserId) {
      invalidUser += 2;
    }
    // invalid channel
    expect(channelRemoveOwner(channelOwner.token, invalidChannel, member.authUserId)).toStrictEqual(400);
    // invalid token
    expect(channelRemoveOwner(invalidToken, channel.channelId, member.authUserId)).toStrictEqual(403);
    // invalid uId
    expect(channelRemoveOwner(channelOwner.token, channel.channelId, invalidUser)).toStrictEqual(400);
  });

  test('uId not an owner, uId only owner, authorised user no perms', () => {
    clear();
    const channelOwner = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const channel = channelsCreate(channelOwner.token, 'Boost', true);

    const member = authRegister('john@bar.com', 'decentpassword', 'John', 'Wick');
    channelJoin(member.token, channel.channelId);

    // not an owner
    expect(channelRemoveOwner(channelOwner.token, channel.channelId, member.authUserId)).toStrictEqual(400);
    // uId only owner
    expect(channelRemoveOwner(channelOwner.token, channel.channelId, channelOwner.authUserId)).toStrictEqual(400);

    // no perms
    const anotherMember = authRegister('joanna@bar.com', 'johnwickssister', 'Joanna', 'Wick');
    channelJoin(anotherMember.token, channel.channelId);
    channelAddOwner(channelOwner.token, channel.channelId, member.authUserId);
    expect(channelRemoveOwner(anotherMember.token, channel.channelId, member.authUserId)).toStrictEqual(403);
  });

  test('globalowner non member cannot remove owner', () => {
    clear();
    const globalOwner = authRegister('ahahahahahahaha@bar.com', 'g00dsdadpassword', 'itsme', 'mario');
    const channelOwner = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');
    const member = authRegister('chicken@bar.com', 'goodpassword', 'Ronald', 'Mcdonald');

    const channel = channelsCreate(channelOwner.token, 'Boost', true);
    channelJoin(member.token, channel.channelId);
    channelAddOwner(channelOwner.token, channel.channelId, member.authUserId);

    expect(channelRemoveOwner(globalOwner.token, channel.channelId, channelOwner.authUserId)).toStrictEqual(403);
  });

  test('globalowner cannot remove final owner', () => {
    clear();
    const globalOwner = authRegister('ahahahahahahaha@bar.com', 'g00dsdadpassword', 'itsme', 'mario');
    const channelOwner = authRegister('chocolate@bar.com', 'g00dpassword', 'Willy', 'Wonka');

    const channel = channelsCreate(channelOwner.token, 'Boost', true);
    channelJoin(globalOwner.token, channel.channelId);

    expect(channelRemoveOwner(globalOwner.token, channel.channelId, channelOwner.authUserId)).toStrictEqual(400);
    clear();
  });
});
