const fetch = require('node-fetch'); // Ensure v2 for CommonJS
const https = require('https');
const { Client, Intents } = require('discord.js');
require('dotenv').config();

const token = "MTMyMjQxODIxMDA1Nzg3OTU2Mg.G832_7.rjjVVwuTUj4hykO9DFN8o45CmWj6GnLN_0ZnNk"; // User token for sending messages
const chID = "1325524182439825448"; // Replace with your channel ID
const botToken = process.env.botToken; // Bot token for monitoring messages
const manualCommands = ['!mi 33', '!use 2']; // Commands to send
let intervalTime = 2000; // 2 seconds interval
let autostart;

// Work for no-SSL certificate web
const agent = new https.Agent({
  rejectUnauthorized: false,
});

// Initialize Discord.js client for monitoring messages
const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });

async function sendCommand(command) {
  try {
    const payload = { content: command };

    const postResponse = await fetch(`https://discord.com/api/v9/channels/${chID}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        authorization: token,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
      },
    });

    if (!postResponse.ok) {
      console.error(`Discord API responded with status ${postResponse.status}`);
      const errorData = await postResponse.json();
      console.error("Error details:", errorData);
    } else {
      console.log(`Command "${command}" sent successfully!`);
    }
  } catch (error) {
    console.error("Error in sendCommand function:", error);
  }
}

function startBot() {
  let commandIndex = 0;

  autostart = setInterval(() => {
    sendCommand(manualCommands[commandIndex]);
    commandIndex = (commandIndex + 1) % manualCommands.length; // Cycle through commands
  }, intervalTime);
}

function stopBot() {
  clearInterval(autostart);
  console.log("Bot paused due to CAPTCHA verification.");
}

async function handleCaptcha(messageContent, attachments) {
  if (messageContent.includes("STOP HUMAN") || messageContent.includes("Answer the captcha")) {
    stopBot(); // Pause the bot

    if (attachments.size > 0) {
      const captchaImage = attachments.first().url;
      console.log(`CAPTCHA Image URL: ${captchaImage}`);
    }

    console.log("Solve the CAPTCHA manually and wait for confirmation.");
  } else if (
    messageContent.includes("Thank You") &&
    messageContent.includes("not a bot") &&
    messageContent.includes("use bot commands")
  ) {
    console.log("CAPTCHA resolved. Resuming bot.");
    startBot(); // Resume the bot
  }
}

// Monitor Discord messages
client.on('messageCreate', async (message) => {
  if (message.channel.id === chID && message.author.bot) {
    handleCaptcha(message.content, message.attachments);
  }
});

// Login to Discord and start bot
client.login(botToken).then(() => {
  console.log("Bot logged in and listening for CAPTCHA and confirmation messages.");
  startBot(); // Start sending commands
});
