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
    MessageCollectorOptions,
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

        /** @type {MessageCollectorOptions} */
        const collectorOptions = {
            filter: collectorFilter,
            idle: 5 * 60 * 1000,
        };
        /** @type {MessageCollector} */
        const collector = await this.interaction.channel.createMessageCollector(
            collectorOptions
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

            if (guess === this.word || this.guesses.length >= this.attempts)
                collector.stop();

            const attachment = await this.generateAttachment();

            const embed = new EmbedBuilder()
                .setTitle("WORDLE")
                .setDescription(
                    "🤔 Type !(your guess) in chat to attempt to guess the word."
                )
                .setImage("attachment://wordle.png");

            await this.sendMessage({ embeds: [embed], files: [attachment] });

            if (this.guesses.length >= this.attempts && guess !== this.word) {
                this.emit("lose");
            } else if (guess === this.word) {
                this.emit("win");
            }
        });

        collector.on("end", async (collected, reason) => {
            if (reason === "idle") {
                const description = `The game has ended due to inactivity. The word was **${this.word.toUpperCase()}**`;

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
                const guess = this.guesses[i];
                const remainingLetters = this.word.split("");
                const letters = [];

                for (let j = 0; j < this.word.length; j++) {
                    if (this.word[j] === guess[j]) {
                        const indexOfLetter = remainingLetters.findIndex(
                            (element) => element === guess[j]
                        );
                        remainingLetters.splice(indexOfLetter, 1);
                        letters[j] = 2;
                    } else {
                        letters[j] = 0;
                    }
                }

                for (let j = 0; j < this.word.length; j++) {
                    if (
                        this.word[j] !== guess[j] &&
                        remainingLetters.includes(guess[j])
                    ) {
                        letters[j] = 1;
                    }
                }

                for (let j = 0; j < letters.length; j++) {
                    const x = j * (boxSize + padding);
                    const y = i * (boxSize + padding);

                    if (letters[j] === 2) {
                        // GREEN
                        ctx.fillStyle = "#538d4e";
                    } else if (letters[j] === 1) {
                        // YELLOW
                        ctx.fillStyle = "#b59f3b";
                    } else {
                        // GRAY
                        ctx.fillStyle = "gray";
                    }

                    ctx.fillStyle = ctx.fillRect(x, y, boxSize, boxSize);

                    // Draw letter
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "30px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(
                        guess[j].toUpperCase(),
                        x + boxSize / 2,
                        y + boxSize / 2
                    );
                }
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
