import Vue from 'vue';

// ! рефакторить только одновременно с lib.utils.mergeDeep (на сервере)
function mergeDeep({ target, source }) {
  for (const key of Object.keys(source)) {
    if (!target[key]) {
      if (source[key] !== null) {
        if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
          Vue.set(target, key, {});
          mergeDeep({ target: target[key], source: source[key] });
        } else Vue.set(target, key, source[key]);
      }
    } else if (typeof target[key] !== typeof source[key] || target[key] === null || source[key] === null) {
      if (source[key] === null) Vue.delete(target, key);
      else Vue.set(target, key, source[key]);
    } else if (Array.isArray(target[key])) {
      // массивы обновляются только целиком (проблемы с реализацией удаления)
      if (source[key] === null) Vue.delete(target, key);
      else Vue.set(target, key, source[key]);
    } else if (typeof target[key] === 'object') {
      if (source[key] === null) Vue.delete(target, key);
      else {
        if (!target[key]) Vue.set(target, key, {});
        mergeDeep({ target: target[key], source: source[key] });
      }
    } else if (target[key] !== source[key]) {
      if (source[key] === null) Vue.delete(target, key);
      else Vue.set(target, key, source[key]);
    } else {
      // тут значения, которые не изменились
    }
  }
}

export { mergeDeep };
