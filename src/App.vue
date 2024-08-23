<script setup>
import { ref, onMounted } from 'vue'
import { Graph } from '@antv/x6'
import { Dnd } from '@antv/x6-plugin-dnd'
// import { Selection } from '@antv/x6-plugin-selection'
// import { History } from '@antv/x6-plugin-history'
import { SwimLane } from './swimlane'
import data from './data.json'

console.log(data)
const container = ref()
const dndContainer = ref()

let graph = null
let dnd = null

const testNode = {
  width: 100,
  height: 40,
  label: 'Rect',
  attrs: {
    body: {
      stroke: '#8f8f8f',
      strokeWidth: 1,
    },
  },
}

function handleStartDrag(e) {
  // const target = e.target
  // const type = target.getAttribute('data-type')
  const node = graph.createNode(testNode)
  dnd.start(node, e)
}
// function exportGraphToJson() {
//   // 获取图的 JSON 数据
//   const jsonData = graph.toJSON();

//   // 将 JSON 数据转换为字符串
//   const jsonString = JSON.stringify(jsonData, null, 2);

//   // 创建 Blob 对象
//   const blob = new Blob([jsonString], { type: 'application/json' });

//   // 创建一个链接元素
//   const a = document.createElement('a');
//   a.href = URL.createObjectURL(blob);
//   a.download = 'graph-data.json'; // 下载的文件名

//   // 触发下载
//   document.body.appendChild(a);
//   a.click();
//   document.body.removeChild(a);
// }
function handleLoadData() {
  graph.fromJSON(data)
}

onMounted(() => {

  window.__x6_instances__ = []

  graph = new Graph({
    container: container.value,
    autoResize: true,
    grid: true,
    panning: true,
    mousewheel: {
      enabled: true,
      global: true,
      modifiers: ['ctrl', 'meta'],
    },
    interacting: {
      nodeMovable(view) {
        return !SwimLane.isSwimLane({ view })
      },
    },
    embedding: {
      enabled: true,
      findParent({ node }) {
        const nodes = this.getNodes()
        return SwimLane.findParentSwimLane(nodes, node)
      },
    },
    highlighting: {
      embedding: SwimLane.embeddingHighlightConfig
    },
  })

  window.graph = graph

  // graph.use(new Selection({
  //   enabled: true,
  //   multiple: true,
  //   movable: true,
  //   rubberband: true,
  //   showNodeSelectionBox: true,
  //   modifiers: ['shift'],
  //   filter: (node) => {
  //     return !SwimLane.isSwimLane({ node })
  //   },
  // }))

  dnd = new Dnd({
    scaled: false,
    target: graph,
    dndContainer: dndContainer.value,
  })
  graph.use(dnd)

  graph.use(new SwimLane())

  // graph.use(
  //   new History({
  //     enabled: true,
  //     beforeAddCommand(event, args) {
  //       // 忽略历史变更
  //       if (args.options.ignoreHistory) {
  //         return false
  //       }
  //     },
  //   }),
  // )

  // graph.addNode({
  //   x: 100,
  //   y: 20,
  //   ...testNode
  // })
  // graph.addNode({
  //   x: 200,
  //   y: 20,
  //   ...testNode
  // })
  // graph.addNode({
  //   x: 100,
  //   y: 60,
  //   ...testNode
  // })
  // graph.addNode({
  //   x: 200,
  //   y: 60,
  //   ...testNode
  // })

  // setTimeout(() => {
  //   graph.centerContent()
  // }, 1000)

  window.__x6_instances__.push(graph)
})
// function handleUndo() {
//   graph.undo()
// }
// function handleRedo() {
//   graph.redo()
// }

</script>

<template>
  <div class="x6-app">
    <div class="dnd" ref="dndContainer">
      <div class="btn-container">
        <!-- <button @click="handleUndo">撤销</button>
      <button @click="handleRedo">重做</button> -->
        <!-- <button @click="exportGraphToJson">download</button> -->
        <button @click="handleLoadData">load data</button>
      </div>
      <div data-type="rect" class="rect" @mousedown="handleStartDrag">rect</div>
    </div>
    <div class="container">
      <div ref="container"></div>
    </div>

  </div>
</template>

<style lang="scss" scoped>
.x6-app {
  width: 100%;
  height: 100%;
  display: flex;

  .dnd {
    box-sizing: border-box;
    width: 200px;
    flex: 0 0 240px;
    padding: 40px 20px;
    border-right: 2px solid #666;

    .btn-container{
      position: absolute;
      top:10px;
      left:20px;
      display: flex;
      width:200px;
    }
    .rect {
      display: flex;
      justify-content: center;
      align-items: center;
      background: #fff;
      width: 100px;
      height: 40px;
      border: 2px solid #8f8f8f;
      cursor: pointer;
    }
  }

  .container {
    flex: 1;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #fff;
  }
}
</style>
