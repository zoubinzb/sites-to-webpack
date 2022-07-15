const fs = require("fs-extra");

const {
    compileFile
} = require('pug')
const path = require("path")
class PugtoHtmlPlugin {
    constructor({
        template,
        requireDataFn,
        commonData,
        entry,
        country
    }) {
        if (!template) {
            throw new Error('template property not found');
        }
        this.template = template;
        this.requireDataFn = requireDataFn || {};
        this.commonData = this.regExe(commonData) || "";
        this.hash = new Map(); // 进行缓存
        this.countryData;
        this.country = country;
        this.entry = entry;
        this.bundleAllJs;
        this.bundleAllCommonCss;
    }
    async apply(compiler) {
        // 重新生成资源
        compiler.hooks.emit.tapPromise ('pug-to-html-plugin', async (compilation) => {
            await this.contorl(compilation);
            this.hash.clear();
        })
    }

    async contorl(compilation){
        
        const _assets = compilation.assets;
        const data = await this.requireDataFn();
        this.bundleAllJs = Object.keys(_assets).filter(item => item.includes("bundle.js"));
        const reg =  /[^.]+\.[^.]+\.css$/
        this.bundleAllCommonCss = Object.keys(_assets).filter(item => {
                return reg.test(item);
        });
        this.countryData = data
        this.controlGenerationResource(this.template, data, _assets,compilation); //编译并生成资源

    }

    controlGenerationResource(template = [], data, assets,compilation) {
        template.forEach(curr => {
            if (!curr.options["loop"]) { // 说明是个单页面，直接编译即可
                const currPageData = this.handle(curr,data)
                const fn = this.compile(curr.template);
                this.handleContentToHtml(fn,currPageData,assets,curr.filename,curr.template,compilation)
            } else { // 处理批量子页面的情况
                const pagesData = data[curr["data"]];
                const pageName = curr.options.loop.pagename
                const pageNameKey = curr.options.loop.pagename_key
                if (pageName) {
                    const pages = data[this.regExe(pageName)];
                    this.createPages(pages,pagesData,curr,assets,"pagename",compilation)
                } else if (pageNameKey && Array.isArray(data[curr["data"]])) {
                    this.createPages(pagesData,pagesData,curr,assets,"pagename_key",compilation)
                }
            }
        })
    }
    createPages(pages,data ,curr,assets,target = "pagename_key",compilation){
        pages.forEach((item, index) => {
            let fn,filename,pageData;
            if(target === "pagename"){
                fn = this.compile( curr.template);
                pageData = this.handle(curr,data,Array.isArray(data) ? data[index]:data)
                filename = curr.filename + item
            }else{
                fn = this.compile( curr.template);
                filename = curr.filename + item[curr.options.loop.pagename_key]
                pageData = this.handle(curr,data,item)
            }
            this.handleContentToHtml(fn,pageData,assets,filename,curr.template,compilation)
        });
    }
    handleContentToHtml(fn,pageData,assets,filename,template,compilation){
        let htmlContent = fn(pageData); //编译模板得到内容
        const reg = /(?<=[\/])[^\/]+$/;
       
        // 插入bundle
        this.bundleAllJs.forEach(item => {
            const scriptFileName = item.match(reg) ? item.match(reg)[0] : false;
            const scriptName = this.getFilename(scriptFileName);
            if(!(template.includes(scriptName) || item.includes("commonJs.bundle.js"))){
                return;
            }
            
            const ScriptLink = `<script src="/${item}"></script>`
            htmlContent = htmlContent.replace("</body>", ScriptLink + "</body>")
        })
        // 插入css
        this.bundleAllCommonCss.forEach(item => {
            const cssFileName = item.match(reg) ? item.match(reg)[0] : false;
            const cssName = this.getFilename(cssFileName);
            if(!(template.includes(cssName) || item.includes("commonCss.css"))){
                return;
            }

            // 引入该模块css
            const CssLink = `<link href="/${item}" rel="stylesheet">`
            htmlContent = htmlContent.replace("</head>", CssLink + "</head>")
        })
        // 生成到资源列表
        this.createAssets(assets,filename, htmlContent)
        compilation.fileDependencies.add(path.resolve(__dirname,`.${template}`));

    }
    getFilename(str=''){
        let filename = str.split('.')[1] ? str.split('.')[1] : false
        return filename
    }
    regExe(str) {
        const reg = /^\$[\s\S]+$/g
        if (reg.test(str)) {
            return str.slice(1);
        }

        return false;
    }
    handle(curr,data,coverData) {
        let currPageData = {
            data: [],
            common: []
        }
        if (!Array.isArray(curr.data)) {
            currPageData["data"] = data[curr.data];
        }
        if(coverData){
            currPageData["data"] = coverData; // 如果有这个字段说明是子页面数据，所以覆盖
        }
        if (this.commonData) {
            currPageData["common"] = this.countryData[this.commonData];
        }
    
        return currPageData;
    }
    createAssets(assets,filename,content) {
        assets[filename] = {
            source(){
                return content
            },
            size(){
                return content.length;
            }
        }       
    }
    compile(path) {
        if(!path){
            throw new Error(`没有传入template`)
        }
        const map = this.hash; // 进行缓存优化编译速度
        let template;
        if (map.has(path)) {
            return map.get(path);
        }
        try {
            template = compileFile(path);
            map.set(path, template);
        } catch (ex) {
            throw new Error(ex);
        }
        return template;
    }

}


module.exports = PugtoHtmlPlugin;