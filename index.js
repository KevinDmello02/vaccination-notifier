const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const request = require('request');
const cron = require('node-cron');
const moment = require('moment');
const nodemailer = require("nodemailer");
require('dotenv').config()

app.use(express.json());

// app.use(express.urlencoded());



cron.schedule('* * * * *', function() {
    console.log('running a task every minute');
    sendRequests();
});
// sendMail(0)
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

function sendRequests() {
    let pincodes = ['401301', '401303', '401304', '421303', '400103'];
    let district = ['395', '395']
    let date = new Date;
    date = moment(date).format('DD-MM-YYYY');
    // for (let pin = 0; pin < pincodes.length; pin++) {
    //     request(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincodes[pin]}&date=26-05-2021}`, { json: true }, (err, res, body) => {
    //         if (err) { return console.log(err); }  
    //         let data = body;      
    //         data = data.centers;
    //         for (let i = 0; i < data.length; i++) {
    //             console.log(data[i])
    //             if (data[i].sessions[0].available_capacity_dose1 !=0 ) {
    //                 sendMail(data[i]);
    //             } else {
    //                 dontSendMail();
    //             }
    //         }
    //     });
    // } 
    for (let dis = 0; dis < district.length; dis++) {
        request(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=${district[dis]}&date=27-05-2021`, { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }  
            let data = body;      
            // data = data.centers;
            for (let i = 0; i < data.sessions.length; i++) {
                if (data.sessions[i].available_capacity_dose1 != 0 && data.sessions[i].fee_type == 'Free' ) {
                    sendMail(data.sessions[i]);
                } else {
                    dontSendMail();
                }
            }
        });
    } 
    return;
}

function sendMail(data) {
    console.log(data)
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
        to: 'kevindmello05@gmail.com, unitedkumbharwada@gmail.com',
        subject: 'Vaccination Status',
        // text: `${data.name} address: ${data.address} pincode: ${data.pincode} has ${data.available_capacity_dose1} slots Available!. NOTE: This is an auto generated mail.`,
        html: `<b>${data.name}<br>address: ${data.address} <br>pincode: ${data.pincode} <br>has <span style="color: green">${data.available_capacity_dose1}</span> slots Available!.</b> <br><span style="color:red;">NOTE: This is an auto generated mail.</span>`
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
}