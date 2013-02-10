var util = require('util');

var progress = function(site) {
    site.on(['active.done'], function(url) {
        process.stdout.write(util.format('\r%d/%d (%s%%)',
                    this.Stats.requests.fetched,
                    this.Stats.urls.added,
                    Math.round(this.Stats.requests.fetched*10000/this.Stats.urls.added)/100));
    })
}

module.exports = progress;