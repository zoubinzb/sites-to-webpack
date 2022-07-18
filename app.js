/*eslint-disable*/
const path = require('path');
const api = require('./api.js');
const countrysJson = require('./site.config.json');
const LangConfig = require('./langConfig/langConfig.js');

const config_path = 'dev_config';
const PROJECT = countrysJson[config_path].name;
const DEV_SITE_TARGET = countrysJson[config_path].dev_siteTarget;
const DEV_SITE_DEVICE = countrysJson[config_path].device;
const {
  formatCountryDatas,
  formatLangConfig,
  createAllDeviceList,
} = require('./utils.js');

const DEVICES_ALL = ['pc', 'mobile', 'ipad'];
const DEFAULT_GIT_BRANCH = 'main';
const LangConfigObj = formatLangConfig(LangConfig);
const INDEX_PAGE = countrysJson.indexPage || {};
const PugtoHtmlPlugin = require('./plugin/pug-to-html-plugin');

const COMMON = countrysJson.common;
const CopyPlugin = require('copy-webpack-plugin');
// 处理静态资源
const SITE_ROOT_DIRECTOR = countrysJson.siteRootDirectory;
// 格式化国家数据
const countrys = formatCountryDatas(countrysJson.countrys, DEVICES_ALL, DEFAULT_GIT_BRANCH) || {};
const ENTRY = countrysJson.entry || {};

/**
 * 根据国家生成对应的数据
 * @param {String} site 国家
 * @param {String} lang 语言
 * @returns
 */
async function handleData(site, lang) {
  const indexData = await api.getIndex(site);
  const detailData = await api.getDetail(site);
  const lpData = await api.getLp(site);
  const categoryData = await api.getCategory(site);
  const categoryPages = categoryData.map((item) => item.data);
  const categoryPagesName = categoryData.map((item) => item.pagename);
  const lpPageName = lpData.map((item) => item.pagename);
  const handleLpData = lpData.map((item) => item.data);
  const ads = {
    // 广告账户 id
    adClient: 'ca-pub-8810908089971791',
  };

  const common = {
    lang,
    timestamp: '324',
    // 设置所有页面通用数据 - 主要用于推荐
    data: indexData,
    categoryData,
    ads: {
      // 广告账户 id
      adClient: 'ca-pub-8810908089971791',
      slot: lang.slot,
    },

  };
  return {
    indexData,
    detailData,
    lpData,
    categoryData,
    commonData: indexData,
    categoryPages,
    categoryPagesName,
    lpPageName,
    ads,
    handleLpData,
    common,
  };
}

function reg(arr = []) {
  for (let i = 0, len = arr.length; i < len; i++) {
    const temp = arr[i];
    let j = temp.length - 1;
    let str = '';
    for (j; j >= 0; j--) {
      if (temp[j] != '/' || j == temp.length - 1) {
        str = temp[j] + str;
      } else {
        break;
      }
    }
    arr[i] = str;
  }
}

/**
 * @param {String} mode 模式，看是生成模式还是打包模式
 * 根据配置文件site.config.json批量生成模板
 * 按照一个国家生成一套的方式
 */
function createAllTemplate(mode) {
  const allPugtoHtmlPlugin = [];
  for (const country of Object.keys(countrys)) {
    if (mode === 'development' && country != DEV_SITE_TARGET) { // 如果为开发模式，并且当前国家不为dev_config中设置的则跳过
      break;
    }
    const currSite = LangConfigObj[country];
    const site = currSite.Site == 'xp' ? 'us' : currSite.Site;
    const AllTemplate = [];

    let devices = countrys[country].device;
    if (mode === 'development') { // 如果当前为开发模式，则重置devices为dev_config中设置的,并且修改filenname去掉项目名、国家、和设备
      devices = [DEV_SITE_DEVICE];
      for (const type in INDEX_PAGE) {
        const filenameArr = Array.isArray(INDEX_PAGE[type].filename) ? INDEX_PAGE[type].filename : [];
        reg(filenameArr);
      }
    }
    const buildType = countrys[country].build_type;
    // 所有设备的pug模板
    AllTemplate.push(...createAllDeviceList({
      country,
      PROJECT,
    }, INDEX_PAGE, devices, buildType));

    allPugtoHtmlPlugin.push(new PugtoHtmlPlugin({
      template: AllTemplate,
      requireDataFn: async () => await handleData(site, currSite),
      commonData: COMMON,
      entry: createEntry(),
      country,
    }));
  }
  return allPugtoHtmlPlugin;
}

/**
 * 需要复制到更目录的静态文件
 * @returns
 */
function staticResouceCopy(mode) {
  const allCopyFile = [];
  const copyFile = SITE_ROOT_DIRECTOR.rootWaitCopyFile || [];
  let rootCommonPath = SITE_ROOT_DIRECTOR.rootCommonPath.trim();
  if (rootCommonPath[rootCommonPath.length - 1] != '/') {
    rootCommonPath += '/';
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const country of Object.keys(countrys)) {
    if (mode === 'development' && country != DEV_SITE_TARGET) { // 如果为开发模式，并且当前国家不为dev_config中设置的则跳过
      break;
    }
    let devices = countrys[country].device;
    if (mode === 'development') {
      devices = [DEV_SITE_DEVICE];
    }
    devices.forEach((device) => {
      copyFile.forEach((file) => {
        const formPath = path.resolve(__dirname, `${rootCommonPath}${file}`);
        let toPath = `${PROJECT}/${country}/${device}`;
        if (mode === 'development') {
          toPath = `${device}`;
        }

        allCopyFile.push(new CopyPlugin({
          // 应用 复制文件 插件
          patterns: [{
            from: formPath, // 将public目录中的所有文件
            to: toPath, // 复制到 输出目录 的根目录
          }],

        }));
      });
    });
  }
  return allCopyFile;
}

function createEntry() {
  return ENTRY;
}
module.exports = {
  createAllTemplate,
  staticResouceCopy,
  createEntry,
};
