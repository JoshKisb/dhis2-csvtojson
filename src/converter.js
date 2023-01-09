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

const dateFields = ["# date_of_notification", "dateofbirth"];

const createMap = (filename) => {
	return new Promise((resolve, reject) => {
		const results = [];
		fs.createReadStream(filename)
			.pipe(csv({ skipComments: true }))
			.on("data", (data) => {
				// console.log(data)
				results.push({
					facilityName: data["Health Facility"],
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
			.pipe(csv({ skipComments: false }))
			.on("data", (data) => {

				dateFields.forEach((f) => {
					if (!!data[f]) {
						const val = data[f];//.replace(/^(\d+)\/(\d+)/, "$2/$1");
						// console.log("val", val);
						data[f] = moment(val, [
							"D/M/YYYY",
							"DD/MM/YYYY",
							"YYYY-MM-DD",
						]).format("YYYY-MM-DD");
					}
				});

				// console.log("Object.keys(data)", Object.keys(data))
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

				
				//occuredAt = date of notification
				event['occurredAt'] = event.dataValues.find(de => de.dataElement == "iN4MkMAfTCI")?.value;
				// console.log("ev", event);
				results.push(event);
			})
			.on("end", () => {
				resolve(results);
			});
	});
};

const mapOrgUnit = (event, facilitycolumns) => {
	let data = null;
	// console.log("facilitycolumns", facilitycolumns);

	// console.log("dava", event);

	data = facilitycolumns.map((facilitycolumn) => {
		return event.dataValues.find(
			(de) =>
				de.dataElement.toLocaleLowerCase() ==
				facilitycolumn.toLocaleLowerCase()
		);
	}).filter(d => !!d);

	// console.log("data", data)

	if (!!data && !!data.length) {

		let orgUnit = null;
		for (let i = 0; i < data.length; i++) {
			const de = data[i];
			
			orgUnit = getIdFromMap(de.value);
			if (!!orgUnit && orgUnit != "#N/A") break;
		}

		if (!!orgUnit && orgUnit != "#N/A") {
			// console.log(`map org: [${data.map.value} => ${orgUnit}]`);
			return { ...event, 
				orgUnit };
		} else {
			// console.log(`failed for: ${data.value}`);
			return null;
		}
	}
	return null;
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
