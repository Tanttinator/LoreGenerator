import OpenAI from "openai";
import http from "http";

//var http = require("http");
const openai = new OpenAI();

var worldName = "World Name";

async function generateName() {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "Give me a name for a fantasy world." }],
        model: "gpt-3.5-turbo",
    });

    worldName = completion.choices[0].message.content;
}

async function handler(req, res) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("Your world is called: " + worldName);
}

http.createServer(handler).listen(8080);