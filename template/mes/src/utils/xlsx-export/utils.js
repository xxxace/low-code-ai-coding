const getFlatColumns = (columns) => {
    const result = [];

    columns.forEach(col => {
        if (col.children) {
            result.push(col);
            result.push.apply(result, getFlatColumns(col.children));
        } else {
            result.push(col);
        }
    });

    return result;
};

export const convertToRows = (originColumns) => {
    let maxLevel = 1;

    const traverse = (column, parent, columnIndex) => {
        if (parent) {
            column.level = parent.level + 1;
            if (maxLevel < column.level) {
                maxLevel = column.level;
            }
            column.columnIndex = parent.columnIndex + columnIndex
        }

        if (column.children) {
            let colSpan = 0;

            column.children.forEach((subColumn, subColumnIndex) => {
                traverse(subColumn, column, subColumnIndex);
                colSpan += subColumn.colSpan;
            })

            column.colSpan = colSpan;
        } else {
            column.colSpan = 1;
        }
    }

    const getColSpan = (column) => {
        let colSpan = 0
        if (column.children) {
            column.children.forEach((subColumn) => {
                colSpan += getColSpan(subColumn);
            })
        } else {
            colSpan = 1;
        }

        return colSpan
    }

    const setColumnEndIndex = (column) => {
        const index = column.columnIndex
        const colSpan = getColSpan(column)
        const lastItem = originColumns[index - 1]
        const endIndex = lastItem && lastItem.columnEndIndex ? lastItem.columnEndIndex + 1 : index
        column.columnIndex = endIndex;
        if (colSpan > 1) {
            column.columnEndIndex = (colSpan + endIndex) - 1
        } else {
            column.columnEndIndex = endIndex
        }
    }
    originColumns.forEach((column, index) => {
        column.level = 1;
        column.columnIndex = index;
        setColumnEndIndex(column);
        traverse(column);
    });

    const rows = [];
    for (let i = 0; i < maxLevel; i++) {
        rows.push([]);
    }

    const allColumns = getFlatColumns(originColumns);
    allColumns.forEach(column => {
        if (column.children) {
            column.rowSpan = 1;
        } else {
            column.rowSpan = maxLevel - column.level + 1;
        }
        rows[column.level - 1].push(column);
    });

    return rows
}

export function convertToExcelRows(rows) {
    const excelRows = []
    const mergeRows = []

    for (let i = 0; i < rows.length; i++) {
        excelRows.push([])
    }

    rows.forEach((row, rowIndex) => {
        const newRow = excelRows[rowIndex]

        row.forEach((col) => {
            if (col.rowSpan > 1) mergeRows.push(col)

            newRow.push(col.title)

            const mergerRowLength = col.colSpan - 1
            if (mergerRowLength > 0) {
                const mergerRows = new Array(mergerRowLength).fill("")
                newRow.push(...mergerRows)
            }
        })
    })

    mergeRows.sort((a, b) => a.columnIndex - b.columnIndex).forEach(col => {
        for (let i = 1; i < col.rowSpan; i++) {
            const level = (col.level + i - 1)
            let emptyCells = [""]
            if (col.colSpan > 1) {
                emptyCells = new Array(col.colSpan - 1).fill("")
            }
            excelRows[level].splice(col.columnIndex, 0, ...emptyCells)
        }
    })
    return excelRows
}

export function addRows(sheet, rows) {
    const sheetRows = []
    rows.forEach((row) => {
        sheetRows.push(sheet.addRow(row))
    })
    return sheetRows
}

export function mergeCells(sheet, rows, currentRowLength = 0) {
    rows.forEach((row) => {
        row.forEach(col => {
            const level = (col.level + currentRowLength)
            if (col.colSpan > 1) {
                sheet.mergeCells(level, col.columnIndex + 1, level, col.columnIndex + col.colSpan)
            }

            if (col.rowSpan > 1) {
                sheet.mergeCells(level, col.columnIndex + 1, (level + col.rowSpan) - 1, col.columnIndex + 1)
            }
        })
    })
}

export function styleColumns(excelRows, rows, defaultColumnStyle) {
    rows.forEach((row) => {
        row.forEach(col => {
            for (let l = 0; l < col.rowSpan; l++) {
                for (let i = 0; i < col.colSpan; i++) {
                    const cell = excelRows[l + col.level - 1]._cells[col.columnIndex + i]
                    if (!cell) return
                    const style = Object.assign({}, defaultColumnStyle || {}, col.style || {})
                    cell.font = style.font;
                    cell.alignment = style.alignment;
                    cell.border = style.border;
                    cell.fill = style.fill;
                }
            }
        })
    })
}

export function getDataColumns(dataIndex, columns) {
    const dataColumns = []

    columns.forEach(col => {
        if (Object.prototype.hasOwnProperty.call(col, dataIndex) && col[dataIndex]) {
            dataColumns.push(col)
        }

        if (col.children && col.children.length) {
            dataColumns.push(...getDataColumns(dataIndex, col.children))
        }
    })

    return dataColumns
}

export function deepClone(value, hash = new WeakMap()) {
    // Handle null and undefined
    if (value === null || value === undefined) {
        return value;
    }

    // Handle primitive types (string, number, boolean, symbol, bigint)
    if (typeof value !== 'object') {
        return value;
    }

    // Handle circular references
    if (hash.has(value)) {
        return hash.get(value);
    }

    // Create a new instance based on the type of value
    let clone;
    if (Array.isArray(value)) {
        clone = [];
    } else if (value instanceof Date) {
        return new Date(value);
    } else if (value instanceof RegExp) {
        return new RegExp(value);
    } else {
        clone = Object.create(Object.getPrototypeOf(value));
    }

    // Store the reference in hash map to handle circular references
    hash.set(value, clone);

    // Recursively clone the properties
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            clone[key] = deepClone(value[key], hash);
        }
    }

    return clone;
}