const request = require("request");
const  util = require('util');
const fse = require('fs-extra');
const path = require("path");
const images = require('images');
const getPromise = util.promisify(request.get);

const url = 'http://api.sp.com/v1/video';
const project = "superbaby";
async function createImg(imgPath, base){
  if(base){
    const a_base64 = base.replace(/^data:image\/\w+;base64,/,"")
    const a_buffer = Buffer.from(a_base64, 'base64')
    await fse.writeFileSync(imgPath, a_buffer);
  }
  return
}

var setImage = false;

var imgSize = ['maxresdefault', 'mqdefault']
async function getCover(count, id){
  var info = await getPromise({
    url: `https://i3.ytimg.com/vi/${id}/${imgSize[count]}.jpg`,
    encoding: 'binary'
  });
  if(info.statusCode != 200){
    return await getCover(1, id)
  }
  return info.body
}

// 获取首页
 const getIndex = async function(site){
  try{
    var {body} = await getPromise({
      url: `${url}/get_index?project=${project}&site=${site}`,
    })
    var tmp = JSON.parse(body)
    return tmp
  }catch(e){
    console.log(e)
  }
}

// 获取所有落地页
 const getLp = async function(site){
  try{
    var {body} = await getPromise({
      url: `${url}/get_lp?project=${project}&site=${site}`,
    })
    var tmp = JSON.parse(body)
    return tmp
  }catch(e){
    console.log(e)
  }
}

// 获取所有详情页
 const getDetail = async function(site){
  try{
    var {body} = await getPromise({
      url: `${url}/get_detail?project=${project}&site=${site}`,
    })

    var tmp = JSON.parse(body)

    if(!setImage){
      if(!await fse.existsSync('./images')){ //创建目录
        await fse.mkdirSync('./images')
      }
      if(!await fse.existsSync('./images/imgCover')){
        await fse.mkdirSync('./images/imgCover')
      }
      for(var i = 0; i < tmp.length; i++){
        const el = tmp[i];
        if(!await fse.existsSync(`./images/imgCover/${el.youtube_id}.jpg`)){
          let cover_info = await getCover(0, el.youtube_id);
          await fse.writeFileSync(path.join('./images/imgCover/',`${el.youtube_id}.jpg`), cover_info, 'binary');
          await images(`./images/imgCover/${el.youtube_id}.jpg`).size(640, 360).save(`./images/imgCover/${el.youtube_id}.jpg`, {quality: 80});
        }
      }
      setImage = true
    }


    
    return tmp
  }catch(e){
    console.log(e)
  }
}

// 获取所有分类页
 const getCategory = async function(site){
  try{
    var {body} = await getPromise({
      url: `${url}/get_cat_data?project=${project}&site=${site}`,
    })
    var tmp = JSON.parse(body)
    return tmp
  }catch(e){
    console.log(e)
  }
}



module.exports = {
  getCategory,
  getDetail,
  getLp,
  getIndex
}