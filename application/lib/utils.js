({
  UNITS: ['', ' Kb', ' Mb', ' Gb', ' Tb', ' Pb', ' Eb', ' Zb', ' Yb'],

  bytesToSize(bytes) {
    if (bytes === 0) return '0';
    const exp = Math.floor(Math.log(bytes) / Math.log(1000));
    const size = bytes / 1000 ** exp;
    const short = Math.round(size, 2);
    const unit = this.UNITS[exp];
    return short + unit;
  },

  UNIT_SIZES: {
    yb: 24, // yottabyte
    zb: 21, // zettabyte
    eb: 18, // exabyte
    pb: 15, // petabyte
    tb: 12, // terabyte
    gb: 9, // gigabyte
    mb: 6, // megabyte
    kb: 3, // kilobyte
  },

  sizeToBytes(size) {
    if (typeof size === 'number') return size;
    const [num, unit] = size.toLowerCase().split(' ');
    const exp = this.UNIT_SIZES[unit];
    const value = parseInt(num, 10);
    if (!exp) return value;
    return value * 10 ** exp;
  },

  clone(item) {
    if (!item) {
      return item;
    } // null, undefined values check

    const types = [Number, String, Boolean];
    let result;

    // normalizing primitives if someone did new String('aaa'), or new Number('444');
    types.forEach((type) => {
      if (item instanceof type) {
        result = type(item);
      } else if (item && typeof item === 'object' && item._bsontype === 'ObjectID') {
        result = db.mongo.ObjectID(item.toString());
      }
    });

    if (typeof result === 'undefined') {
      if (Object.prototype.toString.call(item) === '[object Array]') {
        result = [];
        item.forEach((child, index) => {
          result[index] = lib.utils.clone(child);
        });
      } else if (typeof item === 'object') {
        // testing that this is DOM
        if (item.nodeType && typeof item.cloneNode === 'function') {
          result = item.cloneNode(true);
        } else if (!item.prototype) {
          // check that this is a literal
          if (item instanceof Date) {
            result = new Date(item);
          } else {
            // it is an object literal
            result = {};
            for (const i in item) {
              result[i] = lib.utils.clone(item[i]);
            }
          }
        } else {
          /* // depending what you would like here,
          // just keep the reference, or create new object
          if (item.constructor) {
            // would not advice to do that, reason? Read below
            result = new item.constructor();
          } else {
            result = item;
          } */
          result = item;
        }
      } else {
        result = item;
      }
    }

    return result;
  },

  getDeep(source, path) {
    const splittedPath = typeof path === 'string' ? path.split('.') : path;
    return splittedPath.reduce((result, part) => result?.[part] || null, source);
  },
  setDeep(obj, path, value) {
    const [head, ...rest] = path.split('.');
    obj[head] = rest.length ? lib.utils.setDeep(obj[head], rest.join('.'), value) : value;
    return obj;
  },

  // ! рефакторить только одновременно с mergeDeep (на фронте)
  mergeDeep({ target, source, masterObj = {}, config = {}, keyPath = [] }) {
    const { reset = [], deleteNull = false } = config;
    // обнуляем ключи в заданных объектах (для передачи обновлений клиенту и БД)
    if (reset.includes(keyPath.join('.'))) {
      for (const key of Object.keys(masterObj)) target[key] = null;
    }

    for (const key of Object.keys(source)) {
      if (masterObj[key] == null) {
        // masterObj[key] === null || masterObj[key] === undefined
        if (source[key] !== null) {
          if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            lib.utils.mergeDeep({
              target: target[key],
              source: source[key],
              masterObj: {},
              config,
              keyPath: [...keyPath, key],
            });
            if (config.removeEmptyObject && Object.keys(target[key]).length === 0) {
              // изменений во вложенном объекте нет (удаляем, чтобы он не перетерся в БД)
              delete target[key];
            }
          } else target[key] = source[key];
        } else if (!deleteNull) target[key] = source[key];
      } else if (typeof masterObj[key] !== typeof source[key] || masterObj[key] === null || source[key] === null) {
        if (deleteNull && source[key] === null) delete target[key];
        else target[key] = source[key];
      } else if (Array.isArray(masterObj[key])) {
        // массивы обновляются только целиком (проблемы с реализацией удаления)
        if (deleteNull && source[key] === null) delete target[key];
        else target[key] = source[key];
      } else if (typeof masterObj[key] === 'object') {
        if (deleteNull && source[key] === null) delete target[key];
        else {
          if (source[key] === null) target[key] = null;
          else {
            if (!target[key]) target[key] = {};
            lib.utils.mergeDeep({
              target: target[key],
              source: source[key],
              masterObj: masterObj[key],
              config,
              keyPath: [...keyPath, key],
            });
            if (config.removeEmptyObject && Object.keys(target[key]).length === 0) {
              // изменений во вложенном объекте нет (удаляем, чтобы он не перетерся в БД)
              delete target[key];
            }
          }
        }
      } else if (masterObj[key] !== source[key]) {
        if (deleteNull && source[key] === null) delete target[key];
        else target[key] = source[key];
      } else {
        // тут значения, которые не изменились

        if (target[key] === null) {
          // target[key] мог быть обнулен через reset
          target[key] = source[key];
        }
      }
    }
  },

  isObjectID(value) {
    return value && typeof value === 'object' && value._bsontype === 'ObjectID';
  },
  isPlainObj(value) {
    return value?.constructor?.prototype?.hasOwnProperty('isPrototypeOf');
  },

  flatten(obj, keys = []) {
    const acc = {};
    // ??? проверить, нужен ли baseKey
    const baseKey = Object.values(keys).join('.');
    if (baseKey) acc[baseKey] = {};
    return Object.keys(obj).reduce((acc, key) => {
      return Object.assign(
        acc,
        lib.utils.isPlainObj(obj[key])
          ? lib.utils.flatten(obj[key], keys.concat(key))
          : { [keys.concat(key).join('.')]: lib.utils.isObjectID(obj[key]) ? obj[key].toString() : obj[key] }
      );
    }, acc);
  },

  unflatten(data) {
    const result = {};
    for (const i in data) {
      const keys = i.split('.');
      keys.reduce(
        (r, e, j) => r[e] || (r[e] = isNaN(Number(keys[j + 1])) ? (keys.length - 1 === j ? data[i] : {}) : []),
        result
      );
    }
    return result;
  },

  sumPropertiesOfObjects(arrayOfObjects, allowProps = []) {
    return arrayOfObjects.reduce((result, item) => {
      for (const key in item) {
        if (item[key] && (allowProps.length === 0 || allowProps.includes(key))) {
          result[key] = (result[key] || 0) + item[key];
        }
      }
      return result;
    }, {});
  },

  addDeepProxyChangesWatcher(sourceObject, path = [], storage = {}) {
    /*
            навешиваем proxy на object-свойства в обратном порядке вложенности (из глубины наверх),
            иначе начнут срабатывать watch-функции еще на этапе создания DeepProxy
        */
    const sourceObjectIsArray = Array.isArray(sourceObject);
    const tmpObject = sourceObjectIsArray ? [] : {};

    for (const key of Object.keys(sourceObject)) {
      const value = sourceObject[key];
      const tmpObjectPropValue =
        //!sourceObjectIsArray && // для массивов не придумал ничего лучше, чем обновлять их целиком
        !lib.utils.isObjectID(value) && value !== null && typeof value === 'object'
          ? lib.utils.addDeepProxyChangesWatcher(value, [...path, key], storage).proxy
          : value;

      if (Array.isArray(tmpObject)) tmpObject.push(tmpObjectPropValue);
      else tmpObject[key] = tmpObjectPropValue;
    }

    return {
      storage,
      proxy: new Proxy(tmpObject, {
        set(target, name, value) {
          console.log('set', { target, name, value, path });
          if (
            !Array.isArray(target) && // для массивов не придумал ничего лучше, чем обновлять их целиком
            !lib.utils.isObjectID(value) &&
            value !== null &&
            typeof value === 'object'
          ) {
            target[name] = lib.utils.addDeepProxyChangesWatcher(value, [...path, name], storage).proxy;
          } else {
            target[name] = value;
          }
          sourceObject[name] = value;

          lib.utils.updateStorage({
            target,
            name,
            value,
            path,
            storage,
            sourceObject,
          });

          return true;
        },
        deleteProperty(target, name) {
          console.log('deleteProperty', { target, name });
          delete target[name];
          delete sourceObject[name];

          lib.utils.updateStorage({
            target,
            name,
            value: null,
            path,
            storage,
            sourceObject,
          });

          return true;
        },
      }),
    };
  },
  updateStorage({ target, name, value, path, storage, sourceObject }) {
    if (Array.isArray(target)) {
      // для массивов не придумал ничего лучше, чем обновлять его целиком
      if (name !== 'length') {
        storage[[...path].join('.')] = sourceObject;
      }
    } else {
      const currentKey = [...path, name].join('.');
      let findParentKey = false;
      // проверяем, что текущий ключ не плодит избыточные данные в storage
      Object.keys(storage).forEach((key) => {
        // текущий ключ является родителем более низкого уровня (убираем ключи потомков)
        if (key.indexOf(currentKey + '.') === 0) delete storage[key];
        // текущий ключ является потомком (не добавляем его, а обновляем родителя)
        if (currentKey.indexOf(key + '.') === 0) findParentKey = key;
      });
      if (findParentKey) {
        // найден родитель для текущего ключа, которого нужно обновить
        /*
                    по факту в store уже лежит ссылка на target, который и так обновился,
                    но формально (например, если в store начнет храниться копия) мы должны обновить его вручную
                */
        // storage[findParentKey] = target; - так лучше не делать*
        // (* при множественном вложении подставится некорректный target)
      } else {
        storage[currentKey] = value;
      }
    }
  },

  structuredClone(data, { convertFuncToString = false } = {}) {
    // structuredClone не умеет копировать функции и переводить их в строки (+ он в метархии все равно не работает)
    const replacer = convertFuncToString
      ? (key, value) => {
          if (typeof value === 'function') return value.toString();
          return value;
        }
      : null;
    return JSON.parse(JSON.stringify(data, replacer));
  },
  keysToNull(obj) {
    return Object.fromEntries(Object.keys(obj).map((key) => [key, null]));
  },
});
