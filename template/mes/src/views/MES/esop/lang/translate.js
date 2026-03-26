import translate from 'translate';
import chinese from 'chinese-s2t';

translate.engine = 'google'; // "google", "yandex", "libre", "deepl"
translate.key = process.env.DEEPL_KEY;

const translateArr = async (arr) => {
  // console.log(arr);
  const { lang } = localStorage;
  let text = '';
  if (lang.includes('zh')) {
    text = chinese[lang == 'zh-CN' ? 't2s' : 's2t'](arr.join('_'));
  } else {
    text = await translate(arr.join('_'), { from: 'zh', to: lang });
  }
  // // console.log(text.split('_'), lang);
  return text.split('_');
};

export {
  translateArr
};
