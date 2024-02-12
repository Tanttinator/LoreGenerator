import OpenAI from "openai";
import http from "http";

const openai = new OpenAI();

var world = {
    name: "World",
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
    var content = "<head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8'/></head>";

    content += `<h1>${world.name}</h1>`;

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

async function initializeChat() {
    var message = { role: "system", content: "You are a creative assistant helping to create a fictional world with the users prompts." }
    messageLog.push(message);

    const completion = await openai.chat.completions.create({
        messages: messageLog,
        model: "gpt-3.5-turbo",
    });
}

async function generateName() {
    var message = { role: "user", content: "Give me a name for a fantasy world." };
    messageLog.push(message);

    const completion = await openai.chat.completions.create({
        messages: messageLog,
        model: "gpt-3.5-turbo",
    });
    messageLog.push(completion.choices[0].message);

    world.name = completion.choices[0].message.content;
}

async function generateEvent(year) {
    var message = { role: "user", content: `Describe an event that happened in the world during the year ${year}. The response should be in JSON format with fields for 'name', 'year' and 'description'.` };
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
    var message = { role: "user", content: `Describe a character from the world. The response should be in JSON format with fields for 'name', 'appearance', 'race', 'yearOfBirth', 'personality' and 'profession'. All of the fields should be string fields.` };
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
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(content());
}

await initializeChat();
await generateName();
await generateEvent(1);
await generateEvent(10);
await generateEvent(100);

await generateCharacter();
await generateCharacter();
await generateCharacter();

http.createServer(handler).listen(8080);