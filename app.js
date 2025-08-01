const { create, ev } = require('@open-wa/wa-automate');
const PQueue = require('p-queue').default;
const axios = require('axios');
require('dotenv').config();

const RASA_URL = process.env.RASA_URL || 'http://localhost:5005/webhooks/rest/webhook';

const queue = new PQueue({ concurrency: 4, autoStart: true });

async function startBot() {
  const client = await create({
    sessionId: 'CHATBOT_AI',
    useChrome: true,         // gunakan Google Chrome asli :contentReference[oaicite:2]{index=2}
    headless: false,         // untuk debugging visual & stabilitas :contentReference[oaicite:3]{index=3}
    cacheEnabled: false,     // non‑aktifkan cache untuk menghindari memory leak :contentReference[oaicite:4]{index=4}
    autoRefresh: true,       // QR code diperbarui otomatis jika expired :contentReference[oaicite:5]{index=5}
    customUserAgent: 'ChatbotAI/1.0',  // identitas unik untuk mengurangi risiko blokir :contentReference[oaicite:6]{index=6}
    restartOnCrash: true,
    throwErrorOnTosBlock: false,
    qrTimeout: 0,
    authTimeout: 60000,
    chromiumArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log('✅ WhatsApp bot ready');

  ev.on('qr.**', qr => console.log('📱 QR code received, please scan'));

  // Tangani pesan baru dengan antrean
  client.onMessage(msg => queue.add(() => handleMessage(client, msg)));

  // Tangani pesan belum terbaca saat startup
  const unread = await client.getAllUnreadMessages();
  for (const msg of unread) {
    queue.add(() => handleMessage(client, msg));
  }

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

  // Cek apakah input angka yang sesuai dengan opsi
  if (buttonMap[userInput]) {
    const selectedStatus = buttonMap[userInput];

    // Kirim langsung ke Rasa sebagai payload intent
    await axios.post(RASA_URL, {
      sender: chatId,
      message: `/status{"status":"${selectedStatus}"}`,
    });

    return; // jangan teruskan ke bawah agar tidak double kirim
  }

  // Lanjutkan alur standar
  try {
    const resp = await axios.post(RASA_URL, {
      sender: chatId,
      message: userInput,
    });
    const data = resp.data;

    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.text) {
          await client.sendText(chatId, item.text);
        }

        if (item.buttons) {
          const buttons = item.buttons
            .map((b, i) => `*${i + 1}.* ${b.title}`)
            .join('\n');
          await client.sendText(chatId, buttons);
        }

        if (item.custom && item.custom.image) {
          await client.sendImage(chatId, item.custom.image, 'image', item.text || '');
        }
      }
    } else {
      await client.sendText(chatId, data.text || '...');
    }
  } catch (error) {
    console.error('❌ Error processing message:', error.message);
    await client.sendText(chatId, '⚠️ Terjadi kesalahan, silakan coba lagi.');
  }
}


// async function handleMessage(client, msg) {
//   if (!msg.body || msg.fromMe) return;

//   const chatId = msg.from;
//   console.log(`📨 Received from ${chatId}: ${msg.body}`);

//   try {
//     const resp = await axios.post(RASA_URL, {
//       sender: chatId,
//       message: msg.body,
//     });
//     const data = resp.data;

//     if (Array.isArray(data)) {
//       for (const item of data) {
//         if (item.text) {
//           // kirim teks utama
//           await client.sendText(chatId, item.text);
//         }

//         // jika terdapat opsi tombol (button)
//         if (item.buttons) {
//           const buttons = item.buttons
//             .map((b, i) => `*${i + 1}.* ${b.title}`)
//             .join('\n');
//           await client.sendText(chatId, buttons);
//         }

//         // kalau ada custom JSON payload
//         if (item.custom) {
//           // misal untuk image, link, dsb.
//           if (item.custom.image) {
//             await client.sendImage(chatId, item.custom.image, 'image', item.text || '');
//           }
//           // kamu bisa tambahkan handler payload lain sesuai channel
//         }
//       }
//     } else {
//       // hanya teks sederhana
//       await client.sendText(chatId, data.text || '...');
//     }
//   } catch (error) {
//     console.error('❌ Error processing message:', error.message);
//     await client.sendText(chatId, '⚠️ Terjadi kesalahan, silakan coba lagi.');
//   }
// }


function shutdown() {
  console.log('🛑 Graceful shutdown triggered');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

(async () => {
  try {
    await startBot();
    console.log('🚀 Bot started and ready to receive messages');
  } catch (err) {
    console.error('💥 Failed to start bot:', err);
    process.exit(1);
  }
})();
