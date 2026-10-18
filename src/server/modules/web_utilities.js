async function fetchFromURL(url) {
    try {
        let result = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });
        if (!result.ok) {
            throw new Error(`Could not fetch data. HTTP ${result.status}`)
        }

        let resultObj = await result.json();
        return resultObj

    } catch (error) {
        console.error(error)
        console.log("Link: " + url)
        return error.message
    }
}

function htmlEncode(str) {
    const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;' // Single quote (apostrophe); &apos; is not supported in all browsers
    };
    // Use a regex to match the reserved characters and replace them
    return str.replace(/[&<>"']/g, (char) => entities[char]);
}

const placeholderGameIcon = "/static/images/placeholders/placeholderGameIcon.png";
const placeholderGroupIcon = "/static/images/placeholders/placeholderGameIcon.png";
const placeholderUserIcon = "/static/images/placeholders/placeholderUserIcon.png";
const placeholderUnsupportedMediaThumbnail = "/static/images/placeholders/placeholderThumbnail.png";
const placeholderThumbnail = "/static/images/placeholders/placeholderThumbnail.png";
const redundantUni = "2206832338";

module.exports = {fetchFromURL, htmlEncode, placeholderGameIcon, 
    placeholderUnsupportedMediaThumbnail, placeholderThumbnail, placeholderGroupIcon,
    placeholderUserIcon, redundantUni}