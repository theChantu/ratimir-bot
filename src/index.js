require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.on('ready', (c) => {
    console.log(`${c.user.tag} is online.`)
})

client.on('messageCreate', (message) => {
    //console.log(message.content[0]);
    let stringLower = message.content.toLowerCase();
    if (!message.author.bot) {
        for (let i = 0; i < stringLower.length; i++) {
            if (stringLower[i] === 'r' && stringLower[i + 1] === 'a' && stringLower[i + 2] === 't') {
                message.reply('🐀');
            }
        }
    }
})

client.login(process.env.TOKEN);
