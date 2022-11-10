const csv = require("csv-parser");
const fs = require("fs");
const dayjs = require("dayjs");
var customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const results = [];

const args = process.argv;

const filename = args.length >= 3 ? args[2] : "data.csv";
const outfile = args.length >= 4 ? args[3] : "output.json";

const dateFields = ["iN4MkMAfTCI", "l1pU8bGbUmO"];

fs.createReadStream(filename)
	.pipe(csv({ skipComments: true }))
	.on("data", (data) => {
		dateFields.forEach((f) => {
			const val = data[f].split(" ");
			data[f] = dayjs(val[0].replace(/^0?(\d+)\/0?(\d+)/, '$1/$2'), "D/M/YYYY").format("YYYY-MM-DD");
			if (val.length > 1)
				data[f] += ` ${val[1]}`;
		});
		const event = {
			occurredAt: data.iN4MkMAfTCI?.split(" ")?.[0] ?? "2022-10-02",
			status: "COMPLETED",
			notes: [],
			completedAt: "2022-10-20",
			program: "omMFCL7J9Dd",
			programStage: "gh9L2dKNSwM",
			orgUnit: "FvewOonC8lS",
			attributeCategoryOptions: "l4UMmqvSBe5",
			dataValues: Object.keys(data).map((key) => ({
				dataElement: key,
				value: data[key],
			})),
		};
		results.push(event);
	})
	.on("end", () => {
		const data = JSON.stringify({ events: results }, null, 4);

		fs.writeFileSync(outfile, data, "utf8");

		console.log(`File: [${outfile}] created successfully!`);
	});
