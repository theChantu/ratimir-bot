const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const { token } = require('./config.json');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
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

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        }
    }
});

client.once('ready', async (c) => {
    console.log(`${c.user.tag} is online.`);

    c.user.setPresence({
        activities: [{ name: '/ratimir' }],
    });
});

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

client.on('messageCreate', async (message) => {
    if (
        !message.author.bot &&
        message.content.startsWith('<@1078379206926405802>')
    ) {
        try {
            let conversationLog = [
                { role: 'system', content: 'You are a rat named Ratimir.' },
            ];
            let prevMessages = await message.channel.messages.fetch({
                limit: 5,
            });
            prevMessages.reverse();
            prevMessages.forEach((msg) => {
                if (msg.author.id === '1078379206926405802') {
                    conversationLog.push({
                        role: 'assistant',
                        content: msg.content,
                    });
                } else if (msg.content.startsWith('<@1078379206926405802>')) {
                    msg.content = msg.content.replace(
                        '<@1078379206926405802>',
                        ''
                    );
                    conversationLog.push({
                        role: 'user',
                        content: msg.content,
                    });
                }
            });
            await message.channel.sendTyping();
            const result = await openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: conversationLog,
            });
            const messageArray = checkMessage(
                result.data.choices[0].message.content
            );
            for (let i = 0; i < messageArray.length; i++) {
                message.channel.send(messageArray[i]);
            }
        } catch (error) {
            console.log(error);
            message.channel.send(
                'Ratimir is experiencing some issues right now. Try again later.'
            );
        }
    }
});

client.login(token);
