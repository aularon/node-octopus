
var octopus = {
    Octopus: require('./lib/octopus').Octopus,
    $: require("cheerio-soupselect").select,
    DiskCache: require('./lib/diskcache'),
    plugins: {
        logger: require('./lib/plugins/logger'),
        progress: require('./lib/plugins/progress')
    },
    tools: require('./lib/tools')
}
module.exports = octopus;