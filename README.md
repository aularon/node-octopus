[node-octopus](https://github.com/aularon/node-octopus)
============

![Elephant Logo](https://raw.github.com/aularon/node-octopus/master/doc/logoc.png)


An octopus that can get his hands all over the web.

## From Syria with Love : )
This package is a product of Syria, 2013.

## Installation

```bash
npm install octopus
```

## Usage & Examples

```javascript
var octopus = require('octopus'),
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
```


## Roadmap
* Documenting current features and usage.

## Copyright & License
© 2013 Hasan Arous. All rights reserved.

[Mozilla Public License Version 2.0](http://www.mozilla.org/MPL/2.0/)
