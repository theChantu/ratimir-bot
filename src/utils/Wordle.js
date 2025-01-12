const events = require("events");
const {
    ActionRowBuilder,
    CommandInteraction,
    ButtonStyle,
    ComponentType,
    ButtonBuilder,
    EmbedBuilder,
    MessageCollector,
    MessagePayload,
} = require("discord.js");
const Canvas = require("@napi-rs/canvas");
const { MIN_WORD_LENGTH, MAX_WORD_LENGTH } = require("../config/globals");
const words = require("../database/words.json");
const { AttachmentBuilder } = require("discord.js");

class Wordle extends events {
    /** @param {CommandInteraction} interaction @param {Number} wordLength @param {Number} attempts   */
    constructor(interaction, wordLength, attempts) {
        if (wordLength < MIN_WORD_LENGTH || wordLength > MAX_WORD_LENGTH)
            throw new RangeError(
                `INVALID_NUMBER: Word length must be between ${MIN_WORD_LENGTH} and ${MAX_WORD_LENGTH}`
            );

        super();

        this.interaction = interaction;
        this.guesses = [];
        this.wordLength = wordLength;
        this.attempts = attempts;
        this.word;
    }

    async start() {
        await this.interaction.deferReply().catch(() => {});

        const length = words[this.wordLength].length;

        this.word = words[this.wordLength][Math.floor(Math.random() * length)];

        const attachment = await this.generateAttachment();

        const embed = new EmbedBuilder()
            .setTitle("WORDLE")
            .setDescription(
                "🤔 Type !(your guess) in chat to attempt to guess the word."
            )
            .setImage("attachment://wordle.png");

        await this.sendMessage({
            embeds: [embed],
            files: [attachment],
        });

        const collectorFilter = (m) =>
            m.author.id === this.interaction.user.id &&
            m.content.startsWith("!");

        /** @type {MessageCollector} */
        const collector = await this.interaction.channel.createMessageCollector(
            {
                filter: collectorFilter,
                time: 5 * 60 * 1000,
            }
        );

        collector.on("collect", async (i) => {
            const guess = i.content.toLowerCase().replace(/[^a-z]/g, "");

            if (i.deletable) await i.delete().catch(() => {});

            if (
                guess.length !== this.wordLength ||
                this.guesses.includes(guess)
            )
                return;

            this.guesses.push(guess);

            const attachment = await this.generateAttachment();

            const embed = new EmbedBuilder()
                .setTitle("WORDLE")
                .setDescription(
                    "🤔 Type !(your guess) in chat to attempt to guess the word."
                )
                .setImage("attachment://wordle.png");

            await this.sendMessage({ embeds: [embed], files: [attachment] });

            if (guess === this.word) {
                collector.stop();
                this.emit("win");
            } else if (this.guesses.length === this.attempts) {
                this.emit("lose");
                collector.stop();
            }
        });

        collector.on("end", async (collected, reason) => {
            if (reason === "time") {
                const description = `Time has run out the word was ${this.word.toUpperCase()}.`;

                const attachment = await this.generateAttachment();

                const embed = new EmbedBuilder()
                    .setTitle("WORDLE")
                    .setImage("attachment://wordle.png")
                    .setDescription(description);

                await this.sendMessage({
                    embeds: [embed],
                    files: [attachment],
                });
            }
        });
    }

    /** @param {MessagePayload} content  */
    async sendMessage(content) {
        return await this.interaction.editReply(content).catch(() => {});
    }

    async generateAttachment() {
        const boxSize = 50;
        const padding = 10;
        const width = (boxSize + padding) * this.wordLength - padding;
        const height = (boxSize + padding) * this.attempts - padding;

        const canvas = Canvas.createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        for (let i = 0; i < this.attempts; i++) {
            if (this.guesses[i] !== undefined) {
                [...this.guesses[i]].forEach((letter, j) => {
                    const x = j * (boxSize + padding);
                    const y = i * (boxSize + padding);

                    // Draw box
                    if (this.word[j] !== letter && this.word.includes(letter)) {
                        ctx.fillStyle = "#b59f3b";
                    } else if (this.word[j] === letter) {
                        ctx.fillStyle = "#538d4e";
                    } else {
                        ctx.fillStyle = "gray";
                    }
                    ctx.fillStyle = ctx.fillRect(x, y, boxSize, boxSize);

                    // Draw letter
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "30px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(
                        letter.toUpperCase(),
                        x + boxSize / 2,
                        y + boxSize / 2
                    );
                });
            } else {
                for (let j = 0; j < this.wordLength; j++) {
                    const x = j * (boxSize + padding);
                    const y = i * (boxSize + padding);

                    // Draw box
                    ctx.fillStyle = "gray";
                    ctx.fillStyle = ctx.fillRect(x, y, boxSize, boxSize);
                }
            }
        }

        const image = await canvas.encode("png").catch(() => {});

        const attachment = new AttachmentBuilder(image, { name: "wordle.png" });

        return attachment;
    }
}

module.exports = {
    Wordle,
};
