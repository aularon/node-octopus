var octopus = require('../'),
    $ = octopus.$,
    htmlparser = require('htmlparser2');
var getText = function getText(elem){//from `domutils' package
    if(htmlparser.DomUtils.isTag(elem)) return elem.children.map(getText).join("");
    if(elem.type === htmlparser.ElementType.Text) return elem.data;
    return "";  
};

var wikiOctopus = new octopus.Octopus();

wikiOctopus.addURL('https://en.wikipedia.org/wiki/Main_Page');
wikiOctopus.handle(/^/, function(href, dom) {
    $(dom, '#mp-itn li').forEach(function(elem) {
        console.log('➭', getText(elem), $(elem, 'a')[0].attribs.href)
    })
})

wikiOctopus.start();