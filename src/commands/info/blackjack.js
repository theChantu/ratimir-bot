const {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder,
    MessagePayloadOption,
    ButtonStyle,
    ButtonBuilder,
    ActionRowBuilder,
    ComponentType,
    MessageFlags,
} = require("discord.js");
const { db } = require("../../database/database");
const { Blackjack, Decks } = require("../../utils/Blackjack");
const { log } = require("../../utils/log");
const { rats } = require("../../config/rats");

const choices = rats.map((rat) => {
    return {
        name: rat.name.charAt(0).toUpperCase() + rat.name.slice(1),
        value: rat.name,
    };
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName("blackjack")
        .setDescription("Gamble your rats on blackjack.")
        .addStringOption((option) =>
            option
                .setName("rat")
                .setDescription("The rat type to gamble")
                .setRequired(true)
                .addChoices(...choices)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("The amount of this rat type to gamble")
                .setRequired(true)
        ),
    /**@param {CommandInteraction} interaction  */
    async execute(interaction) {
        await interaction.deferReply();

        // TODO: Temp fix
        await db.addUser(interaction.guildId, interaction.user.id);

        const ratType = interaction.options.get("rat").value;
        const amount = interaction.options.get("amount").value;

        // Check if user has enough to gamble
        const userRats = await db.fetchUsersRats(
            interaction.guildId,
            interaction.user.id
        );
        const foundRat = userRats.find((rat) => rat.ratType === ratType);

        if (foundRat === undefined || foundRat.count < amount) {
            interaction.followUp({
                content: "You don't have enough rats! 😭",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // Remove rats from user balance
        await db.removeRat(
            interaction.guildId,
            interaction.user.id,
            ratType,
            amount
        );

        const game = new Blackjack();
        game.shuffle();
        game.start();

        /** @param {Array<{suit: string, rank: number | string}>} deck */
        function formatDeck(deck, hide = false) {
            let formattedDeck = [...deck];
            if (hide) {
                formattedDeck = formattedDeck.map((card, index) => {
                    return index === 0 ? `${card.rank}${card.suit}` : "??";
                });
            } else {
                formattedDeck = formattedDeck.map((card, index) => {
                    return `${card.rank}${card.suit}`;
                });
            }

            // 💀
            return "```" + formattedDeck.join("    ") + "```";
        }

        const embed = new EmbedBuilder();

        embed.setTitle("Blackjack").addFields([
            {
                name: "Total",
                value: "?",
                inline: true,
            },
            {
                name: `RATIMIR`,
                value: formatDeck(game.dealerDeck, true),
            },
            {
                name: "Total",
                value: `${game.playerValue}`,
                inline: true,
            },
            {
                name: `${interaction.user.globalName.toUpperCase()}`,
                value: formatDeck(game.playerDeck),
            },
        ]);

        const hit = new ButtonBuilder()
            .setCustomId("hit")
            .setLabel("HIT")
            .setStyle(ButtonStyle.Danger);

        const stand = new ButtonBuilder()
            .setCustomId("stand")
            .setLabel("STAND")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(hit, stand);

        const reply = await interaction.followUp({
            components: [row],
            embeds: [embed],
        });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 5 * 60 * 1000,
        });

        collector.on("collect", async (i) => {
            await i.deferUpdate();

            // Return if original command executer is not interacting with the buttons
            if (i.user.id !== interaction.user.id) {
                await i.followUp({
                    content: "This is not meant for you! 😡",
                    flags: MessageFlags.Ephemeral,
                });

                return;
            }

            if (i.component.customId === "hit") {
                game.deal(Decks.PLAYER, 1);

                const embed = new EmbedBuilder()
                    .setTitle("Blackjack")
                    .addFields([
                        {
                            name: "Total",
                            value: `?`,
                            inline: true,
                        },
                        {
                            name: `RATIMIR`,
                            value: formatDeck(game.dealerDeck, true),
                        },
                        {
                            name: "Total",
                            value: `${game.playerValue}`,
                            inline: true,
                        },
                        {
                            name: `${interaction.user.globalName.toUpperCase()}`,
                            value: formatDeck(game.playerDeck),
                        },
                    ]);

                /** @type {MessagePayloadOption} */
                const messagePayload = {
                    embeds: [embed],
                    components: [row],
                };

                // Player bussed smh
                if (game.playerValue > 21) {
                    const embed = new EmbedBuilder()
                        .setTitle("Blackjack")
                        .addFields([
                            {
                                name: "Total",
                                value: `${game.dealerValue}`,
                                inline: true,
                            },
                            {
                                name: `RATIMIR`,
                                value: formatDeck(game.dealerDeck),
                            },
                            {
                                name: "Total",
                                value: `${game.playerValue}`,
                                inline: true,
                            },
                            {
                                name: `${interaction.user.globalName.toUpperCase()}`,
                                value: formatDeck(game.playerDeck),
                            },
                        ]);
                    embed.setDescription(
                        `${interaction.user.globalName} lost ${amount} ${ratType} rats. 😢`
                    );

                    // Remove buttons and stop collector
                    messagePayload.components = [];
                    messagePayload.embeds = [embed];
                    collector.stop();
                }

                try {
                    await i.editReply(messagePayload);
                } catch (error) {
                    log(error);
                }
            } else if (i.component.customId === "stand") {
                while (game.dealerValue < 17) {
                    game.deal(Decks.DEALER, 1);
                }

                const embed = new EmbedBuilder()
                    .setTitle("Blackjack")
                    .addFields([
                        {
                            name: "Total",
                            value: `${game.dealerValue}`,
                            inline: true,
                        },
                        {
                            name: `RATIMIR`,
                            value: formatDeck(game.dealerDeck),
                        },
                        {
                            name: "Total",
                            value: `${game.playerValue}`,
                            inline: true,
                        },
                        {
                            name: `${interaction.user.globalName.toUpperCase()}`,
                            value: formatDeck(game.playerDeck),
                        },
                    ]);
                // Player wins
                if (
                    game.dealerValue > 21 ||
                    game.dealerValue < game.playerValue
                ) {
                    embed.setDescription(
                        `${interaction.user.globalName} won ${
                            amount * 2
                        } ${ratType} rats! 🎉`
                    );
                    await db.claimRat(
                        interaction.guildId,
                        interaction.user.id,
                        ratType,
                        amount * 2
                    );
                    // Tie
                } else if (game.dealerValue === game.playerValue) {
                    embed.setDescription(
                        `A tie? ${interaction.user.globalName} wins absolutely nothing!`
                    );
                    await db.claimRat(
                        interaction.guildId,
                        interaction.user.id,
                        ratType,
                        amount
                    );
                    // Player loses
                } else {
                    embed.setDescription(
                        `${interaction.user.globalName} lost ${amount} ${ratType} rats. 😢`
                    );
                }

                collector.stop();

                try {
                    await i.editReply({
                        embeds: [embed],
                        components: [],
                    });
                } catch (error) {
                    log(error);
                }
            }
        });

        collector.on("end", async (collected, reason) => {
            if (reason === "time") {
                const embed = new EmbedBuilder()
                    .setTitle("Blackjack")
                    .addFields([
                        {
                            name: "Total",
                            value: `${game.dealerValue}`,
                            inline: true,
                        },
                        {
                            name: `RATIMIR`,
                            value: formatDeck(game.dealerDeck),
                        },
                        {
                            name: "Total",
                            value: `${game.playerValue}`,
                            inline: true,
                        },
                        {
                            name: `${interaction.user.globalName.toUpperCase()}`,
                            value: formatDeck(game.playerDeck),
                        },
                    ])
                    .setDescription(
                        `Time has run out ${interaction.user.globalName} lost ${amount} ${ratType} rats.`
                    );
                try {
                    await reply.edit({ embeds: [embed], components: [] });
                } catch (error) {
                    log(error);
                }
            }
        });
    },
};
