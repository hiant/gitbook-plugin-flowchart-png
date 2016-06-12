const spawnSync = require('child_process').spawnSync;
var fs = require('fs')
var fse = require('fs-extra')
var crypto = require('crypto');
var path = require('path');
var jst = require('jst');
var config = [{
    keyword: "flowchart",
    blockRegex: /^```flowchart((.*[\r\n]+)+?)?```$/im
}, {
    keyword: "mermaid",
    blockRegex: /^```mermaid((.*[\r\n]+)+?)?```$/im
}]

var outputBasePath;

var pluginPath = 'node_modules/gitbook-plugin-flowchart-png/book/';
var phantomjs = pluginPath + 'phantomjs';
var rasterize = pluginPath + 'rasterize.js';
var todo = {};

function processBlockList(page) {
    var dirPath = path.dirname(page.path);
    var baseName = path.basename(page.path, '.md');

    for(var i=0, len=config.length; i<len; i++){
        var match;
        var index = 0;
        var keyword = config[i].keyword;
        var blockRegex = config[i].blockRegex;
        var template = fs.readFileSync(pluginPath + keyword + '.html', 'utf-8').trim();
        var tempBase = '.' + keyword;
        // create the folder for the temp output
        fse.mkdirsSync(tempBase);
        while (blockRegex && (match = blockRegex.exec(page.content))) {
            var indexBaseName = baseName + '_' + (index++);
            var linkPath = indexBaseName + '_' + keyword + '.png';
            var contentPath = tempBase + '/' + dirPath + '/' + indexBaseName + '.content';
            var tempDir = tempBase + '/' + dirPath + '/';
            var htmlPath = tempDir+ indexBaseName + '.html';
            var tempPath = htmlPath + '.png';
            var pngPath = outputBasePath + '/' + dirPath + '/' + linkPath;
            var rawBlock = match[0];
            var blockContent = match[1];
            var isUpdateImageRequired = !fs.existsSync(contentPath);
            var md5sum = crypto.createHash('sha1').update(blockContent).digest('hex');
            if (!isUpdateImageRequired) {
                var lastmd5sum = '';
                var sumPath = contentPath + '.sum';
                if (fs.existsSync(sumPath)) {
                    try {
                        lastmd5sum = fs.readFileSync(sumPath, encoding = 'utf-8');
                    } catch (e) {}
                    isUpdateImageRequired = (lastmd5sum != md5sum);
                } else {
                    isUpdateImageRequired = true;
                }
            }
            if (!isUpdateImageRequired) {
                isUpdateImageRequired = !fs.existsSync(tempPath);
            }
            //flowchart
            console.log('%j-> %j-> %j %j', page.path, contentPath, pngPath, isUpdateImageRequired);
            todo[pngPath] = {
                update: isUpdateImageRequired,
                path: htmlPath,
                tempPath: tempPath
            };
            if (isUpdateImageRequired) {
                fse.mkdirsSync(path.dirname(contentPath));
                fse.outputFileSync(contentPath, blockContent, encoding = 'utf-8');
                fse.outputFileSync(contentPath + '.sum', md5sum, encoding = 'utf-8');
                fse.outputFileSync(htmlPath, jst.render(template, {
                    path: path.relative(tempDir, pluginPath).replace(/\\/g, "/"),
                    content: blockContent
                }));
            }
            page.content = page.content.replace(rawBlock, '![](' + linkPath + ')');
        }
    }
    return page;
}

function screenshots(htmlPath, tempPath, pngPath) {
    try{
        var exe = spawnSync(phantomjs, [rasterize, htmlPath, tempPath]);
        console.log(exe.stdout.toString());
    } catch (e) {
        console.error(e);
    }
    fse.copySync(tempPath, pngPath);
}

module.exports = {
    hooks: {
        "init": function() {
            outputBasePath = this.output.root() + '/';
        },
        // Before parsing markdown
        "page:before": processBlockList,
        "finish:before": function() {
            for (var pngPath in todo) {
                var item = todo[pngPath];
                if (item.update) {
                    screenshots(item.path, item.tempPath, pngPath);
                } else {
                    fse.copySync(item.tempPath, pngPath);
                }
            }
        }
    }
};