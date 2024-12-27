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
const { TextChannel } = require("discord.js");
const { getRandomRat } = require("./utils/getRandomRat.js");
const { db } = require("./database/database.js");
const stateManager = require("./utils/StateManager.js");
const { spawnRat } = require("./tasks/spawnRat.js");
const { log } = require("./utils/log.js");
const { deleteRatMessages } = require("./utils/deleteRatMessages.js");
const { addRatMessageInterval } = require("./tasks/addRatMessageInterval.js");
const {
    MINIMUM_TIME_INTERVAL_RUNS,
    MAXIMUM_TIME_INTERVAL_RUNS,
} = require("./config/globals.js");

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
            log(
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

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    safetySettings: [
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
    ],
    systemInstruction:
        "Begrudgingly answer every prompt. Your name is Ratimir.",
});

const timeouts = [];

client.once("ready", async (client) => {
    await db.setup(client);

    // Reset all servers to ratSpawned = false
    await db.resetRatSpawned();
    // Delete any rat messages that are left behind
    await deleteRatMessages(client);

    log(`${client.user.tag} is online.`);

    client.user.setPresence({
        activities: [{ name: "/ratimir" }],
    });

    async function intervalFunction() {
        log("Ready interval running...");

        const guilds = client.channels.cache;
        const textChannels = guilds.filter((channel) => channel.type === 0);
        // Sort channels into seperate arrays based on matching guild
        /**@type {Array<{guildId: string, channels: TextChannel[]}>} */
        const sortedGuildsTCs = textChannels.reduce((result, obj) => {
            const existingGroup = result.find(
                (group) => group.guildId === obj.guildId
            );
            if (existingGroup) {
                existingGroup.channels.push(obj);
            } else {
                result.push({ guildId: obj.guildId, channels: [obj] });
            }
            return result;
        }, []);
        for (const { guildId, channels } of sortedGuildsTCs) {
            // Don't spawn rat for this guild if one is already spawned
            const ratSpawned = await db.getRatSpawned(guildId);
            if (ratSpawned) continue;
            // Find best channel based on the date of the last message sent
            let bestChannel = null;
            let bestMessageTimestamp = null;
            for (const channel of channels) {
                try {
                    // TODO: If message is deleted don't set it to bestChannel

                    // No channel found yet so set it to the first channel
                    if (bestChannel === null) {
                        bestChannel = channel;
                        const lastChannelMessage = await channel.messages.fetch(
                            channel.lastMessageId
                        );
                        bestMessageTimestamp =
                            lastChannelMessage.createdTimestamp;
                    } else {
                        const lastChannelMessage = await channel.messages.fetch(
                            channel.lastMessageId
                        );
                        const messageTimestamp =
                            lastChannelMessage.createdTimestamp;
                        if (messageTimestamp >= bestMessageTimestamp) {
                            bestChannel = channel;
                            bestMessageTimestamp = messageTimestamp;
                        }
                    }
                } catch (error) {
                    if (error.code === 10008) {
                        log("index: Message not found.");
                    } else {
                        log(error);
                    }
                    continue;
                }
            }
            // Spawn a rat in the best channel for this guild
            if (bestChannel !== null) {
                log("Spawning rat in", bestChannel.guild.name);
                const randomRat = getRandomRat();

                const ratMessage = await spawnRat(
                    client,
                    bestChannel.id,
                    randomRat
                );

                await db.updateRatSpawned(guildId, true);

                const time = Date.now();
                // Update global timeSinceLastRatSpawn
                // stateManager.set("timeSinceLastRatSpawn", time);
                // Update guild timeSinceLastRatSpawn
                await db.updateTimeSinceLastRatSpawn(guildId, time);
                await db.addRatMessage(guildId, bestChannel.id, ratMessage.id);

                // Add cool effects to the message
                await addRatMessageInterval(ratMessage, randomRat);
            }
        }
    }

    // Uncomment to immediately spawn a rat when bot is started
    await intervalFunction();

    function setRandomInterval(intervalFunction, minDelay, maxDelay) {
        let timeout;

        const runInterval = () => {
            const timeoutFunction = () => {
                intervalFunction();
                runInterval();
            };

            const delay =
                Math.floor(Math.random() * (maxDelay - minDelay + 1)) +
                minDelay;

            log(
                "Next interval will start in:",
                delay / 60 / 60 / 1000,
                "hours"
            );

            timeout = setTimeout(timeoutFunction, delay);
        };

        runInterval();

        return {
            clear() {
                clearTimeout(timeout);
            },
        };
    }

    // Spawn a rat every 1 to 6 hours
    setRandomInterval(
        intervalFunction,
        MINIMUM_TIME_INTERVAL_RUNS,
        MAXIMUM_TIME_INTERVAL_RUNS
    );
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.isButton()) return;

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

client.on("guildCreate", (guild) => {
    log(`Ratimir has joined ${guild.name}`);
    db.setupServer(guild.id);
});

client.on("messageCreate", async (message) => {
    // if (timeouts.includes(message.author.id)) return;

    // TODO: Handle a case where the bot is replied to.
    // TODO: Handle a case where the bot is mentioned in a reply.
    if (message.author.bot) return;

    if (message.reference) {
        try {
            const repliedTo = await message.channel.messages.fetch(
                message.reference.messageId
            );

            if (repliedTo.author.id === CLIENT_ID) {
                const result = await model.generateContent(message.content);

                await message.reply(result.response.text());
                return;
            }
        } catch (error) {
            log(error);
        }
    }

    if (message.content.startsWith(`<@${CLIENT_ID}>`)) {
        // First add the user to the timeout array.
        // timeouts.push(message.author.id);

        try {
            await message.channel.sendTyping();

            let messages = [];
            let prevMessages = await message.channel.messages.fetch({
                limit: 5,
            });
            prevMessages.reverse();
            let current = "user";
            prevMessages.forEach((msg) => {
                if (msg.author.id === CLIENT_ID && msg.content !== "") {
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

            const chat = model.startChat({
                generationConfig: { temperature: 2 },
                history: messages,
            });

            const result = await chat.sendMessage(msg.parts);

            const messageArray = checkMessage(result.response.text());
            messageArray.forEach((msg) => {
                message.channel.send(msg);
            });
        } catch (error) {
            log(error);
            if (error instanceof GoogleGenerativeAIResponseError) {
                message.channel.send(
                    "Whatever you said triggered a content filter. 🤨📸"
                );
            } else if (error instanceof GoogleGenerativeAIFetchError) {
                message.channel.send(
                    "Ratimir is getting too many requests. Try again in a few minutes."
                );
            } else {
                message.channel.send(
                    "Ratimir has been kidnapped. Please try again later. 🐀"
                );
            }
        } finally {
            // TODO: Change from setTimeout to checking in a database. E.g. person.lastMessageTime >= person.lastMessageTime + 6000
            // Remove the user from the timeout array.
            // setTimeout(() => {
            //     timeouts.splice(timeouts.indexOf(message.author.id), 1);
            // }, 6000);
        }
    }
});

client.login(TOKEN);
