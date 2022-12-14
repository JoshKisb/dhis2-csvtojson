const fs = require("fs");
const axios = require("axios");
const express = require("express");
const multer = require("multer");
const { convert, chunk, mapOrgUnit } = require("./converter");
const { resolve } = require("path");
const upload = multer({ dest: "../uploads/" });
const birthsDEMap = require('../dataelements/births.json')
const deathsDEMap = require('../dataelements/deaths.json')
const axiosRetry = require('axios-retry');
const { cloneDeep } = require("lodash");

axiosRetry(axios, { retries: 3, retryDelay: () => 3000 });

const app = express();
const port = 3000;
const apiUrl = "https://db.sk-engine.cloud/dash";
const apiUser = "mvrs2";
const apiPass = "Mvrs2@123";

const birthPayload = {
	// event: "x0Q2s0gDH07",
	status: "COMPLETED",
	program: "HRpRnJjDTSJ",
	programStage: "iHc8FhAHLMw",
	enrollment: "qCczUwH7LKN",
	orgUnit: "xxxx",
	//orgUnitName: "Adilang HC III",
	occurredAt: "2015-01-05",
	followup: false,
	deleted: false,
	createdAt: "2022-10-26T16:36:44.665",
	updatedAt: "2022-10-26T16:36:44.665",
	attributeOptionCombo: "Lf2Axb9E6B4",
	attributeCategoryOptions: "l4UMmqvSBe5",
	completedBy: "mvrs2",
	completedAt: "2022-10-26",
	notes: [],
	scheduledAt: null,
	geometry: null,
};

const deathPayload = {
	// event: "zA5F2L5I7x5",
	status: "COMPLETED",
	program: "MH5Jp0Nk5ZY",
	programStage: "mb8ZLaPEfFF",
	enrollment: "DAqxDG6xpfA",
	orgUnit: "xxxx",
	occurredAt: "2022-11-01",
	followup: false,
	deleted: false,
	createdAt: "2022-11-07T17:32:58.513",
	updatedAt: "2022-12-17T09:27:15.444",
	attributeOptionCombo: "Lf2Axb9E6B4",
	attributeCategoryOptions: "l4UMmqvSBe5",
	completedBy: "mvrs2",
	completedAt: "2022-11-07",
	scheduledAt: null,
	geometry: null,
};

app.get("/", (req, res) => {
	res.send("API Server is running");
});

// provided by chatgpt
function removeCircularReferences(obj, seen) {
	seen = seen || new WeakSet();
 
	if (obj !== Object(obj)) {
	  return obj;
	}
 
	if (seen.has(obj)) {
	  return '[Circular]';
	}
 
	seen.add(obj);
 
	for (const key of Object.keys(obj)) {
	  obj[key] = removeCircularReferences(obj[key], seen);
	}
 
	return obj;
 }
 

 

const makeAPIRequest = (data) => {
	return new Promise((resolve, reject) => {
		axios
			.post(`${apiUrl}/api/events`, data, {
				auth: {
					username: apiUser,
					password: apiPass,
				},
				timeout: 600000
			})
			.then(function (response) {
				//console.log(response);
				resolve(response.data);
			})
			.catch(function (error) {
				console.log(error.response ?? error);
				reject({ error: error.response ?? error });
			});
	});
};
app.post("/", upload.single("file"), async function (req, res, next) {
	// req.file is the `avatar` file
	// req.body will hold the text fields, if there were any
	console.log("Received request...");
	const payload = req.body["type"] == "births" ? birthPayload : deathPayload;
	const deMap = req.body["type"] == "births" ? birthsDEMap : deathsDEMap;
	const facilitycolumns = req.body["facility_col"]?.split(',') ?? null;

	try {
		convert(req.file.path, payload, deMap).then(async (events) => {
			let results = events;
			const failedOrgs = [];
			const successOrgs = [];

			if (!!facilitycolumns) {
				events.forEach(e => {

					const ev = mapOrgUnit(e, facilitycolumns)
					if (!ev) 
						failedOrgs.push(e);
					else 
						successOrgs.push(ev);
				})
				results = successOrgs;
			}

			console.log("Converted to json...");

			// res.json({events}); return;

			const timestr = Date.now();
			const outfile = `payloads/${timestr}_failed.json`;
			// const data = { events: results };
			fs.writeFileSync(outfile, JSON.stringify(failedOrgs, {}, 2), "utf8");
			//fs.unlinkSync(req.file.path);
			const chunkCount = Math.ceil(results.length / 60);

			const chunks = chunk(results, chunkCount);

			console.log(
				`Posting data to ${apiUrl}/api/events. ${chunkCount} chunks`
			);

			resp = [];

			try {
				for (let x = 0; x < chunks.length; x++) {
					const res = await makeAPIRequest(chunks[x]);
					console.log(`Posted chunk ${x+1}/${chunkCount}`)
					resp.push(res);
					setTimeout(() => {}, 8000);
				}
				console.log("completed posting")
				res.json(resp);
			} catch (err) {
				res.json({ error: removeCircularReferences(cloneDeep(err)) });
			}
			// Promise.all(chunks.map(chunk => makeAPIRequest(chunk)))
			// .then(res => res.json(res))
			// .catch(err => res.json(err))
		});
	} catch (error) {
		// console.error(error);
		res.json({ error: removeCircularReferences(cloneDeep(error)) });
	}
});

app.listen(port, () => {
	console.log(`CSV-JSON Converter listening on port ${port}`);
});
