/**
 * 
 * @param {*} obj 需要克隆的对象
 * @param {*} deep 是否进行深度克隆
 * @returns 返回克隆后的数组
 */
function clone(obj, deep) {
    //判断传进来的obj为数组、对象、还是属于基本类型的值
    if (Array.isArray(obj)) {
        //判断是否要进行深度克隆
        if (deep) {
            var newArr = [];
            // 通过递归数组将数据添加到newArr并返回
            for (let i = 0; i < obj.length; i++) {
                newArr.push(clone(obj[i], deep))
            }
            // 递归结束返回结果
            return newArr;
        } else {
            return obj.slice();
        }
    } else if (typeof (obj) == 'object') {
        var newObj = {};
        for (var prop in obj) {
            if (deep) {
                newObj[prop] = clone(obj[prop], deep)
            } else {
                newObj[prop] = obj[prop]
            }
        }
        // 递归结束返回结果
        return newObj
    } else {
        return obj
    }
}

/**
 * 
 * @param {Object} countrys site.config.json中传入的countrys 
 * @param {Object} devicesAll 默认的设备配置 
 * @param {*} defaultGitBranch 默认的git分支
 * @returns 
 */
function formatCountryDatas(countrys = {}, devicesAll, defaultGitBranch) {
    const DEFAULT_BUILD_TYPE = "default";
    const keys = Object.keys(countrys);
    keys.forEach(item => {
        // 初始化device属性
        const devices = countrys[item]["device"] || devicesAll;
        if (Array.isArray(devices)) { // 如果是数组则默认打包main分支，如果是对象就说明有分支名字了
            if(devices.length <= 0){
                devices = devicesAll
            }
        }
        countrys[item]["device"] = devices
        // 初始化build_type属性，如果有且不为空则用有的，没有则用默认的
        const buildType = countrys[item]["build_type"];
        if (buildType && buildType.trim()) {
            return;
        }
        countrys[item]["build_type"] = DEFAULT_BUILD_TYPE;
    })
    return countrys;
}


/**
 * 
 * @param {Array} LangConfig  
 * @returns 返回对象形式的数据，便于处理
 */
function formatLangConfig(LangConfig) {
    let obj = {};
    LangConfig.forEach(item => {
        obj[item.Site] = item
    })
    return obj
}

/**
 * 
 * @param {*} template 是site.config.json中传入的template的值
 * @param {*} filename 如上
 * @param {*} type 占位符与其对应数据的映射表
 * @returns object 处理完成的template和filename
 */
function handlePath({
    template,
    filename
}, type) {
    return {
        template: handlePathReg(template, type),
        filename: handlePathReg(filename, type)
    }
}

/**
 * 
 * @param {*} str 一个字符串
 * @param {*} type 类型数组
 * @returns 一个处理完成的字符串
 * @例如 str="./$/$1/$2" type={$2:pc，$1:us,$:hh}  ==> "./hh/us/pc"
 */
function handlePathReg(str, type) {
    let result = clone(str, true);
    const arr = Object.keys(type);
    arr.forEach(item => {
        if (result.includes(item)) {
            result = result.replace(item, type[item]);
        }
    })
    return result;
}


/**
 * 
 * @param {Object} param0 ：表示设备 param1: 国家 param2: 项目名
 * @param {Array} indexTemplate 配置文件中传入的参数 
 * @param {*} siteDatas handleData中定义的整个网站需要用到的数据
 * @param {*} timestamp 统一的时间戳
 * @returns 返回某哥处理好的设备配置文件
 */
function createDevices({
    path: device,
    country,
    PROJECT
}, indexTemplate = [], timestamp) {
    const type = { // 配置文件中占位符对应的数据
        $1: country, // 国家
        $2: device, // 设备
        $: PROJECT, // 项目名 
    }
    return indexTemplate.map(config => {
        const obj = {
            ...handlePath({
                template: config["template"],
                filename: config["filename"]
            }, type)
        }

        if (config["options"]) {
            obj["options"] = formatOptions(config["options"], timestamp);
        }else{
            obj["options"] = {};

        }
        if (config["data"]) {
            obj["data"] = config["data"]
        }else{
            obj["data"] = []
        }
        return obj
    })
}


/**
 * 
 * @param {*} str 传入字符串 
 * @returns 返回false 或者处理完成的字符串
 * @例如 $abc => abc , $name => name
 */
function handle(str) {
    const reg = /^\$[\s\S]+$/g
    if (reg.test(str)) {
        return str.slice(1);
    }

    return false;
}


/**
 * 
 * @param {*} optionsArr 配置文件中传入的options
 * @param {*} timestamp appjs中设置的时间戳，文件重命名用
 * @param {*} data  为handleDatajs中配置的数据，与site.config.json中配置的的具体名称做映射
 * @returns 处理好的options
 */
function formatOptions(options, data) {
    const optionsArr = clone(options, true) // 深度克隆
    if (optionsArr["rename"]) {
        const reg = optionsArr["rename"]["reg"]
        const val = optionsArr["rename"]["val"];
        optionsArr["rename"]["reg"] = new RegExp(reg);
        optionsArr["rename"]["val"] = val
    }
    return optionsArr
}

/**
 * 
 * @param {Object} param0 国家 param1 项目名
 * @param {Array} indexTemplate  经过处理的配置格式如下
 * 
 * [
        {
        "template":  "./template/pages/$2-index/index.pug" ,
        "filename": "./sites/$/$1/$2/index.html",
        "data": "indexData"
        }
        ...
    ]
 * @param {Object} siteDatas handleData中定义的整个网站需要用到的动态数据
 * @param {Array} devices 需要打包的设备数组
 * @param {String} buildType 打包打包策略
 * @returns 
 */
function createAllDeviceList({
    country,
    PROJECT
}, indexTemplate = [], devices = [], buildType) {
    const allDevicesIndexPage = [];
    // 三端index page（mobile、pc、ipad代码拼接）
    devices.forEach(path => {
        // if(!allDevicesIndexPage[path]){
        //     allDevicesIndexPage[path] = [];
        // }
        // allDevicesIndexPage[path].push(...createDevices({path, country, PROJECT},handleMoreBuidType(buildType,indexTemplate),timestamp))
        allDevicesIndexPage.push(...createDevices({
            path,
            country,
            PROJECT
        }, handleMoreBuidType(buildType, indexTemplate)))
    })
    
    
    return allDevicesIndexPage;
}

/**
 * 
 * @param {String} buildType 打包打包策略
 * @param {Object} indexTemplate 配置文件中传入的配置
 * @returns 
 */
function handleMoreBuidType(buildType, indexTemplate) {
    const isDeepClone = true;
    const data = clone(indexTemplate, isDeepClone);
    const result = [];
    const buildData = data[buildType];
    if (!buildData) {
        throw new Error(`1.site.config.json中配置的indexPage可能存在问题\n2.可能的问题是你没有配置默认模板`);
    }
    const Len = buildData["template"].length || 0;
    for (let i = 0, j = 0; i < Len; i++, j++) {
        let obj = {};
        for (const key in buildData) {
            if (buildData[key][j]) { // 属性不存在就不需要添加
                obj[key] = buildData[key][j]
            }
        }
        result.push(obj)
    }
    return result;
}




module.exports = {
    formatCountryDatas,
    formatLangConfig,
    createAllDeviceList
}