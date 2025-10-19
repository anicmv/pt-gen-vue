import { DoubanInfo } from '../type/douban'
import { jsonp_parser, NONE_EXIST_ERROR, page_parser } from './common'

// ✅ 改为函数，每次调用时读取
function getDoubanFetchInit(): RequestInit {
  const DOUBAN_COOKIE = globalThis["DOUBAN_COOKIE"];

  if (DOUBAN_COOKIE) {
    return {
      headers: {
        Cookie: DOUBAN_COOKIE,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    };
  }

  return {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  };
}

export async function search_douban(query: string) {
  try {
    const douban_search = await fetch(
      `https://movie.douban.com/j/subject_suggest?q=${query}`,
      getDoubanFetchInit()  // ✅ 使用函数
    );
    const douban_search_json = await douban_search.json();

    return {
      success: true,
      data: douban_search_json.map((d: any) => {
        return {
          episode: d.episode,
          img: d.img,
          title: d.title,
          url: d.url,
          type: d.type,
          year: d.year,
          subtitle: d.sub_title,
          link: `https://movie.douban.com/subject/${d.id}/`,
          id: d.id
        };
      }),
    };
  } catch (e) {
    return {
      success: false,
      error: "豆瓣搜索失败",
    };
  }
}

export async function gen_douban(sid: string) {
  const data: { [key: string]: any } = {
    site: 'douban',
    sid: sid,
  }

  const douban_link = `https://movie.douban.com/subject/${sid}/`
  const db_page_resp = await fetch(douban_link, getDoubanFetchInit());
  const douban_page_raw = await db_page_resp.text()

  if (douban_page_raw.match(/你想访问的页面不存在/)) {
    return Object.assign(data, {
      error: NONE_EXIST_ERROR,
    })
  } else if (douban_page_raw.match(/检测到有异常请求/)) {
    return Object.assign(data, {
      error: 'GenHelp was temporary banned by Douban, Please wait....',
    })
  }

  const awards_page_req = fetch(`${douban_link}awards`, getDoubanFetchInit());
  const $ = page_parser(douban_page_raw)

  const title = $('title').text().replace('(豆瓣)', '').trim()
  const ld_json = JSON.parse(
    $('head > script[type="application/ld+json"]')
      .html()
      ?.replace(/(\r\n|\n|\r|\t)/gm, '') ?? '{}',
  )

  const fetch_anchor = function (anchor: any) {
    return anchor[0].nextSibling.nodeValue.trim()
  }

  let imdb_api_req: Promise<Response> | undefined
  const imdb_anchor = $('#info span.pl:contains("IMDb")')
  let imdb_id, imdb_link, imdb_average_rating, imdb_votes

  if (imdb_anchor.length > 0) {
    data['imdb_id'] = imdb_id = fetch_anchor(imdb_anchor)
    data['imdb_link'] = imdb_link = `https://www.imdb.com/title/${imdb_id}/`
    imdb_api_req = fetch(
      `https://p.media-imdb.com/static-content/documents/v1/title/${imdb_id}/ratings%3Fjsonp=imdb.rating.run:imdb.api.title.ratings/data.json`,
    )
  }

  const chinese_title = (data['chinese_title'] = title)
  const foreign_title = (data['foreign_title'] = $('span[property="v:itemreviewed"]')
    .text()
    .replace(data['chinese_title'], '')
    .trim())

  const aka_anchor = $('#info span.pl:contains("又名")')
  let aka
  if (aka_anchor.length > 0) {
    aka = fetch_anchor(aka_anchor)
      .split(' / ')
      .sort((a: string, b: string) => a.localeCompare(b))
      .join('/')
    data['aka'] = aka.split('/')
  }

  let trans_title, this_title
  if (foreign_title) {
    trans_title = chinese_title + (aka ? '/' + aka : '')
    this_title = foreign_title
  } else {
    trans_title = aka ? aka : ''
    this_title = chinese_title
  }

  data['trans_title'] = trans_title.split('/')
  data['this_title'] = this_title.split('/')

  const regions_anchor = $('#info span.pl:contains("制片国家/地区")')
  const language_anchor = $('#info span.pl:contains("语言")')
  const episodes_anchor = $('#info span.pl:contains("集数")')
  const sessions_anchor = $('#info span.pl:contains("季数")')
  const duration_anchor = $('#info span.pl:contains("单集片长")')
  const officialWebsite_anchor = $('#info > a')

  const year = ' ' + $('#content > h1 > span.year').text().substr(1, 4)
  const region = regions_anchor[0] ? fetch_anchor(regions_anchor).split(' / ') : ''
  data['year'] = year
  data['region'] = region
  data['officialWebsite'] = officialWebsite_anchor[0]?.attribs?.href
  data['genre'] = $('#info span[property="v:genre"]')
    .map(function () {
      return $(this).text().trim()
    })
    .toArray()

  data['language'] = language_anchor[0] ? fetch_anchor(language_anchor).split(' / ') : ''
  data['playdate'] = $('#info span[property="v:initialReleaseDate"]')
    .map(function () {
      return $(this).text().trim()
    })
    .toArray()
    .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())

  data['episodes'] = episodes_anchor[0] ? fetch_anchor(episodes_anchor) : ''
  data['sessions'] = sessions_anchor[0] ? fetch_anchor(sessions_anchor) : ''
  data['duration'] = duration_anchor[0]
    ? fetch_anchor(duration_anchor)
    : $('#info span[property="v:runtime"]').text().trim()

  const introduction_another = $(
    '#link-report-intra > span.all.hidden, #link-report-intra > [property="v:summary"], #link-report > span.all.hidden, #link-report > [property="v:summary"]',
  )
  data['introduction'] = (
    introduction_another.length > 0 ? introduction_another.text() : '暂无相关剧情介绍'
  )
    .split('\n')
    .map((a: string) => a.trim())
    .filter((a: string) => a.length > 0)
    .join('\n')

  data['douban_rating_average'] = ld_json?.['aggregateRating']
    ? ld_json?.['aggregateRating']?.['ratingValue']
    : 0
  data['douban_votes'] = ld_json?.['aggregateRating']
    ? ld_json?.['aggregateRating']?.['ratingCount']
    : 0
  data['douban_rating'] =
    `${data['douban_rating_average'] || 0}/10 from ${data['douban_votes']} users`

  data['poster'] = ld_json?.['image']?.replace(/s(_ratio_poster|pic)/g, 'm$1')
  // .replace("img3", "img1");

  data['director'] = ld_json?.['director'] ? ld_json?.['director'] : []
  data['writer'] = ld_json?.['author'] ? ld_json?.['author'] : []
  data['cast'] = ld_json?.['actor'] ? ld_json?.['actor'] : []

  const tag_another = $('div.tags-body > a[href^="/tag"]')
  if (tag_another.length > 0) {
    data['tags'] = tag_another
      .map(function () {
        return $(this).text()
      })
      .get()
  }

  const awards_page_resp = await awards_page_req
  const awards_page_raw = await awards_page_resp.text()
  const awards_page = page_parser(awards_page_raw)
  data['awards'] = awards_page('#content > div > div.article')
    .html()
    ?.replace(/[ \n]/g, '')
    .replace(/<\/li><li>/g, '</li> <li>')
    .replace(/<\/a><span/g, '</a> <span')
    .replace(/<(div|ul)[^>]*>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/ +\n/g, '\n')
    .trim()

  if (imdb_api_req) {
    const imdb_api_resp = await imdb_api_req
    const imdb_api_raw = await imdb_api_resp.text()
    const imdb_json = jsonp_parser(imdb_api_raw)

    if (imdb_json['resource']) {
      data['imdb_rating_average'] = imdb_average_rating = imdb_json['resource']['rating'] || 0
      data['imdb_votes'] = imdb_votes = imdb_json['resource']['ratingCount'] || 0
    }
  }

  const douban_data: DoubanInfo = {
    id: Number(sid),
    title: trans_title,
    type: ld_json?.['@type'] ?? '',
    originalTitle: this_title,
    translatedName: trans_title,
    year: Number(year.trim()),
    countries: region.join(' / '),
    officialWebsite: data?.['officialWebsite'] as string,
    mainPic: data['poster'],
    genres: data['genre'].join(' / '),
    languages: data['language'].join(' / '),
    publishDate: data['playdate'].join(' / '),
    imdbRating: Number(imdb_average_rating ?? 0),
    imdbRatingCount: Number(imdb_votes ?? 0),
    imdbId: imdb_id,
    douBanRating: Number(data['douban_rating_average'] ?? 0),
    douBanRatingCount: Number(data['douban_votes'] ?? 0),
    episodesCount: data['episodes'] !== '' ? Number(data['episodes']) : 0,
    season: data['sessions'] !== '' ? Number(data['sessions']) : 0,
    durations: data['duration'],
    directors:
      data['director'] && data['director'].length > 0
        ? data['director'].map((x: any) => x['name']).join(' / ')
        : '',
    actors:
      data['cast'] && data['cast'].length > 0
        ? data['cast'].map((x: any) => x['name']).join('\n' + '　'.repeat(3) + '  　')
        : '',
    dramatist:
      data['writer'] && data['writer'].length > 0
        ? data['writer'].map((x: any) => x['name']).join(' / ')
        : '',
    intro: data['introduction'].replace(/\n/g, '\n' + '　'.repeat(2)),
    awards: data['awards'].replace(/\n/g, '\n' + '　'.repeat(2)),
    tags: data['tags'] && data['tags'].length > 0 ? data['tags'].join(' | ') : '',
  }

  console.log(JSON.stringify(douban_data))

  // 从环境变量中获取配置
  const SAVE_API_URL = globalThis['SAVE_API_URL'] || ''
  const SAVE_API_TOKEN = globalThis['SAVE_API_TOKEN'] || ''

  // console.log(SAVE_API_URL)
  // console.log(SAVE_API_TOKEN)
  // 只有配置了 URL 和 token 才发送
  if (SAVE_API_URL && SAVE_API_TOKEN) {
    await fetch(SAVE_API_URL, {
      method: 'POST',
      body: JSON.stringify(douban_data),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + SAVE_API_TOKEN,
      },
    }).catch((e) => {
      console.log(e)
    })
  }

  data['format'] = format_douban(douban_data)
  data['success'] = true
  return {
    ...douban_data,
    format: format_douban(douban_data),
    success: true,
  }
}

export function format_douban(data: DoubanInfo) {
  const imdb_link = `https://www.imdb.com/title/${data.imdbId}/`
  const douban_link = `https://movie.douban.com/subject/${data.id}/`
  const imdbScore = `${data.imdbRating ?? 0}/10 from ${data.imdbRatingCount ?? 0} users`
  const doubanScore = `${data.douBanRating ?? 0}/10 from ${data.douBanRatingCount ?? 0} users`

  let description = data.mainPic ? `[img]${data.mainPic}[/img]\n\n` : ''
  description += data.title ? `◎译　　名　${data.title}\n` : ''
  description += data.originalTitle ? `◎片　　名　${data.originalTitle}\n` : ''
  description += data.year ? `◎年　　代　${data.year}\n` : ''
  description += data.countries ? `◎产　　地　${data.countries}\n` : ''
  description += data.genres ? `◎类　　别　${data.genres}\n` : ''
  description += data.languages ? `◎语　　言　${data.languages}\n` : ''
  description += data.publishDate ? `◎上映日期　${data.publishDate}\n` : ''
  description += data.officialWebsite ? `◎官方网站　${data.officialWebsite}\n` : ''
  description += `◎IMDb评分  ${imdbScore}\n`
  description += data.imdbId ? `◎IMDb链接  ${imdb_link}\n` : ''
  description += `◎豆瓣评分　${doubanScore}\n`
  description += douban_link ? `◎豆瓣链接　${douban_link}\n` : ''
  description += data.season ? `◎季　　数　${data.season}\n` : ''
  description += data.episodesCount ? `◎集　　数　${data.episodesCount}\n` : ''
  description += data.durations !== '' ? `◎片　　长　${data.durations}\n` : ''
  description += data.directors !== '' ? `◎导　　演　${data.directors}\n` : ''
  description += data.dramatist !== '' ? `◎编　　剧　${data.dramatist}\n` : ''
  description += data.actors !== '' ? `◎主　　演　${data.actors}\n` : ''
  description += data.tags !== '' ? `\n◎标　　签　${data.tags}\n` : ''
  description += data.intro !== '' ? `\n◎简　　介\n\n　　${data.intro}\n` : ''
  description += data.awards !== '' ? `\n◎获奖情况\n\n　　${data.awards}\n` : ''

  return description
}
