var url        = require('url'),
    htmlparser = require('htmlparser2'),
    soupselect = require("cheerio-soupselect");

var htmlhelper = function(options) {
    this.hrefHandler = options.hrefHandler;
}

htmlhelper.prototype.parse = function(href, html, cb) {
    var self = this;
    
    var handler = new htmlparser.DomHandler(function (error, dom) {
        if(error) {
            console.error('HTMLPARSER ERROR', error);
            return;
        }
        //absolutify URLs
        soupselect.select(dom, 'a[href]').forEach(function(elem, c){
            elem.attribs.href = url.resolve(href, elem.attribs.href);
            self.hrefHandler(elem.attribs.href);
        });
        soupselect.select(dom, 'img[src]').forEach(function(elem, c){
            elem.attribs.href = url.resolve(href, elem.attribs.src);
            self.hrefHandler(elem.attribs.href);
        });
        cb(href, dom);
    });
    var parser = new htmlparser.Parser(handler);
    parser.write(html);
    parser.done();
}


module.exports = htmlhelper;