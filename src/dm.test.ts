import {
  authRegister, dmCreate, clear, dmList, dmRemove,
  dmDetails, dmLeave, dmMessages,
} from './testhelpers';

clear();
// Tests for dm/create/v1
describe('Testing dm/create/v1 standard', () => {
  test('Testing function success', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');

    expect(dmCreate(sender.token, [recipient.authUserId])).toStrictEqual({ dmId: expect.any(Number) });
  });
  test('Create dm with multiple users', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient1 = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const recipient2 = authRegister('badman@hhm.com', 'thirdpassword', 'Tyrone', 'Gilliland');
    const recipient3 = authRegister('jumpman@hhm.com', 'fourthpassword', 'Hello', 'Fresh');

    expect(dmCreate(sender.token, [recipient1.authUserId, recipient2.authUserId, recipient3.authUserId]))
      .toStrictEqual({ dmId: expect.any(Number) });
  });
});

describe('Testing errors for dm/create/v1', () => {
  test('uId in uIds array does not refer to valid user', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    let fakeuser = recipient.authUserId + 1;
    if (fakeuser === sender.authUserId) {
      fakeuser++;
    }

    expect(dmCreate(sender.token, [recipient.authUserId, fakeuser])).toStrictEqual(400);
  });
  test('All uIds invalid', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    let fakeuser1 = recipient.authUserId + 1;
    if (fakeuser1 === sender.authUserId) {
      fakeuser1++;
    }
    let fakeuser2 = fakeuser1 + 1;
    if (fakeuser2 === sender.authUserId) {
      fakeuser2++;
    }
    expect(dmCreate(sender.token, [fakeuser1, fakeuser2])).toStrictEqual(400);
  });

  test('Duplicate uId in uIds array', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');

    expect(dmCreate(sender.token, [recipient.authUserId, recipient.authUserId])).toStrictEqual(400);
  });

  test('Invalid token', () => {
    clear();
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const fakeToken = recipient.token + 'sdjf';

    expect(dmCreate(fakeToken, [recipient.authUserId])).toStrictEqual(403);
  });
});

// Tests for dm/list/v1
describe('Testing dm/list/v1 standard', () => {
  test('Testing in one dm', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const recipient2 = authRegister('heisenberg@hhm.com', 'bluecrystal', 'Walter', 'White');
    const dm = dmCreate(sender.token, [recipient.authUserId, recipient2.authUserId]);

    expect(dmList(sender.token)).toStrictEqual({
      dms: [{ dmId: dm.dmId, name: expect.any(String) }]
    });
  });
  test('Testing in multiple dms', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const recipient2 = authRegister('heisenberg@hhm.com', 'bluecrystal', 'Walter', 'White');
    const dm = dmCreate(sender.token, [recipient.authUserId]);
    const dm2 = dmCreate(sender.token, [recipient2.authUserId]);

    expect(dmList(sender.token)).toStrictEqual({
      dms: [
        {
          dmId: dm.dmId,
          name: expect.any(String),
        },
        {
          dmId: dm2.dmId,
          name: expect.any(String),
        }
      ]
    });
  });
  test('Testing in 0 dms', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    expect(dmList(sender.token)).toStrictEqual({ dms: [] });
  });
});

describe('Testing dm/list/v1 errors', () => {
  test('Invalid token', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    let fakeToken = sender.token + 'sdf';
    if (fakeToken === recipient.token) {
      fakeToken = fakeToken + 'sdfsd';
    }

    expect(dmList(fakeToken)).toStrictEqual(403);
  });
  test('Test after leaving dm', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const dm = dmCreate(sender.token, [recipient.authUserId]);
    dmLeave(recipient.token, dm.dmId); // recipient leaves only dm
    expect(dmList(recipient.token)).toStrictEqual({ dms: [] }); // recipient has no dms
  });
});

// Tests for dm/details/v1
describe('Testing dm/details/v1 standard', () => {
  test('Testing that function works', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const recipient2 = authRegister('heisenberg@hhm.com', 'bluecrystal', 'Walter', 'White');
    const dm = dmCreate(sender.token, [recipient.authUserId, recipient2.authUserId]);

    expect(dmDetails(sender.token, dm.dmId)).toStrictEqual({
      name: expect.any(String),
      members: [
        {
          uId: sender.authUserId,
          email: 'pollos@hhm.com',
          nameFirst: 'Gus',
          nameLast: 'Fring',
          handleStr: expect.any(String),
        },
        {
          uId: recipient.authUserId,
          email: 'goodman@hhm.com',
          nameFirst: 'Jimmy',
          nameLast: 'McGill',
          handleStr: expect.any(String),
        },
        {
          uId: recipient2.authUserId,
          email: 'heisenberg@hhm.com',
          nameFirst: 'Walter',
          nameLast: 'White',
          handleStr: expect.any(String),
        },
      ],
    });
  });
});

// Tests for dm/details/v1
describe('Testing dm/details/v1 errors', () => {
  test('Invalid dmId', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const dm = dmCreate(sender.token, [recipient.authUserId]);

    expect(dmDetails(sender.token, dm.dmId + 1)).toStrictEqual(400);
  });

  test('User is not a member of dm', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const notMember = authRegister('heisenberg@hhm.com', 'bluecrystal', 'Walter', 'White');
    const dm = dmCreate(sender.token, [recipient.authUserId]);

    expect(dmDetails(notMember.token, dm.dmId)).toStrictEqual(403);
  });

  test('Invalid token', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const dm = dmCreate(sender.token, [recipient.authUserId]);
    let fakeToken = sender.token + 'sdf';
    if (fakeToken === recipient.token) {
      fakeToken = fakeToken + 'sdfsd';
    }

    expect(dmDetails(fakeToken, dm.dmId)).toStrictEqual(403);
  });
});

// Tests for dm/leave/v1
describe('Testing dm/leave/v1 standard', () => {
  test('Testing when recipient leaves', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const recipient2 = authRegister('heisenberg@hhm.com', 'bluecrystal', 'Walter', 'White');
    const dm = dmCreate(sender.token, [recipient.authUserId, recipient2.authUserId]);

    expect(dmLeave(recipient.token, dm.dmId)).toStrictEqual({});
    expect(dmDetails(recipient2.token, dm.dmId)).toStrictEqual({
      name: expect.any(String),
      members: [
        {
          uId: sender.authUserId,
          email: 'pollos@hhm.com',
          nameFirst: 'Gus',
          nameLast: 'Fring',
          handleStr: expect.any(String),
        },
        {
          uId: recipient2.authUserId,
          email: 'heisenberg@hhm.com',
          nameFirst: 'Walter',
          nameLast: 'White',
          handleStr: expect.any(String),
        },
      ],
    });
  });

  test('Testing when sender leaves', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const recipient2 = authRegister('heisenberg@hhm.com', 'bluecrystal', 'Walter', 'White');
    const dm = dmCreate(sender.token, [recipient.authUserId, recipient2.authUserId]);

    expect(dmLeave(sender.token, dm.dmId)).toStrictEqual({});
    expect(dmDetails(recipient.token, dm.dmId)).toStrictEqual({
      name: expect.any(String),
      members: [
        {
          uId: recipient.authUserId,
          email: 'goodman@hhm.com',
          nameFirst: 'Jimmy',
          nameLast: 'McGill',
          handleStr: expect.any(String),
        },
        {
          uId: recipient2.authUserId,
          email: 'heisenberg@hhm.com',
          nameFirst: 'Walter',
          nameLast: 'White',
          handleStr: expect.any(String),
        },
      ],
    });
  });
});

describe('Testing dm/leave/v1 errors', () => {
  test('Invalid dmId', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const dm = dmCreate(sender.token, [recipient.uId]);

    expect(dmLeave(sender.token, dm.dmId + 1)).toStrictEqual(400);
  });

  test('User is not a member of dm', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const notMember = authRegister('heisenberg@hhm.com', 'bluecrystal', 'Walter', 'White');
    const dm = dmCreate(sender.token, [recipient.authUserId]);

    expect(dmLeave(notMember.token, dm.dmId)).toStrictEqual(403);
  });

  test('Invalid token', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const dm = dmCreate(sender.token, [recipient.authUserId]);
    let fakeToken = sender.token + 'sdf';
    if (fakeToken === recipient.token) {
      fakeToken = fakeToken + 'sdfsd';
    }

    expect(dmLeave(fakeToken, dm.dmId)).toStrictEqual(403);
  });
});

// Tests for dm/remove/v1
describe('Testing dm/remove/v1 standard', () => {
  test('Successful dm removal', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const dm = dmCreate(sender.token, [recipient.authUserId]);
    expect(dmList(sender.token)).toStrictEqual({ dms: [{ dmId: dm.dmId, name: expect.any(String) }] });
    expect(dmDetails(sender.token, dm.dmId)).toStrictEqual({
      name: expect.any(String),
      members: [
        {
          uId: sender.authUserId,
          email: 'pollos@hhm.com',
          nameFirst: 'Gus',
          nameLast: 'Fring',
          handleStr: expect.any(String),
        },
        {
          uId: recipient.authUserId,
          email: 'goodman@hhm.com',
          nameFirst: 'Jimmy',
          nameLast: 'McGill',
          handleStr: expect.any(String),
        }
      ]
    });

    expect(dmRemove(sender.token, dm.dmId)).toStrictEqual({});

    expect(dmList(sender.token)).toStrictEqual({ dms: [] });
    expect(dmList(recipient.token)).toStrictEqual({ dms: [] });
    expect(dmDetails(sender.token, dm.dmId)).toStrictEqual(400);
  });
});

describe('Testing dm/remove/v1 errors', () => {
  test('Invalid dmId', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const dm = dmCreate(sender.token, [recipient.authUserId]);

    expect(dmRemove(sender.token, dm.dmId + 1)).toStrictEqual(400);
  });

  test('Recipient removing dm', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const dm = dmCreate(sender.token, [recipient.authUserId]);

    expect(dmRemove(recipient.token, dm.dmId)).toStrictEqual(403);
  });

  test('Sender removes dm but isnt legible', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const recipient2 = authRegister('heisenberg@hhm.com', 'bluecrystal', 'Walter', 'White');
    const dm = dmCreate(sender.token, [recipient.authUserId, recipient2.authUserId]);
    dmLeave(sender.token, dm.dmId);

    expect(dmRemove(sender.token, dm.dmId)).toStrictEqual(403);
  });

  test('Invalid token', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const dm = dmCreate(sender.token, [recipient.authUserId]);
    let fakeToken = sender.token + 'sdf';
    if (fakeToken === recipient.token) {
      fakeToken = fakeToken + 'sdfsd';
    }

    expect(dmRemove(fakeToken, dm.dmId)).toStrictEqual(403);
  });
});

// Test for dm/messages/v1
describe('Testing dm/messages/v1 standard', () => {
  test('Testing that function works', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const dm = dmCreate(sender.token, [recipient.authUserId]);

    expect(dmMessages(sender.token, dm.dmId, 0)).toStrictEqual({
      messages: [],
      start: 0,
      end: -1,
    });
  });
});

describe('Testing dm/messages/v1 errors', () => {
  test('Invalid dmId', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const dm = dmCreate(sender.token, [recipient.authUserId]);

    expect(dmMessages(sender.token, dm.dmId + 1, 0)).toStrictEqual(400);
  });

  test('User is not a member of dm', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const notMember = authRegister('heisenberg@hhm.com', 'bluecrystal', 'Walter', 'White');
    const dm = dmCreate(sender.token, [recipient.authUserId]);

    expect(dmMessages(notMember.token, dm.dmId, 0)).toStrictEqual(403);
  });

  test('Invalid token', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const dm = dmCreate(sender.token, [recipient.authUserId]);
    let fakeToken = sender.token + 'sdf';
    if (fakeToken === recipient.token) {
      fakeToken = fakeToken + 'sdfsd';
    }

    expect(dmMessages(fakeToken, dm.dmId, 0)).toStrictEqual(403);
  });

  test('Start is greater than number of messages in dm', () => {
    clear();
    const sender = authRegister('pollos@hhm.com', 'password', 'Gus', 'Fring');
    const recipient = authRegister('goodman@hhm.com', 'secondpassword', 'Jimmy', 'McGill');
    const dm = dmCreate(sender.token, [recipient.authUserId]);

    expect(dmMessages(recipient.token, dm.dmId, 40)).toStrictEqual(400);
    clear();
  });
});
