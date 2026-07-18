const { createReadStream, existsSync, mkdirSync, writeFileSync } = require('node:fs');
const { basename, extname, join } = require('node:path');
const jwt = require('./utils/jwt.utils');
const authService = require('./services/auth.service');
const chat = require('./controllers/chat.controller');
const chatService = require('./services/chat.service');
const qna = require('./controllers/qna.controller');
const poll = require('./controllers/poll.controller');
const quiz = require('./controllers/quiz.controller');
const meeting = require('./controllers/meeting.controller');
const survey = require('./controllers/survey.controller');
const Config = require('./models/config.model');
const Session = require('./models/session.model');
const Lead = require('./models/lead.model');
const PhotoboothSession = require('./models/photoboothSession.model');
const photobooth = require('./services/photobooth.service');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { initDb, pool } = require('./utils/db');
const { registerSockets } = require('./sockets');

const uploadDir = join(__dirname, '../../uploads');
const tempUploadDir = join(__dirname, '../../temp_uploads');

function errorPayload(error) {
  return {
    success: false,
    message: error?.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'production' ? {} : { stack: error?.stack }),
  };
}

function legacyHandler(fastify, handler, { auth = false } = {}) {
  return async (request, reply) => {
    let status = 200;
    let sent = false;
    let nextError;
    const response = {
      status(code) { status = code; return this; },
      json(payload) { sent = true; return reply.code(status).send(payload); },
      send(payload) { sent = true; return reply.code(status).send(payload); },
    };
    const legacyRequest = {
      body: request.body || {},
      params: request.params || {},
      query: request.query || {},
      headers: request.headers,
      app: fastify.veState,
    };
    if (auth) {
      const header = request.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        return reply.code(401).send({ message: 'No token provided, authorization denied' });
      }
      try {
        legacyRequest.user = jwt.verifyToken(header.slice(7));
      } catch {
        return reply.code(401).send({ message: 'Token is not valid' });
      }
    }
    try {
      const result = await handler(legacyRequest, response, (error) => { nextError = error; });
      if (nextError) throw nextError;
      if (!sent && result !== undefined) return reply.code(status).send(result);
    } catch (error) {
      if (!sent) return reply.code(error.statusCode || 500).send(errorPayload(error));
    }
  };
}

function validateRegister(data) {
  const errors = [];
  const required = [['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Email'], ['password', 'Password']];
  for (const [key, name] of required) if (!data[key]) errors.push({ msg: `${name} is required`, path: key });
  if (data.firstName && (data.firstName.length < 2 || data.firstName.length > 50)) errors.push({ msg: 'First name must be between 2 and 50 characters', path: 'firstName' });
  if (data.lastName && (data.lastName.length < 2 || data.lastName.length > 50)) errors.push({ msg: 'Last name must be between 2 and 50 characters', path: 'lastName' });
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) errors.push({ msg: 'Valid email is required', path: 'email' });
  if (data.password && (!/[A-Z]/.test(data.password) || !/[a-z]/.test(data.password) || !/[0-9]/.test(data.password) || !/[!@#$%^&*(),.?":{}|<>]/.test(data.password) || data.password.length < 8)) errors.push({ msg: 'Password must be at least 8 characters and include upper, lower, number, and special character', path: 'password' });
  if (data.mobileNumber && !/^\d{10}$/.test(data.mobileNumber)) errors.push({ msg: 'Mobile number must be exactly 10 digits', path: 'mobileNumber' });
  return errors;
}

function register(app, method, url, handler, options) {
  app.route({ method, url: `/ve-api${url}`, handler: legacyHandler(app, handler, options) });
}

async function registerVirtualEvents(app) {
  await initDb();
  await chatService.seedMockMessages();
  app.decorate('veState', new Map());
  app.veState.set = app.veState.set.bind(app.veState);
  app.veState.get = app.veState.get.bind(app.veState);
  app.veState.set('onlineUsers', new Set());
  app.veState.set('activeSockets', new Map());
  registerSockets(app);
  app.addHook('onClose', async () => { await pool.end(); });

  app.get('/ve-api/uploads/:name', async (request, reply) => serveFile(request, reply, uploadDir));
  app.get('/ve-api/temp_uploads/:name', async (request, reply) => serveFile(request, reply, tempUploadDir));

  app.post('/ve-api/auth/register', async (request, reply) => {
    const errors = validateRegister(request.body || {});
    if (errors.length) return reply.code(400).send({ errors });
    try {
      const user = await authService.register(request.body);
      return reply.code(201).send({ success: true, message: 'User registered successfully', data: user });
    } catch (error) {
      return reply.code(error.statusCode || 500).send(errorPayload(error));
    }
  });
  app.post('/ve-api/auth/login', async (request, reply) => {
    const { email, password } = request.body || {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !password) return reply.code(400).send({ errors: [{ msg: 'Valid email and password are required' }] });
    try {
      const data = await authService.login(email, password);
      return reply.send({ success: true, message: 'Login successful', data });
    } catch (error) {
      return reply.code(error.statusCode || 500).send(errorPayload(error));
    }
  });
  const authController = require('./controllers/auth.controller');
  register(app, 'GET', '/auth/users', authController.getUsersStats, { auth: true });
  register(app, 'POST', '/auth/visit-booth/:boothId', authController.visitBooth, { auth: true });
  register(app, 'GET', '/auth/leaderboard', authController.getLeaderboard, { auth: true });
  register(app, 'POST', '/auth/add-points', authController.addPoints, { auth: true });

  register(app, 'GET', '/chat/rooms', chat.getRooms, { auth: true });
  register(app, 'GET', '/chat/history', chat.getHistory, { auth: true });
  register(app, 'DELETE', '/chat/history', chat.clearHistory, { auth: true });
  register(app, 'GET', '/chat/users', chat.getUsers, { auth: true });
  register(app, 'GET', '/chat/messages/:room', chat.getMessages, { auth: true });
  register(app, 'POST', '/chat/messages', chat.sendMessage, { auth: true });
  register(app, 'POST', '/chat/messages/reaction', chat.addReaction, { auth: true });
  register(app, 'PATCH', '/chat/messages/:id', chat.editMessage, { auth: true });
  register(app, 'DELETE', '/chat/clear', chat.clearChat, { auth: true });
  register(app, 'GET', '/qna', qna.getQuestions, { auth: true });
  register(app, 'POST', '/qna', qna.askQuestion, { auth: true });
  register(app, 'POST', '/qna/:id/upvote', qna.upvoteQuestion, { auth: true });
  register(app, 'DELETE', '/qna/clear', qna.clearQuestions, { auth: true });
  register(app, 'GET', '/polls', poll.getPolls, { auth: true });
  register(app, 'POST', '/polls', poll.createPoll, { auth: true });
  register(app, 'POST', '/polls/:id/vote', poll.votePoll, { auth: true });
  register(app, 'PATCH', '/polls/:id/toggle', poll.togglePollActive, { auth: true });
  register(app, 'DELETE', '/polls/clear', poll.clearPolls, { auth: true });
  register(app, 'DELETE', '/polls/:id', poll.deletePoll, { auth: true });
  register(app, 'GET', '/quizzes', quiz.getQuizzes, { auth: true });
  register(app, 'POST', '/quizzes', quiz.createQuiz, { auth: true });
  register(app, 'POST', '/quizzes/:id/submit', quiz.submitAnswer, { auth: true });
  register(app, 'PATCH', '/quizzes/:id/toggle', quiz.toggleQuizActive, { auth: true });
  register(app, 'DELETE', '/quizzes/clear', quiz.clearQuizzes, { auth: true });
  register(app, 'DELETE', '/quizzes/:id', quiz.deleteQuiz, { auth: true });
  register(app, 'POST', '/meetings/join', meeting.joinMeeting, { auth: true });
  register(app, 'GET', '/meetings', meeting.getMeetings, { auth: true });
  register(app, 'POST', '/meetings', meeting.createOrUpdateMeeting, { auth: true });
  register(app, 'DELETE', '/meetings/:id', meeting.deleteMeeting, { auth: true });
  for (const [method, url, handler] of [
    ['GET', '/survey/questions', survey.getQuestions], ['POST', '/survey/questions', survey.createQuestion], ['PUT', '/survey/questions/:id', survey.updateQuestion], ['DELETE', '/survey/questions/:id', survey.deleteQuestion],
    ['POST', '/survey', survey.submitSurvey], ['GET', '/survey', survey.getSurveys], ['GET', '/survey/status', survey.checkUserSurveyStatus],
  ]) register(app, method, url, handler, { auth: true });

  register(app, 'GET', '/config/bulk/keys', async (req, res) => {
    const keyList = req.query.keys ? req.query.keys.split(',') : [];
    const configs = keyList.length ? await Config.find({ key: { $in: keyList } }) : [];
    res.json({ success: true, configs: Object.fromEntries(keyList.map((key) => [key, configs.find((item) => item.key === key)?.value ?? null])) });
  });
  register(app, 'GET', '/config/:key', async (req, res) => res.json({ success: true, value: (await Config.findOne({ key: req.params.key }))?.value ?? null }));
  register(app, 'POST', '/config', async (req, res) => res.json({ success: true, data: await Config.findOneAndUpdate({ key: req.body.key }, { value: req.body.value }, { new: true, upsert: true }) }));
  register(app, 'POST', '/config/upload', async (req, res) => {
    const matches = req.body.image?.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ success: false, message: 'Invalid base64 image data' });
    if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
    const filename = `bg_${Date.now()}.${matches[1].split('/')[1] || 'png'}`;
    writeFileSync(join(uploadDir, filename), Buffer.from(matches[2], 'base64'));
    res.json({ success: true, url: `/ve-api/uploads/${filename}` });
  });
  register(app, 'GET', '/sessions', async (_req, res) => res.json({ success: true, data: await Session.find().sort({ createdAt: 1 }) }));
  register(app, 'POST', '/sessions', async (req, res) => { const item = new Session(req.body); await item.save(); res.status(201).json({ success: true, data: item }); });
  register(app, 'DELETE', '/sessions/:id', async (req, res) => { await Session.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'Session deleted successfully' }); });
  register(app, 'POST', '/leads', async (req, res) => {
    const { boothId, productId, productName, queryText } = req.body;
    if (!boothId || !productId || !productName || !queryText) return res.status(400).json({ success: false, message: 'All fields are required' });
    const lead = new Lead({ boothId, productId, productName, user: req.user.id, userName: `${req.user.firstName} ${req.user.lastName}`, userEmail: req.user.email, queryText }); await lead.save(); res.status(201).json({ success: true, message: 'Inquiry submitted successfully', data: lead });
  }, { auth: true });
  register(app, 'GET', '/leads', async (req, res) => res.json({ success: true, data: await Lead.find(req.query.boothId ? { boothId: req.query.boothId } : {}).sort({ createdAt: -1 }) }), { auth: true });
  register(app, 'DELETE', '/leads/:id', async (req, res) => { const item = await Lead.findByIdAndDelete(req.params.id); if (!item) return res.status(404).json({ success: false, message: 'Lead not found' }); res.json({ success: true, message: 'Lead deleted successfully' }); }, { auth: true });
  register(app, 'POST', '/photobooth/process', async (req, res) => { if (!req.body.image || !req.body.style) return res.status(400).json({ success: false, message: 'Image and style are required.' }); res.json({ success: true, session: await photobooth.processCaricature(req.user.id, req.body.image, req.body.style) }); }, { auth: true });
  register(app, 'GET', '/photobooth/history', async (req, res) => res.json({ success: true, history: await PhotoboothSession.find({ userId: req.user.id }).sort({ createdAt: -1 }) }), { auth: true });
  register(app, 'POST', '/photobooth/upload-poster', async (req, res) => res.json({ success: true, session: await photobooth.uploadPoster(req.body.sessionId, req.body.posterImage) }), { auth: true });
  register(app, 'POST', '/translate', async (req, res) => res.json(await translate(req.body)));
}

async function serveFile(request, reply, directory) {
  const name = basename(request.params.name);
  const file = join(directory, name);
  if (!existsSync(file)) return reply.code(404).send({ message: 'File not found' });
  const type = extname(name).toLowerCase() === '.png' ? 'image/png' : extname(name).toLowerCase() === '.jpeg' || extname(name).toLowerCase() === '.jpg' ? 'image/jpeg' : 'application/octet-stream';
  return reply.type(type).send(createReadStream(file));
}

async function translate({ text, targetLanguage, targetLangCode }) {
  if (!text || !targetLanguage) { const error = new Error('Text and targetLanguage are required'); error.statusCode = 400; throw error; }
  let key = process.env.GEMINI_KEY || process.env.GEMINI_API_KEY;
  if (key) {
    key = key.trim().replace(/^["']|["']$/g, '');
    for (const modelName of ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-pro-latest']) {
      try { const result = await new GoogleGenerativeAI(key).getGenerativeModel({ model: modelName }).generateContent(`Translate the following text to ${targetLanguage}. Return ONLY the translated text.\n\nText: "${text}"`); return { translatedText: (await result.response).text().trim(), method: 'Gemini' }; } catch { /* try the next model */ }
    }
  }
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLangCode || 'hi')}&dt=t&q=${encodeURIComponent(text)}`);
  if (!response.ok) throw new Error('All translation services failed');
  const data = await response.json();
  return { translatedText: data[0].map((part) => part[0]).filter(Boolean).join(''), method: 'Google Translate (free)' };
}

module.exports = { registerVirtualEvents };
