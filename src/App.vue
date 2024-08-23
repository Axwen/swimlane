<script setup>
import { ref, onMounted } from 'vue'
import { Graph } from '@antv/x6'
import { Dnd } from '@antv/x6-plugin-dnd'
import { Selection } from '@antv/x6-plugin-selection'
import { History } from '@antv/x6-plugin-history'
import { SwimLane } from './swimlane'

const container = ref()
const dndContainer = ref()

let graph = null
let dnd = null

function handleStartDrag(e) {
  // const target = e.target
  // const type = target.getAttribute('data-type')
  const node = graph.createNode({
    width: 100,
    height: 40,
    label: 'Rect',
    attrs: {
      body: {
        stroke: '#8f8f8f',
        strokeWidth: 1,
      },
    },
  })
  dnd.start(node, e)
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
      embedding: {
        name: 'stroke',
        args: {
          padding: -5,
          attrs: {
            stroke: '#73d13d',
          },
        },
      },
    },
  })

  window.graph = graph

  const selection = new Selection({
    enabled: true,
    multiple: true,
    movable: true,
    rubberband: true,
    showNodeSelectionBox: true,
    modifiers: ['shift'],
    filter: (node) => {
      return !SwimLane.isSwimLane({ node })
    },

  })
  graph.use(selection)


  dnd = new Dnd({
    scaled: false,
    target: graph,
    dndContainer: dndContainer.value,
  })
  graph.use(dnd)

  const swimLane = new SwimLane()
  graph.use(swimLane)

  graph.use(
    new History({
      enabled: true,
      beforeAddCommand(event, args) {
        // 忽略历史变更
        if (args.options.ignoreHistory) {
          return false
        }
      },
    }),
  )

  graph.addNode({
    x: 100,
    y: 20,
    width: 100,
    height: 40,
    label: 'Rect',
    attrs: {
      body: {
        stroke: '#8f8f8f',
        strokeWidth: 1,
      },
    },
  })
  graph.addNode({
    x: 200,
    y: 20,
    width: 100,
    height: 40,
    label: 'Rect',
    attrs: {
      body: {
        stroke: '#8f8f8f',
        strokeWidth: 1,
      },
    },
  })
  graph.addNode({
    x: 100,
    y: 60,
    width: 100,
    height: 40,
    label: 'Rect',
    attrs: {
      body: {
        stroke: '#8f8f8f',
        strokeWidth: 1,
      },
    },
  })
  graph.addNode({
    x: 200,
    y: 60,
    width: 100,
    height: 40,
    label: 'Rect',
    attrs: {
      body: {
        stroke: '#8f8f8f',
        strokeWidth: 1,
      },
    },
  })
  // graph.addNode({
  //   shape: 'swimlane-title',
  //   mainTitle: true,
  //   x: 100,
  //   y: 100,
  //   width: 700,
  //   height: 40,
  // })


  setTimeout(() => {
    graph.centerContent()
  }, 1000)


  window.__x6_instances__.push(graph)
})
function handleUndo() {
  graph.undo()
}
function handleRedo() {
  graph.redo()
}

</script>

<template>
  <div class="x6-app">
    <div class="dnd" ref="dndContainer">
      <div data-type="rect" class="rect" @mousedown="handleStartDrag">rect</div>
      <button @click="handleUndo">撤销</button>
      <button @click="handleRedo">重做</button>
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
    padding: 20px;
    border-right: 2px solid #666;

    .rect {
      display: flex;
      justify-content: center;
      align-items: center;
      background: #fff;
      width: 40px;
      height: 40px;
      border: 2px solid #666;
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
