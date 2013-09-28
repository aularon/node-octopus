/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
var fs = require('fs'),
    hash = require('elephant').mh3;

var md5 = function(str) { return  require('crypto').createHash('md5').update(str).digest("hex"); }


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
    var trial = 0;
    var foundCB = function(found) {
        //console.log(key, h, found);
        if(found) {
            //console.log('found', fname, 'on trial', trial)
            fs.readFile(fname, 'utf8', function(err, data) {
                //console.log(data);
                var data = JSON.parse(data);
                /**/
                data.href = data.href.replace(/&r=&rc=\d+$/, '');
                //console.log();ddd();
                /**/
                cb(data)
            });
            //self.readAndCall(fname, cb);
        } else if(1 == ++trial) {//md5'd
            h = md5(key);
            fname = self.path + '/' + h.substr(0, 2) + '/' + h;
            //console.log(fname);
            fs.exists(fname, foundCB);
        } else {//fetch and save
            self.fetchCb(key, function(data) {
                if(!self.readOnly)
                    fs.writeFile(fname, JSON.stringify(data));
                cb(data);
            })

        }
    }
    fs.exists(fname, foundCB);

    
}


module.exports = DiskCache;
