module.exports = {
  neighborSearch: neighborSearch,
  test:test
}
function test(){
  console.log("this is a test")
}
function neighborSearch(game_size, neighbor_size, player) {
  //查找一个方阵中，某玩家的全体邻居编号
  //规定game_size 是一个完全平方数
  //规定neighbor_size < game_size
  var neighbor = []
  var length = Math.floor(Math.sqrt(game_size)) //方阵的宽度
  var x = player % length
  var y = (player - x) / length
  var i = 0
  var target
  var step = 0
  var xi = x, yi = y

  while(i < neighbor_size){
    step ++
    target = x + step
    while(x < target && i < neighbor_size){
      x ++
      xi = x % length
      neighbor.push(yi * length + xi)
      i++
    }

    target = y - step
    while (y > target && i < neighbor_size) {
      y --
      yi = (y + length) % length
      neighbor.push(yi * length + xi)
      i++
    }

    step ++
    target = x - step
    while (x > target && i < neighbor_size) {
      x--
      xi = (x + length) % length
      neighbor.push(yi * length + xi)
      i++
    }

    target = y + step
    while (y < target && i < neighbor_size) {
      y ++
      yi = y % length
      neighbor.push(yi * length + xi)
      i++
    }
  }
  return neighbor
}

