const execFile = require('child_process').execFile;
const fs = require('fs')
const fse = require('fs-extra')
const crypto = require('crypto');
const path = require('path');
const jst = require('jst');
const pluginPath = 'node_modules/gitbook-plugin-flowchart-png/book/';
const phantomjs = pluginPath + 'phantomjs';
const rasterize = pluginPath + 'rasterize.js';
const config = [{
    keyword: "flowchart",
    blockRegex: /^```flowchart((.*[\r\n]+)+?)?```$/im,
    template: fs.readFileSync(pluginPath + 'flowchart.html', 'utf-8')
}, {
    keyword: "mermaid",
    blockRegex: /^```mermaid((.*[\r\n]+)+?)?```$/im,
    template: fs.readFileSync(pluginPath + 'mermaid.html', 'utf-8')
}]

function processBlockList(page) {
    var dirPath = path.dirname(page.path);
    var baseName = path.basename(page.path, '.md');
    for (var i = 0, len = config.length; i < len; i++) {
        var match;
        var index = 0;
        var keyword = config[i].keyword;
        var blockRegex = config[i].blockRegex;
        var template = config[i].template;
        var tempBase = '.' + keyword;
        // create the folder for the temp output
        fse.mkdirsSync(tempBase);
        while (blockRegex && (match = blockRegex.exec(page.content))) {
            var indexBaseName = baseName + '_' + (index++);
            var linkPath = indexBaseName + '_' + keyword + '.png';
            var contentPath = tempBase + '/' + dirPath + '/' + indexBaseName + '.content';
            var tempDir = tempBase + '/' + dirPath + '/';
            var htmlPath = tempDir + indexBaseName + '.html';
            var tempPath = htmlPath + '.png';
            var pngPath = this.output.root() + '/' + dirPath + '/' + linkPath;
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
            
            // console.log('%j-> %j-> %j %j', page.path, contentPath, pngPath, isUpdateImageRequired);
            if (isUpdateImageRequired) {
                fse.mkdirsSync(path.dirname(contentPath));
                fse.outputFile(contentPath, blockContent, encoding = 'utf-8', function(err) {
                    if (err) throw err;
                });
                fse.outputFile(contentPath + '.sum', md5sum, encoding = 'utf-8', function(err) {
                    if (err) throw err;
                });
                fse.outputFileSync(htmlPath, jst.render(template, {
                    path: path.relative(tempDir, pluginPath).replace(/\\/g, "/"),
                    content: blockContent
                }));
                screenshots(htmlPath, tempPath, pngPath);
            } else {
                fse.copySync(tempPath, pngPath);
            }
            page.content = page.content.replace(rawBlock, '![](' + linkPath + ')');
        }
    }
    return page;
}

function screenshots(htmlPath, tempPath, pngPath) {
    execFile(phantomjs, [rasterize, htmlPath, tempPath], function(err, stdout, stderr) {
        if (err) throw err;
        fse.copySync(tempPath, pngPath);
    });
}

module.exports = {
    hooks: {
        "page:before": processBlockList
    }
};