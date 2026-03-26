/**
 * Đã ngừng sử dụng
 * @deprecated
 */
export default {
  vxe: {
    base: {
      pleaseInput: 'Vui lòng nhập',
      pleaseSelect: 'Vui lòng chọn',
      comma: '，',
      fullStop: '。'
    },
    loading: {
      text: 'Đang tải...'
    },
    error: {
      groupFixed: 'Nếu sử dụng tiêu đề nhóm, cột cố định phải được thiết lập theo nhóm',
      groupMouseRange:
        'Tiêu đề nhóm và "{0}" không thể sử dụng cùng lúc, điều này có thể gây ra lỗi',
      groupTag: 'Tiêu đề nhóm nên sử dụng "{0}" thay vì "{1}", điều này có thể gây ra lỗi',
      scrollErrProp: 'Không hỗ trợ tham số "{0}" khi bật cuộn ảo',
      errConflicts: 'Tham số "{0}" xung đột với "{1}"',
      unableInsert: 'Không thể chèn vào vị trí chỉ định, vui lòng kiểm tra tham số',
      useErr:
        'Lỗi khi cài đặt mô-đun "{0}", có thể thứ tự không đúng, các mô-đun phụ thuộc cần được cài đặt trước Table',
      barUnableLink: 'Thanh công cụ không thể liên kết với bảng',
      expandContent: 'Khe mở rộng nên là "content", vui lòng kiểm tra lại',
      reqComp: 'Thiếu thành phần "{0}", vui lòng kiểm tra xem đã cài đặt đúng chưa',
      reqModule: 'Thiếu mô-đun "{0}"',
      reqProp: 'Thiếu tham số cần thiết "{0}", điều này có thể gây ra lỗi',
      emptyProp: 'Tham số "{0}" không được để trống',
      errProp: 'Tham số không được hỗ trợ "{0}", có thể là "{1}"',
      colRepet:
        'column.{0}="{1}" bị trùng lặp, điều này có thể gây ra một số chức năng không hoạt động',
      notFunc: 'Phương thức "{0}" không tồn tại',
      errFunc: 'Tham số "{0}" không phải là một phương thức',
      notValidators: 'Trình xác thực toàn cầu "{0}" không tồn tại',
      notFormats: 'Định dạng toàn cầu "{0}" không tồn tại',
      notCommands: 'Lệnh toàn cầu "{0}" không tồn tại',
      notSlot: 'Khe "{0}" không tồn tại',
      noTree: 'Cấu trúc cây không hỗ trợ "{0}"',
      notProp: 'Tham số không được hỗ trợ "{0}"',
      checkProp:
        'Khi lượng dữ liệu quá lớn có thể gây ra độ trễ cho hộp kiểm, đề nghị thiết lập tham số "{0}" để tăng tốc độ hiển thị',
      coverProp: 'Tham số "{1}" của "{0}" được định nghĩa lại, điều này có thể gây ra lỗi',
      delFunc: 'Phương thức "{0}" đã ngừng sử dụng, vui lòng sử dụng "{1}"',
      delProp: 'Tham số "{0}" đã ngừng sử dụng, vui lòng sử dụng "{1}"',
      delEvent: 'Sự kiện "{0}" đã ngừng sử dụng, vui lòng sử dụng "{1}"',
      removeProp:
        'Tham số "{0}" đã ngừng sử dụng, không khuyến khích sử dụng, điều này có thể gây ra lỗi',
      errFormat:
        'Nội dung định dạng toàn cầu nên được định nghĩa bằng "VXETable.formats", cách gắn "formatter={0}" không còn được khuyến khích sử dụng',
      notType: 'Loại tệp không được hỗ trợ "{0}"',
      notExp: 'Trình duyệt này không hỗ trợ chức năng nhập/xuất',
      impFields: 'Nhập thất bại, vui lòng kiểm tra tên trường và định dạng dữ liệu',
      treeNotImp: 'Bảng cây không hỗ trợ nhập'
    },
    table: {
      emptyText: 'Không có dữ liệu',
      allTitle: 'Chọn tất cả/Bỏ chọn tất cả',
      seqTitle: 'seq',
      confirmFilter: 'Lọc',
      resetFilter: 'Đặt lại',
      allFilter: 'Tất cả',
      sortAsc: 'Tăng dần: từ thấp đến cao',
      sortDesc: 'Giảm dần: từ cao đến thấp',
      filter: 'Bật lọc cho cột đã chọn',
      impSuccess: 'Nhập thành công {0} bản ghi',
      expLoading: 'Đang xuất',
      expSuccess: 'Xuất thành công',
      expFilename: 'Xuất_{0}',
      expOriginFilename: 'Xuất_gốc_{0}',
      customTitle: 'Cài đặt cột',
      customAll: 'Tất cả',
      customConfirm: 'Xác nhận',
      customCancel: 'Hủy',
      customRestore: 'Khôi phục mặc định',
      maxFixedCol: 'Số lượng cột cố định tối đa không được vượt quá {0}'
    },
    grid: {
      selectOneRecord: 'Vui lòng chọn ít nhất một bản ghi!',
      deleteSelectRecord: 'Bạn có chắc chắn muốn xóa các bản ghi đã chọn không?',
      removeSelectRecord: 'Bạn có chắc chắn muốn loại bỏ các bản ghi đã chọn không?',
      dataUnchanged: 'Dữ liệu không thay đổi!',
      delSuccess: 'Xóa thành công các bản ghi đã chọn!',
      saveSuccess: 'Lưu thành công!',
      operError: 'Đã xảy ra lỗi, thao tác thất bại!'
    },
    select: {
      search: 'Tìm kiếm',
      loadingText: 'Đang tải',
      emptyText: 'Không có dữ liệu'
    },
    pager: {
      goto: 'Đi đến',
      pagesize: '{0} bản ghi/trang',
      total: 'Tổng cộng {0} bản ghi',
      pageClassifier: 'trang',
      homePage: 'Trang đầu',
      homePageTitle: 'Trang đầu',
      prevPage: 'Trang trước',
      prevPageTitle: 'Trang trước',
      nextPage: 'Trang sau',
      nextPageTitle: 'Trang sau',
      prevJump: 'Nhảy lên trang',
      prevJumpTitle: 'Nhảy lên trang',
      nextJump: 'Nhảy xuống trang',
      nextJumpTitle: 'Nhảy xuống trang',
      endPage: 'Trang cuối',
      endPageTitle: 'Trang cuối'
    },
    alert: {
      title: 'Thông báo hệ thống'
    },
    button: {
      confirm: 'Xác nhận',
      cancel: 'Hủy'
    },
    filter: {
      search: 'Tìm kiếm'
    },
    custom: {
      cstmTitle: 'Cài đặt cột',
      cstmRestore: 'Khôi phục mặc định',
      cstmCancel: 'Hủy',
      cstmConfirm: 'Xác nhận',
      cstmConfirmRestore: 'Vui lòng xác nhận có khôi phục cấu hình cột mặc định không?',
      cstmDragTarget: 'Di chuyển mục tiêu: {0}',
      setting: {
        colSort: 'Sắp xếp',
        sortHelpTip: 'Nhấp và kéo biểu tượng để điều chỉnh thứ tự cột',
        colTitle: 'Tiêu đề',
        colResizable: 'Chiều rộng cột (pixel)',
        colVisible: 'Hiển thị',
        colFixed: 'Cột cố định',
        colFixedMax: 'Cột cố định (tối đa {0} cột)',
        fixedLeft: 'Bên trái',
        fixedUnset: 'Không thiết lập',
        fixedRight: 'Bên phải'
      }
    },
    import: {
      modes: {
        covering: 'Chế độ ghi đè (ghi đè trực tiếp dữ liệu bảng)',
        insert: 'Thêm vào cuối (thêm dữ liệu mới vào cuối bảng)',
        insertTop: 'Thêm vào đầu (thêm dữ liệu mới vào đầu bảng)',
        insertBottom: 'Thêm vào cuối (thêm dữ liệu mới vào cuối bảng)'
      },
      impTitle: 'Nhập dữ liệu',
      impFile: 'Tên tệp',
      impSelect: 'Chọn tệp',
      impType: 'Loại tệp',
      impOpts: 'Cài đặt tham số',
      impMode: 'Chế độ nhập',
      impConfirm: 'Nhập',
      impCancel: 'Hủy'
    },
    export: {
      types: {
        csv: 'CSV (phân cách bằng dấu phẩy)(*.csv)',
        html: 'Trang web(*.html)',
        xml: 'Dữ liệu XML(*.xml)',
        txt: 'Tệp văn bản (phân cách bằng tab)(*.txt)',
        xls: 'Excel 97-2003 Workbook(*.xls)',
        xlsx: 'Excel Workbook(*.xlsx)',
        pdf: 'PDF (*.pdf)'
      },
      modes: {
        current: 'Dữ liệu hiện tại (dữ liệu của trang hiện tại)',
        selected: 'Dữ liệu đã chọn (dữ liệu đã chọn của trang hiện tại)',
        all: 'Dữ liệu toàn bộ (bao gồm dữ liệu của tất cả các trang)'
      },
      printTitle: 'In dữ liệu',
      expTitle: 'Xuất dữ liệu',
      expName: 'Tên tệp',
      expNamePlaceholder: 'Vui lòng nhập tên tệp',
      expSheetName: 'Tiêu đề',
      expSheetNamePlaceholder: 'Vui lòng nhập tiêu đề',
      expType: 'Loại lưu',
      expMode: 'Chọn dữ liệu',
      expCurrentColumn: 'Tất cả các trường',
      expColumn: 'Chọn trường',
      expOpts: 'Cài đặt tham số',
      expOptHeader: 'Tiêu đề',
      expHeaderTitle: 'Có cần tiêu đề không',
      expOptFooter: 'Chân trang',
      expFooterTitle: 'Có cần chân trang không',
      expOptColgroup: 'Tiêu đề nhóm',
      expColgroupTitle: 'Nếu có, hỗ trợ tiêu đề có cấu trúc nhóm',
      expOptMerge: 'Hợp nhất',
      expMergeTitle: 'Nếu có, hỗ trợ các ô có cấu trúc hợp nhất',
      expOptAllExpand: 'Mở rộng cấp độ',
      expAllExpandTitle: 'Nếu có, hỗ trợ mở rộng tất cả dữ liệu có cấu trúc cấp độ',
      expOptUseStyle: 'Phong cách',
      expUseStyleTitle: 'Nếu có, hỗ trợ các ô có phong cách',
      expOptOriginal: 'Dữ liệu gốc',
      expOriginalTitle: 'Nếu là dữ liệu gốc, hỗ trợ nhập vào bảng',
      expPrint: 'In',
      expConfirm: 'Xuất',
      expCancel: 'Hủy'
    },
    modal: {
      errTitle: 'Thông báo lỗi',
      zoomMin: 'Thu nhỏ',
      zoomIn: 'Phóng to',
      zoomOut: 'Khôi phục',
      close: 'Đóng',
      miniMaxSize: 'Số lượng cửa sổ thu nhỏ không được vượt quá {0}'
    },
    drawer: {
      close: 'Đóng'
    },
    form: {
      folding: 'Thu gọn',
      unfolding: 'Mở rộng'
    },
    toolbar: {
      import: 'Nhập',
      export: 'Xuất',
      print: 'In',
      refresh: 'Làm mới',
      zoomIn: 'Toàn màn hình',
      zoomOut: 'Khôi phục',
      custom: 'Cài đặt cột',
      customAll: 'Tất cả',
      customConfirm: 'Xác nhận',
      customRestore: 'Đặt lại',
      fixedLeft: 'Cố định bên trái',
      fixedRight: 'Cố định bên phải',
      cancelFixed: 'Hủy cố định cột'
    },
    input: {
      date: {
        m1: 'Tháng 01',
        m2: 'Tháng 02',
        m3: 'Tháng 03',
        m4: 'Tháng 04',
        m5: 'Tháng 05',
        m6: 'Tháng 06',
        m7: 'Tháng 07',
        m8: 'Tháng 08',
        m9: 'Tháng 09',
        m10: 'Tháng 10',
        m11: 'Tháng 11',
        m12: 'Tháng 12',
        quarterLabel: '{0} Năm',
        monthLabel: '{0} Năm',
        dayLabel: '{0} Năm {1}',
        labelFormat: {
          date: 'yyyy-MM-dd',
          time: 'HH:mm:ss',
          datetime: 'yyyy-MM-dd HH:mm:ss',
          week: 'Năm yyyy Tuần WW',
          month: 'yyyy-MM',
          quarter: 'Năm yyyy Quý q',
          year: 'yyyy'
        },
        weeks: {
          w: 'Tuần',
          w0: 'Chủ nhật',
          w1: 'Thứ hai',
          w2: 'Thứ ba',
          w3: 'Thứ tư',
          w4: 'Thứ năm',
          w5: 'Thứ sáu',
          w6: 'Thứ bảy'
        },
        months: {
          m0: 'Tháng một',
          m1: 'Tháng hai',
          m2: 'Tháng ba',
          m3: 'Tháng tư',
          m4: 'Tháng năm',
          m5: 'Tháng sáu',
          m6: 'Tháng bảy',
          m7: 'Tháng tám',
          m8: 'Tháng chín',
          m9: 'Tháng mười',
          m10: 'Tháng mười một',
          m11: 'Tháng mười hai'
        },
        quarters: {
          q1: 'Quý một',
          q2: 'Quý hai',
          q3: 'Quý ba',
          q4: 'Quý bốn'
        }
      }
    },
    imagePreview: {
      popupTitle: 'Xem trước',
      operBtn: {
        zoomOut: 'Thu nhỏ',
        zoomIn: 'Phóng to',
        pctFull: 'Phóng to tỷ lệ',
        pct11: 'Hiển thị kích thước gốc',
        rotateLeft: 'Xoay trái',
        rotateRight: 'Xoay phải',
        print: 'Nhấp để in hình ảnh',
        download: 'Nhấp để tải hình ảnh'
      }
    },
    upload: {
      fileBtnText: 'Nhấp hoặc kéo để tải lên',
      imgBtnText: 'Nhấp hoặc kéo để tải lên',
      dragPlaceholder: 'Vui lòng kéo tệp vào khu vực này để tải lên',
      imgSizeHint: 'Kích thước mỗi ảnh {0}',
      imgCountHint: 'Tối đa {0} ảnh',
      fileTypeHint: 'Hỗ trợ loại tệp {0}',
      fileSizeHint: 'Kích thước tệp không vượt quá {0}',
      fileCountHint: 'Tối đa có thể tải lên {0} tệp',
      overCountErr: 'Chỉ có thể chọn tối đa {0} tệp!',
      overCountExtraErr: 'Đã vượt quá số lượng tối đa {0} tệp, {1} tệp vượt quá sẽ bị bỏ qua!',
      overSizeErr: 'Kích thước tệp không được vượt quá {0}!',
      reUpload: 'Tải lên lại',
      uploadProgress: 'Đang tải lên {0}%',
      uploadErr: 'Tải lên thất bại',
      uploadSuccess: 'Tải lên thành công'
    },
    formDesign: {
      formName: 'Tên biểu mẫu',
      defFormTitle: 'Biểu mẫu chưa đặt tên',
      widgetPropTab: 'Thuộc tính điều khiển',
      widgetFormTab: 'Thuộc tính biểu mẫu',
      styleSetting: {
        btn: 'Cài đặt phong cách',
        title: 'Cài đặt phong cách biểu mẫu',
        layoutTitle: 'Bố cục điều khiển',
        verticalLayout: 'Bố cục dọc',
        horizontalLayout: 'Bố cục ngang',
        styleTitle: 'Phong cách tiêu đề',
        boldTitle: 'Tiêu đề đậm',
        fontBold: 'Đậm',
        fontNormal: 'Bình thường',
        colonTitle: 'Hiển thị dấu hai chấm',
        colonVisible: 'Hiển thị',
        colonHidden: 'Ẩn',
        alignTitle: 'Căn chỉnh',
        widthTitle: 'Chiều rộng tiêu đề',
        alignLeft: 'Căn trái',
        alignRight: 'Căn phải',
        unitPx: 'Pixel',
        unitPct: 'Phần trăm'
      },
      widget: {
        group: {
          base: 'Điều khiển cơ bản',
          layout: 'Điều khiển bố cục',
          advanced: 'Điều khiển nâng cao'
        },
        copyTitle: 'Bản sao_{0}',
        component: {
          input: 'Hộp nhập liệu',
          textarea: 'Vùng văn bản',
          select: 'Chọn thả xuống',
          row: 'Một hàng nhiều cột',
          title: 'Văn bản',
          subtable: 'Bảng con',
          VxeSwitch: 'Có/Không',
          VxeInput: 'Hộp nhập liệu',
          VxeNumberInput: 'Số',
          VxeDatePicker: 'Ngày',
          VxeTextarea: 'Vùng văn bản',
          VxeSelect: 'Chọn thả xuống',
          VxeTreeSelect: 'Chọn cây',
          VxeRadioGroup: 'Nhóm nút radio',
          VxeCheckboxGroup: 'Nhóm hộp kiểm',
          VxeUploadFile: 'Tệp',
          VxeUploadImage: 'Hình ảnh'
        }
      },
      widgetProp: {
        name: 'Tên điều khiển',
        placeholder: 'Gợi ý',
        required: 'Kiểm tra bắt buộc',
        multiple: 'Cho phép chọn nhiều',
        displaySetting: {
          name: 'Cài đặt hiển thị',
          pc: 'Máy tính',
          mobile: 'Điện thoại',
          visible: 'Hiển thị',
          hidden: 'Ẩn'
        },
        dataSource: {
          name: 'Nguồn dữ liệu',
          defValue: 'Tùy chọn {0}',
          addOption: 'Thêm tùy chọn',
          batchEditOption: 'Chỉnh sửa hàng loạt',
          batchEditTip:
            'Mỗi dòng tương ứng với một tùy chọn, hỗ trợ sao chép và dán trực tiếp từ bảng, Excel, WPS.',
          batchEditSubTip:
            'Mỗi dòng tương ứng với một tùy chọn, nếu là nhóm, các mục con có thể bắt đầu bằng khoảng trắng hoặc bắt đầu bằng khoảng trắng hoặc phím tab, hỗ trợ sao chép và dán trực tiếp từ bảng, Excel, WPS.',
          buildOption: 'Tạo tùy chọn'
        },
        rowProp: {
          colSize: 'Số cột',
          col2: 'Hai cột',
          col3: 'Ba cột',
          col4: 'Bốn cột',
          col6: 'Sáu cột',
          layout: 'Bố cục'
        },
        textProp: {
          name: 'Nội dung',
          alignTitle: 'Căn chỉnh',
          alignLeft: 'Căn trái',
          alignCenter: 'Căn giữa',
          alignRight: 'Căn phải',
          colorTitle: 'Màu chữ',
          sizeTitle: 'Kích thước chữ',
          boldTitle: 'Chữ đậm',
          fontNormal: 'Bình thường',
          fontBold: 'Đậm'
        },
        subtableProp: {
          seqTitle: 'Số thứ tự',
          showSeq: 'Hiển thị số thứ tự',
          showCheckbox: 'Cho phép chọn nhiều',
          errSubDrag: 'Bảng con không hỗ trợ điều khiển này, vui lòng sử dụng điều khiển khác'
        },
        uploadProp: {
          limitFileCount: 'Giới hạn số lượng tệp',
          limitFileSize: 'Giới hạn kích thước tệp',
          multiFile: 'Cho phép tải lên nhiều tệp',
          limitImgCount: 'Giới hạn số lượng ảnh',
          limitImgSize: 'Giới hạn kích thước ảnh',
          multiImg: 'Cho phép tải lên nhiều ảnh'
        }
      }
    },
    listDesign: {
      fieldSettingTab: 'Cài đặt trường',
      listSettingTab: 'Cài đặt danh sách'
    },

    /**
     * Plugin mở rộng
     */
    plugins: {
      extendCellArea: {
        area: {
          mergeErr: 'Không thể thực hiện thao tác này trên ô hợp nhất',
          multiErr: 'Không thể thực hiện thao tác này trên vùng chọn nhiều',
          extendErr:
            'Nếu vùng mở rộng chứa các ô hợp nhất, tất cả các ô hợp nhất phải có cùng kích thước',
          pasteMultiErr:
            'Không thể dán, cần vùng sao chép và vùng dán có cùng kích thước để thực hiện thao tác này',
          cpInvalidErr: 'Không thể thực hiện thao tác này, vùng bạn chọn có chứa cột bị cấm ( {0} )'
        },
        fnr: {
          title: 'Tìm và thay thế',
          findLabel: 'Tìm',
          replaceLabel: 'Thay thế',
          findTitle: 'Nội dung tìm kiếm:',
          replaceTitle: 'Thay thế bằng:',
          tabs: {
            find: 'Tìm',
            replace: 'Thay thế'
          },
          filter: {
            re: 'Biểu thức chính quy',
            whole: 'Khớp toàn bộ từ',
            sensitive: 'Phân biệt chữ hoa chữ thường'
          },
          btns: {
            findNext: 'Tìm tiếp',
            findAll: 'Tìm tất cả',
            replace: 'Thay thế',
            replaceAll: 'Thay thế tất cả',
            cancel: 'Hủy'
          },
          header: {
            seq: '#',
            cell: 'Ô',
            value: 'Giá trị'
          },
          empty: '(Giá trị trống)',
          reError: 'Biểu thức chính quy không hợp lệ',
          recordCount: 'Đã tìm thấy {0} ô',
          notCell: 'Không tìm thấy ô phù hợp',
          replaceSuccess: 'Thay thế thành công {0} ô'
        }
      },
      filterComplexInput: {
        menus: {
          fixedColumn: 'Cột cố định',
          fixedGroup: 'Nhóm cố định',
          cancelFixed: 'Hủy cố định',
          fixedLeft: 'Cố định bên trái',
          fixedRight: 'Cố định bên phải'
        },
        cases: {
          equal: 'Bằng',
          gt: 'Lớn hơn',
          lt: 'Nhỏ hơn',
          begin: 'Bắt đầu bằng',
          endin: 'Kết thúc bằng',
          include: 'Bao gồm',
          isSensitive: 'Phân biệt chữ hoa chữ thường'
        }
      },
      filterCombination: {
        menus: {
          clearSort: 'Xóa sắp xếp',
          sortAsc: 'Tăng dần',
          sortDesc: 'Giảm dần',
          fixedColumn: 'Cột cố định',
          fixedGroup: 'Nhóm cố định',
          cancelFixed: 'Hủy cố định',
          fixedLeft: 'Cố định bên trái',
          fixedRight: 'Cố định bên phải',
          clearFilter: 'Xóa lọc',
          textOption: 'Lọc văn bản',
          numberOption: 'Lọc số'
        },
        popup: {
          title: 'Tùy chỉnh cách lọc',
          currColumnTitle: 'Cột hiện tại:',
          and: 'Và',
          or: 'Hoặc',
          describeHtml:
            'Có thể sử dụng ? để đại diện cho một ký tự<br/>Sử dụng * để đại diện cho nhiều ký tự'
        },
        cases: {
          equal: 'Bằng',
          unequal: 'Không bằng',
          gt: 'Lớn hơn',
          ge: 'Lớn hơn hoặc bằng',
          lt: 'Nhỏ hơn',
          le: 'Nhỏ hơn hoặc bằng',
          begin: 'Bắt đầu bằng',
          notbegin: 'Không bắt đầu bằng',
          endin: 'Kết thúc bằng',
          notendin: 'Không kết thúc bằng',
          include: 'Bao gồm',
          exclude: 'Không bao gồm',
          between: 'Giữa',
          custom: 'Lọc tùy chỉnh',
          insensitive: 'Không phân biệt chữ hoa chữ thường',
          isSensitive: 'Phân biệt chữ hoa chữ thường'
        },
        empty: '(Trống)',
        notData: 'Không có mục phù hợp'
      }
    },

    /**
     * Dưới đây đã ngừng sử dụng
     * @deprecated
     */
    pro: {
      area: {
        mergeErr: 'Không thể thực hiện thao tác này trên ô hợp nhất',
        multiErr: 'Không thể thực hiện thao tác này trên vùng chọn nhiều',
        extendErr:
          'Nếu vùng mở rộng chứa các ô hợp nhất, tất cả các ô hợp nhất phải có cùng kích thước',
        pasteMultiErr:
          'Không thể dán, cần vùng sao chép và vùng dán có cùng kích thước để thực hiện thao tác này'
      },
      fnr: {
        title: 'Tìm và thay thế',
        findLabel: 'Tìm',
        replaceLabel: 'Thay thế',
        findTitle: 'Nội dung tìm kiếm:',
        replaceTitle: 'Thay thế bằng:',
        tabs: {
          find: 'Tìm',
          replace: 'Thay thế'
        },
        filter: {
          re: 'Biểu thức chính quy',
          whole: 'Khớp toàn bộ từ',
          sensitive: 'Phân biệt chữ hoa chữ thường'
        },
        btns: {
          findNext: 'Tìm tiếp',
          findAll: 'Tìm tất cả',
          replace: 'Thay thế',
          replaceAll: 'Thay thế tất cả',
          cancel: 'Hủy'
        },
        header: {
          seq: '#',
          cell: 'Ô',
          value: 'Giá trị'
        },
        empty: '(Giá trị trống)',
        reError: 'Biểu thức chính quy không hợp lệ',
        recordCount: 'Đã tìm thấy {0} ô',
        notCell: 'Không tìm thấy ô phù hợp',
        replaceSuccess: 'Thay thế thành công {0} ô'
      }
    },
    renderer: {
      search: 'Tìm kiếm',
      cases: {
        equal: 'Bằng',
        unequal: 'Không bằng',
        gt: 'Lớn hơn',
        ge: 'Lớn hơn hoặc bằng',
        lt: 'Nhỏ hơn',
        le: 'Nhỏ hơn hoặc bằng',
        begin: 'Bắt đầu bằng',
        notbegin: 'Không bắt đầu bằng',
        endin: 'Kết thúc bằng',
        notendin: 'Không kết thúc bằng',
        include: 'Bao gồm',
        exclude: 'Không bao gồm',
        between: 'Giữa',
        custom: 'Lọc tùy chỉnh',
        insensitive: 'Không phân biệt chữ hoa chữ thường',
        isSensitive: 'Phân biệt chữ hoa chữ thường'
      },
      combination: {
        menus: {
          clearSort: 'Xóa sắp xếp',
          sortAsc: 'Tăng dần',
          sortDesc: 'Giảm dần',
          fixedColumn: 'Khóa cột',
          fixedGroup: 'Khóa nhóm',
          cancelFixed: 'Hủy khóa',
          fixedLeft: 'Khóa bên trái',
          fixedRight: 'Khóa bên phải',
          clearFilter: 'Xóa lọc',
          textOption: 'Lọc văn bản',
          numberOption: 'Lọc số'
        },
        popup: {
          title: 'Tùy chỉnh cách lọc',
          currColumnTitle: 'Cột hiện tại:',
          and: 'Và',
          or: 'Hoặc',
          describeHtml:
            'Có thể sử dụng ? để đại diện cho một ký tự<br/>Sử dụng * để đại diện cho nhiều ký tự'
        },
        empty: '(Trống)',
        notData: 'Không có mục phù hợp'
      }
    }
  }
}
