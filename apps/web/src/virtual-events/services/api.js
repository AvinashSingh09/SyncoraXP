import axios from 'axios';

const api = axios.create({
    // Routes through Vite proxy: /ve-api → http://localhost:5000/api
    baseURL: import.meta.env.VITE_VE_API_URL ? `${import.meta.env.VITE_VE_API_URL}/api` : `/ve-api`,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/virtual-events-platform/app/login';
        }
        return Promise.reject(error);
    }
);

export const authService = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    getUsersStats: () => api.get('/auth/users'),
    visitBooth: (boothId) => api.post(`/auth/visit-booth/${boothId}`),
    getLeaderboard: () => api.get('/auth/leaderboard'),
    addPoints: (points, category) => api.post('/auth/add-points', { points, category }),
};

const configCache = {};
const preloadedKeys = new Set();

const preloadImage = (url) => {
    if (!url) return;
    const img = new Image();
    img.src = url;
};

const oldAssets = [
  'lobby-bg.png', 'expo-bg.jpg', 'lounge-bg.jpg', 'lounge-bg.png',
  'meeting-room-bg.png', 'round-tables-bg.jpg', 'default-booth-bg.png',
  'hero-illustration.png', 'icons.svg', 'favicon.svg'
];

const fixConfigValueString = (valueStr) => {
  if (typeof valueStr !== 'string') return valueStr;
  let result = valueStr;
  oldAssets.forEach(asset => {
    const target = '/' + asset;
    const replacement = '/virtual-events-assets/' + asset;
    // Replace all occurrences of /asset but NOT /virtual-events-assets/asset
    if (result.includes(target)) {
      // Regex replace to avoid double prefixing
      const regex = new RegExp('(?<!/virtual-events-assets)/' + asset.replace('.', '\\.'), 'g');
      result = result.replace(regex, replacement);
    }
  });
  return result;
};

export const configService = {
    getFreshConfig: (key) => api.get(`/config/${key}`).then(res => {
        if (res.data && res.data.value) {
            res.data.value = fixConfigValueString(res.data.value);
        }
        return res;
    }),
    getConfig: (key) => {
        const cacheKey = `config_${key}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed.value) parsed.value = fixConfigValueString(parsed.value);
                return Promise.resolve({ data: parsed });
            } catch (e) {
                sessionStorage.removeItem(cacheKey);
            }
        }

        if (!configCache[key]) {
            configCache[key] = api.get(`/config/${key}`).then(res => {
                if (res.data) {
                    if (res.data.value) res.data.value = fixConfigValueString(res.data.value);
                    sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
                }
                return res;
            }).catch(err => {
                delete configCache[key];
                return Promise.reject(err);
            });
        }
        return configCache[key];
    },
    preloadBooth: async (boothId) => {
        const key = `booth_${boothId}_layout`;
        if (preloadedKeys.has(key)) return;
        preloadedKeys.add(key);
        try {
            const res = await configService.getConfig(key);
            if (res.data && res.data.value) {
                const config = JSON.parse(res.data.value);
                if (config.bgImage) preloadImage(config.bgImage);
                if (config.posters) {
                    config.posters.forEach(p => p.imageUrl && preloadImage(p.imageUrl));
                }
                if (config.products) {
                    config.products.forEach(p => p.imageUrl && preloadImage(p.imageUrl));
                }
            }
        } catch (e) {
            preloadedKeys.delete(key);
            console.warn('Preload failed for', key, e);
        }
    },
    getConfigsBulk: (keys) => api.get(`/config/bulk/keys?keys=${keys.join(',')}`).then(res => {
        if (res.data && Array.isArray(res.data)) {
            res.data.forEach(item => {
                if (item.value) item.value = fixConfigValueString(item.value);
            });
        }
        return res;
    }),
    setConfig: (key, value) => {
        delete configCache[key];
        sessionStorage.removeItem(`config_${key}`);
        return api.post('/config', { key, value });
    },
    uploadImage: (base64Data) => api.post('/config/upload', { image: base64Data }),
};

export const sessionService = {
    getSessions: () => api.get('/sessions'),
    createSession: (data) => api.post('/sessions', data),
    deleteSession: (id) => api.delete(`/sessions/${id}`),
};

export const chatService = {
    getRooms: () => api.get('/chat/rooms'),
    getHistory: () => api.get('/chat/history'),
    clearHistory: () => api.delete('/chat/history'),
    getUsers: () => api.get('/chat/users'),
    getMessages: (room) => api.get(`/chat/messages/${encodeURIComponent(room)}`),
    sendMessage: (room, text, replyTo) => api.post('/chat/messages', { room, text, replyTo }),
    reactToMessage: (messageId, emoji) => api.post('/chat/messages/reaction', { messageId, emoji }),
    editMessage: (messageId, text) => api.patch(`/chat/messages/${messageId}`, { messageId, text }),
    forwardMessage: (room, text) => api.post('/chat/messages', { room, text, forwarded: true }),
    clearChat: (room) => api.delete(room ? `/chat/clear?room=${encodeURIComponent(room)}` : '/chat/clear'),
};

export const qnaService = {
    getQuestions: () => api.get('/qna'),
    askQuestion: (text) => api.post('/qna', { text }),
    upvoteQuestion: (id) => api.post(`/qna/${id}/upvote`),
    clearQuestions: () => api.delete('/qna/clear'),
};

export const pollService = {
    getPolls: () => api.get('/polls'),
    createPoll: (data) => api.post('/polls', data),
    votePoll: (pollId, optionId) => api.post(`/polls/${pollId}/vote`, { optionId }),
    togglePoll: (pollId, isActive) => api.patch(`/polls/${pollId}/toggle`, { isActive }),
    deletePoll: (pollId) => api.delete(`/polls/${pollId}`),
    clearPolls: () => api.delete('/polls/clear'),
};

export const quizService = {
    getQuizzes: () => api.get('/quizzes'),
    createQuiz: (data) => api.post('/quizzes', data),
    submitAnswer: (quizId, optionId) => api.post(`/quizzes/${quizId}/submit`, { optionId }),
    toggleQuiz: (quizId, isActive) => api.patch(`/quizzes/${quizId}/toggle`, { isActive }),
    deleteQuiz: (quizId) => api.delete(`/quizzes/${quizId}`),
    clearQuizzes: () => api.delete('/quizzes/clear'),
};

export const leadService = {
    createLead: (leadData) => api.post('/leads', leadData),
    getLeads: (boothId) => api.get(`/leads${boothId ? `?boothId=${boothId}` : ''}`),
    deleteLead: (id) => api.delete(`/leads/${id}`),
};

export const meetingService = {
    join: (code) => api.post('/meetings/join', { code }),
    getMeetings: () => api.get('/meetings'),
    saveMeeting: (data) => api.post('/meetings', data),
    deleteMeeting: (id) => api.delete(`/meetings/${id}`),
};

export const surveyService = {
    submitSurvey: (data) => api.post('/survey', data),
    getSurveys: () => api.get('/survey'),
    checkUserSurveyStatus: () => api.get('/survey/status'),
    getQuestions: () => api.get('/survey/questions'),
    createQuestion: (data) => api.post('/survey/questions', data),
    updateQuestion: (id, data) => api.put(`/survey/questions/${id}`, data),
    deleteQuestion: (id) => api.delete(`/survey/questions/${id}`),
};

export const photoboothService = {
    process: (image, style) => api.post('/photobooth/process', { image, style }),
    getHistory: () => api.get('/photobooth/history'),
    uploadPoster: (sessionId, posterImage) => api.post('/photobooth/upload-poster', { sessionId, posterImage }),
};

export default api;
