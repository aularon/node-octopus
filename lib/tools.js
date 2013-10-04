var url = require('url');
var _ = require('underscore')

var entities;

try {
    var Entities = require('html-entities').AllHtmlEntities;
    entities = new Entities();
} catch(e) {}

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

var blockLevelElements = ['address','article','aside','audio','blockquote','canvas','dd','div','dl','fieldset','figcaption','figure','figcaption','footer','form','h1','h2','h3','h4','h5','h6','header','hgroup','hr','noscript','ol','output','p','pre','section','table','tfoot','ul','video'];

tools.getText = function(elem){
    if(elem instanceof Array) {
        return elem.map(tools.getText).join('\n\n')
    }
    if(htmlparser.DomUtils.isTag(elem)) {
        if('br'==elem.name) return '\n';
        if('p'==elem.name) return elem.children.map(tools.getText).join("") + '\n\n\n';
        if(_.contains(blockLevelElements, elem.name)) return elem.children.map(tools.getText).join("") + '\n';
        return elem.children.map(tools.getText).join("")
    }
    if(elem.type === htmlparser.ElementType.Text) return entities.decode(elem.data.replace(/\n/g, ' ').trim());
    return "";  
};

tools.search = function(node, text, markers, path) {
    var src = [];
    if(!path) path = '';
    if(!markers) markers = [];
    if(node instanceof Array) {
        src = node;
    } else {
        src = node.children;
    }
    src.forEach(function(tag) {
        if('text'==tag.type) {
            if(-1!=tag.data.indexOf(text)) {
                console.log('found!', path)
            }
            return;
        } else if('tag'!=tag.type) return;

        var p = tag.name;
        if(tag.attribs.class) {
            p += '.' + tag.attribs.class;
        }
        markers.forEach(function(m) {
            if(tag.attribs[m]) {
                p += '[' + m + '="' + tag.attribs[m] + '"]'
            }
        })
        p += ' ';
        tools.search(tag, text, markers, path + p)
        //
    })
}

module.exports = tools;