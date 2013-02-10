var util = require('util');

var logger = function(site) {
    site.on('active.new', function(url) {
        log.call(this, '+', decodeURI(url));
    });
    site.on('active.done', function(url) {
        log.call(this, '-', decodeURI(url));
    });
}

var log = function (what, url) {
    
    console.log(util.format('\r%d/%d (%s%%) %s %s',
                this.Stats.requests.fetched,
                this.Stats.urls.added,
                Math.round(this.Stats.requests.fetched*10000/this.Stats.urls.added)/100),
                what, url);
}

module.exports = logger;