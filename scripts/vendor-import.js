const https = require('https');
const path = require('path');
const { PassThrough } = require('stream');
const AWS = require('aws-sdk');
const commandLineArgs = require('command-line-args');
const xlsx = require('node-xlsx');
const uuid = require('uuid/v4');

// surround a string in quotes
const q = str => "'" + str + "'";

const options = commandLineArgs([
  {
    name: 'src',
    description: 'xlsx file one clip per row',
    type: String,
    defaultOption: true,
  },
]);

const s3 = new AWS.S3({ params: { Bucket: 'cv-mandarin' } });
const [sheet] = xlsx.parse(options.src);

const statements = [
  "SET @locale_id = (SELECT id FROM locales WHERE name = 'zh-CN')",
];
for (const [id, url] of sheet.data.slice(1)) {
  const pass = new PassThrough();
  https.get(url, { rejectUnauthorized: false }, response => {
    response.pipe(pass);
  });
  const fileName = id + '.mp3';
  s3.upload({ Key: fileName, Body: pass }).send(err => {
    if (err) {
      console.error(err);
      process.exit();
    }
  });

  statements.push(
    'INSERT INTO user_clients (client_id) VALUES (' + q(id) + ')'
  );

  const sentenceId = uuid();
  const sentence = [q(sentenceId), q('wawa'), 'TRUE', '@locale_id'];
  statements.push(
    'INSERT INTO sentences (id, text, is_used, locale_id) ' +
      `VALUES (${sentence.join(', ')})`
  );

  const clip = [q(id), q(fileName), q(sentenceId), q('wawa'), '@locale_id'];
  statements.push(
    'INSERT INTO clips (client_id, path, original_sentence_id, sentence, locale_id) ' +
      `VALUES (${clip.join(', ')})`
  );
}

console.log(statements.map(s => s + ';').join('\n'));
