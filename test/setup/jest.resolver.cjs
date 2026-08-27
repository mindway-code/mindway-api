const fs = require("fs");
const path = require("path");

module.exports = (request, options) => {
  // In this repo, TS sources use NodeNext-style `.js` specifiers.
  // Jest should load the `.ts` file when it exists, without affecting node_modules.
  if (request && request.endsWith(".js") && request.startsWith(".")) {
    const absJs = path.resolve(options.basedir, request);
    // If the `.js` actually exists (common in node_modules), keep default behavior.
    if (fs.existsSync(absJs)) {
      return options.defaultResolver(request, options);
    }

    const absTs = absJs.slice(0, -3) + ".ts";
    if (fs.existsSync(absTs)) return absTs;
  }

  return options.defaultResolver(request, options);
};
