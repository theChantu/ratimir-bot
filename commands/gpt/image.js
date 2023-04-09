const { SlashCommandBuilder, PermissionFlagsBits, ApplicationCommand, ApplicationCommandOptionType } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('image')
        .setDescription('Generate an image from Ratimir.'),
        options: [
            {
                name: 'prompt',
                description: 'Image to generate.',
                required: true,
                type: 3,
            }
        ],
    async execute(interaction) {
        console.log(interaction.options.get('prompt'));
        const prompt = await interaction.options.get('prompt').value;

        const result = await openai.createImage({
            prompt: `${prompt}`,
            n: 1,
            size: '1024x1024',
        });
        const image_url = result.data.data[0].url;
        await interaction.reply({
            content: `${image_url}`,
        });
    },
};
