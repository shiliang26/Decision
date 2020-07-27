//app.js
App({
  globalData:{
    myid : 0,
    neighbors : [],
    number_of_player:0, 
    number_of_neighbor:0,
    decision_time:0,
    value:[],  //选择结果
    index:-1,  //当前玩家序号
    werewolf:0,
    prophet:0,
    maxround:0,
    name: String
},
  onLaunch: function () {
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }
  }
})
