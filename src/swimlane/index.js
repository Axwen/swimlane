import { Basecoat, CssLoader } from '@antv/x6/lib'


import Matrix from './matrix'
import { registrySwimlaneTitle, initTitle, BASE_LABEL } from './title'
import { registrySwimlaneContent } from './content'
import { TransfromImpl } from './Transfrom'
import { swimlaneBaseConfig, handlerPadding } from './variables'
import { content } from './style'

registrySwimlaneTitle()
registrySwimlaneContent()
// registrySwimlaneTransfromHandler()

function createBlankData(options) {
    const {
        position: [x, y],
        rowTitleHeight,
        columnTitleWidth
    } = options
    return {
        x,
        y,
        width: columnTitleWidth,
        height: rowTitleHeight
    }
}
function createSwimLaneTitleData(i, j, options) {
    const {
        position: [x, y],
        rowTitleHeight,
        columnTitleWidth,
        laneWidth,
        laneHeight
    } = options
    return {
        x: j === 0 ? x : x + columnTitleWidth + laneWidth * (j - 1),
        y: i === 0 ? y : y + rowTitleHeight + laneHeight * (i - 1),
        width: i === 0 ? laneWidth : columnTitleWidth,
        height: j === 0 ? laneHeight : rowTitleHeight,
        label: i + ',' + j || BASE_LABEL
    }
}
function createSwimLaneContentData(i, j, options) {
    const {
        position: [x, y],
        rowTitleHeight,
        columnTitleWidth,
        laneWidth,
        laneHeight
    } = options
    return {
        x: x + columnTitleWidth + laneWidth * (j - 1),
        y: y + rowTitleHeight + laneHeight * (i - 1),
        width: laneWidth,
        height: laneHeight
    }
}

function createSwimLaneItem(i, j, options) {
    const shape = i === 0 || j === 0 ? 'swimlane-title' : 'swimlane-content'
    const blank = i === 0 && j === 0
    const base = {
        shape,
        blank,
        index: [i, j],
        zIndex: 0,
    }
    let info = {}
    if (blank) {
        info = createBlankData(options)
    } else if (shape === 'swimlane-title') {
        info = createSwimLaneTitleData(i, j, options)
    } else if (shape === 'swimlane-content') {
        info = createSwimLaneContentData(i, j, options)
    }
    return {
        ...base,
        ...info
    }
}

function genInsertData(type, index, length, options) {
    index += 1
    const data = Array(length).fill(null).map((item, itemIndex) => {
        let newDataIndex = []
        if (type === 'row') {
            newDataIndex = [index, itemIndex]
        } else if (type === 'col') {
            newDataIndex = [itemIndex, index]
        }
        item = createSwimLaneItem(...newDataIndex, options)
        console.log(item, newDataIndex)
        return item
    })
    console.log('genInsertData', data)
    return data

}
export class SwimLane extends Basecoat {
    constructor(options) {
        super()
        this.name = 'swimlane'
        this.activating = false
        const { position: [x, y], rowTitleHeight, sizes } = swimlaneBaseConfig
        this.sizes = sizes
        // this.options = Object.assign({}, swimlaneBaseConfig, options)
        this.options = Object.assign({}, swimlaneBaseConfig, {
            // 主标题的position
            origin: [x, y],
            //初始化position的还需要放一个主标题，剩余内容从这个位置开始
            position: [x, y + rowTitleHeight]
        })
        CssLoader.ensure(this.name, content)
        console.log('options', options, this.options)
    }

    init(graph) {
        this.graph = graph
        graph.swimlane = this
        const { sizes } = this.options
        const matrix = this.initMatrix(sizes)
        this.matrix = matrix
        initTitle(graph, matrix)
        this.renderData()
        this.transfromImpl = new TransfromImpl({
            graph
        })
        console.log('init', graph, matrix)
    }
    initMatrix() {
        const { sizes } = this.options
        const [rowSize, colSize] = sizes
        const matrix = new Matrix(rowSize + 1, colSize + 1)
        matrix.traverse((item, rowIndex, colIndex) => {
            const itemData = createSwimLaneItem(rowIndex, colIndex, this.options)
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
    checkRowOrColHasChildren({ rowIndex, colIndex }) {
        let result = false
        if (rowIndex > 0 && rowIndex < this.matrix.rows) {
            const rows = this.matrix[rowIndex]
            result = rows.some(item => {
                const cell = this.graph.getCellById(item.id)
                return cell.children && cell.children.length > 0
            })
        }
        if (colIndex > 0 && colIndex < this.matrix.cols) {
            result = this.matrix.some(row => {
                const item = row[colIndex]
                const cell = this.graph.getCellById(item.id)
                return cell.children && cell.children.length > 0
            })
        }
        return result
    }
    insert(dataIndex) {
        const [rowIndex, colIndex] = dataIndex
        const { matrix, matrix: { rows, cols } } = this
        let length = 0
        let type = ''
        let index = 0
        if (rowIndex === 0) {
            type = 'col'
            index = colIndex
            length = rows
        } else if (colIndex === 0) {
            type = 'row'
            index = rowIndex
            length = cols
        }
        const data = genInsertData(type, index, length, this.options)
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
        this.renderData(type, index, removedDatas)
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
                item.id && graph.removeNode(item.id)
            })
        }
        if (updatedDatas && updatedDatas.length > 0) {
            updatedDatas.forEach((item) => {
                const { id, index, x, y, width, height } = item
                if (id) {
                    const node = graph.getCellById(id)
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
        console.log(matrix.data)
    }
    setData() { }
    dispose() {
        this.transfromImpl.dispose()
        CssLoader.clean(this.name)
    }
}