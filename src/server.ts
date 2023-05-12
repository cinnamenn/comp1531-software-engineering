import express, { json, Request, Response } from 'express';
import { echo } from './echo';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';

import { authRegisterV3, authLoginV3, authLogoutV2, authPasswordResetV1, authPasswordRequestV1 } from './auth';
import { channelsCreateV3, channelsListV3, channelsListAllV3 } from './channels';
import { clearV1, searchV1 } from './other';
import {
  channelJoinV3, channelInviteV3, channelDetailsV3,
  channelMessagesV3, channelLeaveV2, channelAddOwnerV2, channelRemoveOwnerV2
} from './channel';
import {
  userProfileV3, usersAllV2, userSetNameV2, userSetEmailV2,
  userSetHandleV2, userStatsV1, usersStatsV1, userUploadPhotoV1
} from './users';
import { dmCreateV2, dmDetailsV2, dmLeaveV2, dmListV2, dmRemoveV2, dmMessagesV2 } from './dm';
import { getNotificationsV1 } from './notifications';
import {
  messageSendV2, messageEditV2, messageRemoveV2, messageSenddmV2, messageShareV1,
  messageReactV1, messageUnreactV1, messagePinV1, messageUnpinV1, messageSendlaterV1,
  messageSendlaterdmV1
} from './message';

import { standupStartV1, standupActiveV1, standupSendV1 } from './standup';

import { adminUserRemoveV1, adminUserpermissionChangeV1 } from './admin';

// Set up web app
const app = express();
app.use('/static', express.static('static'));
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());

// Example get request
app.get('/echo', (req: Request, res: Response, next) => {
  try {
    const data = req.query.echo as string;
    return res.json(echo(data));
  } catch (err) {
    next(err);
  }
});

app.post('/auth/register/v3', (req: Request, res: Response) => {
  const { email, password, nameFirst, nameLast } = req.body;
  return res.json(authRegisterV3(email, password, nameFirst, nameLast));
});

app.post('/auth/login/v3', (req: Request, res: Response) => {
  const { email, password } = req.body;
  return res.json(authLoginV3(email, password));
});

app.post('/auth/passwordreset/reset/v1', (req: Request, res: Response) => {
  const { resetCode, newPassword } = req.body;
  return res.json(authPasswordResetV1(resetCode, newPassword));
});

app.post('/auth/passwordreset/request/v1', (req: Request, res: Response) => {
  const { email } = req.body;
  return res.json(authPasswordRequestV1(email));
});

app.post('/channels/create/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  const { name, isPublic } = req.body;
  return res.json(channelsCreateV3(token, name, isPublic));
});

app.get('/channels/list/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  return res.json(channelsListV3(token));
});

app.get('/channels/listall/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  return res.json(channelsListAllV3(token));
});

app.get('/channel/messages/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  const channelId = parseInt(req.query.channelId as string);
  const start = parseInt(req.query.start as string);
  return res.json(channelMessagesV3(token, channelId, start));
});

app.post('/auth/logout/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  return res.json(authLogoutV2(token));
});

app.delete('/clear/v1', (req: Request, res: Response) => {
  return res.json(clearV1());
});

app.post('/channel/join/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId } = req.body;
  return res.json(channelJoinV3(token, channelId));
});

app.post('/channel/invite/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, uId } = req.body;
  return res.json(channelInviteV3(token, channelId, uId));
});

app.get('/channel/details/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  const channelId = parseInt(req.query.channelId as string);
  return res.json(channelDetailsV3(token, channelId));
});

app.post('/channel/leave/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId } = req.body;
  return res.json(channelLeaveV2(token, channelId));
});

app.post('/channel/addowner/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, uId } = req.body;
  return res.json(channelAddOwnerV2(token, channelId, uId));
});

app.post('/channel/removeowner/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, uId } = req.body;
  return res.json(channelRemoveOwnerV2(token, channelId, uId));
});

app.get('/user/profile/v3', (req: Request, res: Response) => {
  const token = req.header('token');
  const uId = parseInt(req.query.uId as string);
  return res.json(userProfileV3(token, uId));
});

app.get('/users/all/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  return res.json(usersAllV2(token));
});

app.put('/user/profile/setname/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { nameFirst, nameLast } = req.body;
  return res.json(userSetNameV2(token, nameFirst, nameLast));
});

app.put('/user/profile/setemail/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { email } = req.body;
  return res.json(userSetEmailV2(token, email));
});

app.put('/user/profile/sethandle/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { handleStr } = req.body;
  return res.json(userSetHandleV2(token, handleStr));
});

app.get('/user/stats/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  return res.json(userStatsV1(token));
});

app.get('/users/stats/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  return res.json(usersStatsV1(token));
});

app.post('/user/profile/uploadphoto/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { imgUrl, xStart, yStart, xEnd, yEnd } = req.body;
  return res.json(userUploadPhotoV1(token, imgUrl, xStart, yStart, xEnd, yEnd));
});

app.post('/dm/create/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const uIds = req.body.uIds as number[];
  return res.json(dmCreateV2(token, uIds));
});

app.get('/dm/list/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  return res.json(dmListV2(token));
});

app.delete('/dm/remove/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const dmId = parseInt(req.query.dmId as string);
  return res.json(dmRemoveV2(token, dmId));
});

app.get('/dm/details/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const dmId = parseInt(req.query.dmId as string);
  return res.json(dmDetailsV2(token, dmId));
});

app.post('/dm/leave/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { dmId } = req.body;
  return res.json(dmLeaveV2(token, dmId));
});

app.get('/dm/messages/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const dmId = parseInt(req.query.dmId as string);
  const start = parseInt(req.query.start as string);
  return res.json(dmMessagesV2(token, dmId, start));
});

app.post('/message/send/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, message } = req.body;
  return res.json(messageSendV2(token, channelId, message));
});

app.put('/message/edit/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { messageId, message } = req.body;
  return res.json(messageEditV2(token, messageId, message));
});

app.delete('/message/remove/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const messageId = parseInt(req.query.messageId as string);
  return res.json(messageRemoveV2(token, messageId));
});

app.post('/message/senddm/v2', (req: Request, res: Response) => {
  const token = req.header('token');
  const { dmId, message } = req.body;
  return res.json(messageSenddmV2(token, dmId, message));
});

app.get('/notifications/get/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  return res.json(getNotificationsV1(token));
});

app.post('/message/share/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { ogMessageId, message, channelId, dmId } = req.body;
  return res.json(messageShareV1(token, ogMessageId, message, channelId, dmId));
});

app.post('/message/react/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { messageId, reactId } = req.body;
  return res.json(messageReactV1(token, messageId, reactId));
});

app.post('/message/unreact/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { messageId, reactId } = req.body;
  return res.json(messageUnreactV1(token, messageId, reactId));
});

app.post('/message/pin/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { messageId } = req.body;
  return res.json(messagePinV1(token, messageId));
});

app.post('/message/unpin/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { messageId } = req.body;
  return res.json(messageUnpinV1(token, messageId));
});

app.post('/message/sendlater/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, message, timeSent } = req.body;
  return res.json(messageSendlaterV1(token, channelId, message, timeSent));
});

app.post('/message/sendlaterdm/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { dmId, message, timeSent } = req.body;
  return res.json(messageSendlaterdmV1(token, dmId, message, timeSent));
});

app.post('/standup/start/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, length } = req.body;
  return res.json(standupStartV1(token, channelId, length));
});

app.get('/standup/active/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const channelId = parseInt(req.query.channelId as string);
  return res.json(standupActiveV1(token, channelId));
});

app.post('/standup/send/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { channelId, message } = req.body;
  return res.json(standupSendV1(token, channelId, message));
});

app.delete('/admin/user/remove/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const uId = parseInt(req.query.uId as string);
  return res.json(adminUserRemoveV1(token, uId));
});

app.post('/admin/userpermission/change/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const { uId, permissionId } = req.body;
  return res.json(adminUserpermissionChangeV1(token, uId, permissionId));
});

app.get('/search/v1', (req: Request, res: Response) => {
  const token = req.header('token');
  const queryStr = req.query.queryStr as string;
  return res.json(searchV1(token, queryStr));
});

// app.post('/user/profile/uploadphoto/v1', (req: Request, res: Response) => {
//   const token = req.header('token');
//   const { xStart, yStart, xEnd, yEnd } = req.body;
//   return res.json(userUploadPhotoV1(token, xStart, yStart, xEnd, yEnd));
// });

// handles errors nicely
app.use(errorHandler());

// for logging errors (print to terminal)
app.use(morgan('dev'));

// start server
// const server = app.listen(PORT, HOST, () => {
//   // DO NOT CHANGE THIS LINE
//   console.log(`⚡️ Server listening on port ${PORT} at ${HOST}`);
// });

const server = app.listen(parseInt(process.env.PORT || config.port), process.env.IP, () => {
  console.log(`⚡️ Server listening on port ${process.env.PORT || config.port}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
