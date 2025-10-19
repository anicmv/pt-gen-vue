import { NONE_EXIST_ERROR, page_parser } from "./common";

export async function search_bangumi(query: string) {
  const tp_dict: { [key: number]: string } = {
    1: "漫画/小说",
    2: "动画/二次元番",
    3: "音乐",
    4: "游戏",
    6: "三次元番"
  };

  try {
    const bgm_search = await fetch(`http://api.bgm.tv/search/subject/${query}?responseGroup=large`);
    const bgm_search_json = await bgm_search.json();

    return {
      success: true,
      data: bgm_search_json.list.map((d: any) => {
        const rating = d['rating'] || {};
        const score = rating.score ?? 0;
        const ratingTotal = rating.total ?? 0;
        const ratingCount = rating.count || {};

        return {
          id: d['id'],
          type: d['type'],
          eps: d['eps'],
          epsCount: d['eps_count'],
          rank: d['rank'],
          url: d['url'],
          name: d['name'],
          nameCn: d['name_cn'],
          summary: d['summary'],
          airWeekday: d['air_weekday'],
          airDate: d['air_date'].slice(0, 4),
          images: d['images'],
          score: score,
          ratingTotal: ratingTotal,
          ratingCount: ratingCount
        };
      })
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: "Bangumi搜索失败",
    };
  }
}

export async function gen_bangumi(sid: string) {
  const data: { [key: string]: any } = {
    site: "bangumi",
    sid: sid
  };

  const bangumi_link = `https://bgm.tv/subject/${sid}`;
  const bangumi_page_resp = await fetch(bangumi_link);
  const bangumi_page_raw = await bangumi_page_resp.text();

  if (bangumi_page_raw.match(/呜咕，出错了/)) {
    return Object.assign(data, {
      error: NONE_EXIST_ERROR
    });
  }

  data["alt"] = bangumi_link;

  const bangumi_characters_req = fetch(`${bangumi_link}/characters`);

  const $ = page_parser(bangumi_page_raw);

  const cover_staff_another = $("div#bangumiInfo");
  const cover_another = cover_staff_another.find("a.thickbox.cover");
  const info_another = cover_staff_another.find("ul#infobox");
  const story_another = $("div#subject_summary");

  data["cover"] = data["poster"] = cover_another ? ("https:" + cover_another.attr("href"))?.replace(/\/cover\/[lcmsg]\//, "/cover/l/") : "";
  data["story"] = story_another ? story_another.text().trim() : "";

  const info = info_another.find("li").map(function () {
    return $(this).text();
  }).get();

  data["staff"] = info.filter((d: string) => {
    return !/^(中文名|话数|放送开始|放送星期|别名|官方网站|播放电视台|其他电视台|Copyright)/.test(d);
  });
  data["info"] = info.filter((d: string) => !(data["staff"].includes(d)));

  data["bangumi_votes"] = $('span[property="v:votes"]').text();
  data["bangumi_rating_average"] = $('div.global_score > span[property="v:average"]').text();

  data["tags"] = $('#subject_detail > div.subject_tag_section > div > a > span').map(function () {
    return $(this).text();
  }).get();

  const bangumi_characters_resp = await bangumi_characters_req;
  const bangumi_characters_page_raw = await bangumi_characters_resp.text();
  const bangumi_characters_page = page_parser(bangumi_characters_page_raw);
  const cast_actors = bangumi_characters_page("div#columnInSubjectA > div.light_odd > div.clearit");

  data["cast"] = cast_actors.map(function () {
    const tag = bangumi_characters_page(this);
    const h2 = tag.find("h2");
    const char = (h2.find("span.tip").text() || h2.find("a").text()).replace(/\//, "").trim();
    const cv = tag.find("div.clearit > p").map(function () {
      const p = bangumi_characters_page(this);
      return (p.find("small") || p.find("a")).text().trim();
    }).get().join("，");
    return `${char}: ${cv}`;
  }).get();

  let descr = (data["poster"] && data["poster"].length > 0) ? `[img]${data["poster"]}[/img]\n\n` : "";
  descr += (data["story"] && data["story"].length > 0) ? `[b]Story: [/b]\n\n${data["story"]}\n\n` : "";
  descr += (data["staff"] && data["staff"].length > 0) ? `[b]Staff: [/b]\n\n${data["staff"].slice(0, 15).join("\n")}\n\n` : "";
  descr += (data["cast"] && data["cast"].length > 0) ? `[b]Cast: [/b]\n\n${data["cast"].slice(0, 9).join("\n")}\n\n` : "";
  descr += (data["alt"] && data["alt"].length > 0) ? `(来源于 ${data["alt"]} )\n` : "";

  data["format"] = descr.trim();
  data["success"] = true;

  return data;
}
