const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder} = require('discord.js');
// We need http for request to bancho!api
const https = require('https');
const { bancho_domain, debug } = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('serverstatus')
		.setDescription('osu!somtum server status'),
	async execute(interaction) {
		// request API to https://api.${bancho_domain}/v1/get_player_count, we need online and total, output will be like this {"status":"success","counts":{"online":1,"total":219}}, so we need to parse it, also we need ms between request and response
        const start = Date.now();
        https.get(`https://api.${bancho_domain}/v1/get_player_count`, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                const end = Date.now();
                const api_latency = end - start;
                const { status, counts } = JSON.parse(data);
                if (status === "success") {
                    if (debug){
                    console.log(data)
                    }
                    const embed = new EmbedBuilder()
                        .setTitle(`osu!somtum Server Status`)
                        .addFields(
                            { name: 'Online Players', value: counts.online.toString(), inline: true },
                            { name: 'Registered Players', value: counts.total.toString(), inline: true },
                            { name: 'API Latency', value: `${api_latency}ms`, inline: true },
                        )
                       // lime green
                        .setColor("#32CD32")
                    interaction.reply({ embeds: [embed] });
                } else {
                    interaction.reply(`Failed to get server status, please try again later ;-;`);
                }
            });
        }).on("error", (err) => {
            interaction.reply(`Failed to get server status, please try again later ;-;`);
        });
	},
};
