//index.js
//获取应用实例
const app = getApp()
const db = wx.cloud.database()
const g = getApp().globalData
var k=1
var watcher1

Page({
  data: {
    motto: '《生存决策》',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    waiting: 0,   //是否已经点了准备；进入游戏后归为0
    allowprep: 0,  //当mode由1变0时置为1，此时允许点击准备。用于防止导出数据和修改超参数之前有人点击准备
    hiddenmodalput: true, //隐藏名字输入框
    nameinput: false  //是否已经输入名字
  },
  //事件处理函数
  
  logbtn2: function (options) {
    wx.navigateTo({
      url: '../help/help',
    })
  },
  logbtn3: function (options) {
    wx.navigateTo({
      url: '../one/one',
    })
  },
  getSettings: function () {
    var that = this
    db.collection('Players').add({
      data: {
        name: g.name,
        count: 0,    //最后一条记录将是choice[count]
        current_choice: [0],
        time: [0],
        round: [0],
        life:[0],
        extra_total:0
      },
      success: function (res) {
        // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
        g.myid=res._id
      }
    })
    db.collection('Settings').doc('current_setting').get({
      success: function (res) {
        console.log(res.data)
        g.number_of_neighbor = res.data.number_of_neighbor
        g.number_of_player = res.data.number_of_player
        g.prophet=1/res.data.prophet_rate 
        g.werewolf=1/res.data.werewolf_rate
        g.maxround=res.data.maxround
        g.decision_time = res.data.second
        console.log('neighbor=',g.number_of_neighbor,'player=',g.number_of_player,'prophet=',g.prophet,'werewolf=',g.werewolf,'maxround=',g.maxround, 'second=',g.decision_time)
      }
    })
  },
  start: function (options) {
    var that=this
    var waiting = that.data.waiting
    g.neighbors=[]
    if (waiting==0){
      that.getSettings(that)
      that.getcaves(that)
      that.setData({
        waiting: 1
      })
    }
  },

  getcaves:function(){
    db.collection('Caves_2').get({
      success: function (res) {
        g.value=res.data
      }
    })
  },

  getWatcher:function(){
    //监听数据库中的开始标志
    var that = this
    watcher1 = db.collection('Settings').doc('is_game_on')
      .watch({
        onChange: function (snapshot) {
          var waiting = that.data.waiting
          console.log(snapshot)
          if (snapshot.docs[0].mode > 0) {
            console.log('Allow preparing')
            that.setData({
              allowprep: 1
            })
          }
          else {
            that.setData({
              allowprep: 0
            })
            if (waiting == 1) {
              console.log('Beginning')
              wx.navigateTo({
                url: '../counter/counter',
              })
              that.setData({
                waiting: 0
              })
            }
          }
        },
        onError: function (err) {
          that.getWatcher(that)
          console.error('the watch closed because of error', err)
        }
      })
  },

  onLoad: function () {
    var that = this
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
    var util = require('../../utils/util.js');
    that.getWatcher(that)
  },
  
  onHide: function(){
    watcher1.close()
  },

  onShow: function(){
    this.getWatcher(this)
  },

  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  modalinput:function(e){
    this.setData({
      hiddenmodalput: false
    })
  },
  inputname:function(e){
    g.name = e.detail.value
  },
  cancel:function(e){
    this.setData({
      hiddenmodalput: true
    })
  },
  confirm_name: function (e) {
    this.setData({
      hiddenmodalput: true,
      nameinput: true
    })
  }
})
