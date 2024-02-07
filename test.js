import OpenAI from "openai";
import http from "http";

//var http = require("http");
const openai = new OpenAI();

var worldName = "World Name";
var timeline = "<h3>Events:</h3>";

function addEvent(event) {
    timeline += "<p><b>" + event.date + ": " + event.name + "</b></p>";
    timeline += "<p>" + event.description + "</p>";

    console.log("New event added: " + event.name);
}

async function generateName() {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: "Give me a name for a fantasy world." }],
        model: "gpt-3.5-turbo",
    });

    worldName = completion.choices[0].message.content;
}

async function generateEvent(year) {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: "Generate an event that happened in the fictional world of " + worldName + " in the year " + year + ". The response should be in JSON and it should include fields 'name', 'year' and 'description'." }],
        model: "gpt-4-1106-preview",
        response_format: { type: "json_object" },
    });

    var eventData = completion.choices[0].message.content;
    addEvent(JSON.parse(eventData));
}

async function handler(req, res) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>" + worldName + "</h1>\n" + timeline);
}

await generateName();
await generateEvent(1);
await generateEvent(10);
await generateEvent(100);

http.createServer(handler).listen(8080);