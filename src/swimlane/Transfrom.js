import { View, Dom, FunctionExt } from '@antv/x6'
import { swimLaneBaseConfig, swimLanePadding } from './variables'

const {
    laneWidth,
    laneHeight,
    rowTitleHeight: minRowSize,
    columnTitleWidth: minColSize,
} = swimLaneBaseConfig

const documentEvents = {
    mousemove: 'onMouseMove',
    touchmove: 'onMouseMove',
    mouseup: 'onMouseUp',
    touchend: 'onMouseUp',
}

export class TransfromImpl extends View {
    constructor(options) {
        super()
        const { graph, ...others } = options
        this.graph = graph
        this.options = { ...others }
        this.render()
        this.startListening()
    }
    get containerClassName() {
        return this.prefixClassName('swimlane-transform')
    }
    get contentClassName() {
        return `${this.containerClassName}-content`
    }
    get handlerClassName() {
        return `${this.containerClassName}-handler`
    }
    get swimlane() {
        return this.graph.swimlane
    }
    get matrix() {
        return this.swimlane.matrix
    }
    render() {
        this.initContainer()
        this.updateTransform()
    }
    initContainer() {
        const container = this.container = Dom.createElement('div')
        const content = this.content = Dom.createElement('div')
        Dom.addClass(container, this.containerClassName)
        Dom.addClass(content, this.contentClassName)
        Dom.append(container, content)
        Dom.append(this.graph.container, this.container)
    }
    updateHandlers() {
        Dom.empty(this.content)
        Dom.append(this.content, this.createHandlers())
    }
    createHorizontalHandlers() {
        const { matrix: { data, rows } } = this
        const handers = []
        let top = 0
        for (let i = 0; i < rows; i++) {
            const row = data[i]
            const { height } = row[0]
            const handler = Dom.createElement('div')
            Dom.addClass(handler, this.handlerClassName)
            Dom.attr(handler, 'data-dir', 'horizontal')
            Dom.attr(handler, 'data-index', i)
            top = i === 0 ? height : top + height
            Dom.css(handler, { top })
            handers.push(handler)
        }
        return handers
    }
    createVerticalHandlers() {
        const { matrix: { data, cols } } = this
        const handers = []
        const firstCols = data[0]
        let left = 0
        for (let j = 0; j < cols; j++) {
            const col = firstCols[j]
            const { width } = col
            const handler = Dom.createElement('div')
            Dom.addClass(handler, this.handlerClassName)
            Dom.attr(handler, 'data-dir', 'vertical')
            Dom.attr(handler, 'data-index', j)
            left = j == 0 ? width : left + width
            Dom.css(handler, { left })
            handers.push(handler)
        }
        return handers
    }
    createHandlers() {
        const horizontalHandlers = this.createHorizontalHandlers()
        const verticalHandlers = this.createVerticalHandlers()
        return horizontalHandlers.concat(verticalHandlers)
    }
    updateTransform() {
        this.updateContainer()
        this.updateHandlers()
    }
    updateContainer() {
        const ctm = this.graph.matrix()
        const bbox = this.swimlane.getBBox()
        bbox.x *= ctm.a
        bbox.x += ctm.e
        bbox.y *= ctm.d
        bbox.y += ctm.f
        Dom.css(this.container, {
            width: bbox.width,
            height: bbox.height,
            transform: `scale3d(${ctm.a},${ctm.d},1)`,
            left: bbox.x,
            top: bbox.y,
        })
    }
    startListening() {
        const { graph, updateTransform, updateContainer } = this
        graph.on('translate', updateContainer, this)
        graph.on('scale', updateContainer, this)
        graph.on('swimlane:rendered', updateTransform, this)
        graph.on('history:undo', updateTransform, this)
        graph.on('history:redo', updateTransform, this)
        this.delegateEvents({
            [`mousedown .${this.handlerClassName}`]: 'startResizing',
            [`touchstart .${this.handlerClassName}`]: 'startResizing',
        })
        this.delegateDocumentEvents(documentEvents)
    }
    stopListening() {
        const { graph, updateTransform, updateContainer } = this
        graph.off('translate', updateContainer, this)
        graph.off('scale', updateContainer, this)
        graph.off('swimlane:rendered', updateContainer, this)
        graph.off('history:undo', updateTransform, this)
        graph.off('history:redo', updateTransform, this)
        this.undelegateEvents()
        this.undelegateDocumentEvents()
    }
    startResizing(e) {
        this.startHandler(e.target)
        this.graph.view.undelegateEvents()
    }
    onMouseMove = FunctionExt.throttle((e) => {
        if (!this.handler) {
            return
        }
        const evt = this.normalizeEvent(e)
        let clientX = evt.clientX
        let clientY = evt.clientY
        const { target, origin, dir, start, min, max } = this.handler
        const pos = this.graph.clientToLocal(clientX, clientY)
        const axis = dir === 'vertical' ? 'x' : 'y'
        const positionKey = dir === 'vertical' ? 'left' : 'top'
        const offset = pos[axis] - origin[axis] - start
        let position = start + offset
        position = Math.min(position, max)
        position = Math.max(position, min)
        Dom.css(target, {
            [positionKey]: position
        })
        this.handler.offset = position - start
    }, 16)
    onMouseUp() {
        if (!this.handler) {
            return
        }
        if (this.handler.offset) {
            this.resize()
        }
        this.updateContainer()
        this.stopHandler()
        this.graph.view.delegateEvents()
    }
    getChildren(dir, index) {
        let swimLaneItems = []
        const allChildren = []
        const swimLaneNodes = []
        index = Number(index)
        if (dir === 'vertical') {
            swimLaneItems = this.matrix.sliceCol(index, index + 1, true)
        } else {
            swimLaneItems = this.matrix.sliceRow(index, index + 1, true)
        }
        swimLaneItems.forEach(item => {
            const { id } = item
            const node = this.graph.getCellById(id)
            const children = node.getChildren() || []
            swimLaneNodes.push(node)
            allChildren.push(...children)
        })
        const { x: originX, y: originY } = this.swimlane.getBBox()
        const { top, bottom, left, right } = this.graph.getCellsBBox(swimLaneNodes)
        let min = dir === 'vertical' ? left - originX + minColSize : top - originY + minRowSize
        const max = dir === 'vertical' ? right - originX + laneWidth : bottom - originY + laneHeight
        if (allChildren.length > 0) {
            const { right, bottom } = this.graph.getCellsBBox(allChildren)
            console.log(right, bottom)
            min = (dir === 'vertical' ? right - originX : bottom - originY) + swimLanePadding
        }
        return {
            min,
            max
        }
    }
    getMovableRange(dir, index) {
        let min = 0;
        let max = 0;
        const { x: originX, y: originY } = this.swimlane.getBBox()
        const nextIndex = index + 1

        if (dir === 'vertical') {
            const item = this.matrix.getValue(0, index)
            const { x, width } = item
            const base = x - originX
            min = base + minColSize
            if (nextIndex < this.cols) {
                const nextItem = this.matrix.getValue(0, nextIndex)
                const { x: nextX } = nextItem
                max = nextX
            } else {
                max = base + width + laneWidth
            }
        } else {
            const item = this.matrix.getValue(index, 0)
            const { y, height } = item
            const base = y - originY
            min = base + minRowSize
            if (nextIndex < this.rows) {
                const nextItem = this.matrix.getValue(nextIndex, 0)
                const { y: nextY } = nextItem
                max = nextY
            } else {
                max = base - minRowSize + height + laneHeight
            }
        }
        console.log(this.getChildren(dir, index), { min, max })
        return this.getChildren(dir, index)
        // return {
        //     min,
        //     max
        // }
    }
    startHandler(handler) {
        const dir = Dom.attr(handler, 'data-dir')
        const index = Dom.attr(handler, 'data-index')
        const { min, max } = this.getMovableRange(dir, index)
        const start = parseInt(Dom.getComputedStyle(handler, dir === 'vertical' ? 'left' : 'top'))
        const bbox = this.swimlane.getBBox()
        const origin = this.graph.localToPage(bbox.x, bbox.y)
        console.log(start, bbox.x, bbox.y, origin)
        this.handler = {
            start,
            origin: {
                x: bbox.x,
                y: bbox.y
            },
            target: handler,
            dir,
            index,
            min,
            max
        } || null
        Dom.addClass(handler, `${this.handlerClassName}--active`)
        Dom.addClass(this.container, `${this.containerClassName}-cursor-${dir}`)
    }
    stopHandler() {
        const { target: handler, dir } = this.handler
        Dom.removeClass(handler, `${this.handlerClassName}--active`)
        Dom.removeClass(this.container, `${this.containerClassName}-cursor-${dir}`)
        this.handler = null
    }
    resize() {
        const { dir, index, offset } = this.handler
        const type = dir === 'vertical' ? 'col' : 'row'
        this.swimlane.resize({
            type,
            index,
            offset
        })
    }
    dispose() {
        this.stopListening()
        this.container.remove()
    }
}