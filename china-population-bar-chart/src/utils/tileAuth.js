// 天地图鉴权与 URL 构造工具
// - 已不再区分 proxy/direct 模式，始终直连远端（更易理解与部署）
// - 统一从环境/查询/本地缓存读取 TK，并支持多子域名轮询
/**
 * 获取天地图 TK
 * 优先级：env > URL 查询 > localStorage > window.__TDT_TK
 * @returns {string} TK 字符串，若未配置则返回空串
 */
export function getTdtToken() {
  try {
    const getFromQuery = () => {
      if (typeof window === 'undefined' || !window.location || !window.location.search) return '';
      const params = new URLSearchParams(window.location.search);
      return params.get('tk') || params.get('TDT_TK') || '';
    };
    const envTk =
      typeof import.meta !== 'undefined' && import.meta.env
        ? (import.meta.env.VITE_TDT_TOKEN || import.meta.env.VITE_TDT_TK || '')
        : '';
    const queryTk = getFromQuery();
    const lsTk = typeof localStorage !== 'undefined' ? (localStorage.getItem('TDT_TK') || '') : '';
    const globalTk = typeof window !== 'undefined' && window.__TDT_TK ? String(window.__TDT_TK) : '';
    return envTk || queryTk || lsTk || globalTk || '';
  } catch (_) {
    return '';
  }
}

/**
 * 域名分片（sharding）：根据 x/y 将请求均衡到不同子域名，缓解同域并发限制
 * @param {number} x - 瓦片列号
 * @param {number} y - 瓦片行号
 * @param {number} mod - 分片数量（如 4 或 8）
 */
/**
 * 子域名分片：根据 x/y 将请求均衡到不同子域名
 * @param {number} x - 瓦片列号
 * @param {number} y - 瓦片行号
 * @param {number} [mod=8] - 分片数量（如 4 或 8）
 * @returns {number} 子域索引 0..mod-1
 */
function shardByXY(x, y, mod = 8) {
  // 简单分片规则：按 x+y 对 mod 求余，返回 0..mod-1
  const a = Number(x) || 0;
  const b = Number(y) || 0;
  const m = Number(mod) || 1;
  return Math.abs((a + b) % m);
}

/**
 * 构造指定子域名的 WMTS 瓦片 URL（天地图）
 * @param {"tdt-img"|"tdt-cva"|"tdt-ter"} provider - 图层类型
 * @param {number} z - 缩放级别
 * @param {number} y - 行号（TILEROW）
 * @param {number} x - 列号（TILECOL）
 * @param {string} [tkOverride] - 可选 TK 覆盖
 * @param {number} shardIndex - 子域名编号（0..7）
 * @returns {string} 完整的 WMTS 请求 URL
 */
export function buildTileURLShard(provider, z, y, x, tkOverride, shardIndex) {
  const Z = Number(z), Y = Number(y), X = Number(x);
  const tk = tkOverride || getTdtToken();
  const s = Math.max(0, Math.min(7, Number(shardIndex) || 0));
  switch (provider) {
    case 'tdt-img':
      return `https://t${s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${Z}&TILECOL=${X}&TILEROW=${Y}&tk=${tk}`;
    case 'tdt-cva':
      return `https://t${s}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${Z}&TILECOL=${X}&TILEROW=${Y}&tk=${tk}`;
    case 'tdt-ter':
      return `https://t${s}.tianditu.gov.cn/ter_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ter&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${Z}&TILECOL=${X}&TILEROW=${Y}&tk=${tk}`;
    default:
      return '';
  }
}
