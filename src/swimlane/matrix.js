
export default class Matrix {
    constructor(options) {
        const { data, sizes } = options
        if (Array.isArray(data) && data.length > 0) {
            this.initByData(data)
        }else{
            this.initBySizes(sizes)
        } 
    }

    initBySizes([rows, cols] = []) {
        if (rows < 2) {
            throw new Error('rows length should be greater than 2');
        }
        if (cols < 2) {
            throw new Error('cols length should be greater than 2');
        }
        this.rows = rows;
        this.cols = cols;
        this.data = Array.from({ length: rows }, () => Array(cols).fill(null));
    }
    initByData(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return
        }
        let maxRow = 0;
        let maxCol = 0;
        data.forEach(item => {
            const { index: [rowIndex, colIndex] } = item;
            if (rowIndex > maxRow) maxRow = rowIndex;
            if (colIndex > maxCol) maxCol = colIndex;
        });

        this.rows = maxRow + 1
        this.cols = maxCol + 1

        const matrix = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));

        data.forEach(item => {
            const [rowIndex, colIndex] = item.index;
            matrix[rowIndex][colIndex] = item;
        });
        this.data = matrix
        console.log(this)
    }
    traverse(callback) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                callback(this.data[i][j], i, j);
            }
        }
    }
    flat() {
        return this.data.flat()
    }
    sliceRow(start, end, flatten = false) {
        if (start < 0 || end > this.rows) {
            throw new Error('Invalid row index');
        }
        end = end || this.rows;
        const data = this.data.slice(start, end)
        return flatten ? data.flat() : data;
    }
    sliceCol(start, end, flatten = false) {
        if (start < 0 || end > this.cols) {
            throw new Error('Invalid row index');
        }
        end = end || this.cols;
        const result = [];
        const flattenResult = []
        for (let i = 0; i < this.rows; i++) {
            let row = []
            for (let j = start; j < end; j++) {
                const col = this.data[i][j]
                row.push(col)
                flattenResult.push(col);
            }
            result.push(row)
        }
        return flatten ? flattenResult : result
    }

    // 获取矩阵中的值
    getValue(row, col) {
        if (this.isValidIndex(row, col)) {
            return this.data[row][col];
        } else {
            throw new Error('Invalid index');
        }
    }

    // 设置矩阵中的值
    setValue(row, col, value) {
        if (this.isValidIndex(row, col)) {
            this.data[row][col] = value;
        } else {
            throw new Error('Invalid index');
        }
    }

    // 添加行
    addRow(index, values = []) {
        if (index > this.rows || 0 > index) {
            throw new Error('Invalid row index');
        }
        if (values.length !== this.cols) {
            throw new Error('Row length does not match the number of columns');
        }
        this.data.splice(index + 1, 0, values);
        this.rows++;
        this.updateRowIndexFrom(index)
    }

    // 删除行
    removeRow(index) {
        let removedItems = []
        if (index >= 0 && index < this.rows) {
            removedItems = this.data[index].flat()
            this.data.splice(index, 1);
            this.rows--;
        } else {
            throw new Error('Invalid row index');
        }
        this.updateRowIndexFrom(index - 1)
        return removedItems
    }


    // 添加列
    addColumn(index, values = []) {
        if (index < 0 || index > this.cols) {
            throw new Error('Invalid column index');
        }

        if (values.length !== this.rows) {
            throw new Error('Column length does not match the number of rows');
        }
        for (let i = 0; i < this.rows; i++) {
            this.data[i].splice(index + 1, 0, values[i]);
        }
        this.cols++;
        this.updateColumnIndexFrom(index)
    }

    // 删除列
    removeColumn(index) {
        const removedItems = []
        if (index >= 0 && index < this.cols) {
            for (let i = 0; i < this.rows; i++) {
                removedItems.push(this.data[i][index])
                this.data[i].splice(index, 1);
            }
            this.cols--;
        } else {
            throw new Error('Invalid column index');
        }
        this.updateColumnIndexFrom(index - 1)
        return removedItems
    }

    // 检查索引是否有效
    isValidIndex(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    updateRowIndexFrom(startRow) {
        if (startRow < 0 || startRow >= this.rows) {
            throw new Error('Invalid start row index');
        }
        const baseRowItem = this.data[startRow]
        let { y, height } = baseRowItem[0]
        let startY = y + height
        for (let i = startRow + 1; i < this.rows; i++) {
            const row = this.data[i];
            for (let j = 0; j < this.cols; j++) {
                row[j]['index'] = [i, j]
                row[j]['y'] = startY
            }
            const { height } = row[0]
            startY += height
        }
    }
    updateColumnIndexFrom(startCol) {
        if (startCol < 0 || startCol >= this.cols) {
            throw new Error('Invalid start column index');
        }
        for (let i = 0; i < this.rows; i++) {
            const row = this.data[i][startCol]
            const { x, width } = row
            let startX = x + width;
            for (let j = startCol + 1; j < this.cols; j++) {
                const col = this.data[i][j];
                this.data[i][j]['index'] = [i, j];
                this.data[i][j]['x'] = startX;
                const { width } = col
                startX += width
            }
        }
    }
    // 批量更新某一行之后的所有行
    updateRowFrom(startRow, values) {
        if (startRow < 0 || startRow >= this.rows) {
            throw new Error('Invalid start row index');
        }
        if (values.length !== this.cols) {
            throw new Error('Values length does not match the number of columns');
        }
        for (let i = startRow; i < this.rows; i++) {
            this.data[i] = [...values];
        }
    }

    // 批量更新某一列之后的所有列
    updateColumnFrom(startCol, values) {
        if (startCol < 0 || startCol >= this.cols) {
            throw new Error('Invalid start column index');
        }
        if (values.length !== this.rows) {
            throw new Error('Values length does not match the number of rows');
        }
        for (let i = 0; i < this.rows; i++) {
            for (let j = startCol; j < this.cols; j++) {
                this.data[i][j] = values[i];
            }
        }
    }
}
