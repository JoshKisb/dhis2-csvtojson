const express = require('express')
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })


const app = express()
const port = 3000

app.post('/', upload.single('file'), function (req, res, next) {
   // req.file is the `avatar` file
   // req.body will hold the text fields, if there were any
 });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})