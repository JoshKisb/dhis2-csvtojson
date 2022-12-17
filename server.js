const fs = require("fs");
const axios = require("axios");
const express = require("express");
const multer = require("multer");
const { convert } = require("./converter");
const upload = multer({ dest: "uploads/" });

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
	orgUnit: "FvewOonC8lS",
	orgUnitName: "Adilang HC III",
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
   orgUnit: "FvewOonC8lS",
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
}

app.get('/', (req, res) => {
   res.send("API Server is running");
})

app.post("/", upload.single("file"), async function (req, res, next) {
	// req.file is the `avatar` file
	// req.body will hold the text fields, if there were any
   const payload = req.body['type'] == "births" ? birthPayload : deathPayload;

	try {
		convert(req.file.path, payload).then((results) => {
			const data = { events: results };
         //fs.writeFileSync("output.json", JSON.stringify(data, {}, 2), "utf8");
         fs.unlinkSync(req.file.path);

			axios
				.post(`${apiUrl}/api/events`, data, {
					auth: {
						username: apiUser,
						password: apiPass,
					},
				})
				.then(function (response) {
					//console.log(response);
					res.json(response.data);
				})
				.catch(function (error) {
					console.log(error);
					res.json({ error });
				});
		});
	} catch (error) {
		console.error(error);
		res.json({ error });
	}
});

app.listen(port, () => {
	console.log(`CSV-JSON Converter listening on port ${port}`);
});
