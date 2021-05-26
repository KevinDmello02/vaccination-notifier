const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path')

const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const request = require('request');
const cron = require('node-cron');
const moment = require('moment');
const nodemailer = require("nodemailer");

var ejs = require("ejs");

require('dotenv').config()

app.use(express.json());

cron.schedule('* 2 * * *', function() {
    console.log('running a task every minute');
    sendRequests();
});

sendRequests();
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

function sendRequests() {
    let pincodes = ['401301', '401303', '401304', '421303', '400103'];
    let district = ['395', '394']
    let objArr = [];
    let date = new Date;
    date = moment(date).format('DD-MM-YYYY');
    for (let dis = 0; dis < district.length; dis++) {
        request(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=${district[dis]}&date=27-05-2021`, { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }  
            let data = body;      
            for (let i = 0; i < data.sessions.length; i++) {
                if (data.sessions[i].available_capacity_dose1 != 0 && data.sessions[i].fee_type == 'Free' ) {
                    let obj = {
                        name: data.sessions[i].name,
                        address: data.sessions[i].address,
                        pincode: data.sessions[i].pincode,
                        available: data.sessions[i].available_capacity_dose1 
                    }
                    objArr.push(obj);
                    obj = {};
                } else {
                    dontSendMail();
                }
            }
            sendMail(objArr);
        });
    } 
    return;
}

function sendMail(data) {
    const filePath = path.join(__dirname, './template/mail.ejs');
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    const htmlToSend = template(data);

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.MAIL_USERNAME,
            clientId: process.env.OAUTH_CLIENTID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN
        }
    });

    ejs.renderFile("./template/mail.ejs", { data }, function(err, data) {
        if (err) {
            console.log(err);
        } else {
            let mailOptions = {
                from: 'kevindmello05@gmail.com',
                to: 'kevindmello05@gmail.com, unitedkumbharwada@gmail.com',
                subject: 'Vaccination Status',
                html: data
            };
            transporter.sendMail(mailOptions, function(err, data) {
                if (err) {
                  console.log("Error " + err);
                } else {
                  console.log("Email sent successfully");
                }
            });
        }
    })
}



function dontSendMail() {
}