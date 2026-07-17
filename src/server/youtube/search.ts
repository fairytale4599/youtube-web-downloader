import { getKey } from '../cookies';

export async function searchYouTubeVideos(query: string, pageToken: string = '') {
    const apiKey = getKey('apiKey');
    
    if (!apiKey) {
        console.error('API key is required.');
        return { items: [], nextPageToken: undefined, prevPageToken: undefined };
    }

    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;
    
    if (pageToken) {
        url += `&pageToken=${pageToken}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            console.log('No videos found.');
            return { items: [], nextPageToken: undefined, prevPageToken: undefined };
        }

        return {
            items: data.items,
            nextPageToken: data.nextPageToken,
            prevPageToken: data.prevPageToken
        };
    } catch (error) {
        console.error('Error fetching data from YouTube API:', error);
        return { items: [], nextPageToken: undefined, prevPageToken: undefined };
    }
}
