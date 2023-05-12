import { getData, MessageDetails, channel, setData } from './dataStore';
import validator from 'validator';
import { user as userType } from './dataStore';

// const OK = 200;

// =================================================== //
//                                                     //
//                       Types                         //
//                                                     //
// ==================================================  //

export type authUserId = { authUserId: number };

export type channelId = { channelId: number };

export type channels = {
  channels: {
    channelId: number,
    name: string
  }
};

export type user = {
  users: {
    uId: number;
    email: string;
    nameFirst: string;
    nameLast: string;
    handleStr: string;
    isGlobalOwner: boolean;
    tokens: Array<string>;
  }
};

export type messages = {
  messages: string[];
  start: number;
  end: number;
};

export type channelInfo = {
  name: string;
  isPublic: boolean;
  ownerMembers: user[];
  allMembers: user[];
};

export type error = { error: string };

// =================================================== //
//                                                     //
//                  Helper functions                   //
//                                                     //
// ==================================================  //

// Checks if user is valid
export function isValidUser(authUserId: number) {
  const data = getData();
  for (const user of data.users) {
    if (authUserId === user.uId && !user.isRemoved) {
      return true;
    }
  }
  return false;
}

// Fetch the channel index
export function getChannelIndex(channelId: number) {
  const data = getData();
  for (let cIndex = 0; cIndex < data.channels.length; cIndex++) {
    if (data.channels[cIndex].channelId === channelId) {
      return cIndex;
    }
  }
}

export function getChannelDetails(channelId: number) {
  const data = getData();
  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      return {
        name: channel.name,
        channelId: channel.channelId,
      };
    }
  }
}

export function getDmDetails(dmId: number) {
  const data = getData();
  for (const dm of data.dms) {
    if (dm.dmId === dmId) {
      return {
        name: dm.name,
        dmId: dm.dmId,
      };
    }
  }
}

// Fetch the dm index
export function getDmIndex(dmId: number) {
  const data = getData();
  for (let dmIndex = 0; dmIndex < data.dms.length; dmIndex++) {
    if (data.dms[dmIndex].dmId === dmId) {
      return dmIndex;
    }
  }
}

export function getTags(message: string) {
  const data = getData();
  const tagged = [];
  if (message.includes('@')) {
    for (const user of data.users) {
      if (message.includes(`@${user.handleStr}`)) {
        tagged.push(user.uId);
      }
    }
  }

  return tagged;
}

// Fetch message index from channel/dm
export function getMessageDetails(messageId: number) {
  const data = getData();
  // const msg = data.messageDetails.find(msg => msg.messageId === messageId);
  let msg: MessageDetails = null;
  for (const message of data.messageDetails) {
    if (message.messageId === messageId) {
      msg = message;
      break;
    }
  }

  if (msg === null) return null;

  let messageIndex = 0;
  let listIndex = 0;

  if (!msg.isDm) {
    // listIndex = data.channels.findIndex(channel => channel.channelId === msg.listId);
    // messageIndex = data.channels[listIndex].channelmessages.findIndex(msg => msg.messageId === messageId);
    for (const i in data.channels) {
      if (data.channels[i].channelId === msg.listId) {
        listIndex = parseInt(i);
        for (const j in data.channels[listIndex].channelmessages) {
          if (data.channels[i].channelmessages[j].messageId === messageId) {
            messageIndex = parseInt(j);
            break;
          }
        }
        break;
      }
    }
  } else {
    // listIndex = data.dms.findIndex(dm => dm.dmId === msg.listId);
    // messageIndex = data.dms[listIndex].messages.findIndex(msg => msg.messageId === messageId);
    for (const i in data.dms) {
      if (data.dms[i].dmId === msg.listId) {
        listIndex = parseInt(i);
        for (const j in data.dms[i].messages) {
          if (data.dms[listIndex].messages[j].messageId === messageId) {
            messageIndex = parseInt(j);
            break;
          }
        }
        break;
      }
    }
  }
  return {
    uId: msg.uId,
    isDm: msg.isDm,
    listIndex: listIndex,
    messageIndex: messageIndex,
    tags: msg.tags,
  };
}

// export function isActiveStandup(channelId: number) {
//   const data = getData();
//   for (const i of data.channels) {
//     if (i.channelId === channelId) {
//       if (i.standupDetails.isActiveStandup) {
//         return true;
//       }
//     }
//   }
//   return false;
// }

// Checks if channel is valid
export function isValidChannel(channelId: number) {
  const data = getData();
  for (const channel of data.channels) {
    if (channelId === channel.channelId) {
      return true;
    }
  }
  return false;
}

// Checks if user is global owner
export function isGlobalOwner(authUserId: number) {
  const data = getData();

  for (const user of data.users) {
    if (authUserId === user.uId) {
      if (user.isGlobalOwner) {
        return true;
      }
    }
  }
  return false;
}

// Helper function to get hashof string
export function hashOf(str: string) {
  const s = str + 'secret';
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = Math.imul(31, h) + s.charCodeAt(i) | 0; }

  return String(h);
}

// Helper function to pause time
// export function sleep(milliseconds: number) {
//   const date = Date.now();
//   let currentDate = null;
//   do {
//     currentDate = Date.now();
//   } while (currentDate - date < milliseconds);
// }

// Checks if token is valid
export function isValidToken(token: string) {
  const data = getData();

  const hashedToken = hashOf(token);
  if (data.sessionIds.includes(hashedToken)) {
    const uId = getUserId(token);
    const user = data.users.find((user: userType) => user.uId === uId);
    if (!user.isRemoved) {
      return true;
    }
  }
  return false;
}

export function getChannel(channelId: number, channelsArray: channel[]) {
  let channel: channel = null;
  for (let i = 0; i < channelsArray.length; i++) {
    if (channelId === channelsArray[i].channelId) {
      channel = channelsArray[i];
    }
  }
  return channel;
}

// Checks if user is in channel
export function isInChannel(uId: number, channelId: number) {
  const data = getData();

  for (const channel of data.channels) {
    if (channel.channelId === channelId) {
      for (const member of channel.memberIds) {
        if (uId === member) {
          return true;
        }
      }
    }
  }
  return false;
}

// Checks if user is in dm
export function isInDm(uId: number, dmId: number) {
  const data = getData();

  for (const dm of data.dms) {
    if (dm.dmId === dmId) {
      for (const member of dm.members) {
        if (uId === member) {
          return true;
        }
      }
    }
  }
  return false;
}

// Checks if user is channel owner or global owner (to check for channel perms)
// Return true if either, false otherwise
export function isChannelOwner(uId: number, channelId: number) {
  const data = getData();

  // check for channel owner
  for (const channel of data.channels) {
    if (channelId === channel.channelId) {
      for (const owner of channel.ownerIds) {
        if (uId === owner) {
          return true;
        }
      }
    }
  }
  return false;
}

// Checks if user is the only channel owner in given channel
export function isOnlyOwner(uId: number, channelId: number) {
  const data = getData();

  for (const channel of data.channels) {
    if (channelId === channel.channelId) {
      if (channel.ownerIds.length === 1) {
        return true;
      }
    }
  }
  return false;
}

// Helper function to find authUserId of token owner
export function getUserId(token: string) {
  const data = getData();

  const hashedToken = hashOf(token);
  for (const user of data.users) {
    if (user.tokens.includes(hashedToken)) {
      return user.uId;
    }
  }
}

// Checks if valid email address
export function validEmail(email: string) {
  return validator.isEmail(email);
}

// Checks if valid first name
export function validName(name: string) {
  if (name.length < 1 || name.length > 50) {
    return false;
  }
  return true;
}

// Checks if another user has email in use
export function anotherUserEmail(token: string, email: string) {
  const data = getData();

  const hashedToken = hashOf(token);
  for (const user of data.users) {
    if (email === user.email) {
      if (user.tokens.includes(hashedToken)) {
        // own email
        return false;
      }
      // someone else's email
      return true;
    }
  }
  return false;
}

export function alphanumeric(handleStr: string) {
  return /^[A-Za-z0-9]*$/.test(handleStr);
}

export function isValidHandleLength(handleStr: string) {
  if (handleStr.length < 3 || handleStr.length > 20) {
    return false;
  }
  return true;
}

export function anotherUserHandle(token: string, handleStr: string) {
  const data = getData();

  const hashedToken = hashOf(token);
  for (const user of data.users) {
    if (handleStr === user.handleStr) {
      if (user.tokens.includes(hashedToken)) {
        // own handleStr
        return false;
      }
      // someone else's handleStr
      return true;
    }
  }
  return false;
}

// Checks if dmId refers to a valid dm
export function isDmValid(dmId: number) {
  const data = getData();

  for (const Dms of data.dms) {
    if (Dms.dmId === dmId) {
      return true;
    }
  }

  return false;
}

// Checks if user is a member of dm
export function isDmMember(uid: number, dmId: number) {
  const data = getData();

  for (const uids of data.dms[dmId].members) {
    if (uids === uid) {
      return true;
    }
  }

  return false;
}

// Updates userStats
// Takes in uId of user to update, category(ie channel, dms, messages)
// and function(ie add, remove)
export function updateUserStats(uId: number, categ: string, func: string, time: number) {
  const data = getData();
  const userIndex = data.users.findIndex((userobj: userType) => userobj.uId === uId);

  if (categ === 'channels') {
    const lastIndex = data.users[userIndex].userStats.channelsJoined.length - 1;
    if (func === 'add') { // Joining a channel
      data.users[userIndex].userStats.channelsJoined.push({
        numChannelsJoined: data.users[userIndex].userStats.channelsJoined[lastIndex].numChannelsJoined + 1,
        timeStamp: time,
      });
    } else { // Leaving a channel
      data.users[userIndex].userStats.channelsJoined.push({
        numChannelsJoined: data.users[userIndex].userStats.channelsJoined[lastIndex].numChannelsJoined - 1,
        timeStamp: time,
      });
    }
  } else if (categ === 'dms') {
    const lastIndex = data.users[userIndex].userStats.dmsJoined.length - 1;
    if (func === 'add') { // Joining a dm
      data.users[userIndex].userStats.dmsJoined.push({
        numDmsJoined: data.users[userIndex].userStats.dmsJoined[lastIndex].numDmsJoined + 1,
        timeStamp: time,
      });
    } else { // Leaving a dm
      data.users[userIndex].userStats.dmsJoined.push({
        numDmsJoined: data.users[userIndex].userStats.dmsJoined[lastIndex].numDmsJoined - 1,
        timeStamp: time,
      });
    }
  } else if (categ === 'msgs') { // Creating a message
    const lastIndex = data.users[userIndex].userStats.messagesSent.length - 1;
    data.users[userIndex].userStats.messagesSent.push({
      numMessagesSent: data.users[userIndex].userStats.messagesSent[lastIndex].numMessagesSent + 1,
      timeStamp: time,
    });
  }

  setData(data);
}

export function updateWorkSpace(categ: string, func: string, time: number, num?: number) {
  const data = getData();

  if (categ === 'channels') {
    const lastIndex = data.workspaceStats.channelsExist.length - 1;
    if (func === 'add') {
      data.workspaceStats.channelsExist.push({
        numChannelsExist: data.workspaceStats.channelsExist[lastIndex].numChannelsExist + 1,
        timeStamp: time,
      });
    } else {
      data.workspaceStats.channelsExist.push({
        numChannelsExist: data.workspaceStats.channelsExist[lastIndex].numChannelsExist - 1,
        timeStamp: time,
      });
    }
  } else if (categ === 'dms') {
    const lastIndex = data.workspaceStats.dmsExist.length - 1;
    if (func === 'add') {
      data.workspaceStats.dmsExist.push({
        numDmsExist: data.workspaceStats.dmsExist[lastIndex].numDmsExist + 1,
        timeStamp: time,
      });
    } else {
      data.workspaceStats.dmsExist.push({
        numDmsExist: data.workspaceStats.dmsExist[lastIndex].numDmsExist - 1,
        timeStamp: time,
      });
    }
  } else if (categ === 'msgs') {
    const lastIndex = data.workspaceStats.messagesExist.length - 1;

    if (func === 'remove') {
      data.workspaceStats.messagesExist.push({
        numMessagesExist: data.workspaceStats.messagesExist[lastIndex].numMessagesExist - num,
        timeStamp: time,
      });
    } else {
      data.workspaceStats.messagesExist.push({
        numMessagesExist: data.workspaceStats.messagesExist[lastIndex].numMessagesExist + 1,
        timeStamp: time,
      });
    }
  }
  setData(data);
}
