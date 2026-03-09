/**
 * Korean font registration for @react-pdf/renderer
 * Side-effect module -- import for font registration only
 */
import { Font } from '@react-pdf/renderer'

Font.register({
  family: 'NanumGothic',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/ea/nanumgothic/v5/NanumGothic-Regular.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/ea/nanumgothic/v5/NanumGothic-Bold.ttf',
      fontWeight: 700,
    },
  ],
})
