/**
 * 将下划线命名转换为驼峰命名
 */
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

/**
 * 搜索豆瓣移动端 API
 */
export async function search_douban_mobile(query: string) {
  try {
    const url = `https://m.douban.com/rexxar/api/v2/search/subjects?type=movie&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        'Referer': 'https://m.douban.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 转换为驼峰命名
    const camelData = toCamelCase(data);

    // 提取 subjects.items 数组
    const items = camelData?.subjects?.items || [];

    // 过滤掉片单类型，只保留电影和电视剧
    const filteredItems = items.filter((item: any) =>
      item.targetType === 'movie' || item.targetType === 'tv'
    );

    // 格式化返回数据
    const formattedData = filteredItems.map((item: any) => ({
      id: item.target.id,
      title: item.target.title,
      subtitle: item.target.cardSubtitle,
      year: item.target.year,
      type: item.targetType,
      typeName: item.typeName,
      coverUrl: item.target.coverUrl,
      link: `https://movie.douban.com/subject/${item.target.id}/`,
      ratingValue: item.target.rating?.value ?? 0,
      ratingCount: item.target.rating?.count ?? 0,
      ratingStarCount: item.target.rating?.starCount ?? 0,
      ratingMax: item.target.rating?.max ?? 10,
      nullRatingReason: item.target.nullRatingReason,
    }));

    return {
      success: true,
      data: formattedData,
      raw: camelData,
    };
  } catch (e: any) {
    console.error('豆瓣移动端搜索失败:', e);
    return {
      success: false,
      error: `豆瓣移动端搜索失败: ${e.message}`,
    };
  }
}

/**
 * 生成豆瓣移动端信息（复用原有的 gen_douban）
 */
export async function gen_douban_mobile(_sid: string) {
  try {
    return {
      success: false,
      error: "请使用 douban 数据源获取详细信息",
    };
  } catch (e: any) {
    return {
      success: false,
      error: `生成失败: ${e.message}`,
    };
  }
}
