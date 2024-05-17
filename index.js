const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
    GoogleGenerativeAIResponseError,
    GoogleGenerativeAIFetchError,
} = require("@google/generative-ai");

const TOKEN = process.env.TOKEN;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(
                `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
        }
    }
}

function getStringLength(string) {
    return string.length - 2000;
}

function checkMessage(message, array = []) {
    if (message.length <= 2000) array.push(message);
    if (message.length > 2000) {
        const subtractionLength = getStringLength(message);
        const FirstMessage = message.slice(
            0,
            message.length - subtractionLength
        );
        const anotherMessage = message.slice(2000, message.length);
        array.push(FirstMessage);
        if (anotherMessage.length <= 2000) {
            array.push(anotherMessage);
        } else {
            checkMessage(anotherMessage, array);
        }
    }
    return array;
}

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(
            `No command matching ${interaction.commandName} was found.`
        );
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "There was an error while executing this command!",
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                content: "There was an error while executing this command!",
                ephemeral: true,
            });
        }
    }
});

client.once("ready", async (c) => {
    console.log(`${c.user.tag} is online.`);

    c.user.setPresence({
        activities: [{ name: "/ratimir" }],
    });
});

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    safetySettings,
    systemInstruction:
        "You are a serious, sassy, and angry rat. Your name is Ratimir.",
});

const timeouts = [];

client.on("messageCreate", async (message) => {
    if (timeouts.includes(message.author.id)) return;

    if (!message.author.bot && message.content.startsWith(`<@${CLIENT_ID}>`)) {
        // First add the user to the timeout array.
        timeouts.push(message.author.id);

        try {
            await message.channel.sendTyping();

            let messages = [];
            let prevMessages = await message.channel.messages.fetch({
                limit: 5,
            });
            prevMessages.reverse();
            let current = "user";
            prevMessages.forEach((msg) => {
                if (msg.author.id === CLIENT_ID) {
                    if (current === "model") {
                        messages.push({
                            role: "model",
                            parts: [{ text: `${msg.content}` }],
                        });
                        current = "user";
                    }
                } else if (msg.content.startsWith(`<@${CLIENT_ID}>`)) {
                    if (current === "user") {
                        const revisedMsg = `${msg.content.replace(
                            `<@${CLIENT_ID}>`,
                            ""
                        )}`.trim();

                        messages.push({
                            role: "user",
                            parts: [{ text: revisedMsg }],
                        });
                        current = "model";
                    }
                }
            });

            // This is the newest user message and will be used to start a chat with the history of messages.
            const msg = messages.pop();

            const chat = model.startChat({ history: messages });

            const result = await chat.sendMessage(msg.parts);

            const messageArray = checkMessage(result.response.text());
            messageArray.forEach((msg) => {
                message.channel.send(msg);
            });
        } catch (error) {
            console.log(error);
            if (error instanceof GoogleGenerativeAIResponseError) {
                message.channel.send(
                    "Whatever you said triggered a content filter. 🤨📸"
                );
            } else if (error instanceof GoogleGenerativeAIFetchError) {
                message.channel.send(
                    "Ratimir is getting too many requests. Try again in 1 minute."
                );
            } else {
                message.channel.send(
                    "Ratimir has been kidnapped. Please try again later. 🐀"
                );
            }
        } finally {
            // Remove the user from the timeout array.
            setTimeout(() => {
                timeouts.splice(timeouts.indexOf(message.author.id), 1);
            }, 6000);
        }
    }
});

client.login(TOKEN);
