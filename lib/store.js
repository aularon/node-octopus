var EventEmitter = require('events').EventEmitter,
    elephant;

try {
    elephant = require('elephant')
} catch (e) {}
//logging.config('debug')

var Store = function() {
    this.urlsQueue = [];
    if (elephant) {
        this.elephant = new elephant.Elephant();

    }
}

Store.prototype = new EventEmitter();

Store.prototype.forceAddURL = function(url, meta) {
     this.urlsQueue.unshift([url, meta]);
}
Store.prototype.addURL= function(url, meta) {
    
    if(this.elephant.memorize(url)) {
        //this.emit('duplicateURL', url);
        return false;
    }
    
    this.urlsQueue.unshift([url, meta]);
    
    //this.emit('newURL', url);
    return true;
}
Store.prototype.getURL = function() {
    return this.urlsQueue.shift();
}


exports.Store = Store;