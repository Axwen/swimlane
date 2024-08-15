import { Graph, ObjectExt } from '@antv/x6/lib'

import { fillColor, strokeColor, labelColor, strokeWidth } from './variables'

const contentShape = {
    inherit: 'rect',
    attrs: {
        body: {
            strokeWidth: strokeWidth,
            fill: fillColor,
        },
    }
}


function registrySwimlaneContent() {
    Graph.registerNode('swimlane-content', contentShape, true)
}

export {
    registrySwimlaneContent
}