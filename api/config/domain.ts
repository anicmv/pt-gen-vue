const support_list = {
  douban: /(?:https?:\/\/)?(?:(?:movie|www)\.)?douban\.com\/(?:subject|movie)\/(\d+)\/?/,
  doubanMobile: /movie\.douban\.com\/subject\/(\d+)/,
  bangumi: /(?:https?:\/\/)?(?:bgm\.tv|bangumi\.tv|chii\.in)\/subject\/(\d+)\/?/,
};

export { support_list };
