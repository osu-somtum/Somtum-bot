// TODO, getting user info from api v1/search_players?q=${username}
// If result than 1 like {"status":"success","results":2,"result":[{"id":5,"name":"UZQueen"},{"id":198,"name":"Uzachi"}]}, tell them list of username
// else if like this {"status":"success","results":0,"result":[]}, tell them username not found
// but if like this {"status":"success","results":1,"result":[{"id":5,"name":"UZQueen"}]}, now we will request to /v1/get_player_info?id=${id}&scope=all to getting player info
// What we need?, username, status, global rank, country rank, country, pp, playcount, join date, last seen, lastest score and avatar
// Note, status, we need request api to get_player_status?id=${id}, if output like this {"status":"success","player_status":{"online":false,"last_seen":1710775108}}, that mean offline
// But if online, output will be like this {"status":"success","player_status":{"online":true,"login_time":1714894711.8519669,"status":{"action":0,"info_text":"","mode":0,"mods":0,"beatmap":null}}}, that mean online
// action mean what player doing
// action 0 = idle/song select, 1 = AFK, 2 = playing, 3 = editing, 4 = modding, 5 = multiplayer, 6 = watching, 7 = unknown, 8 = testing, 9 = submitting, 10 = paused, 11 = lobby, 12 = multiplayer lobby, 13 = Idle: 🔍 Searching for beatmaps in osu!direct
// Note if action is Playing, Editing, Modding, Watching, Testing, Submitting and In Multiplayer, we need beatmap info, output will be like this {"status":"success","player_status":{"online":true,"login_time":1714894848.66584,"status":{"action":6,"info_text":"osu! play Basshunter - Ievan Polkka Trance Remix [BeuKirby]","mode":0,"mods":2048,"beatmap":{"md5":"f03510b839a01ec1a1dcc71f24d9c596","id":66246,"set_id":10406,"artist":"Basshunter","title":"Ievan Polkka Trance Remix","version":"BeuKirby","creator":"Teara","last_update":"2010-08-01T14:12:57","total_length":210,"max_combo":991,"status":3,"plays":0,"passes":0,"mode":0,"bpm":140,"cs":5,"od":8,"ar":8,"hp":7,"diff":6.003}}}}
// We need Artist - Title (Version) and beatmap id for clickable link
// Back to get_player_info, output will be like this {"status":"success","player":{"info":{"id":3,"name":"blueskychan_","safe_name":"blueskychan_","priv":64647,"country":"th","silence_end":0,"donor_end":0,"creation_time":1710164363,"latest_activity":1714894917,"clan_id":0,"clan_priv":0,"preferred_mode":0,"play_style":0,"custom_badge_name":null,"custom_badge_icon":null,"userpage_content":null,"votes":4},"stats":{"0":{"id":3,"mode":0,"tscore":259083423,"rscore":100738370,"pp":1058,"plays":561,"playtime":24986,"acc":92.648,"max_combo":875,"total_hits":78732,"replay_views":2,"xh_count":5,"x_count":1,"sh_count":9,"s_count":3,"a_count":15,"rank":46,"country_rank":43},"1":{"id":3,"mode":1,"tscore":71630,"rscore":27510,"pp":1,"plays":3,"playtime":91,"acc":63.83,"max_combo":19,"total_hits":235,"replay_views":0,"xh_count":0,"x_count":0,"sh_count":0,"s_count":0,"a_count":0,"rank":0,"country_rank":0},"2":{"id":3,"mode":2,"tscore":128074,"rscore":128074,"pp":6,"plays":1,"playtime":36,"acc":96.891,"max_combo":56,"total_hits":187,"replay_views":0,"xh_count":0,"x_count":0,"sh_count":0,"s_count":0,"a_count":1,"rank":0,"country_rank":0},"3":{"id":3,"mode":3,"tscore":1573848,"rscore":287669,"pp":0,"plays":5,"playtime":232,"acc":55.882,"max_combo":135,"total_hits":1063,"replay_views":0,"xh_count":0,"x_count":0,"sh_count":0,"s_count":0,"a_count":0,"rank":0,"country_rank":0},"4":{"id":3,"mode":4,"tscore":5677190,"rscore":2276980,"pp":1278,"plays":90,"playtime":4138,"acc":93.801,"max_combo":734,"total_hits":18597,"replay_views":0,"xh_count":1,"x_count":0,"sh_count":5,"s_count":1,"a_count":8,"rank":46,"country_rank":43},"5":{"id":3,"mode":5,"tscore":0,"rscore":0,"pp":0,"plays":0,"playtime":0,"acc":0,"max_combo":0,"total_hits":0,"replay_views":0,"xh_count":0,"x_count":0,"sh_count":0,"s_count":0,"a_count":0,"rank":0,"country_rank":0},"6":{"id":3,"mode":6,"tscore":0,"rscore":0,"pp":0,"plays":0,"playtime":0,"acc":0,"max_combo":0,"total_hits":0,"replay_views":0,"xh_count":0,"x_count":0,"sh_count":0,"s_count":0,"a_count":0,"rank":0,"country_rank":0},"8":{"id":3,"mode":8,"tscore":0,"rscore":0,"pp":0,"plays":0,"playtime":0,"acc":0,"max_combo":0,"total_hits":0,"replay_views":0,"xh_count":0,"x_count":0,"sh_count":0,"s_count":0,"a_count":0,"rank":0,"country_rank":0}}}}
// mode id 0 is osu!std, 1 is osu!takio, 2 is osu!catch, 3 is osu!mania, 4 is osu!std (relax), 5 is osu!catch (relax), 6 is osu!mania (relax), 8 is osu!std (autopilot)
// if user tell mode like
// std = osu!std, std_rx = osu!std (relax), taiko = osu!takio, taiko_rx = osu!takio (relax), catch = osu!catch, catch_rx = osu!catch (relax), mania = osu!mania, osu!ap = osu!std (autopilot)
// AI still stupid shit lol

const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder} = require('discord.js');
// We need http for request to bancho!api
const https = require('https');
const { bancho_domain } = require('../../config.json');

var whitelist = false;
// function to get player status
async function getPlayerStatus(id) {
    return new Promise((resolve, reject) => {
        const url = `https://api.${bancho_domain}/v1/get_player_status?id=${id}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const result = JSON.parse(data);
                if (result.status === 'success') {
                    const player_status = result.player_status;
                    if (player_status.online) {
                        resolve('Online');
                    } else {
                        resolve('Offline');
                    }
                } else {
                    reject('Failed to get player status');
                }
            });
        });
    });
}

// function to get lastest score info https://api.pla-ra.xyz/v1/get_player_scores?id={id}&mode={mode}&scope=recent&limit=1, we need only scores.id
async function getLatestScore(id, mode) {
    return new Promise((resolve, reject) => {
        const url = `https://api.${bancho_domain}/v1/get_player_scores?id=${id}&mode=${mode}&scope=recent&limit=1`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const result = JSON.parse(data);
                if (result.status === 'success') {
                    const scores = result.scores;
                    try{
                    resolve(scores[0].id);
                    }
                    catch (error){
                        resolve(0);
                    }
                } else {
                    reject('Failed to get latest score');
                }
            });
        });
    });
}

// Function to player whitelist https://api.pla-ra.xyz/v1/get_player_whitelist?id={id}
async function getPlayerWhitelist(id) {
    return new Promise((resolve, reject) => {
        const url = `https://api.${bancho_domain}/v1/get_player_whitelist?id=${id}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const result = JSON.parse(data);
                if (result.status === 'success') {
                    resolve(result.whitelist);
                } else {
                    reject('Failed to get player whitelist');
                }
            });
        });
    });
}
module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('Search players and get player info')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Username to search')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Mode to search')
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
        // Check username in search_players api
        const username = interaction.options.getString('username');
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
        const url = `https://api.${bancho_domain}/v1/search_players?q=${username}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const result = JSON.parse(data);
                if (result.status === 'success') {
                    if (result.results >= 1) {
                        console.log(result.result[0])
                        const id = result.result[0].id;
                        const url = `https://api.${bancho_domain}/v1/get_player_info?id=${id}&scope=all`;
                        https.get(url, (res) => {
                            let data = '';
                            res.on('data', (chunk) => {
                                data += chunk;
                            });
                            res.on('end', async () => {
                                const result = JSON.parse(data);
                                if (result.status === 'success') {
                                    const player = result.player;
                                    const info = player.info;
                                    const stats = player.stats;
                                    // getting user country code
                                    const country = info.country;
                                    // make all character from lower case to upper case
                                    const country_code = country.toUpperCase();
                                    // apply to status string
                                    let status = 'Unknown';
                                    let lastest_score_id = '';
                                    let roles = '';
                                    try {
                                        status = await getPlayerStatus(id);
                                        console.log(status);
                                        lastest_score_id = await getLatestScore(id, mode_num);
                                        console.log(lastest_score_id);
                                        console.log(mode_num)
                                        whitelist = await getPlayerWhitelist(id);
                                    } catch (error) {
                                        interaction.reply(error);
                                    }
                                    console.log(status)
                                    const embed = new EmbedBuilder()
                                        .setTitle(`${info.name} Profile`)
                                        .setURL(`https://${bancho_domain}/u/${info.id}`)
                                        .setThumbnail(`https://a.${bancho_domain}/${info.id}`)
                                        .addFields(
                                            { name: 'Status', value: status.toString(), inline: true },
                                            { name: 'Whitelist', value: whitelist.toString(), inline: true},
                                            { name: `Global Rank (${country_code} :flag_${country}:)`, value: stats[mode_num].rank.toString(), inline: true },
                                            { name: 'Country Rank', value: stats[mode_num].country_rank.toString(), inline: true },
                                            { name: 'Total Score', value: stats[mode_num].tscore.toString(), inline: true },
                                            { name: 'PP', value: stats[mode_num].pp.toString(), inline: true },
                                            { name: 'Playcount', value: stats[mode_num].plays.toString(), inline: true },
                                            { name: 'Join Date', value: new Date(info.creation_time * 1000).toUTCString(), inline: true },
                                            { name: 'Last Seen', value: new Date(info.latest_activity * 1000).toUTCString(), inline: true },
                                            { name: 'Lastest Score', value: `[Click Here!](https://${bancho_domain}/scores/${lastest_score_id})`, inline: true },
                                        )
                                        .setDescription('Player infomation in osu!somtum')
                                        console.log(embed)
                                    interaction.reply({ embeds: [embed] });
                                } else {
                                    interaction.reply('Failed to get player info');
                                }
                            });
                        });
                    } else {
                        interaction.reply('Username not found');
                    }
                } else {
                    interaction.reply('Failed to search username');
                }
            });
        });
	},
};