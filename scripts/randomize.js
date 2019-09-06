const fs = require('fs');
const commandLineArgs = require('command-line-args');

async function run() {
  const options = commandLineArgs([
    {
      name: 'src',
      description: 'csv file one clip per row',
      type: String,
      defaultOption: true,
    },
  ]);

  const newLines = fs
    .readFileSync(options.src, 'utf-8')
    .split('\n')
    .filter(line => line.includes('accepted') && line.includes('completed'))
    .join('\n');

  console.log(newLines);
}

run().catch(e => console.error(e));
