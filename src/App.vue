<script setup>
import { nextTick, onMounted, } from 'vue'
import { Graph } from '@antv/x6/lib'
import { Dnd } from '@antv/x6-plugin-dnd/lib'
import { Scroller } from '@antv/x6-plugin-scroller/lib'
import { SwimLane } from './swimlane/index.js'
onMounted(() => {


  window.__x6_instances__ = []

  const graph = new Graph({
    container: document.getElementById('container'),
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
        return !view.cell.shape.startsWith('swimlane')
      },
    },
    embedding: {
      enabled: true,
      findParent({ node }) {
        const bbox = node.getBBox()
        return this.getNodes().filter((node) => {
          if (node.shape === 'swimlane-content') {
            const targetBBox = node.getBBox()
            return bbox.isIntersectWithRect(targetBBox)
          }
          return false
        })
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

  const dnd = new Dnd({
    target: graph,
  })

  window.graph = graph
  // const scroller = new Scroller({
  //   enabled: true,
  // })
  const swimLane = new SwimLane()
  graph.use(dnd)
  // graph.use(scroller)
  graph.use(swimLane)

  // graph.addNode({
  //   shape: 'swimlane-title',
  //   mainTitle: true,
  //   x: 100,
  //   y: 100,
  //   width: 700,
  //   height: 40,
  // })

  graph.addNode({
    x: 800,
    y: 800,
    width: 100,
    height: 100,
    attrs: {
      body: {
        fill: 'lightblue',
      },
    }
  })


  // setTimeout(() => {
  //   graph.centerContent()
  // }, 1000)


  window.__x6_instances__.push(graph)
})

</script>

<template>
  <div style="width:100%; height:100%">
    <div id="container"></div>
  </div>
</template>

<style scoped></style>
