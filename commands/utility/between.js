const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder} = require('discord.js');
// We need http for request to bancho!api
const https = require('https');
const { bancho_domain, debug } = require('../../config.json');

async function getPlayersPP(id, mode) {
    return new Promise((resolve, reject) => {
        const url = `https://api.${bancho_domain}/v1/get_player_info?id=${id}&scope=all`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const result = JSON.parse(data);
                if (result.status === 'success') {
                    if (debug){
                    console.log(result.player.stats[mode].pp);
                    }
                    const player_pp = result.player.stats[mode].pp;
                    resolve(player_pp);
                } else {
                    reject('Failed to get player status');
                }
            });
        });
    });
}

async function SearchUsername(username) {
    return new Promise((resolve, reject) => {
        const url = `https://api.${bancho_domain}/v1/search_players?q=${username}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const result = JSON.parse(data);
                if (result.status === 'success') {
                try{
                   const player_id = result.result[0].id;
                     resolve(player_id);
                }
                catch (error) {
                    reject('Username not found');
                }
                } else {
                    reject('Failed to get player status');
                }
            });
        });
    });
}

// Get player rank
async function getPlayersRank(id, mode) {
    return new Promise((resolve, reject) => {
        const url = `https://api.${bancho_domain}/v1/get_player_info?id=${id}&scope=all`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const result = JSON.parse(data);
                if (result.status === 'success') {
                    if (debug){
                    console.log(result.player.stats[mode].rank);
                    }
                    const player_rank = result.player.stats[mode].rank;
                    resolve(player_rank);
                } else {
                    reject('Failed to get player status');
                }
            });
        });
    });
}
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

    // let search username for username1 and username2
    let user_id1 = 0;
    let user_id2 = 0;
    try {
    user_id1 = await SearchUsername(username1);
    user_id2 = await SearchUsername(username2);
    }
    catch (error) {
        await interaction.reply(`Username of ${username1} not found`);
        return;
    }
    try {
    
    }
    catch (error) {
        await interaction.reply(`Username of ${username2} not found`);
        return;
    }
    let player_pp1 = await getPlayersPP(user_id1, mode_num);
    let player_pp2 = await getPlayersPP(user_id2, mode_num);
    let player_rank1 = await getPlayersRank(user_id1, mode_num);
    let player_rank2 = await getPlayersRank(user_id2, mode_num);
    // make embed like, {username1} pp: {pp1}, {username2} pp: {pp2}, difference: {difference}
    // if pp1 > pp2, difference = pp1 - pp2, else difference = pp2 - pp1
    // if pp1 > pp2, {username1} is better than {username2}, else {username2} is better than {username1}
    let difference = 0;
    let better = '';
    if (player_pp1 > player_pp2) {
        difference = player_pp1 - player_pp2;
        better = `So that mean ${username2} need ${difference}pp to beat ${username1}`;
    } else {
        difference = player_pp2 - player_pp1;
        better = `So that mean ${username1} need ${difference}pp to beat ${username2}`;
    }
    const embed = new EmbedBuilder()
        .setTitle(`PP between ${username1} and ${username2}`)
        .addFields(
            { name: `${username1} (#${player_rank1})`, value: player_pp1.toString() + "pp", inline: true },
            { name: `${username2} (#${player_rank2})`, value: player_pp2.toString() + "pp", inline: true },
            { name: 'Difference', value: difference.toString() + "pp" , inline: true },
            { name: 'Result', value: better, inline: false}

        )
        // lime green color
        .setColor('#00FF00');
    await interaction.reply({ embeds: [embed] });
	},
};