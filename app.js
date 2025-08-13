const { create } = require('@open-wa/wa-automate');
const axios = require('axios');
const PQueue = require('p-queue').default;
require('dotenv').config();

const RASA_URL = process.env.RASA_URL || 'http://localhost:5005/webhooks/rest/webhook';
const LARAVEL_URL = process.env.LARAVEL_URL || 'http://dash-react01.test/api';

const queue = new PQueue({ concurrency: 4, autoStart: true });
const userSessions = new Map();

const buttonMap = {
  1: 'Bekerja',
  2: 'Melanjutkan Pendidikan',
  3: 'Wirausaha',
  4: 'Belum Bekerja',
  5: 'Tidak bekerja tapi sedang mencari pekerjaan',
  6: 'Lainnya',
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function startBot() {
  try {
    const client = await create({
      sessionId: process.env.SESSION_ID || 'CHATBOT_AI',
      multiDevice: true,
      useChrome: true,
      headless: false,
      cacheEnabled: false,
      qrLogSkip: false,
      authTimeout: 0,
      qrTimeout: 0,
      sessionDataPath: './sessions',
      deleteSessionDataOnLogout: false, // ubah agar session tetap tersimpan
      restartOnCrash: true,
      // restartOnCrash: () => process.exit(1),
      chromiumArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log('✅ WhatsApp bot ready');

    const page = await client.getPage();
    page.setDefaultNavigationTimeout(60000);

    client.onStateChanged(state => {
      if (['CONFLICT', 'UNPAIRED'].includes(state)) {
        console.warn('⚠️ State bermasalah:', state, '→ kill client');
        client.kill();
      }
    });

    return client;
  } catch (err) {
    console.error('🔴 startBot failed:', err);
    return null;
  }
}

async function handleMessage(client, msg) {
  if (!msg.body || msg.fromMe) return;

  const chatId = msg.from;
  const userInput = msg.body.trim();
  console.log(`📨 Received from ${chatId}: ${userInput}`);

  // Inisialisasi session
  if (!userSessions.has(chatId)) {
    userSessions.set(chatId, { history: [], reminderTimeout: null });
  }
  const session = userSessions.get(chatId);

  // Hentikan pengingat sebelumnya
  clearTimeout(session.reminderTimeout);

  // Konversi input pengguna jika berupa angka dari tombol
  let rasaMessage = userInput;
  const buttonTitles = Object.values(buttonMap);
  if (/^\d+$/.test(userInput)) {
    const index = parseInt(userInput) - 1;
    if (buttonTitles[index]) {
      const title = buttonTitles[index];
      rasaMessage = `/status{"status":"${title}"}`;
    }
  } else if (buttonMap[userInput]) {
    // Jika input sesuai tombol teks
    rasaMessage = `/status{"status":"${buttonMap[userInput]}"}`;
  }

  try {
    // Kirim pesan ke Rasa
    const rasaResp = await axios.post(RASA_URL, {
      sender: chatId,
      message: rasaMessage,
    });

    const data = rasaResp.data;
    session.history.push({ from: 'user', text: userInput });

    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.text) {
          await client.sendText(chatId, item.text);
          session.history.push({ from: 'bot', text: item.text });
        }
        if (item.buttons) {
          const buttons = item.buttons.map((b, i) => `*${i + 1}.* ${b.title}`).join('\n');
          await client.sendText(chatId, buttons);
        }
        if (item.custom) {
          if (item.custom.image) {
            await client.sendImage(chatId, item.custom.image, 'image', item.text || '');
          }
          if (item.custom.survey_done) {
            await saveToLaravel(chatId, session.history);
            scheduleReminder(chatId, client); // ⏰ Jadwal ulang pengingat
          }
        }
      }
    } else if (data.text) {
      await client.sendText(chatId, data.text);
      session.history.push({ from: 'bot', text: data.text });
    }
  } catch (error) {
    console.error('❌ handleMessage error:', error.response?.data || error.message);
    await client.sendText(chatId, '⚠️ Terjadi kesalahan, silakan coba lagi.');
  }
}

async function saveToLaravel(chatId, history) {
  try {
    await axios.post(
      `${LARAVEL_URL}/data-alumnis`,
      {
        chat_id: chatId,
        conversation: history,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.LARAVEL_TOKEN}`,
        },
      }
    );
    console.log(`✅ Percakapan disimpan untuk ${chatId}`);
  } catch (e) {
    console.error('❌ Laravel save error:', e.response?.status, e.response?.data || e.message);
  }
}

function scheduleReminder(chatId, client) {
  const session = userSessions.get(chatId);
  session.reminderSent = false;

  session.reminderTimeout = setTimeout(async () => {
    try {
      await client.sendText(
        chatId,
        '📬 Sudah lebih dari 24 jam sejak terakhir kali. Mau lanjut tracer study atau butuh bantuan?'
      );
      session.reminderSent = true;
      console.log(`🔔 Reminder dikirim ke ${chatId}`);
    } catch (err) {
      console.error('❌ Gagal kirim reminder', err);
    }
  }, 24 * 60 * 60 * 1000); // 24 jam
}

function shutdown() {
  console.log('🛑 Shutdown');
  process.exit(0);
}

(async () => {
  const client = await startBot();

  if (!client) {
    console.error('❌ Bot tidak bisa dijalankan (client null)');
    process.exit(1);
  }

  console.log('🚀 Bot berhasil dijalankan');

  // ✅ Tangani pesan masuk baru
  client.onMessage(async msg => {
    await queue.add(() => handleMessage(client, msg));
  });

  // ✅ Tangani pesan yang belum dibaca saat startup
  try {
    const unreadMessages = await client.getAllUnreadMessages();

    for (const msg of unreadMessages) {
      console.log(`📩 Pesan belum dibaca dari ${msg.sender.id}: ${msg.body}`);
      await handleMessage(client, msg);
    }
  } catch (err) {
    console.error('❌ Gagal mengambil unread messages:', err.message);
  }
})();
