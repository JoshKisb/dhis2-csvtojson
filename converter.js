const csv = require("csv-parser");
const fs = require("fs");
const moment = require("moment");

const nonDEFields = [
	"event",
	"completedDate",
	"eventDate",
	"orgUnit",
	"status",
	"programStage",
	"program",
	"attributeCategoryOptions",
   "#N/A"
];


const dateFields = ["iN4MkMAfTCI", "l1pU8bGbUmO"];

function getIdFromArray(orgUnitName, data) {
	// Loop through each object in the data array
	for (let i = 0; i < data.length; i++) {
	  const obj = data[i];
 
	  // Check if the orgUnitName is in the MVRS_Facilities field
	  if (obj.MVRS_Facilities === orgUnitName) {
		 // Return the ID field
		 return obj.ID;
	  }
 
	  // Check if the orgUnitName is in the MVRS_SUB field
	  if (obj.MVRS_SUB === orgUnitName) {
		 // Return the SUB field
		 return obj.SUB;
	  }
	}
 
	// If the orgUnitName was not found, return null
	return null;
 }
 

const convert = (filename, payload) => {
	return new Promise((resolve, reject) => {
		const results = [];
		fs.createReadStream(filename)
			.pipe(csv({ skipComments: true }))
			.on("data", (data) => {
				dateFields.forEach((f) => {
					if (!!data[f]) {
                  const val = data[f].replace(/^(\d+)\/(\d+)/, "$2/$1")
                  
                  data[f] = moment(val, ["D/M/YYYY","DD/MM/YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD");
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
							dataElement: key,
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

const chunk = (results, chunkCount) => {
	const chunkSize = results.length / chunkCount;
	const chunks = [];

	for (let i = 0; i < results.length; i += chunkSize) {
		const chunk = results.slice(i, i + chunkSize);

		const data = JSON.stringify({ events: chunk }, null, 4);

		chunks.push(data);
	}
};

module.exports = { convert, chunk };
