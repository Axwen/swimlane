import { Graph } from '@antv/x6'

import { fillColor, strokeWidth } from '../variables'

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