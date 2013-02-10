var url = require('url');

var tools = {}

tools.cleanHref = function(href) {
    var parsed = url.parse(href);
    
    
    
    parsed.pathname = parsed.pathname.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
    delete parsed.hash;
    if (parsed.search) parsed.search = parsed.search.substr(1);
    //console.log(parsed, url.format(parsed));
    //console.log(href)
    
    return url.format(parsed);
}

module.exports = tools;