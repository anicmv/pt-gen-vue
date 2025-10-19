import { support_list } from "./config/domain";
import {
  AUTHOR,
  gen_douban,
  makeJsonResponse,
  search_douban,
  search_douban_mobile,
  gen_douban_mobile,
  search_bangumi,
  gen_bangumi
} from "./lib";

// 在文件顶部添加类型定义
interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>
  }
  PT_GEN_STORE?: {
    put: (key: string, value: string, options?: { expirationTtl: number }) => Promise<void>
  }
  SAVE_API_URL?: string
  SAVE_API_TOKEN?: string
  DOUBAN_COOKIE?: string
}


const DATA_SOURCE_CONFIG = {
  douban: {
    search: search_douban,
    generate: gen_douban,
  },
  doubanMobile: {
    search: search_douban_mobile,
    generate: gen_douban_mobile,
  },
  bangumi: {
    search: search_bangumi,
    generate: gen_bangumi,
  },
} as const;

export default {
  async fetch(request: Request, env: Env) {
    // 将 env 设置到 globalThis
    (globalThis as any).SAVE_API_URL = env.SAVE_API_URL;
    (globalThis as any).SAVE_API_TOKEN = env.SAVE_API_TOKEN;

    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/gen")) {
      return await handleApiRequest(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return handleOptions(request);
  }

  const cache = (caches as any).default;
  let response = await cache.match(request);

  if (!response) {
    const uri = new URL(request.url);

    try {
      let response_data;

      if (uri.searchParams.get("search")) {
        const keywords = uri.searchParams.get("search")!;
        const source = uri.searchParams.get("source") || "douban";

        if (source in DATA_SOURCE_CONFIG) {
          const config = DATA_SOURCE_CONFIG[source as keyof typeof DATA_SOURCE_CONFIG];
          if (config.search) {
            response_data = await config.search(keywords);
          } else {
            response_data = { error: "Search function not available for source: " + source };
          }
        } else {
          response_data = { error: "Unknown value of key `source`." };
        }
      } else {
        let site, sid;

        const url_ = uri.searchParams.get("url");
        if (url_) {
          for (const site_ in support_list) {
            const pattern = support_list[site_ as keyof typeof support_list];
            if (url_.match(pattern)) {
              site = site_;
              sid = url_.match(pattern)?.[1];
              break;
            }
          }
        } else {
          site = uri.searchParams.get("site");
          sid = uri.searchParams.get("sid");
        }

        if (site == null || sid == null) {
          response_data = {
            error: "Miss key of `site` or `sid`, or input unsupported resource `url`."
          };
        } else {
          if (site in DATA_SOURCE_CONFIG) {
            const config = DATA_SOURCE_CONFIG[site as keyof typeof DATA_SOURCE_CONFIG];
            if (config.generate) {
              response_data = await config.generate(sid);
            } else {
              response_data = { error: "Generate function not available for site: " + site };
            }
          } else {
            response_data = { error: "Unknown value of key `site`." };
          }
        }
      }

      if (response_data) {
        response = makeJsonResponse(response_data);

        if (env.PT_GEN_STORE && typeof response_data.error === "undefined") {
          const cache_key = `${uri.searchParams.get("site") || uri.searchParams.get("source")}_${uri.searchParams.get("sid") || uri.searchParams.get("search")}`;
          await env.PT_GEN_STORE.put(cache_key, JSON.stringify(response_data), {
            expirationTtl: 86400 * 2
          });
        }

        if (request.method === "GET" && response) {
          await cache.put(request, response.clone());
        }
      }

      if (!response) {
        response = makeJsonResponse({ error: "Unknown error." });
      }

      return response as Response;

    } catch (e: unknown) {
      const err_return = {
        error: `Internal Error, Please contact @${AUTHOR}. Exception: ${e instanceof Error ? e.message : String(e)}`,
      };

      response = makeJsonResponse(err_return);
      return response as Response;
    }
  }

  return response;
}

function handleOptions(request: Request) {
  if (
    request.headers.get("Origin") !== null &&
    request.headers.get("Access-Control-Request-Method") !== null &&
    request.headers.get("Access-Control-Request-Headers") !== null
  ) {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
        "Access-Control-Allow-Headers":
          "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers",
      },
    });
  } else {
    return new Response(null, {
      headers: {
        Allow: "GET, HEAD, OPTIONS",
      },
    });
  }
}
