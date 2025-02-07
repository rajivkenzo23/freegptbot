const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const axios = require("axios");
const dotenv = require("dotenv");
const { parseString } = require("xml2js"); // For news parsing

// Load environment variables from .env file
dotenv.config();

const PREFIX = process.env.PREFIX || ".";
const BOT_NAME = process.env.BOT_NAME || "WhatsApp Bot";
const OWNER_NAME = process.env.OWNER_NAME || "Bot Owner";
const CONTACT_INFO = process.env.CONTACT_INFO || "Not Provided";

// Delay function
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// List of free GPT-4 APIs (GPT4Free alternatives)
const GPT4FREE_APIS = [
    "https://g4f.lol/api/openai/gpt4",
    "https://free.churchless.tech/v1/chat/completions",
    "https://youfreeai.com/api/openai/gpt4"
];

// Function to get AI response with automatic fallback
async function getAIResponse(userInput) {
    for (let api of GPT4FREE_APIS) {
        try {
            const response = await axios.post(api, {
                messages: [{ role: "user", content: userInput }],
                model: "gpt-4"
            });
            return response.data.choices[0].message.content || "I didn't understand that.";
        } catch (error) {
            console.error(`GPT-4 Free API failed: ${api}, trying next...`);
        }
    }
    return "Sorry, the AI service is temporarily unavailable. Please try again later.";
}

// Function to fetch weather data from wttr.in (free API)
async function getWeather(city) {
    try {
        const response = await axios.get(`https://wttr.in/${city}?format=%C+%t`);
        return `The weather in ${city} is: ${response.data}`;
    } catch (error) {
        return "Sorry, I couldn't fetch the weather. Please try again later.";
    }
}

// Function to get news from Google News RSS feed
async function getNews(query) {
    try {
        const feedUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
        const response = await axios.get(feedUrl);
        let newsOutput = "";
        parseString(response.data, (err, result) => {
            if (!err) {
                const articles = result.rss.channel[0].item;
                articles.slice(0, 5).forEach(article => {
                    newsOutput += `${article.title[0]} - ${article.link[0]}\n`;
                });
            }
        });
        return newsOutput || "No news found.";
    } catch (error) {
        return "Sorry, I couldn't fetch the news. Please try again later.";
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    const sock = makeWASocket({ auth: state });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
            console.log("Connection closed, reconnecting...", shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log(`${BOT_NAME} connected successfully!`);
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!text || !text.startsWith(PREFIX)) return;

        const command = text.slice(PREFIX.length).trim().toLowerCase();

        if (command.startsWith("ai")) {
            const query = text.slice(PREFIX.length + 2).trim();
            if (!query) {
                await sock.sendMessage(sender, { text: "Please provide a message for the AI to respond to." });
                return;
            }

            await delay(2000);
            const response = await getAIResponse(query);
            await sock.sendMessage(sender, { text: response });
        } else if (command.startsWith("weather")) {
            const city = text.slice(PREFIX.length + 8).trim();
            if (!city) {
                await sock.sendMessage(sender, { text: "Please provide a city to get weather information." });
                return;
            }
            const weather = await getWeather(city);
            await sock.sendMessage(sender, { text: weather });
        } else if (command.startsWith("news")) {
            const query = text.slice(PREFIX.length + 4).trim();
            if (!query) {
                await sock.sendMessage(sender, { text: "Please provide a topic to get the latest news." });
                return;
            }
            const news = await getNews(query);
            await sock.sendMessage(sender, { text: news });
        } else {
            await sock.sendMessage(sender, { text: `Unknown command: ${command}` });
        }
    });
}

startBot();
