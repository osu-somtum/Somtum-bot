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
  } = require('discord.js');
const { sql_host, sql_user, sql_password, sql_database, gmail_user, gmail_password } = require('../../config.json');
var mysql = require('mysql');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmail_user,
        pass: gmail_password
      }
    });
var username = "";
var userid = "";
var messageid = "";
var usermsgid = "";
var ingameid = "";
// random 6 digit number
var sixdigit = Math.floor(100000 + Math.random() * 900000);
var email = "";


  
module.exports.username = username;
module.exports.userid = userid;
module.exports.messageid = messageid;
module.exports.usermsgid = usermsgid;
module.exports.ingameid = ingameid;
module.exports.sixdigit = sixdigit;

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
		.setName('verify')
		.setDescription('Verify your somtum account with discord account')
        // ask username of user
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Your username')
                .setRequired(true)),
	async execute(interaction) {
        console.log(interaction.options.getString('username'));
        module.exports.username = interaction.options.getString('username');
        module.exports.userid = interaction.user.id;
        await connectsql();
        // check did userid exist in database (users table, discord_id column), if yes, decline the request and told them to contact support
        const discordid_check = await asynqQuery(`SELECT discord_id FROM users WHERE discord_id = '${module.exports.userid}'`);
        console.log(discordid_check);
        if (discordid_check.length > 0) {
            interaction.reply('You are already linked to somtum account, please contact support if you have any problem :p');
            await disconnectsql();
            return;
        }
        // check did username exist in database (users table, name column), if yes, select id of user too
        const result = await asynqQuery(`SELECT id FROM users WHERE name = '${module.exports.username}'`);
        console.log(result);
        let id = result[0].id;
        if (result.length = 0) {
            interaction.reply('Username not found, Please check your username again ;-;');
            await disconnectsql();
            return;
        } 
        console.log(id)
        // debug, checking discord_id of user
        // check did discord_id is already exist for this user, if yes, decline the request and told them to contact support
        const result2 = await asynqQuery(`SELECT discord_id FROM users WHERE id = ${id}`);
        console.log(result2);
        var discord_id = result2[0].discord_id;
        if (discord_id !== null) {
            interaction.reply('This username is already linked to discord account ;-;');
            await disconnectsql();
            return;
        }

        // getting email of user, if not exist, decline the request and told them to contact support, else make new string for email
        const result3 = await asynqQuery(`SELECT email FROM users WHERE id = ${id}`);
        console.log(result3);
        module.exports.email = result3[0].email;
            email = result3[0].email;
        console.log(email)
        console.log("Sending email")
        var mailOptions = {
            from: gmail_user,
            to: email,
            subject: 'Linking somtum account to discord account',
            text: 'I getting request from someone to link somtum account with discord account!\nyour verification code is ' + sixdigit + '\nPlease input this code to discord to verify your account\nIf you did not request this, just ignore this\n\nBest Regards,\nSomtum Team <3\n\nThis is an automated email, please do not reply to this email.'
          };
        console.log(mailOptions);
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log("Sending fail!" + error);
                return;
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        let button = new ActionRowBuilder();
        button.addComponents(
          new ButtonBuilder()
            .setCustomId('verification-button')
            .setStyle(ButtonStyle.Primary)
            .setLabel('Verify with email'),
        );
        const domain = email?.split("@")?.[1] || "";
        let msg = await interaction.reply({content: `I send verification code to your email that ends with ${domain}, please check your email and input the code here <3`,components: [button],ephemeral: true});
        //console.log(msg);
        module.exports.message = msg;
        module.exports.sixdigit = sixdigit;
        // disconnect from database
        await disconnectsql();
        
	},
};