const {
    ClientUser,
    ActionRowBuilder,
    ButtonBuilder,
    Message,
    TextChannel,
    ChannelType,
} = require("discord.js");
const { getRandomRat } = require("../utils/getRandomRat");
const stateManager = require("../utils/StateManager");
const { updateServer } = require("../database/database");
const { log } = require("../utils/log");

const DELETE_MESSAGE_TIME = 30000;

// TODO: Move server loop to startup event function (so that this function only handles 1 thing)
// This function will then take a server ID, and channel ID (might not be required)
/**
 * @param {Client} client
 * @param {string} channelId
 */
async function spawnRat(client, channelId) {
    const randomRat = getRandomRat();
    const [ratName, ratWeight, ratImg] = randomRat;
    const row = new ActionRowBuilder();

    row.addComponents(
        new ButtonBuilder().setCustomId(ratName).setLabel("Catch").setStyle(3)
    );
    const messageObject = {
        content: `A ${ratName}!`,
        components: [row],
    };
    /**@type {TextChannel} */
    const channel = await client.channels.fetch(channelId);
    /** @type {Message}*/
    const message = await channel.send(messageObject);
    await updateServer(channel.guildId, Number(true));

    // FIXME: This will also update the database to the same Date.now()
    stateManager.set("timeSinceLastRatSpawn", Date.now());

    // 1 minute interval TODO: Change to 60000
    // TODO: Once a message is deleted from catching or some other way, try and find a way to cancel this interval immediately
    const interval = setInterval(async () => {
        log("Message edit interval running...");
        const channel = client.channels.cache.get(channelId);
        // Handle case where channel mysteriously disappears
        if (!channel) {
            await updateServer(channel.guild.id, Number(false));
            clearInterval(interval);
            return;
        }

        // FIXME: Add a new column for servers called timeSinceLastRatSpawn
        // This current method doesn't work well because the time will be set again whenever a new rat is spawned for a different server
        // And the calculations won't work properly
        // The issue is that whenever a rat is spawned, the date will get updated and some messages won't delete at the right time because they pull from that updated date
        const timeSinceLastRatSpawn = stateManager.get("timeSinceLastRatSpawn");
        log("timeSinceLastRatSpawn:", timeSinceLastRatSpawn);
        channel.messages
            .fetch(message.id)
            .then((msg) => {
                if (Date.now() >= timeSinceLastRatSpawn + DELETE_MESSAGE_TIME) {
                    msg.edit({
                        content: "*blows up*",
                        components: [],
                    });
                    setTimeout(async () => {
                        msg.delete(3000).catch((error) => {
                            log(error);
                            updateServer(channel.guild.id, Number(false));
                        });
                    }, 3000);
                    updateServer(channel.guild.id, Number(false));
                    clearInterval(interval);
                    return;
                }

                // Pull timeSinceLastRatSpawn from database for more accurate data
                const timeUntilDestruction =
                    timeSinceLastRatSpawn + DELETE_MESSAGE_TIME - Date.now();
                log("timeUntilDestruction:", timeUntilDestruction / 1000 / 60);

                msg.edit({
                    content: `A ${ratName}! This message will self destruct in ${Math.floor(
                        timeUntilDestruction / 1000 / 60
                    )} minutes.`,
                });
            })
            .catch((error) => {
                log(error);
                log("Spawned rat message not found.");
                updateServer(channel.guild.id, Number(false));
                clearInterval(interval);
                return;
            });
    }, 10000);
}
// console.log(channel);

// Select specific channel for now
// TODO: Handle case where no channel has any messages (just use random channel)
// TODO: This has to do channels in multiple servers. It's currently only picking the first channel it finds
// TODO: Try to figure out how to split the channels into multiple arrays, each array being a different server
//     try {
//         const serverList = client.channels.cache
//             .filter((channel) => channel.type === 0)
//             .reduce((result, obj) => {
//                 (result[obj.guildId] = result[obj.guildId] || []).push(obj);
//                 return result;
//             }, []);

//         for (const server of Object.values(serverList)) {
//             let channelId = null;
//             let messageTimestamp = null;

//             for (const channel of Object.values(server)) {
//                 console.log(
//                     "Rat Spawned?",
//                     await getRatSpawned(channel.guild.id)
//                 );
//                 if ((await getRatSpawned(channel.guild.id)) == false) {
//                     try {
//                         // FIXME: Trycatch as a work around because sometimes it can't find a message using the message id
//                         // No other channels have been found so default to the first one
//                         if (channelId === null) {
//                             channelId = await channel.id;
//                             const messageId = await channel.lastMessageId;
//                             const lastChannelMessage =
//                                 await channel.messages.fetch(messageId);
//                             messageTimestamp =
//                                 lastChannelMessage.createdTimestamp;
//                         } else {
//                             const messageId = await channel.lastMessageId;
//                             const lastChannelMessage =
//                                 await channel.messages.fetch(messageId);
//                             if (
//                                 lastChannelMessage.createdTimestamp >=
//                                 messageTimestamp
//                             ) {
//                                 channelId = await channel.id;
//                                 messageTimestamp =
//                                     lastChannelMessage.createdTimestamp;
//                             }
//                         }
//                     } catch (error) {
//                         log(error);
//                         if (error.code === 10008) {
//                             continue;
//                         }
//                     }
//                 } else {
//                     console.log("Rat already spawned in this channel.");
//                 }
//             }

//             // channelId will be null when a server has ratSpawned set to true
//             if (channelId !== null) {
//                 const randomRat = getRandomRat();
//                 const [ratName, ratWeight, ratImg] = randomRat;
//                 const row = new ActionRowBuilder();

//                 row.addComponents(
//                     new ButtonBuilder()
//                         .setCustomId(ratName)
//                         .setLabel("Catch")
//                         .setStyle(3)
//                 );
//                 const messageObject = {
//                     content: `A ${ratName}!`,
//                     components: [row],
//                 };
//                 /**@type {TextChannel} */
//                 const channel = await client.channels.fetch(channelId);
//                 /** @type {Message}*/
//                 const message = await channel.send(messageObject);
//                 await updateServer(channel.guildId, Number(true));
//                 timeSinceLastRatSpawn = Date.now();

//                 // 1 minute interval TODO: Change to 60000
//                 // TODO: Once a message is deleted from catching or some other way, try and find a way to cancel this interval immediately
//                 const interval = setInterval(async () => {
//                     console.log("Message edit interval running...");
//                     const channel = client.channels.cache.get(channelId);
//                     // Handle case where channel mysteriously disappears
//                     if (!channel) {
//                         await updateServer(channel.guild.id, Number(false));
//                         clearInterval(interval);
//                         return;
//                     }
//                     channel.messages
//                         .fetch(message.id)
//                         .then((msg) => {
//                             if (
//                                 Date.now() >=
//                                 timeSinceLastRatSpawn + DELETE_MESSAGE_TIME
//                             ) {
//                                 msg.edit({
//                                     content: "*blows up*",
//                                     components: [],
//                                 });
//                                 setTimeout(async () => {
//                                     msg.delete(3000).catch((error) => {
//                                         log(error);
//                                         updateServer(
//                                             channel.guild.id,
//                                             Number(false)
//                                         );
//                                     });
//                                 }, 3000);
//                                 updateServer(channel.guild.id, Number(false));
//                                 clearInterval(interval);
//                                 return;
//                             }

//                             const timeUntilDestruction =
//                                 timeSinceLastRatSpawn +
//                                 DELETE_MESSAGE_TIME -
//                                 Date.now();
//                             msg.edit({
//                                 content: `Oh shit! A rat! This message will self destruct in ${Math.floor(
//                                     timeUntilDestruction / 1000 / 60
//                                 )} minutes.`,
//                             });
//                         })
//                         .catch((error) => {
//                             log(error);
//                             log("Spawned rat message not found.");
//                             updateServer(channel.guild.id, Number(false));
//                             clearInterval(interval);
//                             return;
//                         });
//                 }, 10000);
//             }
//         }
//     } catch (error) {
//         log(error);
//     }
// }

module.exports = {
    spawnRat,
};
