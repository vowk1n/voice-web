const fs = require('fs');
const https = require('https');
const path = require('path');
const { PassThrough } = require('stream');
const AWS = require('aws-sdk');
const commandLineArgs = require('command-line-args');
const parse = require('csv-parse/lib/sync');
const uuid = require('uuid/v4');

// surround a string in quotes
const q = str => "'" + str + "'";

async function run() {
  const options = commandLineArgs([
    {
      name: 'src',
      description: 'xlsx file one clip per row',
      type: String,
      defaultOption: true,
    },
  ]);

  const s3 = new AWS.S3({ params: { Bucket: 'cv-mandarin' } });
  const lines = parse(fs.readFileSync(options.src, 'utf-8'), {
    from_line: 2,
    delimiter: ';',
  });

  const statements = [
    "SET @locale_id = (SELECT id FROM locales WHERE name = 'zh-CN')",
  ];

  let uploads = 0;
  for (const [id, , , sentence, url] of lines) {
    if (uploads > 250) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const pass = new PassThrough();
    https.get(url, { rejectUnauthorized: false }, response => {
      response.pipe(pass);
    });
    const fileName = id + '.mp3';
    s3.upload({ Key: fileName, Body: pass }).send(err => {
      uploads--;
      if (err) {
        console.error(err);
        process.exit();
      }
    });
    uploads++;

    statements.push(
      'INSERT IGNORE INTO user_clients (client_id) VALUES (' + q(id) + ')'
    );

    const sentenceId = uuid();
    const sentenceData = [q(sentenceId), q(sentence), 'TRUE', '@locale_id'];
    statements.push(
      'INSERT INTO sentences (id, text, is_used, locale_id) ' +
        `VALUES (${sentenceData.join(', ')})`
    );

    const clipData = [
      q(id),
      q(fileName),
      q(sentenceId),
      q(sentence),
      '@locale_id',
    ];
    statements.push(
      'INSERT INTO clips (client_id, path, original_sentence_id, sentence, locale_id) ' +
        `VALUES (${clipData.join(', ')})`
    );
  }

  console.log(statements.map(s => s + ';').join('\n'));
}

run().catch(e => console.error(e));
