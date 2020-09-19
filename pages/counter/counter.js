const db = wx.cloud.database()
const _ = db.command
var wxCharts = require('../../utils/wxcharts.js');
var util = require('../../utils/util.js');
var app = getApp();
var columnChart = null;
var k=0;//counter for alpha test
const g = getApp().globalData//一共有四个全局变量
var chartData = {
  main: {
    title: '邻居选择情况',
    data: [0,0],
    categories: ['山洞一', '山洞二']
  },
};
var watcher;

function amongMajority(final, options){
  var max = Math.max(options[0], options[1])
  console.log(options, options[final - 1] == max)
  if (options[final - 1] == max) {
    return true
  }
  else
    return false
}

Page({
  data: {
    isDown: false,
    percent: 50,
    non_relevant: 0,
    extra:0,//从众激励，如果最后一秒后选择和邻居中多数一致，则得到激励
    second: 15,
    wait: 5,
    isMainChartDisplay: true,
    choice:0,
    non:0,  //number of neighbor, 与g.number_of_neighbor同步
    final_choice:0,//默认为0
    round:1,
    flag:true,
    iden:'',
    id_no:0,
    best:0,
    change:0,
    options: [0,0],
  },

  updateLife:function(){//更新生命值
    var that = this
    var choice= this.data.choice
    var percent=this.data.percent
    var non_relevant = this.data.non_relevant
    var round = this.data.round
    var final_choice=this.data.final_choice
    var change=this.data.change
    var id_no=this.data.id_no
    var extra = this.data.extra
    var change_temp = (g.value)[(round - 1) % 20].cave[final_choice - 1] * 5
    if(final_choice==0){
      that.setData({
        percent:percent-5,    //不做选择会产生惩罚.     //2020.3.8更新：目前有默认选择，不会再有不选的情况。保留备用。
        non_relevant: non_relevant - 5,
        change:-5
      })
    }
    else{
      that.setData({
        change: change_temp,//定这个量主要是为了给弹出窗口传值
        percent: percent + change_temp + extra * 2,
        non_relevant: non_relevant + extra
      })
    }
  },

  //generateNeighbor:function()
  countdown_second: function () {//每轮倒计时
    var that = this
    var second = this.data.second
    var flag=this.data.flag
    var percent=this.data.percent
    var choice=this.data.choice
    var final_choice=this.data.final_choice
    var id_no = this.data.id_no
    var options = this.data.options
    if(second == 0) {
      if (id_no == 0 && amongMajority(final_choice, options)) {
        that.setData({
          extra: 1
        })
      }
      that.updateLife(that)
      that.countdown_wait(that)
      return
     }
    var time = setTimeout(function () {
      that.setData({
       second: second - 1
      })
      that.countdown_second(that)
    }, 1000)
  },
  countdown_wait: function () {//轮次间倒计时
    var that = this
    var wait = this.data.wait
    var flag=this.data.flag
    var round=this.data.round
    var percent=this.data.percent
    var non_relevant = this.data.non_relevant
    if (round >= g.maxround){
      that.setData({
        flag:false
      })
      db.collection('Players').doc(g.myid).update({
        data: {
          extra_total: non_relevant
        },
      })
    }
    if (wait == 0 && flag==true) {
      that.setData({
        wait: 5,
        second: g.decision_time,
        final_choice: 0,
        choice: Math.round(Math.random()) + 1,
        round:round+1,
        change:0,
        extra:0
     })
      that.confirm(that)
      columnChart.updateData({
        series: [{
          name: '选择人数',
          data: [0,0],
          format: function (val, name) {
            return val;
          }
        }]
      })
      that.setData({
        best: (g.value)[round%10].best
      })
      that.countdown_second(that)
      return
    }
    var time = setTimeout(function () {
        that.setData({
         wait: wait - 1
        })
        if(flag == true)
          that.countdown_wait(that)
    }, 1000)
  },

  initiate:function(snapshot){
    var that=this
    var i=0
    var choice = this.data.choice
    var second = this.data.second
    for (i = 0; i < g.number_of_player && i < snapshot.docs.length; i++) {
      if (snapshot.docs[i]._id == g.myid) {
        g.index = i
        break
      }
    }
    if(g.index < 0 || g.index >= g.number_of_player){
      console.log("Error number of players")
      g.index = 0
    }
    g.neighbors = util.neighborSearch(g.number_of_player, g.number_of_neighbor, g.index)
    console.log('neighbor & index',g.neighbors,g.index)
    if (g.index % g.prophet == 2) {
      that.setData({
        iden: "预言家",
        id_no: 2
      })
    }
    else {
      that.setData({
        iden: "平民",
        id_no: 0
      })
    }
    that.setData({
      best: (g.value)[0].best
    })
    that.setData({
      non: g.number_of_neighbor,
      choice: Math.round(Math.random()) + 1
    })
    that.confirm(that)

  },

  getChart: function (e) {//创建图表
    var windowWidth = 360;
    try {
      var res = wx.getSystemInfoSync();
      windowWidth = res.windowWidth;
    } catch (e) {
      console.error('getSystemInfoSync failed!');
    }
    columnChart = new wxCharts({
      canvasId: 'columnCanvas',
      type: 'column',
      animation: true,
      categories: chartData.main.categories,
      series: [{
        name: '选择人数',
        data: chartData.main.data,
        format: function (val, name) {
          return val;
        }
      }],
      yAxis: {
        format: function (val) {
          return val;
        },
        title: '人数',
        min: 0
      },
      xAxis: {
        disableGrid: false,
        type: 'calibration'
      },
      extra: {
        column: {
          width: 40
        }
      },
      width: windowWidth * 0.8,
      height: 150,
    });
  },

  getWatcher: function() {
    var that = this
    watcher = db.collection('Players')
      .watch({
        onChange: function (snapshot) {   //如果是第一次获取，转至initiate，根据集合内容计算序号、邻居、身份等信息
          if(snapshot.type === 'init'){
            that.initiate(snapshot)
          }
          var round = that.data.round
          var second = that.data.second
          var final_choice = that.data.final_choice
          //决定选取current中第几个数进行统计，测试期间每次往后取一个，多人正式运行时应该选取最后一个；
          var options = that.data.options
          var extra = that.data.extra
          var id_no = that.data.id_no
          var local_options = [0, 0]
          var max
          var pick
          var choice
          console.log(snapshot)
          for (var i = 0; i < g.number_of_player && i < snapshot.docs.length; i++) {
            if (g.neighbors.indexOf(i) == -1)
              continue      //当前条目不在邻居集合中
            //var pick=maxq
            lengths = snapshot.docs[i].current_choice.length
            if(snapshot.docs[i].round[lengths-1] != round || lengths == null)
              continue
            choice = snapshot.docs[i].current_choice[lengths - 1]
            local_options[choice - 1]++
            //console.log('Player', i, 'chose cave', choice)
          }
          that.setData({
            options: local_options
          })
          columnChart.updateData({
            series: [{
              name: '选择人数',
              data: local_options,
              format: function (val, name) {
                return val;
              }
            }]
          })
        },
        onError: function (err) {
          that.getWatcher(that)
          watcher.close()
        }
      })
  },

  onLoad: function (options) {//进入页面时开启倒计时
    this.setData({
      second: g.decision_time
    })
    this.getChart(this)
    this.getWatcher(this)
    this.countdown_second(this)
  },

  onUnload: function(){
    console.log(watcher, "Closing")
    watcher.close()
  },

//做出临时选择后更新choice变量
  caveone:function(){
    var that=this
    var choice=this.data.choice
    that.setData({
      choice:1
    })
    console.log("Picked Cave 1")
    that.confirm(that)
  },

  cavetwo: function () {
    var that = this
    var choice = this.data.choice
    that.setData({
      choice: 2
    })
    console.log("Picked Cave 2")
    that.confirm(that)
  },
  
  //确认选择，将choice赋给final_choice
  confirm:function(){
    var that=this
    var final_choice=this.data.final_choice
    var choice=this.data.choice
    var round=this.data.round
    var percent = this.data.percent
    var non_relevant = this.data.non_relevant
    var d1 = new Date()
    console.log('Confirmed Cave',choice)
    console.log('my id:',g.myid)
    if(choice!=final_choice){
    db.collection('Players').doc(g.myid).update({
      // data 传入需要局部更新的数据
      data: {
        count:_.inc(1),
        current_choice: _.push(choice),
        time:_.push(d1.getTime()),
        life:_.push(percent - non_relevant),
        round:_.push(round)
      },
      success: function (res) {
      }
    })
    that.setData({
      final_choice: choice
    })
    }
  },
  interrupt:function(){
    db.collection('Players').doc(g.myid).remove({
    })
    this.setData({
      second: 0,
      flag: false
    })
    wx.navigateBack({
      delta: 1
    })
  }

})