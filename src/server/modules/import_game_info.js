
let webUtils = require('./web_utilities')

// Returns object to pass to other functions.
async function getUniverseId (placeId) {
    let universeId = await webUtils.fetchFromURL(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`)
    let responseObj = {}

    if (typeof universeId != "object") {
        return "An error occured while retrieving data from Roblox's end."
    }

    if (!universeId.universeId) {
        return "Invalid place ID. Ensure you've inputted the game's place ID and not its Universe ID."
    }

    universeId = universeId.universeId;
    responseObj.universeId = universeId;

    responseObj.placeId = placeId

    return responseObj
}

async function getPlaceMedia (responseObj) {


    // const placeholderIcon = "";
    // const placeholderThumbnail = "";
    // const placeholderVideo = "";

    let universeId = responseObj.universeId;
    let placeId = responseObj.placeId;

    // ICON
    // ===========================================================================================================================

    let [iconLink, thumbnailDetails, thumbnailLinks] = await Promise.allSettled([
        webUtils.fetchFromURL(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${placeId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`),
        webUtils.fetchFromURL(`https://games.roblox.com/v1/games/${universeId}/media?fetchAllExperienceRelatedMedia=true`),
        webUtils.fetchFromURL(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&countPerUniverse=100&defaults=true&size=768x432&format=Png&isCircular=false`)
    ]) 
    // thumbnailDetails only shows info for user-uploaded thumbnails


    iconLink = iconLink.value;
    thumbnailDetails = thumbnailDetails.value;
    thumbnailLinks = thumbnailLinks.value;

    if (typeof iconLink != "object") iconLink = {data: [{imageUrl: webUtils.placeholderGameIcon}]}
    iconLink = iconLink.data[0].imageUrl
    responseObj.icon = {}
    responseObj.icon = {
        imageUrl: iconLink,
    }

    // THUMBNAILS
    // ===========================================================================================================================

    responseObj.thumbnails = []

    if (typeof thumbnailDetails == "object") {
        for (let i = 0; i < thumbnailDetails.data.length; i++) {
            let details = thumbnailDetails.data[i];

            if (details.assetType !== "Image") {
                responseObj.thumbnails.push({
                    libraryId: details.imageId,
                    imageUrl: webUtils.placeholderUnsupportedMediaThumbnail,
                    altText: "Media type not supported (this asset is not an image)"
             })
             continue;
            }

            responseObj.thumbnails.push({
                libraryId: details.imageId,
                imageUrl: webUtils.placeholderThumbnail,
                altText: details.altText || null
            })
        }
    }
    
    if (typeof thumbnailLinks == "object" && typeof thumbnailDetails == "object") {
        for (let i = 0; i < thumbnailLinks.data[0].thumbnails.length; i++) {
            let details = thumbnailLinks.data[0].thumbnails[i];
            let doesImgExist = false;
            for (let k = 0; k < responseObj.thumbnails.length; k++) {
                if (responseObj.thumbnails[k].libraryId === details.targetId) {
                    responseObj.thumbnails[k].imageUrl = details.imageUrl;
                    doesImgExist = true;
                    break
                }
            }

            if (!doesImgExist) {
                responseObj.thumbnails.push({
                    libraryId: details.targetId,
                    imageUrl: details.imageUrl,
                    altText: null
                })
            }
        }
    } else if (typeof thumbnailLinks == "object") {
        // console.log(thumbnailLinks.data[0].thumbnails)
        for (let i = 0; i < thumbnailLinks.data[0].thumbnails.length; i++) {
            let details = thumbnailLinks.data[0].thumbnails[i];
            responseObj.thumbnails.push({
                libraryId: details.targetId,
                imageUrl: details.imageUrl,
                altText: null
            })
        }
    }
}

async function getFavouriteAndAvatar (responseObj) {
    let universeId = responseObj.universeId;
    let [favouriteCount, avatarType] = await Promise.allSettled([
        webUtils.fetchFromURL(`https://games.roblox.com/v1/games/${universeId}/favorites/count`),
        webUtils.fetchFromURL(`https://avatar.roblox.com/v1/game-start-info?universeId=${universeId}`)
    ])

    favouriteCount = favouriteCount.value;
    avatarType = avatarType.value;

    if (typeof favouriteCount === "object") {
        responseObj.favourites = favouriteCount.favoritesCount;
    } else {
        responseObj.favourites = "Unknown";
    }

    if (typeof avatarType === "object") {
        responseObj.avatarType = avatarType.gameAvatarType;
    } else {
        responseObj.avatarType = "Unknown";
    }
    
    return responseObj
}

async function getPlaceInfo (responseObj) {

    let universeId = responseObj.universeId;
    let placeId = responseObj.placeId;
    
    
    let [upvoteDownvotes, universeInfo, placeInfo, lastSavedVer] = await Promise.allSettled([
        webUtils.fetchFromURL(`https://games.roblox.com/v1/games/votes?universeIds=${universeId}`),
        webUtils.fetchFromURL(`https://games.roblox.com/v1/games?universeIds=${universeId},${webUtils.redundantUni}`),
        webUtils.fetchFromURL(`https://economy.roblox.com/v2/assets/${placeId}/details`),
        webUtils.fetchFromURL(`https://develop.roblox.com/v2/universes/${universeId}/places?extendedSettings=true&limit="100"`)
    ])

    upvoteDownvotes = upvoteDownvotes.value;
    universeInfo = universeInfo.value;
    placeInfo = placeInfo.value;
    lastSavedVer = lastSavedVer.value;


    // UPVOTES & DOWNVOTES
    // ===========================================================================================================================

    if (typeof upvoteDownvotes == "object") {
        responseObj.upVotes = upvoteDownvotes.data[0].upVotes;
        responseObj.downVotes = upvoteDownvotes.data[0].downVotes;
    } else {
        responseObj.upVotes = "Unknown";
        responseObj.downVotes = "Unknown";
    }

    // UNIVERSE INFO
    // ===========================================================================================================================

    if (typeof universeInfo == "object") {
        if (universeInfo.data[0].id === 0) { // Private game
            await getFavouriteAndAvatar(responseObj)
            responseObj.accessFee = 0
            responseObj.genre = "Unknown"
            responseObj.accessFee = 0
            responseObj.playing = "Unknown"
            responseObj.visits = "Unknown"
        } else {
            responseObj.genre = universeInfo.data[0].genre_l1;
            responseObj.subgenre = universeInfo.data[0].genre_l2;
            responseObj.avatarType = universeInfo.data[0].universeAvatarType;
            responseObj.favourites = universeInfo.data[0].favoritedCount;
            responseObj.playing = universeInfo.data[0].playing;
            responseObj.visits = universeInfo.data[0].visits;

            responseObj.creator = {
                id: universeInfo.data[0].creator.id,
                creatorType: universeInfo.data[0].creator.type,
                name: universeInfo.data[0].creator.name,
                verified: universeInfo.data[0].creator.hasVerifiedBadge
            }
        }

    } else {
        await getFavouriteAndAvatar(responseObj)
        responseObj.genre = "Unknown";
    }

    if (responseObj.avatarType == "MorphToR15") responseObj.avatarType = "R15"
    else if (responseObj.avatarType == "MorphToR6") responseObj.avatarType = "R6"
    else if (responseObj.avatarType == "PlayerChoice") responseObj.avatarType = "Player Choice"

    // PLACE INFO
    // ===========================================================================================================================

    if (typeof placeInfo == "object") {
        responseObj.name = placeInfo.Name;
        responseObj.description = webUtils.htmlEncode(placeInfo.Description);
        responseObj.description = responseObj.description.replace(/[\n]/g, "\n")
        responseObj.updated = placeInfo.Updated;
        responseObj.created = placeInfo.Created;
        responseObj.icon.libraryId = placeInfo.IconImageAssetId;
        responseObj.accessFee = placeInfo.PriceInRobux

        if (placeInfo.PriceInRobux === null) responseObj.accessFee = 0;

        responseObj.creator = {
            id: placeInfo.Creator.CreatorTargetId,
            creatorType: placeInfo.Creator.CreatorType,
            name: placeInfo.Creator.Name,
            verified: placeInfo.Creator.HasVerifiedBadge
        }
    } else {
        responseObj.name = "(Could not Load)";
        responseObj.description = "<i>(Could not Load)</i>";
        responseObj.updated = "Unknown";
        responseObj.created = "Unknown";
        if (responseObj.accessFee === null) responseObj.accessFee = "Unknown";
    }

    // VERSION INFO
    // ===========================================================================================================================

    if (typeof lastSavedVer === "object") {
        let doesPlaceExist = false
        for (let i = 0; i < lastSavedVer.data.length; i++) {
            let place = lastSavedVer.data[i];
            if (place.id == placeId) {
                responseObj.currentSavedVersion = place.currentSavedVersion;
                responseObj.maxPlayers = place.maxPlayerCount;
                responseObj.uncopylocked = place.allowCopying;
                doesPlaceExist = true;
                break;
            }
        }

        let nextCursor = lastSavedVer.nextPageCursor
        while (!doesPlaceExist) {
            let nextPage = await webUtils.fetchFromURL(`https://develop.roblox.com/v2/universes/${universeId}/places?extendedSettings=true&limit="100"&cursor=${nextCursor}`);

            for (let i = 0; i < nextPage.data.length; i++) {
                let place = nextPage.data[i]
                if (place.id == placeId) {
                    responseObj.currentSavedVersion = place.currentSavedVersion;
                    responseObj.maxPlayers = place.maxPlayerCount;
                    responseObj.uncopylocked = place.allowCopying;
                    doesPlaceExist = true;
                    break;
                }
            }

            nextCursor = nextPage.nextPageCursor
        }
    } else {
        responseObj.currentSavedVersion = "Unknown";
        responseObj.maxPlayers = "Unknown";
        responseObj.uncopylocked = false;
    }
}

module.exports = {getUniverseId, getPlaceMedia, getPlaceInfo}


// let respObj = await getUniverseId(4050215579)
// await getPlaceMedia(respObj)
// await getPlaceInfo(respObj)
// console.log(respObj)