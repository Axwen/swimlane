import { strokeColor, highlightColor, swimlaneBaseConfig, handlerPadding, handerSize } from './variables'

const { rowTitleHeight, columnTitleWidth } = swimlaneBaseConfig
export const content = `
    .x6-swimlane-transform-wrapper {
        position: absolute;
        box-sizing: border-box !important;
        margin: -1px 0 0 -1px;
        padding-top:${rowTitleHeight}px;
        padding-left:${columnTitleWidth}px;
        z-index:999;
    }
    .x6-swimlane-transform-container {
        box-sizing: border-box !important;
        position: relative;
        width:100%;
        height:100%;
    }
    .x6-swimlane-transform-handler{
        box-sizing: border-box !important;
        position: absolute;
        top:0;
        left:0;
        width:${handerSize}px;
        height:100%;
        padding:${handlerPadding}px 0;
        cursor:col-resize;
    }
    .x6-swimlane-transform-handler::after{
        content:'';
        display:block;
        width:100%;
        height:100%;
        background-color: ${strokeColor};
    }
    .x6-swimlane-transform-handler__horizontal{
       box-sizing: border-box !important;
        position: absolute;
        left:0;
        width:100%;
        height:${handerSize}px;
        padding:0 ${handlerPadding}px;
        cursor:row-resize;
    }
    .x6-swimlane-transform-handler__horizontal::after{
        content:'';
        display:block;
        width:100%;
        height:100%;
        background-color: ${strokeColor};
    }
    .x6-swimlane-transform-handler:hover::after,.x6-swimlane-transform-handler.active::after{
        background-color: ${highlightColor};
    }
`