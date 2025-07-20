const { create } = require('@open-wa/wa-automate');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const crypto = require('crypto');
const express = require('express');

require('dotenv').config(); // Memuat variabel lingkungan dari .env file

// app = express();

// // Middleware untuk menangani JSON body
// app.use(express.json());
// // Middleware untuk menangani URL encoded body
// app.use(express.urlencoded({ extended: true }));
// // Middleware untuk menangani CORS
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*'); // Ganti '*' dengan domain yang diizinkan jika perlu
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200); // Handle preflight requests
//   }

//   next();
// });

// // Middleware untuk menangani error
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send('Internal Server Error');
// });

// Konfigurasi dasar dan URL API
const RASA_URL = process.env.RASA_URL || 'http://localhost:5005/webhooks/rest/webhook'; // URL Rasa API
const RASA_ACTIONS_URL = process.env.RASA_ACTIONS_URL || `${RASA_URL}/actions`;
const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:3000/api/data-alumnis';
const LARAVEL_DB_URL = process.env.LARAVEL_DB_URL || 'http://localhost:3000/api/verifikasi-alumni';
const DEFAULT_RESPONSE =
  "❓ Maaf, saya mengalami kesulitan memahami pesan Anda. Silakan coba lagi atau ketik 'bantuan' untuk panduan.";
const ERROR_RESPONSE = '⚠️ Terjadi kesalahan sistem. Silakan coba lagi dalam beberapa saat.';

// Simple session storage untuk sender ID consistency dan menu state
const activeSessions = new Map();
const menuStates = new Map();

// Fungsi untuk membuat atau mendapatkan sender ID berdasarkan chat ID
function startSenderId(chatId) {
  if (!activeSessions.has(chatId)) {
    const hash = crypto.createHash('md5').update(chatId).digest('hex').substring(0, 12);
    activeSessions.set(chatId, `wa_${hash}`);
    return activeSessions.get(chatId);
  }

  return activeSessions.get(chatId);
}

// Fungsi untuk mengirim pesan (text atau berbasis JSON response dari Rasa)
async function sendMessageWithTyping(client, to, rasaMessage) {
  try {
    let textToSend = '';

    // Jika respons adalah object (JSON) dari Rasa dengan format actions
    if (typeof rasaMessage === 'object' && rasaMessage !== null) {
      if (rasaMessage.text) {
        textToSend += rasaMessage.text + '\n';
      }

      // Jika ada tombol (optional)
      if (Array.isArray(rasaMessage.buttons)) {
        rasaMessage.buttons.forEach((btn, i) => {
          textToSend += `${i + 1}. ${btn.title}\n`;
        });
      }

      // Tambahan: Jika ada custom payload lain seperti image, PDF, dsb
      if (rasaMessage.image) {
        await client.sendImage(to, rasaMessage.image, 'image.jpg', rasaMessage.caption || '');
      }

      if (rasaMessage.attachment && rasaMessage.attachment.type === 'pdf') {
        await client.sendFileFromUrl(
          to,
          rasaMessage.attachment.url,
          'file.pdf',
          rasaMessage.attachment.caption || ''
        );
      }
    } else {
      // Jika hanya teks biasa
      textToSend = rasaMessage;
    }

    // Simulasikan typing lalu kirim
    await client.simulateTyping(to, true);
    const delay = Math.min(Math.max(textToSend.length * 50, 1000), 3000);
    await new Promise(resolve => setTimeout(resolve, delay));
    await client.simulateTyping(to, false);
    await client.sendText(to, textToSend);

    console.log(`📤 Pesan terkirim ke ${to}: ${textToSend.substring(0, 50)}...`);
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
}

// Fungsi untuk memproses response dari Rasa dan kirimkan ke pengguna
async function processRasaResponse(client, chatId, responses) {
  if (!Array.isArray(responses) || responses.length === 0) {
    await sendMessageWithTyping(client, chatId, DEFAULT_RESPONSE);
    return;
  }

  for (const res of responses) {
    if (res.text && Array.isArray(res.buttons) && res.buttons.length > 0) {
      // Tampilkan tombol sebagai menu pilihan bernomor
      let menu = res.text + '\n\n';
      
      res.buttons.forEach((btn, i) => {
        menu += `${i + 1}. ${btn.title}\n`;
      });

      // Simpan state menu untuk input selanjutnya
      menuStates.set(chatId, {
        options: res.buttons,
        timestamp: Date.now(),
      });

      await sendMessageWithTyping(client, chatId, menu);
    } else if (res.text) {
      await sendMessageWithTyping(client, chatId, res.text);
    } else if (res.image) {
      await client.sendImage(chatId, res.image, 'image', res.caption || '');
    } else if (res.attachment && res.attachment.type === 'pdf') {
      await client.sendFileFromUrl(
        chatId,
        res.attachment.url,
        'file.pdf',
        res.attachment.caption || ''
      );
    } else {
      console.warn('❗ Format response dari Rasa tidak dikenali:', res);
    }
  }
}

function processMenuChoice(chatId, userInput) {
  const menu = menuStates.get(chatId);
  if (!menu || !menu.options) return null;

  const index = parseInt(userInput.trim());
  if (!isNaN(index) && index > 0 && index <= menu.options.length) {
    const payload = menu.options[index - 1].payload;
    console.log(`📌 User memilih menu: ${payload}`);
    return payload;
  }
  
  console.log("📋 Response:", JSON.stringify(res, null, 2));

  return null;
}

// Fungsi utama untuk handle pesan masuk (teks atau menu selection)
async function handleUserInput(client, chatId, senderId, userMessage) {
  try {
    console.log(`📨 [${senderId}] Processing: ${userMessage}`);

    // Cek apakah ini pilihan menu
    const menuChoice = processMenuChoice(chatId, userMessage);
    const messageToProcess = menuChoice || userMessage;

    if (menuChoice) {
      console.log(`🔄 Menu choice detected: ${menuChoice}`);
    }

    const rasaPayload = {
      sender: senderId,
      message: messageToProcess,
      metadata: {
        source: 'whatsapp',
        timestamp: new Date().toISOString(),
        chat_id: senderId,
        is_menu_choice: !!menuChoice,
        original_message: userMessage,
      },
    };

    console.log('🧠 Mengirim ke Rasa:', JSON.stringify(rasaPayload, null, 2));

    const response = await axios.post(RASA_URL, rasaPayload, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    console.log('📥 Rasa response:', JSON.stringify(response.data, null, 2));

    // Proses response dari Rasa dan tunggu sampai selesai
    await processRasaResponse(client, chatId, response.data);

    // Setelah berhasil diproses, hapus state menu
    menuStates.delete(chatId);

    // Simpan interaction log ke Laravel
    const interactionData = {
      sender_id: senderId,
      chat_id: chatId,
      user_message: userMessage,
      processed_message: messageToProcess,
      rasa_response: JSON.stringify(response.data),
      timestamp: new Date().toISOString(),
      is_menu_choice: !!menuChoice,
    };

    try {
      await saveDataToLaravel(interactionData);
    } catch (saveError) {
      console.error('⚠️ Gagal menyimpan log interaksi:', saveError.message);
      // Tidak mengirim error ke user untuk log yang gagal
    }
  } catch (error) {
    console.error(`❌ [${senderId}] Error:`, error.message);

    if (error.code === 'ECONNREFUSED') {
      await sendMessageWithTyping(
        client,
        chatId,
        '🔧 Sistem sedang dalam maintenance. silakan coba beberapa saat lagi.'
      );
    } else if (error.code === 'ETIMEDOUT') {
      await sendMessageWithTyping(
        client,
        chatId,
        '⏱️ Sistem membutuhkan waktu lebih lama. Mohon tunggu sebentar...'
      );
    } else {
      await sendMessageWithTyping(client, chatId, ERROR_RESPONSE);
    }
  }
  console.log('─'.repeat(80));
}

// Fungsi menyimpan log interaksi ke Laravel API
async function saveDataToLaravel(interactionData) {
  try {
    const response = await axios.post(LARAVEL_API_URL, interactionData, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Tambahkan Authorization jika Laravel API butuh Sanctum atau token:
        // Authorization: `Bearer ${process.env.LARAVEL_API_TOKEN}`
      },
      timeout: 10000,
    });

    console.log(`✅ Data interaksi disimpan ke Laravel: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error('❌ Gagal mengirim data ke Laravel:', error.response?.data || error.message);
    throw error;
  }
}


// Main bot function
async function startBot() {
  console.log('🚀 Memulai WhatsApp AI Bot...');

  const client = await create({
    sessionId: 'CHATBOT_AI',
    multiDevice: true,
    headless: true, // Set ke false untuk tidak di handles 
    useChrome: true, // Menambahkan performa chrome
    qrTimeout: 60000,
    authTimeout: 60000,
    restartOnCrash: true,
    cacheEnabled: false,
    killProcessOnBrowserClose: true,
    throwErrorOnTosBlock: false,
    chromiumArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--aggressive-cache-discard',
      '--disable-cache',
      '--disable-application-cache',
      '--disable-offline-load-stale-cache',
      '--disk-cache-size=0',
    ],
    qrCallback: qr => {
      console.log('📱 Scan QR Code untuk login WhatsApp:');
      qrcode.generate(qr, { small: true });
    },
    // onLoadingScreen: () => {
    //   console.log('⏳ Loading WhatsApp Web...');
    // },
    // autoRefresh: true,
  });

  // Display status
  const sessionText = `${activeSessions.size} session`;
  const width = 100;
  const horizontalLine = '═'.repeat(width - 1);
  const horizontalboxnull = ' '.repeat(width - 1);
  const labelWidth = 35;

  console.log(`\n\t╔${horizontalLine}╗`);
  console.log(`\t║${horizontalboxnull}║`);
  console.log(
    `\t║${' TRACER STUDY CHATBOT - STATUS '.padStart((width + 33) / 2).padEnd(width - 1)}║`
  );
  console.log(`\t║${horizontalboxnull}║`);
  console.log(`\t╠${'═'.repeat(width - 1)}╣`);
  console.log(
    `\t║${' ✅ WhatsApp Bot berhasil terhubung! '.padStart((width + 36) / 2).padEnd(width - 1)}║`
  );
  console.log(`\t║${horizontalboxnull}║`);
  console.log(`\t║ 🧠 ${'Rasa NLU Server'.padEnd(labelWidth)}: ${RASA_URL.padEnd(width - 42)}║`);
  console.log(
    `\t║ 🎯 ${'Rasa Actions Server'.padEnd(labelWidth)}: ${RASA_ACTIONS_URL.padEnd(width - 42)}║`
  );
  console.log(`\t║ 🔗 ${'Laravel API'.padEnd(labelWidth)}: ${LARAVEL_API_URL.padEnd(width - 42)}║`);
  console.log(
    `\t║ 🌐 ${'Laravel Database'.padEnd(labelWidth)}: ${LARAVEL_DB_URL.padEnd(width - 42)}║`
  );
  console.log(`\t║ 💾 ${'Active Sessions'.padEnd(labelWidth)}: ${sessionText.padEnd(width - 42)}║`);
  console.log(
    `\t║ 🕒 ${'Started At'.padEnd(labelWidth)}: ${new Date().toLocaleString().padEnd(width - 42)}║`
  );
  console.log(`\t║${horizontalboxnull}║`);
  console.log(`\t╚${horizontalLine}╝`);

  // Handle incoming messages
  // client.onMessage(async message => {
  //   if (!message.body || message.fromMe || message.isGroupMsg) {
  //     return;
  //   }

  //   const chatId = message.from;
  //   const userMessage = message.body.trim();
  //   const senderId = startSenderId(chatId);

  //   console.log(`\n📨 [${senderId}] ${userMessage}`);
  //   await handleUserInput(client, chatId, senderId, userMessage);
  // });

  client.onMessage(async message => {
    if (!message.body || message.fromMe) {
      return;
    }

    // Handle incoming message
    try {
      const chatId = message.from;
      const senderId = startSenderId(chatId);

      console.log(`📨 Message from ${senderId}: ${message.body}`);

      const rasaPayload = {
        sender: senderId,
        message: message.body,
        metadata: {
          whatsapp: true,
          timestamp: new Date().toISOString(),
        },
      };

      const response = await axios.post(RASA_URL, rasaPayload, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
      });

      await processRasaResponse(client, chatId, response.data);
      // await processRasaResponse(client, chatId, senderId, userMessage, response.data);
    } catch (error) {
      console.error('🔴 Error in message handler:', error);
      await client.sendText(
        message.from,
        'Maaf, terjadi gangguan teknis. Silakan coba lagi beberapa saat.'
      );
    }
  });

  // Handle incoming calls
  client.onIncomingCall(async call => {
    console.log('📞 Incoming call dari:', call.peerJid);
    try {
      await client.sendText(
        call.peerJid,
        '📞 Maaf, sistem kami hanya dapat membantu melalui pesan teks. Silakan kirim pesan untuk mendapatkan bantuan Tracer Study.'
      );
    } catch (error) {
      console.error('❌ Gagal menangani panggilan:', error.message);
    }
  });

  // Handle connection state changes
  client.onStateChanged(state => {
    console.log('🔄 Status koneksi berubah:', state);
    if (state === 'CONFLICT') {
      console.log('⚠️ Konflik sesi terdeteksi - restart mungkin diperlukan');
    } else if (state === 'DISCONNECTED') {
      console.log('⚠️ Koneksi terputus - mencoba reconnect...');
    } else if (state === 'CONNECTED') {
      console.log('✅ Koneksi WhatsApp aktif');
    }
  });

  console.log('\n\t📋 CHATBOT INFORMASI:');
  console.log('\t├── WhatsApp: ✅ Connected');
  console.log('\t├── Rasa Server: 🧠 Ready');
  console.log('\t├── Actions Server: 🎯 Ready');
  console.log('\t├── Session Storage: 💾 Active');
  console.log('\t├── Menu States:', menuStates.size, 'active');
  console.log('\t└── 🚀 Ready to handle Tracer Study conversations!');

  return client;
}

// Clean session periodically (every hour)
setInterval(() => {
  const maxSessions = 1000;
  const maxMenuAge = 5 * 60 * 1000; // 5 minutes

  // Clean sessions if too many
  if (activeSessions.size > maxSessions) {
    const sessionsToDelete = activeSessions.size - maxSessions;
    const keysToDelete = Array.from(activeSessions.keys()).slice(0, sessionsToDelete);
    keysToDelete.forEach(key => activeSessions.delete(key));
    console.log(`🧹 Cleaned up ${sessionsToDelete} old sessions`);
  }

  // Clean up expired menu states
  const now = Date.now();
  let cleanedMenus = 0;
  for (const [chatId, menu] of menuStates.entries()) {
    if (now - menu.timestamp > maxMenuAge) {
      menuStates.delete(chatId);
      cleanedMenus++;
    }
  }

  if (cleanedMenus > 0) {
    console.log(`🧹 Cleaned up ${cleanedMenus} expired menu states`);
  }
}, 60 * 60 * 1000);

// Graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot gracefully...');
  console.log('👋 Bot stopped by user (CTRL+C)');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down bot gracefully...');
  console.log('👋 Bot stopped by system (SIGTERM)');
  process.exit(0);
});

// Error handling
process.on('uncaughtException', error => {
  console.error('💥 Uncaught Exception:', error.message);
  console.error('Stack:', error.stack);
  console.log('🔄 Attempting to restart...');
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Promise Rejection:', reason);
  console.error('Promise:', promise);
  console.log('⚠️ This should be handled properly in production');
});

// Start the bot
console.log('🔄 Starting Tracer Study WhatsApp Bot...\n');

startBot()
  .then(client => {
    console.log('\t🎉 Tracer Study WhatsApp Bot started successfully!\n');
    console.log('📱 Waiting for messages...\n');
  })
  .catch(error => {
    console.error('💥 Failed to start bot:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n🔄 Please check your configuration and try again.');
    process.exit(1);
  });
