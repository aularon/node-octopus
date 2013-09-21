/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
var fs = require('fs'),
    hash = require('elephant').mh3;


var DiskCache = function(path, fetchCb, readOnly) {
    this.path = path;
    this.fetchCb = fetchCb;
    this.readOnly = readOnly;
    fs.mkdir(path, function(){});
}

DiskCache.prototype.get = function(key, cb) {
    var self = this;
    var h = hash(key);
    var fname = this.path + '/'+ h;
    fs.exists(fname, function(found) {
        //console.log(key, h, found);
        if(found) {
            fs.readFile(fname, 'utf8', function(err, data) {
                //console.log(data);
                cb(JSON.parse(data))
            });
            //self.readAndCall(fname, cb);
        } else {//fetch and save
            self.fetchCb(key, function(data) {
                if(!self.readOnly)
                    fs.writeFile(fname, JSON.stringify(data));
                cb(data);
            })
        }
    });
    
}


module.exports = DiskCache