const port = 3000;

// Fetches JSON content from URL. Only GET requests are supported.
// Returns the string "error" if request fails + automatically displays error message for user.
export async function fetchByProxy(url, errorFrame, silentError, errorMsg) {

    try {
        const list = await fetch(`http://localhost:${port}/proxy/` + url);
        

        if (!list.ok) {
            throw new Error(`Could not fetch requested data. HTTP response code: ${list.status}`);
        }

        const listObj = await list.json();
        return listObj
    } catch (error) {
        
        if (!silentError) {
            console.error(error)
            errorFrame.querySelector('p').textContent = (errorMsg || "An unknown error has occurred.");
            errorFrame.style.display = '';
        }
        

        return "error"
    }
}


export const placeholderGameIcon = "/static/images/placeholders/placeholderGameIcon.png";
export const placeholderGroupIcon = "/static/images/placeholders/placeholderGameIcon.png";
export const placeholderUserIcon = "/static/images/placeholders/placeholderUserIcon.png";
export const redundantUni = "2206832338";