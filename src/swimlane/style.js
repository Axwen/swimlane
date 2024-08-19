import {  highlightColor, handerSize } from './variables'

export const content = `
    .x6-swimlane-transform {
        position: absolute;
        box-sizing: content-box !important;
        margin: -1px;
        padding-right:600px;
        padding-bottom:600px;
        transform-origin: top left;
        user-select: none;
        pointer-events: none;
    }
    .x6-swimlane-transform-cursor-vertical{
        user-select: auto;
        pointer-events: auto;
        cursor:col-resize;
    }
    .x6-swimlane-transform-cursor-horizontal{
        user-select: auto;
        pointer-events: auto;
         cursor:row-resize;
    }
    .x6-swimlane-transform-content{
        position: relative;
        width:100%;
        height:100%;
    }
    .x6-swimlane-transform-handler{
        box-sizing: border-box !important;
        position: absolute;
        background-color: transparent;
        transform-origin: center;
        pointer-events: auto;
        user-drag: none;
        -webkit-user-drag: none;
    }

    .x6-swimlane-transform-handler[data-dir="horizontal"]{
        left:0;
        width:100%;
        height:${handerSize}px;
        transform:scale(0.98,1);
        cursor:row-resize;
    }
    .x6-swimlane-transform-handler[data-dir="vertical"]{
        top:0;
        width:${handerSize}px;
        height:100%;
        transform:scale(1,0.98);
        cursor:col-resize;
    }
    .x6-swimlane-transform-handler:hover,
    .x6-swimlane-transform-handler--active{
        background-color: ${highlightColor}; 
    }
    .x6-swimlane-transform-handler[data-dir="vertical"]:hover,
    .x6-swimlane-transform-handler--active[data-dir="vertical"]{
       transform:scale(1.6,0.98);
    }
    .x6-swimlane-transform-handler[data-dir="horizontal"]:hover,
    .x6-swimlane-transform-handler--active[data-dir="horizontal"]{
        transform:scale(0.98,1.6);
    }
`