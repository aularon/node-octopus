var url        = require('url'),
    htmlparser = require('htmlparser2'),
    soupselect = require("cheerio-soupselect"),
    _          = require('underscore');

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
            elem.href = url.resolve(href, _.unescape(elem.attribs.href));
            self.hrefHandler(elem.href);
        });
        soupselect.select(dom, 'img[src]').forEach(function(elem, c){
            elem.src = url.resolve(href, _.unescape(elem.attribs.src));
            self.hrefHandler(elem.src);
        });
        cb(href, dom);
    });
    var parser = new htmlparser.Parser(handler);
    parser.write(html);
    parser.done();
}


module.exports = htmlhelper;