const csv = require("csv-parser");
const fs = require("fs");
const dayjs = require("dayjs");
var customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const nonDEFields = [
	"event",	
	"completedDate",	
	"eventDate",	
	"orgUnit",	
	"status",	
	"programStage",	
	"program",	
	"attributeCategoryOptions",
];


export const convert = (filename) => {
   return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filename)
      .pipe(csv({ skipComments: true }))
      .on("data", (data) => {
         // dateFields.forEach((f) => {
         // const f = !!data["V1et6u3BPTl"] ? "V1et6u3BPTl" : "mmm";
         // const val = data[f].split(" ");
         // data["V1et6u3BPTl"] = dayjs(
         // 	val[0].replace(/^0?(\d+)\/0?(\d+)/, "$1/$2"),
         // 	"D/M/YYYY"
         // ).format("YYYY-MM-DD");
         // if (val.length > 1) data["V1et6u3BPTl"] += ` ${val[1]}`;
         // });

         
         const event = {
            attributeCategoryOptions: data['attributeCategoryOptions'],
            orgUnit: data['orgUnit'],
            program: data['program'],
            programStage: data['programStage'],
            eventDate: data['eventDate'].replace(/ 00:00:00.0$/,''),			
            event: data['event'],
            status: data['status'],		
            completedDate: data['completedDate'].replace(/ 00:00:00.0$/,''),	
            // occurredAt: "2022-11-01",
            // createdAt: "2022-11-07T17:32:58.513",
            // updatedAt: "2022-11-07T17:32:58.513",
            // attributeOptionCombo: "Lf2Axb9E6B4",			
            // completedAt: "2022-11-07",
            // notes: [],
            // occurredAt: data.V1et6u3BPTl?.split(" ")?.[0] ?? "2022-10-02",
            dataValues: Object.keys(data)
               .filter((f) => !nonDEFields.includes(f))
               .map((key) => ({
                  dataElement: key,
                  value: data[key].replace(/ 00:00:00.0$/,''),
               })).filter(de => !!de.dataElement),
         };
		   results.push(event);
	   })
      .on("end", () => {
         resolve(results);
      });

   })

}

export const chunk = (results, chunkSize) => {
   const chunkSize = results.length / chunkSize;
   const chunks = [];

   
   for (let i = 0; i < results.length; i += chunkSize) {
     
      const chunk = results.slice(i, i + chunkSize);

      const data = JSON.stringify({ events: chunk }, null, 4);

      chunks.push(data);
   }
}