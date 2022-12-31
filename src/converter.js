const csv = require("csv-parser");
const fs = require("fs");
const moment = require("moment");
const map = require("./map.json");

const nonDEFields = [
	"event",
	"completedDate",
	"eventDate",
	"orgUnit",
	"status",
	"programStage",
	"program",
	"attributeCategoryOptions",
	"#N/A",
];

const dateFields = ["iN4MkMAfTCI", "l1pU8bGbUmO"];

const createMap = (filename) => {
	return new Promise((resolve, reject) => {
		const results = [];
		fs.createReadStream(filename)
			.pipe(csv({ skipComments: true }))
			.on("data", (data) => {
				// console.log(data)
				results.push({
					facilityName: data["MVRS_Facilities"],
					id: data["FAC"],
				});
			})
			.on("end", () => {
				resolve(results);
			});
	});
};
const getIdFromMap = (orgUnitName) => {
	const facility = map.find((f) => {
		return f.facilityName.toLowerCase() == orgUnitName.toLowerCase();
	});

	return facility?.id;
};

const convert = (filename, payload, deMap) => {
	return new Promise((resolve, reject) => {
		const results = [];
		fs.createReadStream(filename)
			.pipe(csv({ skipComments: true }))
			.on("data", (data) => {
				dateFields.forEach((f) => {
					if (!!data[f]) {
						const val = data[f].replace(/^(\d+)\/(\d+)/, "$2/$1");

						data[f] = moment(val, [
							"D/M/YYYY",
							"DD/MM/YYYY",
							"YYYY-MM-DD",
						]).format("YYYY-MM-DD");
					}
				});

				const event = {
					...payload,
					completedDate: data["completedDate"]?.replace(
						/ 00:00:00.0$/,
						""
					),
					dataValues: Object.keys(data)
						.filter((f) => !nonDEFields.includes(f))
						.map((key) => ({
							dataElement: deMap[key],
							value: data[key].replace(/ 00:00:00.0$/, ""),
						}))
						.filter((de) => !!de.dataElement),
				};

				results.push(event);
			})
			.on("end", () => {
				resolve(results);
			});
	});
};

const mapOrgUnit = (event, facilitycolumns) => {
	let data = null;
	facilitycolumns.every(facilitycolumn => {
		data = event.dataValues.find(
			(de) =>
				de.dataElement.toLocaleLowerCase() ==
				facilitycolumn.toLocaleLowerCase()
		);
		// breaks when falsy/ if data set then break
		return !data;
	});
	if (!!data) {
		const orgUnit = getIdFromMap(data.value);

		if (!!orgUnit) {
			console.log(`map org: [${data.value} => ${orgUnit}]`);
			return { ...event, orgUnit };
		} else console.log(`failed for: ${data.value}`);
	} 
	return event;
};

const chunk = (results, chunkCount) => {
	const chunkSize = results.length / chunkCount;
	const chunks = [];
	const timestr = Date.now();
	let x = 0;

	for (let i = 0; i < results.length; i += chunkSize) {
		x += 1;
		const chunk = results.slice(i, i + chunkSize);

		const data = { events: chunk };

		const outfile = `payloads/${timestr}_payload_${x}.json`;

		fs.writeFileSync(outfile, JSON.stringify(data, {}, 4), "utf8");
		chunks.push(data);
	}

	return chunks;
};

module.exports = { convert, chunk, createMap, mapOrgUnit, getIdFromMap };
