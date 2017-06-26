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

exports.getStatusOld = functions.https.onRequest((req, res) => {

    // Forbidding PUT/POST requests.
    if (req.method === 'PUT' || req.method === 'POST') {
        res.status(403).send('Forbidden!');
    }

    admin.database().ref('/users').once('value', (snapshot => {
        let statusRes = '';

        snapshot.forEach((userSnapshot) => {
            statusRes += userSnapshot.val().phoneNumber;
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

exports.getStatus = functions.https.onRequest((req, res) => {
    // Forbidding PUT/POST requests.
    if (req.method === 'PUT' || req.method === 'POST') {
        res.status(403).send('Forbidden!');
    }

    var MAXCHARS = 2420;
    var MAXUSERS = (MAXCHARS - 2) / 28;

    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!

    var yyyy = today.getFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }

    var todayString = yyyy + "-" + mm + "-" + dd;

    admin.database().ref('/reports/' + todayString).once('value', (snapshot => {
        let statusRes = [];
        let total = 0;
        let count = 0;
        let countQR = 1;
        let QRs = [];

        snapshot.forEach((userSnapshot) => {
            total++;

            admin.database().ref('/users/' + userSnapshot.key + '/cid').once('value', (snapshot => {
                let user = {
                    id: snapshot.val(),
                    status: userSnapshot.val()
                };

                count++;
                statusRes.push(user);

                if (count > MAXUSERS * countQR) {
                    QRCode.toDataURL(JSON.stringify(statusRes), { errorCorrectionLevel: 'Q' },  function (err, url) {
                        if (err) console.log('error: ' + err);
                        QRs.push(url);
                    });

                    countQR++;
                    statusRes = [];
                }

                if (count == total) {
                    QRCode.toDataURL(JSON.stringify(statusRes), { errorCorrectionLevel: 'Q' },  function (err, url) {
                        if (err) console.log('error: ' + err);

                        if (JSON.stringify(statusRes) != "[]")
                            QRs.push(url);

                        cors(req, res, () => {
                            let body = '';
                            body += '<img src="' + QRs[0] + '" id="qr1" class="active" align="middle"/>';

                            for (let i = 1; i < QRs.length; i++) {
                                body += "<img src='" + QRs[i] + "' id='qr" + (i+1) + "' class='hidden' align='middle'/>";
                            }

                            body += '<br><br>';
                            body += '<div class="pagination">';
                            body += '<a onclick="prev()">&laquo;</a>';

                            body += '<a href="#" id="a1" class="active" onclick="goto(1)">1</a>';

                            for (let i = 1; i < QRs.length; i++) {
                                body += '<a href="#" id="a'+(i+1)+'" onclick="goto(' + (i+1) + ')">'+(i+1)+'</a>';
                            }

                            body += '<a href="#" onclick="next()">&raquo;</a>';
                            body += '</div>';

                            res.header('Content-Type', 'text/html');
                            res.status(200).send(`
                            <!DOCTYPE html/>
                            <html>
                                <head>
                                   <title>node-qrcode</title>
                                    <style>
                                        body {
                                            text-align:center;
                                        }
                                        
                                        .pagination {
                                            display: inline-block;
                                        }
                                        
                                        .pagination a {
                                            color: black;
                                            float: left;
                                            padding: 8px 16px;
                                            text-decoration: none;
                                            transition: background-color .3s;
                                            border: 1px solid #ddd;
                                            margin: 0 4px;
                                        }
                                        
                                        .pagination a.active {
                                            background-color: #4CAF50;
                                            color: white;
                                            border: 1px solid #4CAF50;
                                        }
                                        
                                        .pagination a:hover:not(.active) {background-color: #ddd;}
                                        
                                        .hidden {
                                            display: none;
                                        }
                                        
                                        .active {
                                            display: block;
                                        }
                                    </style>
                                    <script type="application/javascript">
                                        var current = 1;
                                        var max = ` + QRs.length + `;
                                        
                                        function next() {
                                            document.getElementById("qr"+current).classList.remove("active");
                                            document.getElementById("qr"+current).classList.add("hidden");
                                            document.getElementById("a"+current).classList.remove("active");
                                            
                                            current++;
                                            if (current > max ) current = 1;
                                            
                                            document.getElementById("qr"+current).classList.add("active");
                                            document.getElementById("qr"+current).classList.remove("hidden");
                                            document.getElementById("a"+current).classList.add("active");
                                        }
                                        
                                        function prev() {
                                            document.getElementById("qr"+current).classList.remove("active");
                                            document.getElementById("qr"+current).classList.add("hidden");
                                            document.getElementById("a"+current).classList.remove("active");
                                            
                                            current--;
                                            if (current == 0) current = max;
                                            
                                            document.getElementById("qr"+current).classList.add("active");
                                            document.getElementById("qr"+current).classList.remove("hidden");
                                            document.getElementById("a"+current).classList.add("active");
                                        }
                                        
                                        function goto(i) {
                                            document.getElementById("qr"+current).classList.remove("active");
                                            document.getElementById("qr"+current).classList.add("hidden");
                                            document.getElementById("a"+current).classList.remove("active");
                                            
                                            current = i;
                                            
                                            document.getElementById("qr"+current).classList.add("active");
                                            document.getElementById("qr"+current).classList.remove("hidden");
                                            document.getElementById("a"+current).classList.add("active");
                                        }
                                    </script>
                                </head>
                                <body>
                                    <center>` +
                                        body +
                                `   </center>
                                </body>
                                </html>`);
                        });

                    });

                }
            }));

        });


    }));
});