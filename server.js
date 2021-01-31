var PololuMaestro = require("pololu-maestro");
var express = require('express')
var path = require('path');
var app = express()

// Port number that the server will listen on
const server_port = 8000;

// Library object for serial communication with servo driver
var maestro = new PololuMaestro("COM4", 115200);

var timer;
var angle;

// Servo 1 and Servo 2 positions, 0-180 degrees
var s1_pos = 90;
var s2_pos = 90;

// Laser enabled
var laserOn = true;

app.use(express.json())

// Initial setup for servo driver
maestro.on("ready", function() {
    console.log("ready");
    maestro.reset();
    maestro.setSpeed(0, 40);
    maestro.setSpeed(1, 40);
    maestro.digitalWrite(2, true);
});

// Host index.html for GET requests
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'))
});

// Recieve POST requests here
app.post('/', function (req, res) {

    var body = req.body;
    console.log(body);

    if(body.circle) {
        circle();
    }

    if(body.direction) {

        // Turn laser on or off with relay
        if(body.direction == "onoff") {
            if(laserOn) {
                maestro.digitalWrite(2, false);
                laserOn = false;
            }
            else {
                maestro.digitalWrite(2, true);
                laserOn = true;
            }
        }

        // Turn laser left
        if(body.direction == "left") {
            s1_pos += 5;
        }
        // Turn laser right
        if(body.direction == "right") {
            s1_pos -= 5;
        }
        // Turn laser upward
        if(body.direction == "up") {
            s2_pos += 5;
        }
        // Turn laser downward
        if(body.direction == "down") {
            s2_pos -= 5;
        }

      
    }

    // Set X coordinate
    if(body.X) {
        s1_pos = 180 - body.X;
    }

    // Set Y coordinate
    if(body.Y) {
        s2_pos = 180 - body.Y;
    }   

    // Ensure that X and Y coordinates stay between 0 and 180
    if(s1_pos < 0) {
        s1_pos = 0;
    }
    if(s1_pos > 180) {
        s1_pos = 180;
    }
    if(s2_pos < 0) {
        s2_pos = 0;
    }
    if(s2_pos > 180) {
        s2_pos = 180;
    }

    // Send X and Y coordinates to servo driver board, scaled to appropriate PWM frequencies
    maestro.setTarget(0, s1_pos * 9.25 + 640);
    maestro.setTarget(1, s2_pos * 9.25 + 640);

    // Respond to web client with updated coordinates
    res.send(JSON.stringify({X: s1_pos, Y: s2_pos}));

});


// Make laser go in a circle
function circle() {
    maestro.setSpeed(0, 100);
    maestro.setSpeed(1, 100);
    angle = 0;
    timer = setInterval(circle_helper, 100);
}

function circle_helper() {
    new_s1_pos = s1_pos +20 * Math.cos(angle);
    new_s2_pos = s2_pos + 20 * Math.sin(angle);

    if(new_s1_pos < 0) {
        new_s1_pos = 0;
      }
      if(new_s1_pos > 180) {
        new_s1_pos = 180;
      }
      if(new_s2_pos < 0) {
        new_s2_pos = 0;
      }
      if(new_s2_pos > 180) {
        new_s2_pos = 180;
      }

    angle += 2 * Math.PI / 180;
    maestro.setTarget(0, new_s1_pos * 9.25 + 640);
    maestro.setTarget(1, new_s2_pos * 9.25 + 640);

    if(angle >= 2*Math.PI) {
        clearInterval(timer);
        timer = null;
        maestro.setSpeed(0, 20);
        maestro.setSpeed(1, 20);
    }
}

// Listen for GET and POST requests on port 8000
app.listen(server_port, () => {
    console.log(`Example app listening at http://localhost:${server_port}`)
});