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

    admin.database().ref('/users').once('value', (snapshot => {
        let statusRes = '';

        snapshot.forEach((userSnapshot) => {
            statusRes += userSnapshot.val().displayName + userSnapshot.val().phoneNumber;
        });

        cors(req, res, () => {

            QRCode.toDataURL(statusRes, function (err, url) {
                if (err) console.log('error: ' + err);

                res.header('Content-Type', 'text/html');
                res.status(200).send("<!DOCTYPE html/><html><head><title>node-qrcode</title></head><body><img src='" + url + "'/></body></html>")
            });

        });
    }));
});