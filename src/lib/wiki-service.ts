export interface WikipediaPage {
    title: string;
    extract: string;
    imageUrl?: string;
}

const WIKI_API_URL = "https://zh.wikipedia.org/w/api.php";
const API_USER_AGENT =
    "HistoryEchoes/0.1 (https://echoes.umiko.moe; contact@umi@umiko.moe)";

/**
 * 封装通用的维基百科API请求逻辑
 * @param params URL查询参数
 * @returns 解析后的JSON数据
 */
async function _fetchWikipediaAPI(params: URLSearchParams): Promise<any> {
    const url = `${WIKI_API_URL}?${params.toString()}`;
    try {
        const response = await fetch(url, {
            headers: {
                "Api-User-Agent": API_USER_AGENT,
            },
        });

        if (!response.ok) {
            throw new Error(
                `Wikimedia API request failed with status ${response.status}`
            );
        }
        return await response.json();
    } catch (error) {
        // 统一处理网络层面的错误
        console.error("Error during Wikipedia API request:", error);
        throw new Error("Failed to communicate with Wikipedia API.");
    }
}

/**
 * 根据人物名称搜索并获取其维基百科页面的主要内容和图片。
 *
 * @param figureName 要搜索的历史人物姓名
 * @returns 返回包含标题、摘要和图片链接的对象，如果找不到则返回null
 */
export async function getWikipediaPage(
    figureName: string
): Promise<WikipediaPage | null> {
    const params = new URLSearchParams({
        action: "query",
        format: "json",
        generator: "search",
        gsrsearch: figureName,
        gsrlimit: "1", // 只取最相关的第一个结果
        // 在获取到的页面上执行以下操作
        prop: "extracts|pageimages",
        explaintext: "true",
        pithumbsize: "500",
        redirects: "1",
    });

    try {
        const data = await _fetchWikipediaAPI(params);

        // 检查API是否返回了页面数据
        if (!data.query || !data.query.pages) {
            console.warn(`No page found for "${figureName}" on Wikipedia.`);
            return null;
        }

        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0]; // 获取第一个页面的ID
        const page = pages[pageId];

        // 确保页面有效
        if (!page || page.missing) {
            console.warn(`Page for "${figureName}" is marked as missing.`);
            return null;
        }

        return {
            title: page.title,
            extract: page.extract,
            imageUrl: page.thumbnail?.source,
        };
    } catch (error) {
        console.error(
            `Failed to get Wikipedia page for "${figureName}":`,
            error
        );
        return null;
    }
}
