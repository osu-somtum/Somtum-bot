const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
    Events,
    GatewayIntentBits,
    InteractionType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Collection,
    SlashCommandBuilder,
    EmbedBuilder,
  } = require('discord.js');
const { bancho_domain, sql_host, sql_user, sql_password, sql_database, gmail_user, gmail_password } = require('../../config.json');
var mysql = require('mysql');
// import https
const https = require('https');

// function to connect mysql
function connectsql() {
    return new Promise((resolve, reject) => {
        con = mysql.createConnection({
            host: sql_host,
            user: sql_user,
            password: sql_password,
            database: sql_database
        });
        con.connect((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

function asynqQuery(query, params) {
    return new Promise((resolve, reject) => {
        con.query(query, params, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

// function for disconnect from mysql
function disconnectsql() {
    return new Promise((resolve, reject) => {
        con.end((err) => {
            if (err) {
                reject(err);
            } else {
                console.log("Disconnected from database")
                resolve();
            }
        });
    });
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('myprofile')
		.setDescription('Your osu!somtum profile'),
	async execute(interaction) {
		// Connect to database and get user id from discord id
        // Select id from users where discord_id = ?
        await connectsql();
        let result = await asynqQuery("SELECT id FROM users WHERE discord_id = ?", [interaction.user.id]);
        let user_id = result[0].id;
        await disconnectsql();
        if (user_id === undefined) {
            await interaction.reply("You are not verified, please use /verify command to verify your account");
            return;
        }
        else
        console.log(user_id);
        // make embed like, Your profile: https://{bancho_domain}/u/{user_id}(Show name with clickable link, also include user country), User ID: {user_id}. creation date: {creation_date}, lastest seen: {lastest_seen}
        // to see more information, please use /search {username} command
        // To getting user country, creation date, and lastest seen, we need to use api
        // https://api.${bancho_domain}/v1/get_player_info?id=${id}&scope=all
        // and get player.country, player, creation_time and lastest_activity. noitce they are json, so you need to parse them
        // and make embed message
        // notice: creation_time and lastest_activity are in unix timestamp, so you need to convert them discord timestamp like this <t:1714929300:R>
        // and send embed message
        // also, tell them like, please use /search {username} command to see more information
        // and make sure to disconnect from mysql

        const url = `https://api.${bancho_domain}/v1/get_player_info?id=${user_id}&scope=all`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const { player } = JSON.parse(data);
                let country_emoji = '';
                                    if (player.info.country == '03'){
                                        country_emoji = '<:flag_03:1236731363097448459>';
                                    }
                                    else {
                                        country_emoji = `:flag_${player.info.country}:`;
                                    }
                const embed = new EmbedBuilder()
                    .setTitle(`Your profile: ${player.info.name}`)
                    .setURL(`https://${bancho_domain}/u/${user_id}`)
                    .setThumbnail(`https://a.${bancho_domain}/${user_id}`)
                    .setDescription(`User ID: ${user_id}\nCountry: ${country_emoji}\nCreation date: <t:${player.info.creation_time}:R>\nLastest seen: <t:${player.info.latest_activity}:R>\nTo see more information, please use /search ${player.info.name} command`)
                    // Color lime green
                    .setColor('#00FF00');
                interaction.reply({ embeds: [embed] });
            });
        });
	},
};