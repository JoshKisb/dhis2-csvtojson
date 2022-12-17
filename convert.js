const { convert, chunk } = require("./converter");

const args = process.argv;

const filename = args.length >= 3 ? args[2] : "data.csv";
const outfile = args.length >= 4 ? args[3] : "output.json";

convert(filename).then(results => {
	const chunks = chunk(results, 16);

	for (let i = 0; i < chunks.length; i += 1) {
		
		const data = chunks[i]
		const outfile = `output${i + 1}.json`

		fs.writeFileSync(outfile, data, "utf8");
		console.log(`File: [${outfile}] created successfully!`);
	}
})
		
		
