const fs = require("fs");
const { join } = require("path");
const process = require("process");
const { google } = require("googleapis");
const AWS = require("aws-sdk");
const ncp = require("copy-paste");

let loaclFolderPath, driveFolderLink;

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question("\n\t\x1b[7mType the folder path:\x1b[0m \n\t", (lPath) => {
  if (!lPath || lPath === "q") return exitFunc();
  readline.question(
    "\n\t\x1b[7mType the google drive folder link:\x1b[0m \n\t",
    (dLink) => {
      if (!dLink || dLink === "q") return exitFunc();
      loaclFolderPath = lPath;
      driveFolderLink = dLink;

      textToAudio();
    }
  );
});

function textToAudio() {
  readline.question("\n\t\x1b[7mType the word:\x1b[0m \n\t", (word) => {
    if (!word || word === "q") return exitFunc();

    // Create the audio file:
    const Polly = new AWS.Polly({
      region: "ap-south-1",
    });
    const input = {
      Engine: "neural",
      Text: word,
      OutputFormat: "mp3",
      VoiceId: "Matthew",
      LanguageCode: "en-US",
    };
    Polly.synthesizeSpeech(input, (err, data) => {
      if (err) return console.error(err);
      if (data.AudioStream instanceof Buffer) {
        // Save to source folder
        let folderPath = join(loaclFolderPath, "./audios");
        let filePath = join(folderPath, `${word}.mp3`);
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
        fs.writeFile(filePath, data.AudioStream, (fsErr) => {
          if (fsErr) return console.error(fsErr);
          // Save to source drive folder
          uploadFile(filePath, `${word}.mp3`);

          console.log("\x1b[100m%s", `\tCreated file: ${word}.mp3`, "\x1b[0m");
        });
      }
    });
  });
}
async function uploadFile(filePath, name) {
  try {
    let KEYFILEPATH =
      "D:\\Web Design\\Tutorials\\Text To Audio\\credentials.json";
    // conver it in index.js
    let SCOPES = ["https://www.googleapis.com/auth/drive"];
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILEPATH,
      scopes: SCOPES,
    });
    const { data } = await google.drive({ version: "v3", auth }).files.create({
      media: {
        mimeType: "audio/mpeg",
        body: fs.createReadStream(filePath),
      },
      requestBody: {
        name,
        parents: [driveFolderLink.split("/")[5].split("?")[0]],
      },
      fields: "id,name",
    });

    console.log("\x1b[100m%s", `\tUploaded file: ${data.name}`, "\x1b[0m");

    // copy to clipbord
    let url = `https://drive.google.com/file/d/${data.id}/view?usp=share_link`;
    ncp.copy(url, () => {
      console.log("\x1b[100m%s", `\tLink copied: ${url}`, "\x1b[0m");

      // Repeate the question:
      textToAudio();
    });
  } catch (error) {
    console.error(error);
  }
}

function exitFunc() {
  console.log("\x1b[41m%s", `\tExiting...`, "\x1b[0m\n");
  setTimeout(() => readline.close(), 500);
}

// https://drive.google.com/drive/folders/1w1d07BKyQU5GjNxVTg0vqDj8ZntWzr49?usp=sharing
