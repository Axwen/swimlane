# 泳道图

##

### 文件

```js
swimlane
│├──  README.md
│├── index.js  // 泳道图class 
│├── matrix.js // 泳道的数据结构
│├── shape  //自定义注册的泳道节点
││├── content.js // 内容容器
││└── title.js // 可编辑标题及相关tools和事件
│├── style.js // 相关样式
│├── transfrom.js // 缩放插件
│├── utils.js // path生成等辅助方法
│└── variables.js // 相关配置变量
```

### 完整示例

```js

import { SwimLane } from './swimlane';

new Graph({
    //...其他配置
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

graph.use(new SwimLane());

```

### 静态属性

#### 静态属性 SwimLane.embeddingHighlightConfig

加入泳道时的高亮配置

| 属性 | 值 |
| --- | -- |
| name| stroke  |
| args.padding | -5 |
| args.attrs.stroke | #73d13d (variables.js配置 highlightColor ) |

#### 静态方法 SwimLane.isSwimLane

判断是否是泳道节点，常用与 节点可否移动，可否选中等

```js

new Graph({
    //...其他配置
    interacting: {
      nodeMovable(view) {
        // 如果是泳道节点，不能移动
        return !SwimLane.isSwimLane({ view })
      },
    },
})

new Selection({
    enabled: true,
    multiple: true,
    movable: true,
    rubberband: true,
    showNodeSelectionBox: true,
    modifiers: ['shift'],
    filter: (node) => {
    // 排除泳道节点不可选中
      return !SwimLane.isSwimLane({ node })
    },
})
```

| 参数 | 描述 |
| ------------ | ----------------- |
|  view| 当前节点的视图  |
| node | 节点(node的优先级大于view) |

#### 静态方法 SwimLane.findParentSwimLane

返回允许加入泳道图的父节点

```js

new Graph({
    //...其他配置
    embedding: {
      enabled: true,
      findParent({ node }) {
        const nodes = this.getNodes()
        return SwimLane.findParentSwimLane(nodes, node)
      }
    }
})
```

| 参数 | 描述 |
| ------------ | ----------------- |
| nodes| node集合 |
| currentNode | 当前选中的节点 |
