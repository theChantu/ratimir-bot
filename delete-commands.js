require("dotenv").config();
const { REST, Routes } = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const rest = new REST().setToken(TOKEN);

rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] })
    .then(() => console.log("Successfully deleted all application commands."))
    .catch(console.error);

rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] })
    .then(() =>
        console.log("Successfully deleted all admin application commands.")
    )
    .catch(console.error);
