const core = require('@actions/core');
const path = require('path');
const klawSync = require('klaw-sync');
const { lookup } = require('mime-types');
const axios = require('axios');
var fs = require("fs");

const clientId = core.getInput('clientId', {
  required: true
});
const clientSecret = core.getInput('clientSecret', {
  required: true
});
const SOURCE_DIR = core.getInput('source_dir', {
  required: true
});
let OUTPUT_DIR = core.getInput('output_dir', {
  required: false
});
const paths = klawSync(SOURCE_DIR, {
  nodir: true
});
//get Sirv API token
async function getToken() {
  const requestConfig = {
    method: 'post',
    url: 'https://api.sirv.com/v2/token',
    data: {'clientId': clientId, 'clientSecret': clientSecret},
    headers: {
      'Content-Type': 'application/json'
    },
  }
  let response = await axios(requestConfig);
  return response.data.token;
}
async function upload(headers, qs, payload) {
  const requestConfig = {
    method: 'post',
    url: 'https://api.sirv.com/v2/files/upload',
    params: qs,
    headers: headers,
    data: payload
  }
  let response = await axios(requestConfig);
  return response.status
}
async function run() {
  const token = await getToken();
  const sourceDir = path.join(process.cwd(), SOURCE_DIR);
  return Promise.all(
    paths.map(p => {
      const fileStream = fs.createReadStream(p.path);
      if (!OUTPUT_DIR) {
        OUTPUT_DIR = SOURCE_DIR
      }
      const qs = {'filename': '/'+path.join(OUTPUT_DIR, path.relative(sourceDir, p.path))};
      const payload = fileStream;
      const headers = {
        authorization: 'Bearer ' + token,
        ContentType: lookup(p.path) || 'image/jpeg'
      };
      return upload(headers, qs, payload);
    })
  );
}
run().then(response => {
  core.info(`Sucess. Status code - ${response}`);
})
.catch(err => {
  core.error(err);
  core.setFailed(err.message);
});;