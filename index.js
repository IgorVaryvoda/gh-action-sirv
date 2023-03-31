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
const PURGE = core.getInput('purge', {
  required: false
});
let OUTPUT_DIR = core.getInput('output_dir', {
  required: false
});
const paths = klawSync(SOURCE_DIR, {
  nodir: true
});

let token = null;
let tokenExpiration = null;
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
  try {
    let response = await axios(requestConfig);
    return response.data.token;
  }
  catch (e) {
    console.warn('Error:', e)
  }
}
async function axiosWithTokenRefresh(requestConfig) {
  if (!token || (tokenExpiration && Date.now() >= tokenExpiration)) {
    token = await getToken();
    tokenExpiration = Date.now() + 1180 * 1000; // Refresh token 20 seconds before expiration
  }
  requestConfig.headers.authorization = 'Bearer ' + token;
  return axios(requestConfig);
}

async function upload(headers, qs, payload) {
  const requestConfig = {
    method: 'post',
    url: 'https://api.sirv.com/v2/files/upload',
    params: qs,
    headers: headers,
    data: payload
  }
  try {
    let response = await axiosWithTokenRefresh(requestConfig);
    return response.status
  }
  catch(e) {
    console.warn('Error:', e)
  }
}
async function deleteImage(headers, filename) {
  const requestConfig = {
    method: 'post',
    url: 'https://api.sirv.com/v2/files/delete',
    params: { filename: '/' + OUTPUT_DIR + '/' + filename },
    headers: headers,
  };
  try {
    let response = await axiosWithTokenRefresh(requestConfig);
    return response.status;
  }
  catch(e) {
    console.warn('Error:', e)
  }
}


async function run() {
  const sourceDir = path.join(process.cwd(), SOURCE_DIR);
  let result = {};
  // Function to get files from Sirv
  async function getSirvFiles(dirname, continuation) {
    const requestConfig = {
      method: 'get',
      url: 'https://api.sirv.com/v2/files/readdir',
      params: { dirname: '/' + dirname, continuation },
      headers: {
        authorization: 'Bearer ' + token,
        'content-type': 'application/json',
      },
    };
    try {
      let response = await axiosWithTokenRefresh(requestConfig);
      // Filter out directories from the response
      const files = response.data.contents.filter(entry => !entry.isDirectory);
      return { files, continuation: response.data.continuation };
    }
    catch(e) {
      console.warn('Error:', e)
    }
  }

  if (PURGE) {
    // Fetch all files from Sirv
    let sirvFiles = [];
    let continuation = null;
    do {
      const response = await getSirvFiles(OUTPUT_DIR, continuation);
      sirvFiles = sirvFiles.concat(response.files);
      continuation = response.continuation;
    } while (continuation);
    console.log("Fetched files from Sirv:", sirvFiles);

    // Get the list of file paths in the repository
    const repoFiles = paths.map(p => '/' + path.join(OUTPUT_DIR, path.relative(sourceDir, p.path)));
    console.log("Files in the repository:", repoFiles);

    // Identify images that are no longer in the repository
    const imagesToDelete = sirvFiles
      .filter(file => !file.isDirectory && !repoFiles.includes(file.filename))
      .map(file => file.filename);
    console.log("Images to delete:", imagesToDelete);

    // Call the deleteImage function for each image that needs to be deleted
    const deletePromises = imagesToDelete.map(image => {
      const headers = {
        authorization: 'Bearer ' + token,
        'content-type': 'application/json',
      };
      return deleteImage(headers, image);
    });

    // Wait for all delete operations to complete and return their status codes
    const deleteStatusCodes = await Promise.all(deletePromises);
    console.log("Deleted images, status codes:", deleteStatusCodes);
    result.purge = true;
    result.deleteStatusCodes = deleteStatusCodes;
    } else {
      result.purge = false;
    }
    // Upload functionality
    const uploadStatusCodes = await Promise.all(
      paths.map((p) => {
        const fileStream = fs.createReadStream(p.path);
        if (!OUTPUT_DIR) {
          OUTPUT_DIR = SOURCE_DIR;
        }
        const qs = {
          filename: "/" + path.join(OUTPUT_DIR, path.relative(sourceDir, p.path)),
        };
        const payload = fileStream;
        const headers = {
          authorization: "Bearer " + token,
          ContentType: lookup(p.path) || "image/jpeg",
        };
        return upload(headers, qs, payload);
      })
    );

    result.uploadStatusCodes = uploadStatusCodes;
    console.log("Uploaded images, status codes:", uploadStatusCodes);

    return result;
  }
  run()
  .then((result) => {
    if (result.purge) {
      core.info(`Deleted images. Status codes - ${result.deleteStatusCodes}`);
    } else {
      core.info("Purge not enabled, no images were deleted.");
    }
    core.info(`Uploaded images. Status codes - ${result.uploadStatusCodes}`);
  })
  .catch((err) => {
    core.error(err);
    core.setFailed(err.message);
  });
