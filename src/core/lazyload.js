// htmlString <img src="" />
const srcReplaceRegExp = new RegExp(
  "(i?<img .*?)(src=)(['\"].*?['\"])*",
  "gmi"
);
// htmlString <img alt="" />
const altReplaceRegExp = new RegExp(
  "(i?<img .*?)(alt=)(['\"].*?['\"])*",
  "gmi"
);

// 匹配 url(host)
const backgroundRegExp = function ({ host, reg }) {
  return new RegExp(`url\\([\'|\"]?(${host}.*?(${reg}))[\'|\"]?\\)`, "g");
};

// 匹配src链接 ^host+reg$
const httpRegExp = function ({ host, reg }) {
  return new RegExp(`^${host}.*(${reg})$`, "g");
};

// 检测是否支持webp
let _support;
export function support_format_webp() {
  if (typeof _support === "boolean") return _support;

  const elem = document.createElement("canvas");

  if (elem.getContext && elem.getContext("2d")) {
    _support = elem.toDataURL("image/webp").indexOf("data:image/webp") === 0;
  } else {
    _support = false;
  }

  return _support;
}

const defaults = {
  // attribute
  src: "data-src",
  alt: "data-alt",
  style: "data-style",
  unlazy: "v-no-lazyload",
  compress: "v-no-compress",
  html: "data-html",

  // observer
  root: null,
  rootMargin: "0px",
  threshold: 0,

  // options
  reg: ".jpg|.jpeg|.png",
  host: "",
  maxSize: 16383,
  minSize: 64,
};

function LazyLoad(images, options) {
  // 存在声明的组件内容为空
  if (!images || !images.querySelectorAll) return;
  this.settings = { ...defaults, ...(options || {}) };
  this.images = images.querySelectorAll("*");
  this.observer = null;

  this.init();
  // fix: images.querySelectorAll("*") without parentNode
  this.initSelector(images);
}

LazyLoad.prototype = {
  init(currentNode) {
    const self = this;

    /* Without observers load everything and bail out early. */
    if (!IntersectionObserver) {
      Array.prototype.forEach.call(
        currentNode || this.images,
        function (image) {
          self.loadElements(image);
        }
      );
      return;
    }

    const observerConfig = {
      root: this.settings.root,
      rootMargin: this.settings.rootMargin,
      threshold: [this.settings.threshold],
    };

    this.observer = new IntersectionObserver(function (entries) {
      Array.prototype.forEach.call(entries, function (entry) {
        if (entry.isIntersecting) {
          self.observer.unobserve(entry.target);
          self.loadElements(entry.target);
        }
      });
    }, observerConfig);

    Array.prototype.forEach.call(currentNode || this.images, function (image) {
      // 新增禁止懒加载属性
      if (image.hasAttribute(self.settings.unlazy)) {
        self.loadElements(image);
      } else if (
        image.hasAttribute(self.settings.src) ||
        image.hasAttribute(self.settings.alt) ||
        image.hasAttribute(self.settings.style) ||
        image.hasAttribute(self.settings.html)
      ) {
        self.observer.observe(image);
      }
    });
  },

  initSelector(selector) {
    const self = this;

    if (!selector.hasAttribute) {
      return;
    }

    if (!IntersectionObserver) {
      self.loadElements(selector);
      return;
    }

    // 新增禁止懒加载属性
    if (selector.hasAttribute(self.settings.unlazy)) {
      self.loadElements(selector);
    } else if (
      selector.hasAttribute(self.settings.src) ||
      selector.hasAttribute(self.settings.alt) ||
      selector.hasAttribute(self.settings.style) ||
      selector.hasAttribute(self.settings.html)
    ) {
      self.observer.observe(selector);
    }
  },

  loadElements(node) {
    const self = this;
    if (node.hasAttribute(self.settings.src)) {
      self.loadImages(node);
    }
    if (node.hasAttribute(self.settings.style)) {
      self.loadBackgroundImages(node);
    }
    if (node.hasAttribute(self.settings.html)) {
      self.loadHTML(node);
    }
    if (node.hasAttribute(self.settings.alt)) {
      self.loadAlt(node);
    }
  },

  loadImages(node) {
    if (!this.settings) {
      return;
    }

    const self = this;
    const src = node.getAttribute(self.settings.src);

    if (src) {
      node.removeAttribute(self.settings.src);
      self.observer.unobserve(node);

      // 新增禁止压缩属性
      if (!IntersectionObserver || node.hasAttribute(self.settings.compress)) {
        node.src = src;
        return;
      }

      // webp图片压缩
      if (httpRegExp(self.settings).test(src)) {
        const hasSize = Math.max(node.offsetWidth, node.offsetHeight) > 0;

        if (hasSize) {
          node.src = `${src}${self.getXOSSProcess(
            node.offsetWidth,
            node.offsetHeight
          )}`;
        } else {
          // 渐进式加载：先加载质量为1%的最低像素图
          // 只有当图片未设高宽时，才利用渐进式加载获取占位尺寸
          node.src = `${src}${self.getXOSSProcess(0, 0, 1)}`;
          node.onload = function () {
            node.onload = undefined;
            // fix: Maximum width and height allowed is 16383 pixels for converting webp.
            if (
              node.naturalWidth > self.settings.maxSize ||
              node.naturalHeight > self.settings.maxSize
            ) {
              node.src = src;
            } else {
              // 继续webp压缩
              node.src = node.src.replace(
                self.getXOSSProcess(0, 0, 1),
                self.getXOSSProcess(node.offsetWidth, node.offsetHeight)
              );
            }
          };
        }
      } else {
        node.src = src;
      }
    }
  },

  // img alt属性也需要data-alt化
  // 因为alt会导致图片存在16x16占位
  loadAlt(node) {
    node.setAttribute("alt", node.getAttribute(this.settings.alt));
    node.removeAttribute(this.settings.alt);
    this.observer.unobserve(node);
  },

  loadBackgroundImages(node) {
    if (!this.settings) {
      return;
    }

    const self = this;
    const style = node.getAttribute(self.settings.style);

    if (!style) {
      return;
    }

    node.removeAttribute(self.settings.style);
    self.observer.unobserve(node);

    const styleObject = JSON.parse(style);
    Object.keys(styleObject).forEach((a) => {
      const styleStr = styleObject[a];
      if (
        // 新增禁止压缩属性
        !node.hasAttribute(self.settings.compress) &&
        (a === "backgroundImage" ||
          a === "background" ||
          a === "background-image") &&
        backgroundRegExp(self.settings).test(styleStr)
      ) {
        const { width, height } = node.getBoundingClientRect();
        node.style[a] = styleStr.replace(
          backgroundRegExp(self.settings),
          `url($1${self.getXOSSProcess(width, height)})`
        );
      } else {
        node.style[a] = styleStr;
      }
    });
  },

  loadHTML(node) {
    if (!this.settings) {
      return;
    }

    const self = this;
    const html = node.getAttribute(self.settings.html);

    if (!html) {
      return;
    }

    node.removeAttribute(self.settings.html);
    self.observer.unobserve(node);

    // 新增禁止压缩属性
    if (node.hasAttribute(self.settings.compress)) {
      node.innerHTML = html;
      return;
    }

    // 正则匹配html字符串中的 "<img src" 和 "<img alt"
    // background暂时不支持，因为拿不到占位尺寸
    node.innerHTML = html
      .replace(/\n/g, "")
      .replace(srcReplaceRegExp, `$1${self.settings.src}=$3`)
      .replace(altReplaceRegExp, `$1${self.settings.alt}=$3`);
    // .replace(backgroundRegExp(self.settings), `url($1${self.getXOSSProcess()})`);

    self.init(node.querySelectorAll("*"));
  },

  /**
   * x-oss-process query计算函数
   * 文档：https://help.aliyun.com/document_detail/135444.html
   * * */
  getXOSSProcess(width, height, quality) {
    // 仅质量转换
    if (quality) {
      return `?x-oss-process=image/auto-orient,1/quality,q_${quality}/format,jpg`;
    }

    let size = "";
    // 判断初始图片为auto还是有固定值
    if (width > 0 || height > 0) {
      // 图片过小时不压缩，如icon图标
      if (width < this.settings.minSize && height < this.settings.minSize) {
        return "";
      }

      const w = this.getCompressRatio(width);
      const h = this.getCompressRatio(height);

      size = `,${w > h ? `w_${w}` : `h_${h}`}`;
    }

    // 图片已占位时 —— 加载最适合像素尺寸
    if (size) {
      if (support_format_webp()) {
        return `?x-oss-process=image/resize${size}/format,webp`;
      }

      return `?x-oss-process=image/resize${size}`;
    }

    // 图片未占位时 —— 渐进式加载
    if (support_format_webp()) {
      return `?x-oss-process=image/format,webp`;
    }

    return "";
  },

  /**
   * 根据宽度获得压缩比
   * w48,w64,w120,w155,w160,w220,w230,w299,w320,w330,w600,w640,w720,w900,
   */
  getCompressRatio(originWidth) {
    // 当前设备像素值
    const devicePixelRatio = (window && window.devicePixelRatio) || 1;

    const value = originWidth * devicePixelRatio;
    if (value <= 48) {
      return 48;
    }
    if (value <= 64) {
      return 64;
    }
    if (value <= 120) {
      return 120;
    }
    if (value <= 155) {
      return 155;
    }
    if (value <= 160) {
      return 160;
    }
    if (value <= 220) {
      return 220;
    }
    if (value <= 230) {
      return 230;
    }
    if (value <= 299) {
      return 299;
    }
    if (value <= 320) {
      return 320;
    }
    if (value <= 330) {
      return 330;
    }
    if (value <= 600) {
      return 600;
    }
    if (value <= 640) {
      return 640;
    }
    if (value <= 720) {
      return 720;
    }
    return 900;
  },

  destroy() {
    if (!this.settings) {
      return;
    }
    this.observer.disconnect();
    this.settings = null;
  },
};

export default function LazyLoad2(doc, options) {
  // eslint-disable-next-line no-new
  return new LazyLoad(doc, options);
}
