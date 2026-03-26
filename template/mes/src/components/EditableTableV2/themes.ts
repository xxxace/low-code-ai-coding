import { themes } from '@visactor/vtable'

const ARCO = themes.ARCO.extends({
  headerStyle: {
    fontSize: 14,
    padding: 4,
    fontWeight: 600
  },
  bodyStyle: {
    fontSize: 14,
    padding: [6, 4]
  },
  frameStyle: {
    borderLineWidth: 1,
    cornerRadius: 0,
    shadowColor: 'transparent'
  },
  scrollStyle: {
    scrollRailColor: 'RGBA(246,246,246,0.5)',
    visible: 'always',
    width: 16,
    scrollSliderCornerRadius: 0,
    scrollSliderColor: '#c0c0c0'
  }
})

export default {
  ARCO
}
