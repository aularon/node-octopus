var http = require('http'),
    request = require('request'),
    Store = require('./store').Store,
    tools = require('./tools'),
    htmlhelper = require('./htmlhelper'),
    EventEmitter = require('events').EventEmitter,
    $ = require("cheerio-soupselect").select;

var iconv = require('iconv-lite');

/* =============== Base ===================================================== */
var Octopus = function(config) {
    var self = this;
    for (var k in config) this.config[k] = config[k];
    
    this.store = new Store();
    
    if('string' == typeof this.config.cache) {
        this.config.cache = new (require('./diskcache'))(this.config.cache);
    }
    if((this.cache = this.config.cache)) {
        this.cache.fetchCb = function(url, cb) {
            //cb
            self.fetchURL(url, function(res, body) {
                //if(!res) return cb(null);
                cb({
                    data: body.toString('base64'),
                    headers: res.headers,
                    href: res.request.href
                });
            })
        };
    }


    
    
    this.httpAgent = new http.Agent();
    this.httpAgent.maxSockets = this.config.maxSockets;
    this.freeSlots = this.config.maxSockets * 2;
    
    //console.log(self.config.automaticallyCollectLinks);
    this.htmlhelper = new htmlhelper({
        hrefHandler: function(href) {
            //console.log(self.config.automaticallyCollectLinks)
            if(!self.config.automaticallyCollectLinks) return;
            for(var i=0; i<self.handlers.length; ++i) {
                //console.log(self.handlers[i].rx.test(href), self.handlers[i].rx, href);
                if(self.handlers[i].rx.test(href)) {
                    if(self.config.urlRewriter) {
                        self.addURL(self.config.urlRewriter(href));
                        
                    } else {
                        self.addURL(href);
                    }
                    
                    break;
                }
            }
        }
    });
    
    this.req = request.defaults({
        pool: this.httpAgent,
        followRedirect: false,
        encoding: this.config.encoding,
        timeout: this.config.timeout,
    });
    //console.log(this.config.encoding)
}
Octopus.prototype = new EventEmitter();
Octopus.prototype.httpAgent = null;
Octopus.prototype.store = null;
Octopus.prototype.req = function() {};
Octopus.prototype.freeSlots = 0;
Octopus.prototype.config = {
    maxSockets: 10,
    automaticallyCollectLinks: false,
    cache: null,
    urlRewriter: null,
    encoding: null,
    offlineMode: false,
    timeout: 30000//30 sec
}
Octopus.prototype.handlers = []


Octopus.prototype.handle = function(rx, cb) {
    this.handlers.push({"rx": rx, "cb": cb})
}
Octopus.prototype.addURL = function(href, meta) {
    
    href = tools.cleanHref(href);
    
    if(this.store.addURL(href, meta)) {
        ++this.Stats.urls.added;
        this.pickupRequest();
    } else {
        ++this.Stats.urls.duplicates;
    }
    
}

Octopus.prototype.paused = true;
Octopus.prototype.start = function() {
    this.paused = false;
    this.pickupRequest();
}

Octopus.prototype.pickupRequest = function() {
    if (this.paused) return;
    var url;
    if(this.freeSlots > 0 && ('undefined'!=typeof (url = this.store.getURL()))) {
        --this.freeSlots;
        if('object'!=typeof url) {
            console.log(url);d();
        }
        this.handleURL(url[0], url[1]);
    }
}

/* =============== Status Related =========================================== */
Octopus.prototype.Stats = {
    requests: {
        "started": 0,
        "completed": 0,
        "fetched": 0
    },
    urls: {
        "added": 0,
        "duplicates": 0
    },
    errors: {
        "sock": 0,
        "http": 0
    },
    "active": 0
};
Octopus.prototype.getStatus = function() {
    return {
        stats: this.Stats,
        freeSlots: this.freeSlots
    }
}

/* =============== Active URLs info ========================================= */
Octopus.prototype.activeCreate = function(url, meta) {
    ++this.Stats.active;
    this.active[url] = {
        handlers: [],
        status: 'new',
        meta: meta
    };
    this.emit('active.new', url);
}
Octopus.prototype.activeModify = function(url) {
    
}
Octopus.prototype.activeFinish = function(url) {
    this.emit('active.done', url);
    delete this.active[url];
    --this.Stats.active;
}

/* ========================================================================== */
Octopus.prototype.active = {}
Octopus.prototype.fetchURL = function(url, cb) {
    if(this.config.offlineMode) {
        this.activeFinish(url);
        ++this.freeSlots; this.pickupRequest();
        //console.log(this.freeSlots)
        return;
    }
    var self = this;
    ++self.Stats.requests.started;
    this.req.get(url, function(error, response, body) {
        ++self.Stats.requests.completed;
        if (error) {
            ++self.Stats.errors.sock;
            if('ECONNRESET' == error.code
                || 'ETIMEDOUT' == error.code
                || 'ESOCKETTIMEDOUT' == error.code
                ) {
                if(!self.config.offlineMode) {
                    self.store.forceAddURL(url, self.active[url].meta);
                }
                ++self.freeSlots; self.pickupRequest();
            } else {

                // console.log(cb+'')
                //cb(null);
                console.log('ERROR', error, response, url);
            }
        } else if(200==response.statusCode) {
            cb(response, body);
        } else if(299<response.statusCode && response.statusCode<309) {
            self.activeModify(url, {status: 'redirect'});
            self.addURL(response.headers['location']);
        } else {
            ++self.Stats.errors.http;
            self.activeModify(url, {status: 'error'});
            console.log('HTTP ERROR', response.statusCode, url);//response
        }
    });
}
Octopus.prototype.handleURL = function(url, meta) {
    var self = this;
    this.activeCreate(url, meta);
    if(!this.cache) {
        var fetchURLCallback = function(a, b) {
            ++self.freeSlots; self.pickupRequest();
            ++self.Stats.requests.fetched;
            self.handleResponse(a, b)
            
            
            self.activeFinish(url);
        }
        this.fetchURL(url, fetchURLCallback);
        return;
    }
    var cacheGetCallback = function(obj) {
        ++self.freeSlots; self.pickupRequest();
        ++self.Stats.requests.fetched;
        //console.log(obj);
        //console.log('<'==obj.data[0])
        self.handleResponse({
            headers: obj.headers,
            request: {
                href: obj.href
            }
        }, ('<'==obj.data[0])? obj.data : new Buffer(obj.data, 'base64'));
        self.activeFinish(url);
    }
    this.cache.get(url, cacheGetCallback);
    /*
    this.fetchURL(url, function(a, b) {
        self.handleResponse(a, b)
    });*/
}
Octopus.responseHandlers = {}
Octopus.responseHandlers.allURLs = function(href, dom) {
    var self = this;
    $(dom, 'a[href]').forEach(function(elem) {
        //console.log(elem.attribs.href)
        self.addURL(elem.attribs.href);
    })
}
Octopus.prototype.handleResponse = function(response, body) {

    var self = this;
    //console.log(body);u()
    //console.log(this.active[response.request.href].meta)
    if('undefined'!=typeof response.headers['content-length'] 
            && response.headers['content-length'] != body.length) {
        console.log('!!!', response.request.href);
    }
    
    if(!this.active[response.request.href]) {
        console.log('FIXME#2', response.request.href);
    } else
    for(var i=0; i<this.handlers.length; ++i) {
        if(this.handlers[i].rx.test(response.request.href)) {

            this.active[response.request.href].handlers.push(this.handlers[i].cb);
        }
    }

    var is_html = 'text/html'==response.headers['content-type'].substr(0, 9)
        || 'text/xml'==response.headers['content-type'].substr(0, 8);

    //console.log('is_html', is_html)
    if(is_html) {
        var encoding = body.slice(0, 500).toString('ascii').match(/content="text\/html; charset=([\w\-]+)"/i);
        if(encoding && iconv.encodingExists(encoding=encoding[1])) {
            body = iconv.decode(body, encoding);
        }
        //console.log(encoding, iconv.encodingExists(encoding))
        
        this.htmlhelper.parse(response.request.href, body, function(href, dom) {
            //console.log('href', href);
            if(!self.active[href]) {
                //console.log(href);
                href = href.replace(/&r=&rc=\d+$/, '');
            }
            if(self.active[href]) {//FIXME

                for(var k=0; k<self.active[href].handlers.length; ++k) {
                    self.active[href].handlers[k].call(self,href, dom,response, self.active[response.request.href].meta, is_html);
                }
            } else {
                console.log('FIXME#1', href);
                //FIXME()
            }
        });
    } else {
        for(var k=0; k<self.active[response.request.href].handlers.length; ++k) {
            self.active[response.request.href].handlers[k].call(self,response.request.href, body, response, self.active[response.request.href].meta, is_html);
        }
        
    }
    /*if(0!=this.active[response.request.href].handlers.length) {//has handlers

    }*/
}

exports.Octopus = Octopus;


Octopus.prototype.single = function(url, cb) {
    var self = this;
    this.cache.get(url, function(obj) {
        var html = new Buffer(obj.data, 'base64');
        self.htmlhelper.parse(url, html, cb);
    });

    return;
}