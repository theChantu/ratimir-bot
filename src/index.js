require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
const { stringify } = require('querystring');

function propagandaify(message) {
    message = message.replace('OpenAI', 'Ratimir');
    return message;
}

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.on('ready', async (c) => {
    console.log(`${c.user.tag} is online.`);

    c.user.setPresence({
        activities: [{ name: '@Ratimir message' }],
    });
});

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith('!')) return;

    if (message.content.startsWith('<@1078379206926405802>')) {
        let conversationLog = [
            { role: 'system', content: 'You are friendly rat. ' },
        ];

        await message.channel.sendTyping();

        let prevMessages = await message.channel.messages.fetch({ limit: 20 });
        prevMessages.reverse();

        prevMessages.forEach((msg) => {
            if (message.content.startsWith('!')) return;
            if (msg.author.id !== client.user.id && message.author.bot) return;
            if (msg.author.id !== message.author.id) return;

            conversationLog.push({
                role: 'user',
                content: msg.content,
            });
        });

        const result = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: conversationLog,
        });

        message.channel.send(propagandaify(result.data.choices[0].message.content));        

        fs.appendFile('debug.txt', JSON.stringify(conversationLog), (err) => {
            if (err) {
                console.err;
                return;
            }
        });
    }

    /*fs.appendFile('debug.txt', JSON.stringify(result.data), (err) => {
        if (err) {
            console.err;
            return;
        }
    });*/
});

client.login(process.env.TOKEN);
