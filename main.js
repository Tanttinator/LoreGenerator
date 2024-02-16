import OpenAI from "openai";
import http from "http";
import express from "express";
import bodyParser from "body-parser";

const openai = new OpenAI();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

var worldCreated = false;
var world = {
    name: "World",
    description: "A new world full of wonder.",
    image: "",
    events: [], // name, year, description
    characters: [], // name, appearance, race, yearOfBirth, portrait, personality, profession
}

var messageLog = []

function parseEvent(event) {
    return `<p><b>${event.name} (${event.year})</b></p> <p>${event.description}</p>`
}

function parseCharacter(character) {
    var content = `<p><b>${character.name}</b></p>`;
    content += `<p>Appearance: ${character.appearance}</p>`;
    content += `<p>Race: ${character.race}</p>`;
    content += `<p>Year of birth: ${character.yearOfBirth}</p>`;
    content += `<p>Personality: ${character.personality}</p>`;
    content += `<p>Profession: ${character.profession}</p>`;
    return content;
}

function content() {
    if (!worldCreated) {
        return promptView();
    }
    else {
        return worldView();
    }
}

function worldView() {
    var content = "<head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8'/></head>";

    content += `<h1>${world.name}</h1>`;
    content += `<img src='${world.image}' width='1024' height='1024'/>`
    content += `<p>${world.description}</p>`

    content += '<h2>Timeline:</h2>';
    world.events.forEach(event => {
        content += parseEvent(event);
    });

    content += '<h2>Characters:</h2>';
    world.characters.forEach(character => {
        content += parseCharacter(character);
    });

    return content;
}

function promptView() {
    var content = "<head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8'/></head>";

    content += "<h1>Enter prompt for a new world:</h1>";
    content += "<form action = '/newworld' method='POST'>";
    content += "<input type='text' name='prompt'>";
    content += "<button type='submit'>Create</button>";
    content += "</form>";

    return content;
}

async function initializeChat() {
    var message = { role: "system", content: "You are a creative assistant helping to create a fictional world with the users prompts." }
    messageLog.push(message);

    const completion = await openai.chat.completions.create({
        messages: messageLog,
        model: "gpt-3.5-turbo",
    });
}

async function generateWorldInfo(prompt) {
    var message = { role: "user", content: "Come up with a new fictional world based on the users prompt: '" + prompt + "'. Give me a name for the world and a short description of it less than 100 words long. The response should be in JSON format with fields for 'name' and 'description'." };
    messageLog.push(message);

    const completion = await openai.chat.completions.create({
        messages: messageLog,
        model: "gpt-4-1106-preview",
        response_format: { type: "json_object" },
    });
    messageLog.push(completion.choices[0].message);

    var object = JSON.parse(completion.choices[0].message.content);
    world.name = object.name;
    world.description = object.description;

    const response = await openai.images.generate({
        model: "dall-e-2",
        prompt: "Illustration of a fictional world based on the following description: " + world.description,
        size: "1024x1024"
    });
    world.image = response.data[0].url;
}

async function generateEvent(year) {
    var message = { role: "user", content: `Describe an event that happened in the world during the year ${year} and the characters important to that event if any. The response should be in JSON format with fields for 'name', 'year' and 'description'. All of the fields should be string fields.` };
    messageLog.push(message);

    const completion = await openai.chat.completions.create({
        messages: messageLog,
        model: "gpt-4-1106-preview",
        response_format: { type: "json_object" },
    });
    messageLog.push(completion.choices[0].message);

    var event = JSON.parse(completion.choices[0].message.content);
    world.events.push(event);
    console.log(`Event created: ${event.name}`);
}

async function generateCharacter() {
    var message = { role: "user", content: `Describe a character from the world that is related to the events of the world. The response should be in JSON format with fields for 'name', 'appearance', 'race', 'yearOfBirth', 'personality' and 'profession'. All of the fields should be string fields.` };
    messageLog.push(message);

    const completion = await openai.chat.completions.create({
        messages: messageLog,
        model: "gpt-4-1106-preview",
        response_format: { type: "json_object" },
    });
    messageLog.push(completion.choices[0].message);

    var character = JSON.parse(completion.choices[0].message.content);
    world.characters.push(character);

    console.log(`Character created: ${character.name}`);
}

async function handler(req, res) {
    console.log(req.url);
    if (req.url.pathname === "/newworld") {
        console.log("Prompt entered");
        worldCreated = true;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(content());
}

app.get('/', (req, res) => {
    res.send(content());
});

app.post('/newworld', async (req, res) => {
    worldCreated = true;
    console.log(req.body);
    await generateWorldInfo(req.body.prompt);
    await generateEvent(1);
    for (var decade = 1; decade <= 10; decade++) {
        await generateEvent(decade * 10);
    }

    await generateCharacter();
    await generateCharacter();
    await generateCharacter();

    res.redirect('/');
});

await initializeChat();
app.listen(8080);