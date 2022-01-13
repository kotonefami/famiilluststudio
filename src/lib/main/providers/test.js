const fs = require("fs").promises;

(async function() {
    var testContent = await fs.readFile("test.mdp");

    for (const provider of [require("./null.js"), require("./mdp.js")]) {
        if (provider.isSupport(testContent)) {
            await (new provider()).parse(testContent);
            break;
        }
    }
})();
