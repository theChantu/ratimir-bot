const { Message } = require("discord.js");
const { log } = require("../utils/log");
const { db } = require("../database/database");
const {
    MESSAGE_EDIT_INTERVAL_RATE,
    DELETE_MESSAGE_TIME,
} = require("../config/globals");

/** @param {Message} message  */
function addRatMessageInterval(message, rat) {
    // Store in case this shit gets deleted some time after interval runs
    const { guildId, id } = message;

    const [ratName, ratWeight, ratImg] = rat;

    const interval = setInterval(async () => {
        log("Message edit interval running...");

        const timeSinceLastRatSpawn = await db.getTimeSinceLastRatSpawn(
            guildId
        );
        log("timeSinceLastRatSpawn:", timeSinceLastRatSpawn);

        try {
            if (Date.now() >= timeSinceLastRatSpawn + DELETE_MESSAGE_TIME) {
                await message.edit({
                    content: "*blows up*",
                    components: [],
                });
                // setTimeout(async () => {
                //     message.delete(3000).catch((error) => {
                //         log(error);
                //         db.updateRatSpawned(channel.guild.id, false);
                //     });
                // }, 3000);
                await message.delete();
                await db.updateRatSpawned(guildId, false);
                await db.removeRatMessage(id);
                clearInterval(interval);
                return;
            }

            const timeUntilDestruction =
                timeSinceLastRatSpawn + DELETE_MESSAGE_TIME - Date.now();
            log("timeUntilDestruction:", timeUntilDestruction / 1000 / 60);

            await message.edit({
                content: `A ${ratName}! This message will self destruct in ${Math.floor(
                    timeUntilDestruction / 1000 / 60
                )} minutes.`,
            });
        } catch (error) {
            if (error.code === 10008) {
                log("index: Message not found.");
            } else {
                log(error);
            }

            await db.updateRatSpawned(guildId, false);
            await db.removeRatMessage(id);
            clearInterval(interval);
        }
    }, MESSAGE_EDIT_INTERVAL_RATE);

    // return () => clearInterval(interval);
}

module.exports = {
    addRatMessageInterval,
};
