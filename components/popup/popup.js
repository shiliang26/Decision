Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  /*组件的属性列表*/
  properties: {
    title1:String,
    title2:String,
    // 弹窗内容
    congrats:String,
    cave_correct:String,
    cave_wrong:String,
    extra_result:String,
    extra_negative:String,
    result: String,
    btn_back:String,
    change:Number,
    wait:Number,
    extra:Number,
    flag:Boolean
  },
  /* 组件的初始数据 */
  data: {
    flag: true,//true for keep going, false for game over
    bgOpacity: 1,
    wrapAnimate: 'wrapAnimate',
    popupAnimate: 'popupAnimate',
    isDown:false,
  },
  /* 组件的方法列表 */
  
  methods: {
    //隐藏弹框
    hidePopup: function () {
      const that = this;
      this.setData({ bgOpacity: 0.7, wrapAnimate: "wrapAnimateOut", popupAnimate: "popupAnimateOut" })
      setTimeout(function () {
        that.setData({ flag: false })
      }, 120)
    },
    /* 内部私有方法建议以下划线开头 triggerEvent 用于触发事件 */
    gameover() {//触发取消回调
      this.triggerEvent("error")
      wx.navigateBack({
        delta:1
      })
    },
  }
})
