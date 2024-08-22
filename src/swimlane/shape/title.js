

import { Graph, ObjectExt } from '@antv/x6'
import { Button } from '@antv/x6/es/registry/tool/button'
import { ElMessageBox } from 'element-plus'

import { getCrossPath, getLinePath } from '../utils'
import { fillColor, strokeColor, labelColor, strokeWidth } from '../variables'

export const BASE_LABEL = '请输入...'

export const ROW_HEIGHT = 300
export const COL_WIDTH = 100

const TITLE_BTN_WIDTH = 14
const TITLE_BTN_HEIGHT = 14
const RADIUS = 3
const MAIN_TITLE_LABEL_OFFSET = 8

const TITLE_BTN_RECT_ATTRS = {
    width: TITLE_BTN_WIDTH,
    height: TITLE_BTN_HEIGHT,
    rx: RADIUS,
    ry: RADIUS,
    fill: fillColor,
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    cursor: 'pointer',
}

const TITLE_BTN_ICON_ATTRS = {
    fill: 'none',
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    pointerEvents: 'none',
}

function getTitleButtonToolMarkup(type) {
    return [
        {
            tagName: 'rect',
            selector: 'button',
            attrs: TITLE_BTN_RECT_ATTRS,
        },
        {
            tagName: 'path',
            selector: 'icon',
            attrs: {
                ...TITLE_BTN_ICON_ATTRS,
                d: type === 'add' ? getCrossPath(TITLE_BTN_RECT_ATTRS) : getLinePath(TITLE_BTN_RECT_ATTRS)
            },
        },
    ]
}


const addTitleButton = Button.define({
    markup: getTitleButtonToolMarkup('add'),
    onClick({ e, cell, view }) {
        e.stopPropagation()
        const { graph } = view
        const { index } = cell.getData()
        graph.swimlane.insert(index)
    },
});

const removeTitleButton = Button.define({
    markup: getTitleButtonToolMarkup('remove'),
    onClick({ e, cell, view }) {
        e.stopPropagation()
        const { graph } = view
        const { index } = cell.getData()
        const hasChildren = graph.swimlane.checkRowOrColHasChildren(index)
        if (hasChildren) {
            ElMessageBox.confirm('该泳道内存在内容，删除后会同步删除泳道内的内容，确认删除?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {

                graph.swimlane.remove(index)
            })
            return
        }
        graph.swimlane.remove(index)
    },
})

const titleShape = {
    inherit: 'rect',
    attrs: {
        body: {
            strokeWidth: strokeWidth,
            stroke: strokeColor,
            fill: fillColor,
        },
        label: {
            fontWeight: 'bold',
            fill: labelColor,
        }
    },
    propHooks(metadata) {
        let { mainTitle, blank, ...others } = metadata
        if (mainTitle) {
            ObjectExt.setByPath(others, 'attrs/label/textAnchor', 'start')
            ObjectExt.setByPath(others, 'attrs/label/refX', MAIN_TITLE_LABEL_OFFSET)
        }
        if (blank) {
            ObjectExt.setByPath(others, 'tools', [])
            ObjectExt.setByPath(others, 'attrs/text/text', '')
        }

        ObjectExt.setByPath(others, 'subTitle', !mainTitle && !blank)

        return {
            ...others
        }
    },
    tools: [
        {
            name: 'node-editor',
            args: {
                attrs: {
                    color: '#999',
                    backgroundColor: 'transparent',
                },
            },
        },
    ],
}

function isSwimLaneSubTitle(node) {
    return node.shape === 'swimlane-title' && node.prop('subTitle')
}

function addTitleTools(node, graph) {
    const { swimlane: { matrix, options: { sizes } } } = graph
    const { index: [rowIndex] } = node.getData() || {}
    const isRowTitle = rowIndex === 0
    const tools = [{
        name: 'title-add',
        args: {
            x: '100%',
            y: '100%',
            offset: { x: -20, y: -20 },
        },
    }]

    // rowTitle增加列 colTitle增加行
    const size = isRowTitle ? matrix.cols : matrix.rows
    const minSize = isRowTitle ? sizes[0] : sizes[1]
    if (size - 1 > minSize) {
        tools.push({
            name: 'title-remove',
            args: {
                x: '100%',
                y: '100%',
                offset: { x: -38, y: -20 },
            }
        })
    }
    node.addTools(tools, { ignoreHistory: true })
}

function removeTitleTools(node) {
    node.removeTool('title-add', { ignoreHistory: true })
    node.removeTool('title-remove', { ignoreHistory: true })
}


function registrySwimlaneTitle() {
    Graph.registerNode('swimlane-title', titleShape, true)
    Graph.registerNodeTool('title-add', addTitleButton, true)
    Graph.registerNodeTool('title-remove', removeTitleButton, true)
}

function titleMouseenter({ node, view }) {
    const { graph, tools } = view
    const editorActive = tools?.tools?.some(item => item.editor)
    if (!editorActive && isSwimLaneSubTitle(node)) {
        addTitleTools(node, graph)
    }
}

function titleMouseleave({ node, view }) {
    const { tools } = view
    const editorActive = tools?.tools?.some(item => item.editor)
    if (!editorActive && isSwimLaneSubTitle(node)) {
        removeTitleTools(node)
    }
}

function bindTitleEvent() {
    graph.on('node:mouseenter', titleMouseenter)
    graph.on('node:mouseleave', titleMouseleave)
}
function unbindTitleEvent() {
    graph.off('node:mouseenter', titleMouseenter)
    graph.off('node:mouseleave', titleMouseleave)
}

export {
    registrySwimlaneTitle,
    bindTitleEvent,
    unbindTitleEvent
}

