import { convertToRows, convertToExcelRows, addRows, mergeCells, styleColumns, getDataColumns, deepClone } from './utils'
import { Workbook } from 'exceljs'

function saveAsExcelFile(buffer, fileName) {
  const blob = new Blob([buffer], { type: 'application/octet-stream' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  window.URL.revokeObjectURL(url)
}

export async function exportXlsx(params) {
  // 导出文件名称
  const fileName = (params.fileName || 'export') + '.xlsx'
  // 导出列
  const columns = params.columns ? deepClone(params.columns) : []
  // 行高
  const rowHeight = params.rowHeight || 16.5
  // 数据源
  const dataSource = params.dataSource || []
  // 字段索引
  const dataIndex = params.dataIndex || 'dataIndex'
  // worksheet配置
  const worksheetOptions = params.worksheetOptions || {}
  // 默认列样式
  const defaultColumnStyle = Object.assign(
    {
      font: { name: '宋体', size: 10 },
      alignment: { vertical: 'middle', wrapText: true, horizontal: 'center' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      },
      fill: null
    },
    params.defaultColumnStyle || {}
  )
  // 每一标题列的值处理
  const eachColumnValue = params.eachColumnValue || ((col) => col)
  // 每一单元格的处理
  const eachCell = params.eachCell || (() => void 0)
  const eachRow = params.eachRow || (() => void 0)
  // 每一单元格的值处理
  const eachCellValue = params.eachCellValue || void 0
  const beforeAddColumns = params.beforeAddColumns || (() => void 0)
  const beforeDownload = params.beforeDownload || (() => void 0)
  const workbook = new Workbook()
  const worksheet = workbook.addWorksheet('Sheet1', worksheetOptions)
  const rows = convertToRows(columns)
  const excelRows = convertToExcelRows(rows).map((row) =>
    row.map((col) => {
      if (col) {
        return eachColumnValue(col)
      } else {
        return col
      }
    })
  )
  const dataColumns = getDataColumns(dataIndex, columns)

  beforeAddColumns({ worksheet, dataColumns })

  const currentRowLength = worksheet._rows.length
  const worksheetRows = addRows(worksheet, excelRows)

  mergeCells(worksheet, rows, currentRowLength)
  // 给列设置样式
  styleColumns(worksheetRows, rows, defaultColumnStyle)

  dataColumns.forEach((col, i) => {
    if (col.width) worksheet.getColumn(i + 1).width = Number(col.width) / 8
  })

  const defaultRowDataGenerator = (rowData) => {
    const rdata = dataColumns.map((col, i) => {
      const key = col[dataIndex]
      if (typeof rowData[key] !== 'number' && typeof col.formatter === 'function') {
        return col.formatter({
          cellValue: rowData[key],
          rowIndex: i,
          row: rowData,
          column: col
        }) || ''
      }

      return rowData[key] || ''
    })

    return rdata
  }

  const customRowDataGenerator = (rowData) => {
    const rdata = dataColumns.map((col, index) => {
      return eachCellValue({ index, key: col[dataIndex], value: rowData[col[dataIndex]], col, row: rowData }) || ''
    })

    return rdata
  }

  const rowDataGenerator = typeof eachCellValue === 'function' ? customRowDataGenerator : defaultRowDataGenerator

  const cellStyle = {
    font: { name: '宋体', size: 10 },
    alignment: { vertical: 'middle', wrapText: true, horizontal: 'center' },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    }
  }

  dataSource.forEach((rowData, rowIndex) => {
    const row = worksheet.addRow(rowDataGenerator(rowData))
    row.eachCell((cell, cellIndex) => {
      const style = Object.assign({}, cellStyle, dataColumns[cellIndex - 1].cellStyle || {})

      for (const key in style) {
        cell[key] = style[key]
      }

      eachCell({ cell, cellIndex, rowData, rowIndex, column: dataColumns[cellIndex - 1] })
    })
    if (rowHeight !== 'auto') row.height = rowHeight // 设置行高为固定值

    eachRow({ row, rowIndex, rowData, columns: dataColumns })
  })

  beforeDownload({ worksheet, dataColumns })

  // 保存Excel文件
  const buffer = await workbook.xlsx.writeBuffer()
  saveAsExcelFile(buffer, fileName)
}
