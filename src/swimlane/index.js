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
        this.transfrom = new TransfromImpl({
            graph,
            swimlane: this,
            matrix,
        })
        initTitle(graph, matrix)
        // initSwimlaneTransfromHandler(graph, matrix)
        this.renderData()
        // this.renderHandler()
        console.log('init', graph, matrix.data)
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
        let length = 0
        let type = ''
        let index = 0
        if (rowIndex === 0) {
            type = 'col'
            index = colIndex
            length = this.matrix.rows
        } else if (colIndex === 0) {
            type = 'row'
            index = rowIndex
            length = this.matrix.cols
        }
        const data = genInsertData(type, index, length, this.options)
        if (type === 'row') {
            this.matrix.addRow(index, data)
        } else if (type === 'col') {
            this.matrix.addColumn(index, data)
        }
        this.renderData(type, index)
        console.log(this.matrix)
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
    renderData(type, index, removedDatas) {
        let needUpdateData = []
        if (type === 'row') {
            needUpdateData = this.matrix.sliceRow(index)
        } else if (type === 'col') {
            needUpdateData = this.matrix.sliceCol(index)
        } else {
            needUpdateData = this.matrix.flat()
        }
        const { graph, matrix } = this

        graph.startBatch('render-data')
        if (removedDatas && removedDatas.length > 0) {
            removedDatas.forEach(item => {
                item.id && graph.removeNode(item.id)
            })
        }
        needUpdateData.forEach((item) => {
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
        graph.stopBatch('render-data')
        console.log(matrix.data)
    }
    renderHandler() {
        const { graph, matrix: { data, rows, cols } } = this
        const first = data[0][0]
        const last = data[rows - 1][cols - 1]
        const start = {
            x: first.x + handlerPadding,
            y: first.y + handlerPadding
        }
        const end = {
            x: last.x + last.width - handlerPadding,
            y: last.y + last.height - handlerPadding
        }
        graph.startBatch('render-handler')
        const edges = []
        for (let i = 0; i < rows; i++) {
            const row = data[i]
            const { y, height } = row[0]
            const handlerY = y + height
            edges.push({
                shape: 'swimlane-transform-handler',
                horizontal: true,
                source: {
                    x: start.x,
                    y: handlerY
                },
                target: {
                    x: end.x,
                    y: handlerY
                }
            })
        }
        const firstCols = data[0]
        for (let j = 0; j < cols; j++) {
            const col = firstCols[j]
            const { x, width } = col
            const handlerX = x + width
            edges.push({
                shape: 'swimlane-transform-handler',
                source: {
                    x: handlerX,
                    y: start.y
                },
                target: {
                    x: handlerX,
                    y: end.y
                }
            })
        }
        graph.addEdges(edges)
        graph.stopBatch('render-handler')
    }
    initEvent() {
        const { graph } = this
        //设置swimLane active状态
        graph.on('node:click', ({ node }) => {
            this.updateTransformHandler(node.isNode() && node.shape.startsWith('swimlane'))
        })
        graph.on('blank:click', () => {
            this.updateTransformHandler(false)
        })
    }
    updateTransformHandler(activating) {
        if (activating) {
            this.initTransformHandler.show()
        } else {
            this.initTransformHandler.hide()
        }
    }
    setData() { }
    dispose() {
    }
}