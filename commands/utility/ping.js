const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		// getting latency from discord api
		const latency = Date.now() - interaction.createdTimestamp;
		await interaction.reply(`Pong! Latency is ${latency}ms. API Latency is ${Math.round(interaction.client.ws.ping)}ms.`);
	},
};