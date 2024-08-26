export const fillColor = '#fff'
export const strokeColor = '#333'
export const strokeWidth = 1.5
export const labelColor = '#333'

export const swimLanePadding = 20


export const handerSize = 2
export const highlightHandlerSize = handerSize * 2

export const highlightColor = '#73d13d'

export const swimLaneBaseConfig = {
    position: [100, 100],
    sizes: [3, 3],
    laneWidth: 300,
    laneHeight: 300,
    rowTitleHeight: 40,
    columnTitleWidth: 100,
}

export const swimLaneEmbeddingHighlightConfig = {
    name: 'stroke',
    args: {
        padding: -5,
        attrs: {
            stroke: highlightColor,
        },
    },
}

