import * as cheerio from "cheerio";
import { HTML2BBCode } from "html2bbcode";

export const AUTHOR = "anicmv";
const VERSION = "0.0.1";

export const NONE_EXIST_ERROR = "The corresponding resource does not exist.";

const default_body = {
  success: false,
  error: null,
  format: "",
  copyright: `Powered by @${AUTHOR}`,
  version: VERSION,
  generate_at: 0,
};

// 修改 page_parser
export function page_parser(responseText: string) {
  return cheerio.load(responseText, {
    decodeEntities: false,
  } as any);
}

// 修改 jsonp_parser 的 catch
export function jsonp_parser(responseText: string) {
  try {
    responseText = responseText.replace(/\n/gi, "").match(/[^(]+\((.+)\)/)![1];
    return JSON.parse(responseText);
  } catch {
    return {};
  }
}

export function html2bbcode(html: string) {
  const converter = new HTML2BBCode();
  const bbcode = converter.feed(html);
  return bbcode.toString();
}

export function makeJsonResponse(body_update: Record<string, any>) {
  const body = {
    ...default_body,
    ...body_update,
    generate_at: new Date().valueOf(),
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
