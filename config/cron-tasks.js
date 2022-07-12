let getIssues = require("../functions/getIssues");

module.exports = {
  /**
   * Simple example.
   * Every monday at 1am.
   */

  "* * */20 * * *": async () => {
    console.log("running");
    getIssues();
  },
};
