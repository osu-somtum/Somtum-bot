const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder} = require('discord.js');
// We need http for request to bancho!api
const https = require('https');
const { bancho_domain, debug } = require('../../config.json');

async function getonlinelist() {
    return new Promise((resolve, reject) => {
        // WARNING: If you modding bancho.py too much like akatuski.py, this maybe won't work
        const url = `https://c.${bancho_domain}/online`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                    // remove first 5 characters, which is "Back "
                    // output should be like this 
                    // users:
                    // bots:
                    // (1): banchobot
                    // not include HTML tags like
                    // <body style="font-family: monospace;  white-space: pre-wrap;"><a href="/">back</a>

                    // remove HTML tags
                    data = data.replace(/<[^>]*>/g, '');
                    // remove "Back "
                    data = data.substring(5);
                    const online_list = data;
                    resolve(online_list);
            });
        });
    });
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('serverstatus')
		.setDescription('osu!somtum server status'),
	async execute(interaction) {
        // Request to bancho
        let online_data = await getonlinelist();
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
                            { name: 'Online List', value: `\`\`\`${online_data}\`\`\``, inline: false },
                        )
                        // add thumbnail https://somtum.fun/static/images/somtum.png
                        .setThumbnail('https://somtum.fun/static/images/somtum.png')
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
