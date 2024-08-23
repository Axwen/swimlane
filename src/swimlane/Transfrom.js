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
    getMovableRange(dir, index) {
        const { graph, matrix, swimlane } = this
        const { x: originX, y: originY } = swimlane.getBBox()
        let swimLaneItems = []
        const currentChildren = []
        const swimLaneNodes = []
        index = Number(index)
        const nextIndex = index + 1
        if (dir === 'vertical') {
            swimLaneItems = matrix.sliceCol(index, nextIndex, true)
        } else {
            swimLaneItems = matrix.sliceRow(index, index + 1, true)
        }
        swimLaneItems.forEach(item => {
            const { id } = item
            const node = this.graph.getCellById(id)
            const children = node.getChildren() || []
            swimLaneNodes.push(node)
            currentChildren.push(...children)
        })

        const { top, bottom, left, right } = graph.getCellsBBox(swimLaneNodes)

        let min = 0
        let max = 0
        if (dir === 'vertical') {
            min = left - originX + minColSize
            max = right - originX + laneWidth
        } else {
            min = top - originY + minRowSize
            max = bottom - originY + laneHeight
        }
        if (currentChildren.length > 0) {
            const { right, bottom } = graph.getCellsBBox(currentChildren)
            min = (dir === 'vertical' ? right - originX : bottom - originY) + swimLanePadding
        }
        return {
            min,
            max
        }
    }
    startHandler(handler) {
        const dir = Dom.attr(handler, 'data-dir')
        const index = Dom.attr(handler, 'data-index')
        const { min, max } = this.getMovableRange(dir, index)
        const start = parseInt(Dom.getComputedStyle(handler, dir === 'vertical' ? 'left' : 'top'))
        const bbox = this.swimlane.getBBox()
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