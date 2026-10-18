let toggleTabHeaders = document.querySelector('fieldset.toggleable_tab_headers');
let toggleTabContent = document.querySelector('section.toggleable_tab_content');
let loadingFrame = toggleTabContent.querySelector(':scope > .base_loading');
let errorFrame = toggleTabContent.querySelector(':scope > .base_error');
let userId = parseInt(document.querySelector('meta[name="user_id"]').getAttribute("data-user-id"))

let tabStatus = {
    "users_places": "loading",
    "users_groups": "loading"
}

let placesList = [];
let groupList = [];

import { integerAbbreviator } from '../modules/prettier.js';
import { fetchByProxy, placeholderGameIcon, placeholderGroupIcon, redundantUni } from '../modules/net_utils.js';

// HELPERS
// ==============================================================================================================



// GAMES HANDLER
// ==============================================================================================================


let hasGameLoaderRun = false;
let hasAnyGames = true;
async function fetchUserGames () {
    // return;
    if (!hasAnyGames) {
        errorFrame.style.display = '';
        errorFrame.querySelector('p').textContent = "No public games found.";
    }

    if (hasGameLoaderRun) return;
    hasGameLoaderRun = true;

    loadingFrame.style.display = '';
    tabStatus.users_places = "loading";

    let publicGameUniList = [];
    let finishedQuerying = false;
    let cursor = "";

    let didPublicGameApiWork = true;

    // Checks for user's public games using API (this method takes priority)
    while (!finishedQuerying) {
        let results = await fetchByProxy(`https://games.roblox.com/v2/users/${userId}/games?limit=50&sortOrder=Asc&cursor=${cursor || ""}`, errorFrame, false, "Could not fetch some of user's games (Roblox's API might be down).");
        let listOfPlaceIds = ""
        let listOfUniIds = ""
        let placesToProcess = {};

        if (typeof results !== "object") {
            didPublicGameApiWork = false
            break;
        }

        for (let i = 0; i < results.data.length; i++) {
            let place = results.data[i];
            publicGameUniList.push(place.id);

            placesToProcess[place.id] = {
                "universeId": place.id,
                "name": place.name,
                "placeId": place.rootPlace.id,
                "sortOrder": i + 1
            }

            listOfUniIds += place.id + ",";
            listOfPlaceIds += place.rootPlace.id + ",";
        }

        cursor = results.nextPageCursor;
        if (!cursor || cursor.length == 0) {
            finishedQuerying = true;
        };

        if (results.data.length === 0) {break;}

        listOfUniIds = listOfUniIds.substring(0, listOfUniIds.length - 1);
        listOfPlaceIds = listOfPlaceIds.substring(0, listOfPlaceIds.length - 1);
        results = await fetchByProxy(`https://games.roblox.com/v1/games/votes?universeIds=${listOfUniIds}`, errorFrame, true);

        if (typeof results === "object") {
            results.data.forEach((universeEntry) => {
                placesToProcess[universeEntry.id].upVotes = universeEntry.upVotes;
                placesToProcess[universeEntry.id].downVotes = universeEntry.downVotes;
            })
        } 


        results = await fetchByProxy(`https://games.roblox.com/v1/games?universeIds=${listOfUniIds}`, errorFrame, false, "Could not fetch information for certain games (Roblox's API might be down)");

        if (typeof results === "object") {
            results.data.forEach((universeEntry) => {
                if (universeEntry.id === 0) return;
                placesToProcess[universeEntry.id].playing = universeEntry.playing;
            })
        } 

        // For some reason if the icon of the game got deleted, the image would not exist if you were to get it
        // by the game's universe ID, so I have to use the game's root place ID

        let placeEntries = {};
        let placeValues = Object.values(placesToProcess);
        placeValues.forEach((value) => {
            placeEntries[value.placeId] = value;
        })


        results = await fetchByProxy(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${listOfPlaceIds}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`, errorFrame, false, "Could not fetch icons for certain games.");
        if (typeof results === "object") {
            results.data.forEach((thumbnailEntry) => {
                placeEntries[thumbnailEntry.targetId].iconUrl = thumbnailEntry.imageUrl;
            })
        }

        placeValues = Object.values(placeEntries);
        placeValues.forEach((value) => {
            placesToProcess[value.universeId] = value;
        })

        let finalisedListOfPlaces = Object.values(placesToProcess)
        finalisedListOfPlaces.sort((a, b) => {
            if (a.sortOrder < b.sortOrder) return -1;
            else return 1;
        })
        finalisedListOfPlaces.forEach((placeEntry) => {
            placesList.push(placeEntry);
        })
    }

    finishedQuerying = false;
    cursor = "";

    // Checks for user's inventory for games (only works if their inventory is public)
    while (!finishedQuerying) {
        let results = await fetchByProxy(`https://inventory.roblox.com/v1/users/${userId}/places/inventory?placesTab=3&itemsPerPage=50&cursor=${cursor || ""}`, errorFrame, true);
        let listOfPlaceIds = ""; // For querying icon API later
        let listOfUniIds = "";
        let universeToProcess = []; // Collecting unique unverse IDs the user owns to iterate and find root place info
        let universeObjEntries = {}; // Where we write root place info, universe ID and icon URL to

        // First, we grab universe IDs to check for their root places
        // We check against the array of universe IDs we got in the first while loop (publicGameUniList) + this while loop (universeToProcess)
        
        if (typeof results !== "object") break;

        results.data.forEach((placeEntry, index) => {
            if (publicGameUniList.includes(placeEntry.universeId) || universeToProcess.includes(placeEntry.universeId)) return;
            placeEntry.sortOrder = index + 1;
            listOfUniIds += placeEntry.universeId + ","
            universeToProcess.push(placeEntry.universeId);        
        })
        

        cursor = results.data.nextPageCursor
        if (!cursor || cursor.length == 0) {finishedQuerying = true}
        if (listOfUniIds.length === 0) {continue}
        
        let useAlternateMethod = false;

        listOfUniIds = listOfUniIds.substring(0, listOfUniIds.length - 1);
        
        results = await fetchByProxy(`https://games.roblox.com/v1/games?universeIds=${listOfUniIds + (listOfUniIds.split(",").length === 1 && `,${redundantUni}` || "")}`, errorFrame, true);

        if (typeof results === "object") {
            for (let i = 0; i < results.data.length; i++) {
                let data = results.data[i];
                if (data.id === 0) break;
                if (data.id == redundantUni) continue;
                universeObjEntries[data.id] = {
                    name: data.name,
                    universeId: data.id,
                    placeId: data.rootPlaceId,
                    playing: data.playing
                }
                listOfPlaceIds += data.rootPlaceId + ",";
            }
        } else {
            useAlternateMethod = true;
        }
        
        
        if (useAlternateMethod) {
            // Now, we search each universe ID we got in universeToProcess for its root place ID + name
            for (let i = 0; i < universeToProcess.length; i++) {
                let universeId = universeToProcess[i];
                let cursor2 = "";
                let hasRootPlaceBeenFound = false;

                while (!hasRootPlaceBeenFound) {
                    let results = await fetchByProxy(`https://develop.roblox.com/v2/universes/${universeId}/places?extendedSettings=true&cursor=${cursor2 || ""}`, errorFrame, false, "Could not fetch information for certain games (Roblox's API might be down)");

                    if (typeof results !== "object") break;
                        
                    for (let k = 0; k < results.data.length; k++) {
                        let data = results.data[k];
                        if (!data.isRootPlace) continue;
                        universeObjEntries[data.universeId] = {
                            name: data.name,
                            universeId: data.universeId,
                            placeId: data.id
                        }
                        listOfPlaceIds += data.id + ",";
            
                        hasRootPlaceBeenFound = true;
                        break;
                    }
                        

                    if (hasRootPlaceBeenFound) break;
                    cursor2 = results.nextPageCursor;

                }
            }
        }

        results = await fetchByProxy(`https://games.roblox.com/v1/games/votes?universeIds=${listOfUniIds}`, errorFrame, true)
        if (typeof results === "object") {
            results.data.forEach((voteEntry) => {
                universeObjEntries[voteEntry.id].upVotes = voteEntry.upVotes;
                universeObjEntries[voteEntry.id].downVotes = voteEntry.downVotes;
            })
        }

        listOfPlaceIds = listOfPlaceIds.substring(0, listOfPlaceIds.length - 1);

        let placesEntries = {};
        let universeValues = Object.values(universeObjEntries)
        universeValues.forEach((value) => {
            placesEntries[value.placeId] = value;
        })
        
        // Finally, we fetch the icons of the games by their universe IDs
        results = await fetchByProxy(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${listOfPlaceIds}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`, errorFrame, false ,"Could not fetch icons for certain games.");
        if (typeof results === "object") {
            results.data.forEach((thumbnailEntry) => {
                placesEntries[thumbnailEntry.targetId].iconUrl = thumbnailEntry.imageUrl
            })
        }

        let finalList = Object.values(placesEntries)
        finalList.sort((a, b) => {
            if (a.sortOrder < b.sortOrder) return -1;
            else return 1;
        })
        finalList.forEach((finalPlaceInfo) => {
            placesList.push(finalPlaceInfo);
        })
    
}

    finishedQuerying = false;
    cursor = "";

    // Check for user's favourite games to see if they favourited any of their own games
    
    while (!finishedQuerying) {
        let results = await fetchByProxy(`https://games.roblox.com/v2/users/${userId}/favorite/games?limit=50&sortOrder=Desc&cursor=${cursor || ""}`, errorFrame, true);
        let loggedUniPlaces = {};
        let listOfPlaceIds = "";
        let listOfUniIds = "";

        if (typeof results !== "object") {break;}

        results.data.forEach((favourite, index) => {
            if (favourite.creator.type.toLowerCase() !== "user" || favourite.creator.id !== userId) return;
            if (publicGameUniList.includes(favourite.id)) return;
                
            publicGameUniList.push(favourite.id);
            loggedUniPlaces[favourite.id] = {
                name: favourite.name,
                universeId: favourite.id,
                placeId: favourite.rootPlace.id,
                sortOrder: index + 1
            }

            listOfPlaceIds += favourite.rootPlace.id + ",";
            listOfUniIds += favourite.id + ",";
        })

        cursor = results.nextPageCursor;
        if (!cursor || cursor.length == 0) finishedQuerying = true;
        if (listOfPlaceIds.length === 0) continue;

        listOfPlaceIds = listOfPlaceIds.substring(0, listOfPlaceIds.length - 1)
        listOfUniIds = listOfUniIds.substring(0, listOfUniIds.length - 1)

        results = await fetchByProxy(`https://games.roblox.com/v1/games?universeIds=${(listOfUniIds.split(",").length === 1 && listOfUniIds + "," + redundantUni) || listOfUniIds}`, errorFrame, true);
        if (typeof results === "object") {
            results.data.forEach((game) => {
                if (game.id === 0) return;
                if (game.id == redundantUni) return;
                loggedUniPlaces[game.id].playing = game.playing;
            })
        }

        results = await fetchByProxy(`https://games.roblox.com/v1/games/votes?universeIds=${listOfUniIds}`, errorFrame, true);
        if (typeof results === "object") {
            results.data.forEach((ratings) => {
                loggedUniPlaces[ratings.id].upVotes = ratings.upVotes;
                loggedUniPlaces[ratings.id].downVotes = ratings.downVotes;
            })
        }


        

        let loggedPlaces = {};
        
        
        Object.values(loggedUniPlaces).forEach((uni) => {
            loggedPlaces[uni.placeId] = uni
        })

        results = await fetchByProxy(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${listOfPlaceIds}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`, errorFrame, false, "Could not fetch icons for certaing games.");
        if (typeof results === "object") {
            results.data.forEach((icon) => {
                loggedPlaces[icon.targetId].iconUrl = icon.imageUrl;
            })
        }

        let finalListOfUnis = Object.values(loggedPlaces);
        finalListOfUnis.sort((a, b) => {
            if (a.sortOrder < b.sortOrder) return -1;
            else return 1;
        });

        finalListOfUnis.forEach((uni) => {
            placesList.push(uni);
        })

        
    }
    

    tabStatus.users_places = "done";
    loadingFrame.style.display = 'none';

    if (placesList.length === 0) {
        hasAnyGames = false;
        errorFrame.style.display = '';
        if (!didPublicGameApiWork) errorFrame.querySelector('p').textContent = "Could not fetch some of user's games (Roblox's API might be down).";
        else errorFrame.querySelector('p').textContent = "No games found."
        return
    }

    let gamePlaceList = toggleTabContent.querySelector('ul.game_place_list');
    let template = gamePlaceList.querySelector('li.template');

    placesList.forEach((place) => {
        let newPlace = template.cloneNode(true);
        newPlace.classList.remove("template");

        newPlace.querySelector('a').href = `/games/${place.placeId}`;
        newPlace.querySelector('a > div > img').src = place.iconUrl || placeholderGameIcon,
        newPlace.querySelector('.grid_item_title').textContent = place.name;

        if (place.upVotes === undefined || place.downVotes === undefined) {
            newPlace.querySelector('ul.grid_subtext li.game_like_dislike_ratio span').textContent = "Unknown";
        } else if (place.upVotes === place.downVotes && place.downVotes === 0) {
            newPlace.querySelector('ul.grid_subtext li.game_like_dislike_ratio span').textContent = "-- %";
        } else {
            newPlace.querySelector('ul.grid_subtext li.game_like_dislike_ratio span').textContent = Math.floor(place.upVotes / (place.downVotes + place.upVotes) * 100) + "%";
        }

        if (place.playing === undefined) {
            newPlace.querySelector('ul.grid_subtext li.game_playing_now span').textContent = "?";
        } else {
            newPlace.querySelector('ul.grid_subtext li.game_playing_now span').textContent = integerAbbreviator(place.playing, true);
        }

        gamePlaceList.appendChild(newPlace);
        
    })
    
}

// GROUP HANDLER
// ==============================================================================================================

let hasGroupLoaderRun = false;
let hasAnyGroups = true;

async function fetchUserGroups () {
    if (!hasAnyGroups) {
        errorFrame.querySelector('p').textContent = "No groups found."
        errorFrame.style.display = '';
        loadingFrame.style.display = 'none';
    }

    if (hasGroupLoaderRun) return;
    hasGroupLoaderRun = true;

    loadingFrame.style.display = '';
    tabStatus.users_groups = "loading";
    let groupInfo = {};
    let listOfGroups = [""];
    // let listOfGroups = "";

    let result = await fetchByProxy(`https://groups.roblox.com/v1/users/${userId}/groups/roles?includeLocked=true`, errorFrame, false, "Could not fetch user groups (Roblox's API might be down).")
    if (typeof result !== "object") {hasGroupLoaderRun = false; return;}

    let elapsedGames = 0
    result.data.forEach((group) => {
        groupInfo[group.group.id] = {
            id: group.group.id,
            name: group.group.name,
            hasVerifiedBadge: group.group.hasVerifiedBadge,
            isOwner: ((group.group.owner) && userId === group.group.owner.userId) || false,
            role: group.role.name,
            memberCount: group.group.memberCount,
            primaryGroup: false
        }

        elapsedGames++;
        if (elapsedGames > 40) {
            elapsedGames = 0;
            listOfGroups.push("")
        }
        
        listOfGroups[listOfGroups.length - 1] += group.group.id + ",";
    })

    if (result.data.length === 0) {
        hasAnyGroups = false;
        errorFrame.querySelector('p').textContent = "No groups found."
        errorFrame.style.display = '';
        tabStatus.users_groups = "done"
        loadingFrame.style.display = 'none';
        return;
    }

    result = await fetchByProxy(`https://groups.roblox.com/v1/users/${userId}/groups/primary/role`, errorFrame, true, "Could not fetch user's primary group.")
    if (result) {
        if (groupInfo[result.group.id]) {
            groupInfo[result.group.id].primaryGroup = true;
        } else {
            let groupData = await fetchByProxy(`https://groups.roblox.com/v1/groups/${result.group.id}`, errorFrame, true, "Could not fetch user's primary group.");
            if (typeof groupData === "object") {
                groupInfo[groupData.id] = {
                    id: groupData.id,
                    name: groupData.name,
                    hasVerifiedBadge: groupData.hasVerifiedBadge,
                    isOwner: ((groupData.owner) && userId === groupData.owner.userId) || false,
                    role: '(Unknown)',
                    memberCount: groupData.memberCount,
                    primaryGroup: true
                }
            }
        }
        
    }


    for (let i = 0; i < listOfGroups.length; i++) {
        let grpIds = listOfGroups[i];
        grpIds = grpIds.substring(0, grpIds.length - 1);

        result = await fetchByProxy(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${grpIds}&size=420x420&format=Png&isCircular=false`, errorFrame, false, "Could not group icons.")
        if (typeof result === "object") {
            result.data.forEach((icon) => {
                groupInfo[icon.targetId].iconUrl = icon.imageUrl;
            })
        }
    }

    let finalGroupList = Object.values(groupInfo);
    finalGroupList.sort((a, b) => {
        if (a.primaryGroup && !b.primaryGroup) return -1;
        else if (!a.primaryGroup && b.primaryGroup) return 1;

        if (a.isOwner && !b.isOwner) return -1;
        else if (!a.isOwner && b.isOwner) return 1;

        if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
        else return 1;
    })

    finalGroupList.forEach((group) => {groupList.push(group)});

    let groupTab = toggleTabContent.querySelector('ul.game_group_list');
    let template = groupTab.querySelector('li.template');

    groupList.forEach((group) => {
        let newGroup = template.cloneNode(true);
        newGroup.classList.remove('template');

        newGroup.querySelector('a').href = `/groups/${group.id}`;
        if (group.primaryGroup) {
            newGroup.querySelector('span.top_right_label').textContent = 'Primary';
        } else if (group.isOwner) {
            newGroup.querySelector('span.top_right_label').textContent = 'Owner';
        } else {
            newGroup.querySelector('span.top_right_label').style.display = 'none';
        }

        newGroup.querySelector('div > img').src = group.iconUrl || placeholderGroupIcon;
        newGroup.querySelector('p.grid_item_title').textContent = group.name;
        newGroup.querySelector('p.group_rank').textContent = group.role;

        let prettyNumber = integerAbbreviator(group.memberCount, true)
        newGroup.querySelector('p.group_members').textContent = prettyNumber + " members";

        if (group.hasVerifiedBadge) {
            newGroup.querySelector('img.base_profile_icon').style.display = ''
        } else {
            newGroup.querySelector('img.base_profile_icon').style.display = 'none'
        }

        groupTab.appendChild(newGroup);
    })

    tabStatus.users_groups = "done"
    loadingFrame.style.display = 'none';
}

// TAB TOGGLE FUNC
// ==============================================================================================================

function hideOtherTabs() {
    toggleTabContent.querySelectorAll(":scope > *").forEach((content) => {
        content.style.display = 'none';
    })
}

function refreshTabContent(event) {
    let clickedInput = event.currentTarget;
    let associatedContent = toggleTabContent.querySelector(`:scope > .${clickedInput.value}`);
    let contentStatus = tabStatus[clickedInput.value];
    hideOtherTabs()

    if (contentStatus == "loading") loadingFrame.style.display = ''
    associatedContent.style.display = '';

    if (clickedInput.value === "users_places") fetchUserGames();
    else if (clickedInput.value === "users_groups") fetchUserGroups();
}

toggleTabHeaders.querySelectorAll(':scope > input').forEach((input) => {
    input.addEventListener("change", refreshTabContent)
    if (input.checked) {
        let newChangeEvent = new Event("change");
        input.dispatchEvent(newChangeEvent);
    };
})