export const environment = {
  production: true,
  apiUrl: '/',
  tokenExpiredTimeInMin: 50,
  allowExtesions: [
    {
      type: 'office',
      extentions: ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'xml', 'json']
    },
    {
      type: 'pdf',
      extentions: ['pdf']
    },
    {
      type: 'font',
      extentions: ['ttf', 'otf']
    },
    {
      type: 'image',
      extentions: [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'tiff',
        'psd',
        'bmp',
        'webp',
        'raw',
        'bmp',
        'heif',
        'indd',
        'svg',
        'ai',
        'eps',
        'tif',
      ]
    },
    {
      type: 'text',
      extentions: ['txt', 'csv']
    },
    {
      type: 'audio',
      extentions: [
        '3gp',
        'aa',
        'aac',
        'aax',
        'act',
        'aiff',
        'alac',
        'amr',
        'ape',
        'au',
        'awb',
        'dss',
        'dvf',
        'flac',
        'gsm',
        'iklx',
        'ivs',
        'm4a',
        'm4b',
        'm4p',
        'mmf',
        'mp3',
        'mpc',
        'msv',
        'nmf',
        'ogg',
        'oga',
        'mogg',
        'opus',
        'org',
        'ra',
        'rm',
        'raw',
        'rf64',
        'sln',
        'tta',
        'voc',
        'vox',
        'wav',
        'wma',
        'wv'
      ],
    },
    {
      type: 'video',
      extentions: [
        'webm',
        'flv',
        'vob',
        'ogv',
        'ogg',
        'drc',
        'avi',
        'mts',
        'm2ts',
        'wmv',
        'yuv',
        'viv',
        'mp4',
        'm4p',
        '3pg',
        'flv',
        'f4v',
        'f4a',

      ]
    }
  ],
  maximumFileSizeInMB: 10
};
