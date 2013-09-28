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

tools.getText = function(elem){//from `domutils' package
    if(htmlparser.DomUtils.isTag(elem)) {
        if('br'==elem.name) return '\n';
        return elem.children.map(tools.getText).join("")
    }
    if(elem.type === htmlparser.ElementType.Text) return elem.data.replace(/\n/g, ' ').trim();
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