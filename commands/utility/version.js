const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder} = require('discord.js');
let version = "0.2.0-dev";
module.exports = {
	data: new SlashCommandBuilder()
		.setName('botversion')
		.setDescription('Somtum Bot Version'),
	async execute(interaction) {
		// Send embed message like Somtum-Bot version 0.1.1-dev, and source code of somtum-bot: https://github.com/osu-somtum/Somtum-bot
        // make source code clickable and bottom of the embed message
        const embed = new EmbedBuilder()
            .setTitle(`Somtum-Bot version ${version}`)
            .setDescription(`[Source code of Somtum-Bot](https://github.com/osu-somtum/Somtum-bot)`)
            .setColor('#0099ff');
        await interaction.reply({ embeds: [embed] });
	},
};