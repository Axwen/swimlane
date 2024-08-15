/**
 * 生成 + 路径，适应给定矩形的宽高和描边宽度
 * @param {number} width - 矩形的宽度
 * @param {number} height - 矩形的高度
 * @param {number} strokeWidth - 描边宽度
 * @param {number} margin - 边距
 * @returns {string} - 十字形路径的 d 属性值
 */


export function getCrossPath({ width, height, strokeWidth, margin = 3 }) {

    const horizontalLine = getLinePath({ width, height, strokeWidth, margin })
    const verticalLine = getLinePath({ width, height, strokeWidth, margin }, false)
    
    return `${horizontalLine} ${verticalLine}`;
}

/**
 * 生成 - 路径，适应给定矩形的宽高和描边宽度
 * @param {number} width - 矩形的宽度
 * @param {number} height - 矩形的高度
 * @param {number} strokeWidth - 描边宽度
 * @param {number} margin - 边距
 * @returns {string} - 路径的 d 属性值
 */
export function getLinePath({ width, height, strokeWidth, margin = 3 }, isHorizontal = true) {
    const size = Math.min(width, height) - 2 * margin - strokeWidth;
    const offsetX = (width - size) / 2;
    const offsetY = (height - size) / 2;

    if (isHorizontal) {
        const horizontalStartX = offsetX;
        const horizontalStartY = offsetY + size / 2;
        const horizontalEndX = offsetX + size;

        return `M ${horizontalStartX} ${horizontalStartY} L ${horizontalEndX} ${horizontalStartY}`;
    } else {

        const verticalStartX = offsetX + size / 2;
        const verticalStartY = offsetY;
        const verticalEndY = offsetY + size;

        return `M ${verticalStartX} ${verticalStartY} L ${verticalStartX} ${verticalEndY}`;
    }

}


