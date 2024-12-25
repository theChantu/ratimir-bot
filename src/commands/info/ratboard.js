const {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder,
    MessagePayload,
} = require("discord.js");
const { db } = require("../../database/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ratboard")
        .setDescription("YOU WHAT?!?!"),
    /**@param {CommandInteraction} interaction  */
    async execute(interaction) {
        const guild = await db.fetchUsersRats(interaction.guildId);
        const embed = new EmbedBuilder();

        // TODO: Limit to only 10 users displayed so that the 6000 character limited isn't exceeded
        /** @type {Array<{userId: string, value: Number}>} */
        const formattedGuild = guild.reduce((result, obj) => {
            const existingGroup = result.find(
                (group) => group.userId === obj.userId
            );
            if (existingGroup) {
                existingGroup.value += obj.count;
            } else {
                result.push({
                    userId: obj.userId,
                    value: obj.count,
                });
            }
            return result;
        }, []);

        const sortedGuild = formattedGuild.sort((a, b) => b.value - a.value);

        let string = "";
        for (const user of sortedGuild) {
            string += `<@${user.userId}>: ${user.value} rats\n`;
        }

        embed
            .setTitle(`${interaction.guild.name} Ratboard`)
            .setDescription(string)
            .setColor("Random");

        /** @type {MessagePayload} */
        const messagePayload = {
            embeds: [embed],
        };

        await interaction.reply(messagePayload);
    },
};
