const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const { token, googleapikey } = require("./config.json");
const { TextServiceClient } = require("@google-ai/generativelanguage").v1beta2;
const { GoogleAuth } = require("google-auth-library");
const { DiscussServiceClient } = require("@google-ai/generativelanguage");
const MODEL_NAME = "models/chat-bison-001";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();
client.cooldowns = new Collection();

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

const googleClient = new DiscussServiceClient({
    authClient: new GoogleAuth().fromAPIKey(googleapikey),
});

const timeouts = [];

client.on("messageCreate", async (message) => {
    if (timeouts.includes(message.author.id)) return;

    if (
        !message.author.bot &&
        message.content.startsWith("<@1078379206926405802>")
    ) {
        // First add the user to the timeout array.
        timeouts.push(message.author.id);

        try {
            await message.channel.sendTyping();

            let messages = [];
            let prevMessages = await message.channel.messages.fetch({
                limit: 5,
            });
            prevMessages.reverse();
            prevMessages.forEach((msg) => {
                if (msg.author.id === "1078379206926405802") {
                    messages.push({ content: `${msg.content}` });
                } else {
                    messages.push({
                        content: `${msg.content}`,
                    });
                }
            });
            console.log(messages);

            const result = await googleClient.generateMessage({
                model: MODEL_NAME,
                temperature: 0.2,
                candidateCount: 1,
                prompt: {
                    context: "You are an aggressive rat named Ratimir.",
                    messages: messages,
                    disable_filters: true,
                },
            });

            // If the message contains a bad word, the API will return a filter.
            if (result[0].filters.length > 0) {
                console.log(result[0].filters);
                message.channel.send(
                    "Whatever you said triggered a content filter. 🤨"
                );
                setTimeout(() => {
                    timeouts.splice(timeouts.indexOf(message.author.id), 1);
                }, 6000);
                return;
            }

            const messageArray = checkMessage(result[0].candidates[0].content);
            messageArray.forEach((msg) => {
                message.channel.send(msg);
            });

            setTimeout(() => {
                timeouts.splice(timeouts.indexOf(message.author.id), 1);
            }, 6000);
        } catch (error) {
            console.log(error);
            message.channel.send("A Ratimerror has occured. 🐀");
            // Remove the user from the timeout array even when error occurs.
            setTimeout(() => {
                timeouts.splice(timeouts.indexOf(message.author.id), 1);
            }, 6000);
        }
    }
});

const COOLMESSAGES = [
    "It's not. 💀",
    "No.",
    "Maybe? 🤔",
    "Nope.",
    "I don't know.",
    "Yes.",
    "I guess.",
    "I don't think so.",
    "I think so.",
    "It is.",
];
// OPTIMIZATION????????????????
const COOLMESSAGESLENGTH = COOLMESSAGES.length;

client.on("messageCreate", async (message) => {
    if (
        !message.author.bot &&
        message.content.toLowerCase().startsWith("is ")
    ) {
        message.channel.send(
            COOLMESSAGES[Math.floor(Math.random() * COOLMESSAGESLENGTH)]
        );
    }
});

client.login(token);
