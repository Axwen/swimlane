import { View, Dom } from '@antv/x6/lib'

import { swimlaneBaseConfig, handlerPadding } from './variables'
const { position: [x, y], rowTitleHeight, sizes } = swimlaneBaseConfig

export class TransfromImpl extends View {
    constructor(options) {
        super()
        const { graph, swimlane, origin, matrix, ...others } = options
        this.graph = graph
        this.swimlane = swimlane
        this.matrix = matrix
        this.origin = origin
        this.options = { ...others }
        this.render()
        this.startListening()
    }
    render() {
        const wrapper = (this.wrapper = Dom.createElement('div'))
        const container = (this.container = Dom.createElement('div'))
        Dom.addClass(wrapper, 'x6-swimlane-transform-wrapper')
        Dom.addClass(container, 'x6-swimlane-transform-container')
        this.renderHandlers()

        Dom.append(wrapper, container)
        Dom.append(this.graph.container, wrapper)
        this.updateTransfrom()
    }
    show() { }
    hide() { }
    renderHandlers() {
        const { matrix: { data, rows, cols } } = this
        const handers = []
        let top = 0
        for (let i = 0; i < rows; i++) {
            const row = data[i]
            const { height } = row[0]
            const handler = Dom.createElement('div')
            Dom.addClass(handler, 'x6-swimlane-transform-handler x6-swimlane-transform-handler__horizontal')
            top = i == 0 ? 0 : top + height
            Dom.css(handler, {
                top
            })
            handers.push(handler)
        }
        const firstCols = data[0]
        let left = 0
        for (let j = 0; j < cols; j++) {
            const col = firstCols[j]
            const {  width } = col
            const handler = Dom.createElement('div')
            Dom.addClass(handler, 'x6-swimlane-transform-handler')
            left = j == 0 ? 0 : left + width
            Dom.css(handler, {
                left
            })
            handers.push(handler)
        }
        Dom.append(this.container, handers)
    }
    updateTransfrom() {
        const { graph, matrix: { data, rows, cols } } = this
        const first = data[0][0]
        const last = data[rows - 1][cols - 1]
        const { x, y } = first
        const { x: lastX, y: lastY, width: lastWidth, height: lastHeight } = last
        const width = lastX + lastWidth - x;
        const height = lastY + lastHeight - y;
        const styles = graph.localToPage({
            x,
            y,
            width,
            height
        })
        console.log(styles)
        Dom.css(this.wrapper, {
            width: styles.width,
            height: styles.height,
            left: styles.x,
            top: styles.y,
        })
    }
    startListening() {

    }
    stopListening() {

    }
    dispose() {

    }
}