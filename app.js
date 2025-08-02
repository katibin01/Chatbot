const { create, ev } = require('@open-wa/wa-automate');
const axios = require('axios');
const PQueue = require('p-queue').default;
require('dotenv').config();

const RASA_URL     = process.env.RASA_URL     || 'http://localhost:5005/webhooks/rest/webhook';
const LARAVEL_URL  = process.env.LARAVEL_URL  || 'http://localhost/api';

const queue = new PQueue({ concurrency: 4, autoStart: true });

// Menyimpan percakapan tiap user
const userSessions = new Map();

async function startBot() {
  const client = await create({
    sessionId: 'CHATBOT_AI',
    useChrome: true,
    headless: false,
    cacheEnabled: false,
    autoRefresh: true,
    customUserAgent: 'ChatbotAI/1.0',
    restartOnCrash: true,
    throwErrorOnTosBlock: false,
    qrTimeout: 0,
    authTimeout: 60000,
    chromiumArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log('✅ WhatsApp bot ready');
  ev.on('qr.**', qr => console.log('📱 QR code received, please scan'));
  client.onMessage(msg => queue.add(() => handleMessage(client, msg)));

  const unread = await client.getAllUnreadMessages();
  for (const msg of unread) queue.add(() => handleMessage(client, msg));

  return client;
}

const buttonMap = {
  '1': 'Bekerja',
  '2': 'Melanjutkan Pendidikan',
  '3': 'Wirausaha',
  '4': 'Belum Bekerja',
  '5': 'Tidak bekerja tapi sedang mencari pekerjaan',
  '6': 'Lainnya',
};

async function handleMessage(client, msg) {
  if (!msg.body || msg.fromMe) return;

  const chatId = msg.from;
  const userInput = msg.body.trim();
  console.log(`📨 Received from ${chatId}: ${userInput}`);

  if (!userSessions.has(chatId)) {
    userSessions.set(chatId, { history: [], reminderTimeout: null });
  }
  const session = userSessions.get(chatId);
  clearTimeout(session.reminderTimeout);

  let rasaMessage = userInput;
  if (buttonMap[userInput]) {
    rasaMessage = `/status{"status":"${buttonMap[userInput]}"}`;
  }

  try {
    const resp = await axios.post(RASA_URL, {
      sender: chatId,
      message: rasaMessage,
    });
    const data = resp.data;
    session.history.push({ from: 'user', text: userInput });

    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.text) {
          await client.sendText(chatId, item.text);
          session.history.push({ from: 'bot', text: item.text });
        }
        if (item.buttons) {
          const buttons = item.buttons.map((b,i) => `*${i+1}.* ${b.title}`).join('\n');
          await client.sendText(chatId, buttons);
        }
        if (item.custom) {
          if (item.custom.image) {
            await client.sendImage(chatId, item.custom.image, 'image', item.text || '');
          }
          // Jika Rasa "{{ custom: {survey_done: true} }}"
          if (item.custom.survey_done) {
            await saveToLaravel(chatId, session.history);
            scheduleReminder(chatId, client);
          }
        }
      }
    } else if (data.text) {
      await client.sendText(chatId, data.text);
      session.history.push({ from: 'bot', text: data.text });
    }
  } catch (error) {
    console.error('❌ handleMessage error:', error.response?.data || error.message);
    await client.sendText(chatId, '⚠️ Error terjadi, silakan coba lagi.');
  }
}

async function saveToLaravel(chatId, history) {
  try {
    await axios.post(`${LARAVEL_URL}/data-alumnis`, {
      chat_id: chatId,
      conversation: history,
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`✅ Saved conversation for ${chatId}`);
  } catch (e) {
    console.error('❌ Laravel save error:', e.response?.status, e.response?.data);
  }
}

// Reminder yang akan dikirim setelah 24 jam (sekali), kecuali user sudah lanjut chat
function scheduleReminder(chatId, client) {
  const session = userSessions.get(chatId);
  session.reminderSent = false;

  session.reminderTimeout = setTimeout(async () => {
    try {
      await client.sendText(chatId,
        '📬 Sudah lebih dari 24 jam sejak terakhir kali. Mau lanjut tracer study atau butuh bantuan?'
      );
      session.reminderSent = true;
      console.log(`🔔 Reminder sent to ${chatId}`);
    } catch (err) {
      console.error('❌ Failed to send reminder', err);
    }
  }, 24 * 60 * 60 * 1000); // 24 jam dalam milidetik
}

function shutdown() { console.log('🛑 Shutdown'); process.exit(0); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

(async () => {
  await startBot();
  console.log('🚀 Bot started');
})();
