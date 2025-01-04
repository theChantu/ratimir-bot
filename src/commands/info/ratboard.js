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
        .setDescription("A board with rats."),
    /**@param {CommandInteraction} interaction  */
    async execute(interaction) {
        const guild = await db.fetchUsersRats(interaction.guildId);
        const embed = new EmbedBuilder();

        const filteredGuild = guild.filter((user) => user.count > 0);

        // TODO: Limit to only 10 users displayed so that the 6000 character limited isn't exceeded
        /** @type {Array<{name: string, value: Number}>} */
        const formattedGuild = filteredGuild.reduce((result, obj) => {
            const existingGroup = result.find(
                (group) => group.name === obj.userId
            );
            if (existingGroup) {
                existingGroup.value += obj.count;
            } else {
                result.push({
                    name: obj.userId,
                    value: obj.count,
                });
            }
            return result;
        }, []);

        const sortedGuild = formattedGuild.sort((a, b) => b.value - a.value);

        const fields = [];

        for (const [index, user] of sortedGuild.entries()) {
            fields.push({
                name: `${(index + 1).toString()}.`,
                value: `<@${user.name}> ${user.value.toString()}`,
            });
        }

        embed
            .setTitle(`${interaction.guild.name} Leaderboard`)
            .setColor("Random")
            .setFields(fields);

        /** @type {MessagePayload} */
        const messagePayload = {
            embeds: [embed],
        };

        await interaction.reply(messagePayload);
    },
};
