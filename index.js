const express = require('express')
const app = express()
const port = 3000
const request = require('request');
const cron = require('node-cron');
const moment = require('moment');
const nodemailer = require("nodemailer");
require('dotenv').config()

app.use(express.json());

// app.use(express.urlencoded());

app.get('/', (req, res) => {
    res.send('Hello World!');
    cron.schedule('* * * * *', function() {
        console.log('running a task every minute');
        sendRequests();
    });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

function sendRequests() {
    let date = new Date;
    date = moment(date).format('DD-MM-YYYY');
    request(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=401303&date=${date}`, { json: false }, (err, res, body) => {
        if (err) { return console.log(err); }        
        let data = JSON.parse(body);
        data = data.centers;
        for (let i = 0; i < data.length; i++) {
            if (data[i].sessions[0].available_capacity_dose1 !=0 ) {
                sendMail(data[i]);
            } else {
                dontSendMail();
            }
        }
    });
    return;
}

function sendMail(data) {
    console.log('Mail Received',data)
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.MAIL_USERNAME,
            // pass: process.env.MAIL_PASSWORD,
            clientId: process.env.OAUTH_CLIENTID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN
        }
    });
    let mailOptions = {
        from: 'kevindmello05@gmail.com',
        to: 'kevindmello05@gmail.com',
        subject: 'Vaccination Status',
        text: `${data.name} has ${data.sessions[0].available_capacity_dose1} slots Available!. NOTE: This is an auto generated mail.`
    };
    transporter.sendMail(mailOptions, function(err, data) {
        if (err) {
          console.log("Error " + err);
        } else {
          console.log("Email sent successfully");
        }
    });
}
function dontSendMail() {
    console.log('Mail not sent')
}
