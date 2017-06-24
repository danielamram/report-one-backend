/**
 * Returns the server's date. You must provide a `format` URL query parameter or `format` vaue in
 * the request body with which we'll try to format the date.
 *
 * Format must follow the Node moment library. See: http://momentjs.com/
 *
 * Example format: "MMMM Do YYYY, h:mm:ss a".
 * Example request using URL query parameters:
 *   https://us-central1-<project-id>.cloudfunctions.net/date?format=MMMM%20Do%20YYYY%2C%20h%3Amm%3Ass%20a
 * Example request using request body with cURL:
 *   curl -H 'Content-Type: application/json' /
 *        -d '{"format": "MMMM Do YYYY, h:mm:ss a"}' /
 *        https://us-central1-<project-id>.cloudfunctions.net/date
 *
 * This endpoint supports CORS.
 */
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const QRCode = require('qrcode');

admin.initializeApp(functions.config().firebase);

exports.getStatus = functions.https.onRequest((req, res) => {

    // Forbidding PUT/POST requests.
    if (req.method === 'PUT' || req.method === 'POST') {
        res.status(403).send('Forbidden!');
    }

    admin.database().ref('/users').then(snapshot => {
        console.log(snapshot);
    });

    // Enable CORS using the `cors` express middleware.
    cors(req, res, () => {
        let jungleBook = "The moonlight was blocked out of the mouth of the cave, for Shere Khan's\n" +
            'great square head and shoulders were thrust into the entrance. Tabaqui,\n' +
            'behind him, was squeaking: "My lord, my lord, it went in here!"\n' +
            '\n' +
            '"Shere Khan does us great honor," said Father Wolf, but his eyes were\n' +
            'very angry. "What does Shere Khan need?"\n' +
            '\n' +
            "\"My quarry. A man's cub went this way,\" said Shere Khan. \"Its parents\n" +
            'have run off. Give it to me."\n' +
            '\n' +
            "Shere Khan had jumped at a woodcutter's campfire, as Father Wolf had\n" +
            'said, and was furious from the pain of his burned feet. But Father Wolf\n' +
            'knew that the mouth of the cave was too narrow for a tiger to come in\n' +
            "by. Even where he was, Shere Khan's shoulders and forepaws were cramped\n" +
            "for want of room, as a man's would be if he tried to fight in a barrel.\n" +
            '\n' +
            '"The Wolves are a free people," said Father Wolf. "They take orders from\n' +
            "the Head of the Pack, and not from any striped cattle-killer. The man's\n" +
            'cub is ours--to kill if we choose."';

        QRCode.toDataURL(jungleBook, function (err, url) {
            if (err) console.log('error: ' + err);

            res.header('Content-Type', 'text/html');
            res.status(200).send("<!DOCTYPE html/><html><head><title>node-qrcode</title></head><body><img src='" + url + "'/></body></html>")
        });
    });
});