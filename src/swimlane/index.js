import { Basecoat, CssLoader } from '@antv/x6'

import Matrix from './matrix'
import { registrySwimlaneTitle, initTitle, BASE_LABEL } from './shape/title'
import { registrySwimlaneContent } from './shape/content'
import { TransfromImpl } from './transfrom'
import { swimLaneBaseConfig, swimLanePadding } from './variables'
import { content } from './style'

registrySwimlaneTitle()
registrySwimlaneContent()

function genSwimLaneItemBBox([i, j], options) {
    const {
        position: [originX, originY],
        rowTitleHeight,
        columnTitleWidth,
        laneWidth,
        laneHeight,
    } = options
    return {
        x: j === 0 ? originX : originX + columnTitleWidth + laneWidth * (j - 1),
        y: i === 0 ? originY : originY + rowTitleHeight + laneHeight * (i - 1),
        width: j === 0 ? columnTitleWidth : laneWidth,
        height: i === 0 ? rowTitleHeight : laneHeight
    }
}
function genSwimLaneItemData(index, options, bbox) {
    const [i, j] = index
    let shape = 'swimlane-content';
    let label = ''
    if (i === 0 || j === 0) {
        shape = 'swimlane-title'
        label = BASE_LABEL
    }
    bbox = bbox || genSwimLaneItemBBox(index, options)
    return {
        shape,
        blank: i === 0 && j === 0,
        index,
        zIndex: 0,
        label,
        ...bbox,
    }
}

// 群组改变时，自动调整子节点 左侧超出就移动子节点 右侧超出就扩大
function autoResizeSwimLane({ node, currentParent }) {
    const { graph } = this
    const selectedCells = graph.getSelectedCells()
    if (selectedCells.length === 0) {
        selectedCells.push(node)
    }
    const {
        left,
        top,
        right,
        bottom
    } = graph.getCellsBBox(selectedCells)
    const {
        left: parentLeft,
        top: parentTop,
        right: parentRight,
        bottom: parentBottom,
    } = currentParent.getBBox()

    const minX = parentLeft + swimLanePadding
    const minY = parentTop + swimLanePadding
    const maxX = parentRight - swimLanePadding
    const maxY = parentBottom - swimLanePadding

    let offetX = 0
    let offsetY = 0
    let resizeX = 0
    let resizeY = 0
    // 判断左侧是不是在父节点的内，不是的向右移动
    if (left < minX) {
        offetX = left - minX
    }
    if (top < minY) {
        offsetY = top - minY
    }

    // 判断右侧是不是在父节点的内（包含移动后），不是的话 扩展节点宽度
    const afterMoveChildrenMaxX = right - offetX
    const afterMoveChildrenMaxY = bottom - offsetY
    if (afterMoveChildrenMaxX > maxX) {
        resizeX = afterMoveChildrenMaxX - maxX
    }
    if (afterMoveChildrenMaxY > maxY) {
        resizeY = afterMoveChildrenMaxY - maxY
    }
    const { index: [rowIndex, colIndex] } = currentParent.getData()
    graph.startBatch('batch-move-children')
    if (offetX !== 0 || offsetY !== 0) {
        selectedCells.forEach((cell) => {
            cell.translate(-offetX, -offsetY)
        })
    }
    if (resizeX) {
        this.resize({ type: 'col', index: colIndex, offset: resizeX })
    }
    if (resizeY) {
        this.resize({ type: 'row', index: rowIndex, offset: resizeY })
    }
    graph.stopBatch('batch-move-children')
}

export class SwimLane extends Basecoat {
    static isSwimLane({ view, node }) {
        const shape = node ? node.shape : view ? view.cell.shape : ''
        return shape.startsWith('swimlane')
    }
    static findParentSwimLane(nodes, currentNode) {
        const bbox = currentNode.getBBox()
        return nodes.filter((node) => {
            if (node.shape === 'swimlane-content') {
                const targetBBox = node.getBBox()
                // return targetBBox.containsRect(bbox)
                return bbox.isIntersectWithRect(targetBBox)
            }
            return false
        })
    }
    constructor(options) {
        super()
        this.name = 'swimlane'
        this.activating = false
        const { position: [x, y], rowTitleHeight, sizes } = swimLaneBaseConfig
        this.sizes = sizes
        // this.options = Object.assign({}, swimLaneBaseConfig, options)
        this.options = Object.assign({}, swimLaneBaseConfig, {
            // 主标题的position
            origin: [x, y],
            //初始化position的还需要放一个主标题，剩余内容从这个位置开始
            position: [x, y + rowTitleHeight]
        })
        CssLoader.ensure(this.name, content)
    }
    init(graph) {
        this.graph = graph
        graph.swimlane = this
        const matrix = this.initMatrix()
        this.matrix = matrix
        initTitle(graph, matrix)
        this.renderData()
        this.transfromImpl = new TransfromImpl({ graph })
        this.bindEvents()
    }
    initMatrix() {
        const { sizes } = this.options
        const [rowSize, colSize] = sizes
        const matrix = new Matrix(rowSize + 1, colSize + 1)
        matrix.traverse((item, rowIndex, colIndex) => {
            const itemData = genSwimLaneItemData([rowIndex, colIndex], this.options)
            matrix.setValue(rowIndex, colIndex, itemData)
        })
        return matrix
    }
    getBBox() {
        const { graph, matrix, matrix: { rows, cols } } = this
        const { id: firstId } = matrix.getValue(0, 0)
        const { id: lastId } = matrix.getValue(rows - 1, cols - 1)
        const firstNode = graph.getCellById(firstId)
        const lastNode = graph.getCellById(lastId)
        if (firstNode && lastNode) {
            const firstBBox = firstNode.getBBox()
            const lastBBox = lastNode.getBBox()
            const x = firstBBox.x
            const y = firstBBox.y
            const width = lastBBox.x + lastBBox.width - x
            const height = lastBBox.y + lastBBox.height - y
            return { x, y, width, height }
        }
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }
    }
    checkRowOrColHasChildren([rowIndex, colIndex]) {
        let items = []
        if (rowIndex > 0 && rowIndex < this.matrix.rows) {
            items = this.matrix.sliceRow(rowIndex, rowIndex + 1, true)
        }
        if (colIndex > 0 && colIndex < this.matrix.cols) {
            items = this.matrix.sliceCol(colIndex, colIndex + 1, true)
        }
        return items.some(item => {
            const cell = this.graph.getCellById(item.id)
            return cell.children && cell.children.length > 0
        })
    }
    genInsertData(type, index, length, data) {
        const { laneWidth, laneHeight } = this.options
        index += 1
        let increment = 0
        return Array(length).fill(null).map((item, itemIndex) => {
            let newDataIndex = []
            const bbox = {}
            if (type === 'row') {
                newDataIndex = [index, itemIndex]
                const { x, y, width } = data[0][itemIndex]
                if (itemIndex === 0) {
                    increment = x
                }
                bbox.width = width
                bbox.height = laneHeight
                bbox.x = increment
                bbox.y = y
                increment += width
            } else if (type === 'col') {
                newDataIndex = [itemIndex, index]
                const { x, y, height } = data[itemIndex][0]
                if (itemIndex === 0) {
                    increment = y
                }
                bbox.width = laneWidth
                bbox.height = height
                bbox.x = x
                bbox.y = increment
                increment += height
            }
            return genSwimLaneItemData(newDataIndex, this.options, bbox)
        })
    }
    insert(dataIndex) {
        const [rowIndex, colIndex] = dataIndex
        const { matrix, matrix: { rows, cols } } = this
        let length = 0
        let type = ''
        let index = 0
        let current = []
        if (rowIndex === 0) {
            type = 'col'
            index = colIndex
            length = rows
            current = matrix.sliceCol(colIndex, colIndex + 1)
        } else if (colIndex === 0) {
            type = 'row'
            index = rowIndex
            length = cols
            current = matrix.sliceRow(rowIndex, rowIndex + 1)
        }
        const data = this.genInsertData(type, index, length, current)
        if (type === 'row') {
            matrix.addRow(index, data)
        } else if (type === 'col') {
            matrix.addColumn(index, data)
        }
        this.renderData({ type, index })
    }
    remove(dataIndex) {
        const [rowIndex, colIndex] = dataIndex
        let type = ''
        let index = 0
        if (rowIndex === 0) {
            type = 'col'
            index = colIndex
        } else if (colIndex === 0) {
            type = 'row'
            index = rowIndex
        }
        let removedDatas = []
        if (type === 'row') {
            removedDatas = this.matrix.removeRow(index)
        } else if (type === 'col') {
            removedDatas = this.matrix.removeColumn(index)
        }
        this.renderData({ type, index, removedDatas })
    }
    resize({ type, index, offset }) {
        let needUpdateData = []
        if (type === 'row') {
            this.matrix.sliceRow(index).forEach((row, rowIndex) => {
                row.forEach((col) => {
                    if (rowIndex === 0) {
                        col.height += offset
                    } else {
                        col.y += offset
                    }
                    needUpdateData.push(col)
                })
            })
        } else if (type === 'col') {
            this.matrix.sliceCol(index).forEach((row) => {
                row.forEach((col, colIndex) => {
                    if (colIndex === 0) {
                        col.width += offset
                    } else {
                        col.x += offset
                    }
                    needUpdateData.push(col)
                })
            })
        }
        this.renderData({ type, index, updatedDatas: needUpdateData })
    }
    renderData({ type, index, updatedDatas, removedDatas } = {}) {
        const { rows, cols } = this.matrix
        if (!Array.isArray(updatedDatas) || updatedDatas.length === 0) {
            if (type === 'row') {
                updatedDatas = this.matrix.sliceRow(index, rows, true)
            } else if (type === 'col') {
                updatedDatas = this.matrix.sliceCol(index, cols, true)
            } else {
                updatedDatas = this.matrix.flat()
            }
        }

        const { graph, matrix } = this

        graph.startBatch('render-data')
        if (removedDatas && removedDatas.length > 0) {
            removedDatas.forEach(item => {
                const { id } = item
                if (id) {
                    const node = graph.getCellById(id)
                    const children = node.getChildren()
                    if (children && children.length > 0) {
                        children.forEach(child => {
                            node.remove(child)
                        })
                    }
                    graph.removeNode(node)
                }
            })
        }
        if (updatedDatas && updatedDatas.length > 0) {
            updatedDatas.forEach((item) => {
                const { id, index, x, y, width, height } = item
                if (id) {
                    const node = graph.getCellById(id)
                    const children = node.getChildren()
                    if (children && children.length > 0) {
                        children.forEach(child => {
                            const relativePos = child.position({ relative: true })
                            child.position(x + relativePos.x, y + relativePos.y)
                        })
                    }
                    node.resize(width, height)
                    node.position(x, y)
                    node.updateData({ index })
                } else {
                    const { index, ...other } = item
                    const node = graph.addNode({
                        ...other,
                        data: item
                    })
                    node.attr('text/text', node.id.substring(0, 4))
                    matrix.setValue(...index, {
                        ...item,
                        id: node.id
                    })
                }

            })
        }
        graph.stopBatch('render-data')
        graph.emit('swimlane:rendered', { matrix })
    }
    bindEvents() {
        const { graph } = this
        graph.on('node:embedded', autoResizeSwimLane, this)
        graph.on('history:undo', function ({ cmds }) {
            console.log(cmds)
        }, this)
    }
    unbindEvents() {
        const { graph } = this
        graph.off('node:embedded', autoResizeSwimLane, this)
    }
    setData() { }
    dispose() {
        this.transfromImpl.dispose()
        this.unbindEvents()
        CssLoader.clean(this.name)
    }
}