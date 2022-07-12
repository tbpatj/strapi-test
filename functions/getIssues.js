const { default: axios } = require("axios");

async function getIssues() {
  let res = await axios
    .get(
      `${process.env.ATLASSIAN_BASE}/rest/api/2/search?jql=project=%27node%27&maxResults=100`,
      {
        auth: {
          username: process.env.ATLASSIAN_USERNAME,
          password: process.env.ATLASSIAN_API_KEY,
        },
      }
    )
    .then((res) => res)
    .catch((err) => console.log(err));
  //   console.log(newRes);
  let bulkData = [];
  let findData = [];

  //organize the data to push to our backend
  for (let i = 0; i < res.data.issues.length; i++) {
    let issue = res.data.issues[i];
    let description = issue.fields.description;
    let status = issue.fields.status.name;
    let issueID = issue.id;
    let issueKey = issue.key;
    bulkData.push({
      description,
      status,
      issueID,
      issueKey,
      votes: 0,
      publishedAt: new Date().toISOString(),
    });
    findData.push({ issueID });
  }
  let results = await strapi.db.query("api::issue.issue").findMany({
    where: {
      $or: findData,
    },
  });
  //   console.log(results);
  //update these fields, due to them already existing
  let updateData = [];
  for (let i = 0; i < results.length; i++) {
    for (let t = 0; t < bulkData.length; t++) {
      if (parseInt(bulkData[t].issueID) === parseInt(results[i].issueID)) {
        // if the new data is different than the old then update it
        if (bulkData[t].status !== results[i].status) {
          console.log("updating", bulkData[t].issueKey);
          await strapi.db.query("api::issue.issue").update({
            where: { issueID: bulkData[t].issueID },
            data: {
              status: bulkData[t].status,
            },
          });
        }
        bulkData.splice(t, 1);
        t = bulkData.length + 1;
      }
    }
  }

  //do a bulk creation for all the data we need to push to the server
  if (bulkData.length > 0) {
    await strapi.db.query("api::issue.issue").createMany({
      data: bulkData,
    });
  }
}

module.exports = getIssues;
