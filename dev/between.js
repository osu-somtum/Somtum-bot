const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder} = require('discord.js');
// We need http for request to bancho!api
const https = require('https');
const { bancho_domain } = require('../../config.json');
module.exports = {
	data: new SlashCommandBuilder()
    .setName('between')
    .setDescription('pp between player and player')
    .addStringOption(option =>
        option.setName('username1')
            .setDescription('Username to search')
            .setRequired(true))
    .addStringOption(option =>
                option.setName('username2')
                .setDescription('Username to search')
                .setRequired(true))
    .addStringOption(option =>
        option.setName('mode')
            .setDescription('Gamemode to between')
            .setRequired(true)
            .addChoices(
                { name: 'osu!std', value: 'std' },
                { name: 'osu!std (Relax)', value: 'std_rx' },
                { name: 'osu!std (Autopilot)', value: 'std_ap' },
                { name: 'osu!Taiko', value: 'taiko' },
                { name: 'osu!Taiko (Relax)', value: 'taiko_rx' },
                { name: 'osu!Catch', value: 'catch' },
                { name: 'osu!Catch (Relax)', value: 'catch_rx' },
                { name: 'osu!mania', value: 'mania' },
            )),
	async execute(interaction) {
        const username1 = interaction.options.getString('username1');
        const username2 = interaction.options.getString('username2');
        let mode_num = 0;
        // change mode to number
        switch (interaction.options.getString('mode')) {
            case 'std':
                mode_num = 0;
                break;
            case 'std_rx':
                mode_num = 4;
                break;
            case 'std_ap':
                mode_num = 8;
                break;
            case 'taiko':
                mode_num = 1;
                break;
            case 'taiko_rx':
                mode_num = 5;
                break;
            case 'catch':
                mode_num = 2;
                break;
            case 'catch_rx':
                mode_num = 6;
                break;
            case 'mania':
                mode_num = 3;
                break;
        }
    // Search 2 players to api, and get they id, and use id to get pp of 2 players
    // this kinda like search.js but we need only id and pp of 2 players
    //const urlcheck = `https://api.${bancho_domain}/v1/search_players?q=${username1}`;
    //const ppurl = `https://api.${bancho_domain}/v1/get_player_info?id=${id}&scope=all`;
    // request to get userid by https://api.${bancho_domain}/v1/search_players?q=${username1,2}
    // request to get pp by https://api.${bancho_domain}/v1/get_player_info?id=${id}&scope=all
    // stats[mode_num].pp is pp of player
    // stats[mode_num].rank is rank of player

    // let search username for username1
    const url = `https://api.${bancho_domain}/v1/search_players?q=${username1}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const { status, players } = JSON.parse(data);
                if (status === "success") {
                    if (data.length === 0) {
                        interaction.reply(`Player ${username1} not found ;-;`);
                        return;
                    }
                    const id1 = players[0].id;
                    // request to get pp by https://api.${bancho_domain}/v1/get_player_info?id=${id}&scope=all
                    const ppurl = `https://api.${bancho_domain}/v1/get_player_info?id=${id1}&scope=all`;
                    https.get(ppurl, (resp) => {
                        let data = '';
                        resp.on('data', (chunk) => {
                            data += chunk;
                        });
                        resp.on('end', () => {
                            const { status, stats } = JSON.parse(data);
                            if (status === "success") {
                                const pp1 = stats[mode_num].pp;
                                const rank1 = stats[mode_num].rank;
                                // let search username for username2
                                const url = `https://api.${bancho_domain}/v1/search_players?q=${username2}`;
                                https.get(url, (res) => {
                                    let data = '';
                                    res.on('data', (chunk) => {
                                        data += chunk;
                                    });
                                    res.on('end', () => {
                                        const { status, players } = JSON.parse(data);
                                        if (status === "success") {
                                            if (players.length === 0) {
                                                interaction.reply(`Player ${username2} not found ;-;`);
                                                return;
                                            }
                                            const id2 = players[0].id;
                                            // request to get pp by https://api.${bancho_domain}/v1/get_player_info?id=${id}&scope=all
                                            const ppurl = `https://api.${bancho_domain}/v1/get_player_info?id=${id2}&scope=all`;
                                            https.get(ppurl, (resp) => {
                                                let data = '';
                                                resp.on('data', (chunk) => {
                                                    data += chunk;
                                                });
                                                resp.on('end', () => {
                                                    const { status, stats } = JSON.parse(data);
                                                    if (status === "success") {
                                                        const pp2 = stats[mode_num].pp;
                                                        const rank2 = stats[mode_num].rank;
                                                        // calculate pp between 2 players
                                                        const ppbetween = pp1 - pp2;
                                                        const rankbetween = rank1 - rank2;
                                                        // output pp between 2 players
                                                        const embed = new EmbedBuilder()
                                                            .setTitle(`PP between ${username1} and ${username2}`)
                                                            .addFields(
                                                                { name: `${username1}`, value: `PP: ${pp1} | Rank: ${rank1}`, inline: true },
                                                                { name: `${username2}`, value: `PP: ${pp2} | Rank: ${rank2}`, inline: true },
                                                                { name: 'PP Difference', value: ppbetween.toString(), inline: true },
                                                                { name: 'Rank Difference', value: rankbetween.toString(), inline: true },
                                                            )
                                                            .setColor('#0099ff');
                                                        interaction.reply({ embeds: [embed] });
                                                    }
                                                }
                                                );
                                            }
                                            ).on("error", (err) => {
                                                interaction.reply(`Failed to get player info, please try again later ;-;`);
                                            });
                                        }
                                    }
                                    );
                                }
                                ).on("error", (err) => {
                                    interaction.reply(`Failed to get player info, please try again later ;-;`);
                                });
                            }
                        }
                        );
                    }
                    ).on("error", (err) => {
                        interaction.reply(`Failed to get player info, please try again later ;-;`);
                    });
                }
            }
            );
        }
        ).on("error", (err) => {
            interaction.reply(`Failed to get player info, please try again later ;-;`);
        });
	},
};