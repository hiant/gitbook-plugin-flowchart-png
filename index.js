const spawnSync = require('child_process').spawnSync;
const fs = require('fs')
const fse = require('fs-extra')
const crypto = require('crypto');
const path = require('path');
const jst = require('jst');
const blockRegex = /^```flowchart((.*[\r\n]+)+?)?```$/im;
const basePath = '.flowchart/';
fse.mkdirsSync(basePath);
var outputBasePath;
const flowchartList = new Array();
const pngMap = {};
const pluginPath = 'node_modules/gitbook-plugin-flowchart-png';

function processBlockList(page, flowchartPath) {
    var dirPath = path.dirname(page.path);
    var baseName = path.basename(page.path, '.md');
    var match;
    var index = 0;
    while ((match = blockRegex.exec(page.content))) {
        var indexBaseName = baseName + '_' + (index++);
        var relativePath = dirPath + '/' + indexBaseName;
        var pngOutPath = outputBasePath + relativePath + '_flowchart.png';
        var assetsPathPrefix = basePath + relativePath;
        var linkPath = indexBaseName + '_flowchart.png';
        var flowchartPath = assetsPathPrefix + '.html';
        var pngPath = assetsPathPrefix + '_flowchart.png';
        pngMap[pngPath] = pngOutPath;
        var rawBlock = match[0];
        var blockContent = match[1];
        var isUpdateImageRequired = !fs.existsSync(flowchartPath);
        var md5sum = crypto.createHash('sha1').update(blockContent).digest('hex');
        if (!isUpdateImageRequired) {
            var lastmd5sum = '';
            var sumPath = flowchartPath + '.sum';
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
            isUpdateImageRequired = !fs.existsSync(pngPath);
        }
        //flowchart
        console.log('%j-> %j-> %j %j', page.path, flowchartPath, pngPath, isUpdateImageRequired);
        if (isUpdateImageRequired) {
            fse.mkdirsSync(path.dirname(flowchartPath));
            jst.renderFile(pluginPath + '/book/template.html', {
                content: blockContent
            }, function(err, ctx) {
                fse.outputFileSync(flowchartPath, ctx);
            });
            fse.outputFileSync(flowchartPath + '.sum', md5sum, encoding = 'utf-8');
            flowchartList.push(flowchartPath);
        }
        page.content = page.content.replace(rawBlock, '![](' + linkPath + ')');
    }
    return page;
}
module.exports = {
    hooks: {
        "init": function() {
            outputBasePath = this.output.root() + '/';
        },
        // Before parsing markdown
        "page:before": processBlockList,
        "finish:before": function() {
            if (flowchartList.length > 0) {
                var phantomjs = pluginPath + '/book/phantomjs';
                var rasterize = pluginPath + '/book/rasterize.js';
                for (var i = 0; i < flowchartList.length; i++) {
                    try {
                        var flowchart = flowchartList[i];
                        var dirPath = path.dirname(flowchart);
                        var basename = path.basename(flowchart, '.html');
                        var pngPath = dirPath + '/' + basename + '_flowchart.png';
                        var exe = spawnSync(phantomjs, [rasterize, flowchart, pngPath]);
                        console.log(exe.stdout.toString());
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
            for (var pngPath in pngMap) {
                fse.copySync(pngPath, pngMap[pngPath]);
            }
        }
    }
};