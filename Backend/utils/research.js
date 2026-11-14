import "dotenv/config";

/**
 * Searches the web for authoritative technical documentation, guides, and links using Tavily API.
 * Increased to 8 results for richer resources.
 */
export async function searchTavily(query) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
        return [];
    }

    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: `${query} documentation guide tutorial`,
                search_depth: "basic",
                include_answer: false,
                max_results: 8
            }),
            signal: AbortSignal.timeout(7000)
        });

        if (!response.ok) {
            console.warn(`Tavily search warning: status ${response.status}`);
            return [];
        }

        const data = await response.json();
        if (!data || !Array.isArray(data.results)) {
            return [];
        }

        return data.results.map((item) => {
            let domain = "";
            try {
                domain = new URL(item.url).hostname.replace(/^www\./, "");
            } catch (e) {
                domain = "doc";
            }
            return {
                title: item.title || "Reference",
                url: item.url,
                domain,
                content: (item.content || "").slice(0, 350)
            };
        });
    } catch (err) {
        console.warn("Tavily search unavailable:", err.message);
        return [];
    }
}

/**
 * Searches Tavily for real-world salary data and job role market trends in India.
 */
export async function searchTavilySalary(query) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
        return [];
    }

    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: `${query} developer roles salary in India fresher mid senior LPA AmbitionBox Glassdoor`,
                search_depth: "basic",
                include_answer: true,
                max_results: 4
            }),
            signal: AbortSignal.timeout(6500)
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return (data.results || []).map((item) => ({
            title: item.title,
            url: item.url,
            content: (item.content || "").slice(0, 350)
        }));
    } catch (err) {
        console.warn("Tavily salary search unavailable:", err.message);
        return [];
    }
}

/**
 * Searches YouTube for relevant technical tutorials and videos.
 */
export async function searchYouTube(query) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        return [];
    }

    try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=4&q=${encodeURIComponent(query + " tutorial practical project")}&type=video&key=${apiKey}`;
        
        const response = await fetch(searchUrl, {
            signal: AbortSignal.timeout(7000)
        });

        if (!response.ok) {
            console.warn(`YouTube search warning: status ${response.status}`);
            return [];
        }

        const data = await response.json();
        if (!data || !Array.isArray(data.items)) {
            return [];
        }

        return data.items.map((item) => ({
            title: item.snippet?.title || "Tutorial Video",
            videoId: item.id?.videoId,
            url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
            channelTitle: item.snippet?.channelTitle || "",
            thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || ""
        })).filter(video => video.videoId);
    } catch (err) {
        console.warn("YouTube search unavailable:", err.message);
        return [];
    }
}

/**
 * Concurrently gathers Tavily web docs, live salary market insights, and YouTube tutorials.
 */
export async function fetchResearchData(query) {
    const [tavilyResult, salaryResult, youtubeResult] = await Promise.allSettled([
        searchTavily(query),
        searchTavilySalary(query),
        searchYouTube(query)
    ]);

    const webResults = tavilyResult.status === "fulfilled" ? tavilyResult.value : [];
    const salaryResults = salaryResult.status === "fulfilled" ? salaryResult.value : [];
    const videoResults = youtubeResult.status === "fulfilled" ? youtubeResult.value : [];

    return {
        webResults,
        salaryResults,
        videoResults
    };
}
