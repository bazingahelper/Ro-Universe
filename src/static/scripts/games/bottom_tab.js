
let bottomTabHeaders = document.querySelector(".toggleable_tab_headers");
let bottomTabContent = document.querySelector(".toggleable_tab_content");
let indivHeaderBtn = bottomTabHeaders.querySelectorAll(`input[name="toggleable_tab"][type="radio"]`)
let placeId = parseInt(document.querySelector('meta[name="place_id"]').getAttribute("data-place-id"))
let universeId = parseInt(document.querySelector('meta[name="universe_id"]').getAttribute("data-universe-id"))


let tabStatus = {
    "game_servers": "loading", 
    "game_badges": "done", 
    "game_store": "done",
    "game_group_grid": "done"
}
// let serverListAsc = [];
// let serverListDesc = [];
let serverNavigation = {
    "Asc": {page: 0, cursor: "", serverList: []}, "Desc": {page: 0, cursor: "", serverList: []}
}
let placesList = [];
let badgesList = [];
let storeNavigation = {
    "Gamepass": [], "DevProducts": []
}


// HELPERS
// ===================================================================================================================

import { sortIntoMainPage, integerAbbreviator, formatDate } from "../modules/prettier.js";
import { fetchByProxy, placeholderGameIcon } from "../modules/net_utils.js"



// SERVER LIST FUNCTIONS
// =======================================================================================================================================


async function loadNewServers() {
    let isDescSortUsed = bottomTabContent.querySelector(".game_servers select.game_server_filter").value == "most"
    let sortOrderUsed = (isDescSortUsed && "Desc") || "Asc"

    let game_server_frame = bottomTabContent.querySelector(".game_servers")
    let loadingFrame = bottomTabContent.querySelector(".base_loading")

    let serverListFrame = (isDescSortUsed && game_server_frame.querySelector("ol.mostPlrs")) || game_server_frame.querySelector("ol.leastPlrs");
    let serverTemplate = serverListFrame.querySelector('.template');

    let errorFrame = bottomTabContent.querySelector(":scope > .base_error");
    errorFrame.style.display = 'none';

    let url = `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=${sortOrderUsed}&excludeFullGames=false&limit=100&cursor=${serverNavigation[sortOrderUsed].cursor}`;
    let fetchResults;

    const serverListPageLimit = 10

    // Each GET request fetches 100 servers max.
    // We split the servers we received into pages with 10 servers max.
    // When we reach a page divisible by 10, we have reached the end of all our
    // server pages, and need to retrieve more.

    if (serverNavigation[sortOrderUsed].page % 10 === 0 || serverNavigation[sortOrderUsed].page === 0) {
        loadingFrame.style.display = '';
        tabStatus["game_servers"] = "loading";
        fetchResults = await fetchByProxy(url, errorFrame, false, "Unable to fetch servers.");

        if (typeof fetchResults === "string") return;

        serverNavigation[sortOrderUsed].cursor = fetchResults.nextPageCursor || null;
        serverNavigation[sortOrderUsed].serverList = sortIntoMainPage(serverNavigation[sortOrderUsed].serverList, fetchResults.data, serverListPageLimit)
    }

    let showmoreBtn = game_server_frame.querySelector("button.game_server_loadmore")

    // We are at the end of the server list page v
    if (serverNavigation[sortOrderUsed].page < serverNavigation[sortOrderUsed].serverList.length - 1) {
        showmoreBtn.style.display = '';
    } else {
        showmoreBtn.style.display = 'none';
    }

    tabStatus["game_servers"] = "yetToLoad";
    loadingFrame.style.display = 'none';



    if (!serverNavigation[sortOrderUsed].serverList[serverNavigation[sortOrderUsed].page] || serverNavigation[sortOrderUsed].serverList[serverNavigation[sortOrderUsed].page].length === 0) {
        tabStatus["game_servers"] = "done"
        errorFrame.querySelector('p').textContent = "No more servers found."
        errorFrame.style.display = '';
        return
    }

    for (let i = 0; i < serverNavigation[sortOrderUsed].serverList[serverNavigation[sortOrderUsed].page].length; i++) {
        let newServerInfo = serverNavigation[sortOrderUsed].serverList[serverNavigation[sortOrderUsed].page][i];
        let newServer = serverTemplate.cloneNode(true);
        newServer.classList.remove("template");

        newServer.setAttribute("data-server-id", newServerInfo.id);
        newServer.setAttribute("data-playing-now", newServerInfo.playing);
        newServer.setAttribute("data-max-players", newServerInfo.maxPlayers);
        newServer.querySelector(":scope .server_players").textContent = `${newServerInfo.playing} of ${newServerInfo.maxPlayers} players`;
        newServer.querySelector(":scope .server_ping").textContent = `Ping: ${newServerInfo.ping || "Unknown"}`;
        newServer.querySelector(":scope a").href = `roblox://experiences/start?placeId=${placeId}&gameInstanceId=${newServerInfo.id}`

        serverListFrame.appendChild(newServer)
    }

    serverNavigation[sortOrderUsed].serverList.page++;

}

function switchServerAscView() {
    let serverSort = bottomTabContent.querySelector(".game_servers select.game_server_filter");
    let descFrame = bottomTabContent.querySelector(".game_servers ol.mostPlrs");
    let ascFrame = bottomTabContent.querySelector(".game_servers ol.leastPlrs");
    if (serverSort.value == "most") {
        descFrame.style.display = '';
        ascFrame.style.display = 'none'
        if (serverNavigation["Desc"].page == 0 && serverNavigation["Asc"].cursor != "") loadNewServers()
    } else {
        descFrame.style.display = 'none';
        ascFrame.style.display = ''
        if (serverNavigation["Asc"].page == 0 && serverNavigation["Desc"].cursor != "") loadNewServers()
    }
}

function toggleFullServerFilter() {
    let filterFullServers = bottomTabContent.querySelector('.game_servers input[type="checkbox"][id="game_server_excludefull"]').checked
    let isDescSortUsed = bottomTabContent.querySelector(".game_servers select.game_server_filter").value == "most"
    let frameUsed
    
    if (isDescSortUsed) {
        frameUsed = bottomTabContent.querySelector(".game_servers ol.mostPlrs");
    }
    else {
        frameUsed = bottomTabContent.querySelector(".game_servers ol.leastPlrs");
    }

    let listItems = Array.from(frameUsed.querySelectorAll("li:not(.template)"));

    if (isDescSortUsed) {
        for (let i = 0; i < listItems.length; i++) {
            let item = listItems[i];
            if (item.getAttribute("data-playing-now") === item.getAttribute("data-max-players")) {
                if (filterFullServers) item.style.display = "none";
                else item.style.display = "";
            } else break;
        }
    } else {
        for (let i = listItems.length - 1; i > 0; i--) {
            let item = listItems[i];
            if (item.getAttribute("data-playing-now") === item.getAttribute("data-max-players")) {
                if (filterFullServers) item.style.display = "none";
                else item.style.display = "";
            } else break;
        }
    }

}

// PLACES FUNCTIONS
// =======================================================================================================================================

// CALL THIS ONCE (unless this fails)!
let hasSubplaceBeenLoaded = false
async function loadAllSubplaces() {

    let errorFrame = bottomTabContent.querySelector(":scope > .base_error");
    let loadingFrame = bottomTabContent.querySelector(":scope > .base_loading");
    tabStatus.game_servers = "loading";
    errorFrame.style.display = 'none';
    loadingFrame.style.display = '';

    if (hasSubplaceBeenLoaded) {
        tabStatus.game_servers = "done";
        loadingFrame.style.display = 'none';
        return
    };
    hasSubplaceBeenLoaded = true;

    let hasAllPlacesBeenSearched = false;
    let cursor = "";
    let versionToUse = "v2";

    while (!hasAllPlacesBeenSearched) {
        let idToIcon = {};
        let listOfIds = "";
        let subplaces = await fetchByProxy(`https://develop.roblox.com/v2/universes/${universeId}/places?extendedSettings=true&limit=50&cursor=${cursor || ""}`, errorFrame, false, "Unable to fetch places.")
        
        if (typeof subplaces == "string") {
            hasSubplaceBeenLoaded = false;
            return
        };
        for (let i = 0; i < subplaces.data.length; i++) {
            let data = subplaces.data[i]
            idToIcon[parseInt(data.id)] = {
                id: data.id,
                name: data.name,
                isRootPlace: (versionToUse == "v2" && data.isRootPlace) || false,
                version: data.currentSavedVersion,
                sortOrder: i + 1
            }

            listOfIds += (data.id + ",")
            if (data.isRootPlace) versionToUse = "v1";
        }

        if (!subplaces.nextPageCursor) hasAllPlacesBeenSearched = true
        else cursor = subplaces.nextPageCursor

        listOfIds = listOfIds.substring(0, listOfIds.length - 1)
        let gameIcons = await fetchByProxy(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${listOfIds}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`, errorFrame, false, "Could not fetch icons for some places.")

        if (typeof gameIcons === "object") {
            for (let i = 0; i < gameIcons.data.length; i++) {
                let data = gameIcons.data[i];
                idToIcon[data.targetId].iconUrl = data.imageUrl;
            }
        }

        let finalIdToIcon = Object.values(idToIcon)
        finalIdToIcon.sort((a, b) => {
            if (a.sortOrder < b.sortOrder) return -1;
            else return 1;
        })
        

        for (let i = 0; i < finalIdToIcon.length; i++) {
            placesList.push(finalIdToIcon[i]);
        }
    }

    let gamePlaceList = bottomTabContent.querySelector('ul.game_place_list');
    let gameTemplate = gamePlaceList.querySelector('li.template');

    for (let i = 0; i < placesList.length; i++) {
        let subplace = placesList[i];

        let newGame = gameTemplate.cloneNode(true);
        newGame.classList.remove('template');
        newGame.querySelector('p.grid_item_title').textContent = subplace.name;
        newGame.querySelector('p.grid_subtext').textContent = (subplace.isRootPlace && "Start Place") || "";
        
        if (placeId === subplace.id) {
            newGame.querySelector('a').href = `#`;
        } else {
            newGame.querySelector('a').href = `/games/${subplace.id}`;
        }
        newGame.querySelector('div > img').src = subplace.iconUrl || placeholderGameIcon;
        
        let prettyVersion = integerAbbreviator(subplace.version, false)
        if (typeof prettyVersion === "object") {
            newGame.querySelector('p.game_place_version').textContent = `Version ${prettyVersion.shortenedInt}`;
        } else {
            newGame.querySelector('p.game_place_version').textContent = `Version ${prettyVersion}`;
        }
        

        gamePlaceList.appendChild(newGame);
    }

    tabStatus.game_servers = "done";
    loadingFrame.style.display = 'none';
}

// BADGES FUNCTION
// =======================================================================================================================================
let hasBadgesBeenLoaded = false;
let areBadgesZero = false;

async function loadAllBadges() {

    let errorFrame = bottomTabContent.querySelector(":scope > .base_error");
    let loadingFrame = bottomTabContent.querySelector(":scope > .base_loading");


    if (areBadgesZero) {
        errorFrame.style.display = '';
        errorFrame.querySelector('p').textContent = "No badges found."
        tabStatus.game_servers = "done";
        loadingFrame.style.display = 'none';
        return;
    }

    if (hasBadgesBeenLoaded) {
        return
    };

    tabStatus.game_servers = "loading";
    errorFrame.style.display = 'none';
    loadingFrame.style.display = '';

    hasBadgesBeenLoaded = true;

    let hasAllBadgesBeenSearched = false;
    let cursor = "";
    let passedBadges = 0;

    while (!hasAllBadgesBeenSearched) {
        let idToIcon = {};
        let listOfIds = "";
        let badges = await fetchByProxy(`https://badges.roblox.com/v1/universes/${universeId}/badges?sortBy=Rank&limit=50&sortOrder=Asc&cursor=${cursor || ""}`, errorFrame, false, "Could not fetch badges.")
        
        if (typeof badges == "string") {
            hasBadgesBeenLoaded = false
            return
        };


        for (let i = 0; i < badges.data.length; i++) {
            let data = badges.data[i]
            let dataToPush = {};
            let dataKeys = Object.keys(data)
            for (let k = 0; k < dataKeys.length; k++) {
                dataToPush[dataKeys[k]] = data[dataKeys[k]]
            }
            dataToPush.sortOrder = i + 1;

            idToIcon[data.id] = dataToPush
            

            listOfIds += (data.id + ",")
        }

        if (!badges.nextPageCursor) {
            hasAllBadgesBeenSearched = true;
        } else cursor = badges.nextPageCursor
        passedBadges += badges.data.length;

        if (badges.data.length === 0) {
            for (let i = 0; i < idToIcon.length; i++) {
                badgesList.push(idToIcon[i]);
            }
            break;
        }

        listOfIds = listOfIds.substring(0, listOfIds.length - 1)
        let badgeIcons = await fetchByProxy(`https://thumbnails.roblox.com/v1/badges/icons?badgeIds=${listOfIds}&size=150x150&format=Png&isCircular=false`, errorFrame, false, "Failed to retrieve some badge icons.")
        
        if (typeof badgeIcons == "object") {
            for (let i = 0; i < badgeIcons.data.length; i++) {
                let data = badgeIcons.data[i];
                idToIcon[data.targetId].iconUrl = data.imageUrl;
            }
        }

        let finalIdToIcon = Object.values(idToIcon);
        finalIdToIcon.sort((a, b) => {
            if (a.sortOrder < b.sortOrder) return -1;
            else return 1;
        })
        

        for (let i = 0; i < finalIdToIcon.length; i++) {
            badgesList.push(finalIdToIcon[i]);
        }
    }

    let badgesListFrame = bottomTabContent.querySelector('.game_badges > ul');
    let badgeTemplate = badgesListFrame.querySelector('li.template');

    for (let i = 0; i < badgesList.length; i++) {
        let badge = badgesList[i];

        let newBadge = badgeTemplate.cloneNode(true);
        newBadge.classList.remove('template');
        newBadge.querySelector('a').href = `https://roblox.com/badges/${badge.id}`;
        newBadge.querySelector('img').src = badge.iconUrl || "";
        newBadge.querySelector('.badge_basic_info h2').textContent = badge.name;
        newBadge.querySelector('.badge_basic_info p').textContent = badge.description || "";

        let prettyWonYestStat = integerAbbreviator(badge.statistics.pastDayAwardedCount, false)
        let percentageStr = (badge.statistics.winRatePercentage * 100).toFixed(2).split("").reverse();

        for (let k = 0; k < percentageStr.length; k++) {
            if (percentageStr[k] === "0") {
                percentageStr.splice(k, 1);
                k--;
            } else if (percentageStr[k] === ".") {
                if (k === 0) percentageStr.splice(k, 1);
                break
            }
        }

        percentageStr = percentageStr.reverse().join("")

        if (typeof prettyWonYestStat == "string") {
            newBadge.querySelector('.badge_yesterday p:not(:first-child)').textContent = percentageStr + "% (" + prettyWonYestStat + ")";
        } else {
            newBadge.querySelector('.badge_yesterday p:not(:first-child)').textContent = percentageStr + "% (" + prettyWonYestStat.shortenedInt + ")";
        }

        newBadge.querySelector('div.badge_yesterday_percentage').style.width = `${(badge.statistics.winRatePercentage * 100)}%`;

        let prettyWonAllTimeStat = integerAbbreviator(badge.statistics.awardedCount, false)
        if (typeof prettyWonAllTimeStat == "string") {
            newBadge.querySelector('.badge_all_time p:not(:first-child)').textContent = prettyWonAllTimeStat;
        } else {
            newBadge.querySelector('.badge_all_time p:not(:first-child)').textContent = prettyWonAllTimeStat.shortenedInt;
        }
        

        badgesListFrame.appendChild(newBadge);
    }

    tabStatus.game_servers = "done";
    loadingFrame.style.display = 'none';

    if (badgesList.length == 0) {
        areBadgesZero = true;
        errorFrame.style.display = '';
        errorFrame.querySelector('p').textContent = "No badges found."
        return;
    }

}

// STORE FUNCTIONS
// =======================================================================================================================================

function switchStoreViewer() {
    let storeOption = bottomTabContent.querySelector('.game_store > select');
    let passList = bottomTabContent.querySelector('.game_store ul.game_store_pass');
    let devProductList = bottomTabContent.querySelector('.game_store ul.game_store_devproduct');

    if (storeOption.value === "Gamepasses") {
        passList.style.display = '';
        devProductList.style.display = 'none';
    } else {
        passList.style.display = 'none';
        devProductList.style.display = '';
    }

}

function closeDialogOnBackdropClick(event) {
    let storeDialog = bottomTabContent.querySelector('dialog#store_dialog');
    if (event.target != storeDialog) return;

    let dialogBounds = storeDialog.getBoundingClientRect();
    if (event.clientX < dialogBounds.left || event.clientX > dialogBounds.right || event.clientY < dialogBounds.top || event.clientY > dialogBounds.bottom) {
        storeDialog.closest();
    }
}

function inspectStoreHandler(event) {
    let btn = event.currentTarget;
    let storeDialog = bottomTabContent.querySelector('dialog#store_dialog');
    let dialogHeader = storeDialog.querySelector('header > h3.dialog_title');
    
    let storeIcon = storeDialog.querySelector('.dialog_content > .dialog_image img#dialog_product_image');
    let storeIconMobile = storeDialog.querySelector('.dialog_content .dialog_image.mobile_visible > img');
    let storeName = storeDialog.querySelector('.dialog_content section.dialog_title h2 span');
    let storeLink = storeDialog.querySelector('.dialog_content section.dialog_title a');

    let dialog_stats = storeDialog.querySelector('section.dialog_stats')
    let priceText = dialog_stats.querySelector('#dialog_price_row span');
    let priceRbx = dialog_stats.querySelector('#dialog_price_row img');
    let type = dialog_stats.querySelector('#dialog_type_row td');
    let iconLink = dialog_stats.querySelector('#dialog_iconlink td a');
    let productId = dialog_stats.querySelector('#dialog_productID_row td');
    let devProductIdRow = dialog_stats.querySelector('#dialog_devProductID_row');
    let gamepassIdRow = dialog_stats.querySelector('#dialog_gamepassID_row');
    let createdDate = dialog_stats.querySelector('#dialog_created_row button');
    let updatedDate = dialog_stats.querySelector('#dialog_updated_row button')
    let descRow = dialog_stats.querySelector('#dialog_description_row')


    if (btn.getAttribute("data-gamepass-order-id")) {
        let storeEntry = storeNavigation.Gamepass[parseInt(btn.getAttribute("data-gamepass-order-id"))];
        if (storeEntry !== storeEntry) return;

        dialogHeader.textContent = "View Gamepass";
        storeIcon.src = storeEntry.iconUrl;
        storeIconMobile.src = storeEntry.iconUrl;
        storeName.textContent = (storeEntry.name);
        storeLink.href = `https://roblox.com/game-pass/${storeEntry.id}`;

        if (storeEntry.isForSale) priceRbx.style.display = '';
        else priceRbx.style.display = 'none';

        priceText.textContent = (!storeEntry.isForSale && "Offsale") || (integerAbbreviator(storeEntry.price, false).shortenedInt || integerAbbreviator(storeEntry.price, false))
        type.textContent = "Gamepass";
        iconLink.href = `https://roblox.com/library/${storeEntry.displayIconImageAssetId}`;
        productId.textContent = storeEntry.productId;

        devProductIdRow.style.display = 'none';
        gamepassIdRow.style.display = '';
        gamepassIdRow.querySelector('td').textContent = storeEntry.id;

        let creationDateArray = formatDate(storeEntry.created);
        createdDate.setAttribute("data-toggle-text-1", creationDateArray[0])
        createdDate.setAttribute("data-toggle-text-2", creationDateArray[1])
        createdDate.setAttribute("data-toggle-text-3", creationDateArray[2])
        createdDate.setAttribute("data-hint-on-hover", creationDateArray[2])
        createdDate.textContent = createdDate.getAttribute(`data-toggle-text-${createdDate.getAttribute("data-current-sequence")}`)

        let updateDateArray = formatDate(storeEntry.updated);
        updatedDate.setAttribute("data-toggle-text-1", updateDateArray[0])
        updatedDate.setAttribute("data-toggle-text-2", updateDateArray[1])
        updatedDate.setAttribute("data-toggle-text-3", updateDateArray[2])
        updatedDate.setAttribute("data-hint-on-hover", updateDateArray[2])
        updatedDate.textContent = updatedDate.getAttribute(`data-toggle-text-${updatedDate.getAttribute("data-current-sequence")}`)

        if (!storeEntry.description || storeEntry.description.length == 0) {
            descRow.style.display = 'none';
        } else descRow.style.display = '';

        descRow.querySelector('td').textContent = (storeEntry.description);

    } else if (btn.getAttribute("data-devproduct-order-id")) {
        let storeEntry = storeNavigation.DevProducts[parseInt(btn.getAttribute("data-devproduct-order-id"))];
        if (storeEntry !== storeEntry) return;

        dialogHeader.textContent = "View Developer Product";
        storeIcon.src = storeEntry.iconUrl;
        storeIconMobile.src = storeEntry.iconUrl;
        storeName.textContent = (storeEntry.Name);
        storeLink.href = `https://roblox.com/developer-product/${universeId}/product/${storeEntry.ProductId}`;

        if (storeEntry.IsForSale) priceRbx.style.display = '';
        else priceRbx.style.display = 'none';

        priceText.textContent = (!storeEntry.IsForSale && "Offsale") || (integerAbbreviator(storeEntry.PriceInRobux, false).shortenedInt || integerAbbreviator(storeEntry.PriceInRobux, false))
        type.textContent = "Developer Product";
        iconLink.href = `https://roblox.com/library/${storeEntry.displayIcon}`;
        productId.textContent = storeEntry.ProductId;

        gamepassIdRow.style.display = 'none';
        devProductIdRow.style.display = '';
        devProductIdRow.querySelector('td').textContent = storeEntry.DeveloperProductId;

        let creationDateArray = formatDate(storeEntry.Created);
        createdDate.setAttribute("data-toggle-text-1", creationDateArray[0])
        createdDate.setAttribute("data-toggle-text-2", creationDateArray[1])
        createdDate.setAttribute("data-toggle-text-3", creationDateArray[2])
        createdDate.setAttribute("data-hint-on-hover", creationDateArray[2])
        createdDate.textContent = createdDate.getAttribute(`data-toggle-text-${createdDate.getAttribute("data-current-sequence")}`)

        let updateDateArray = formatDate(storeEntry.Updated);
        updatedDate.setAttribute("data-toggle-text-1", updateDateArray[0])
        updatedDate.setAttribute("data-toggle-text-2", updateDateArray[1])
        updatedDate.setAttribute("data-toggle-text-3", updateDateArray[2])
        updatedDate.setAttribute("data-hint-on-hover", updateDateArray[2])
        updatedDate.textContent = updatedDate.getAttribute(`data-toggle-text-${updatedDate.getAttribute("data-current-sequence")}`)

        if (!storeEntry.Description || storeEntry.Description.length == 0) {
            descRow.style.display = 'none';
        } else descRow.style.display = '';

        descRow.querySelector('td').textContent = (storeEntry.Description);

    } else {
        console.error("Cannot detect correct attribute.")
    }

    storeDialog.showModal()
}

let hasPassBeenLoaded = false;
let isPassZero = false;
let hasDevProductsBeenLoaded = false;
let isDevZero = false;

async function loadStorePassProducts() {
    let storeOption = bottomTabContent.querySelector('.game_store > select');
    let passList = bottomTabContent.querySelector('.game_store ul.game_store_pass');
    let devProductList = bottomTabContent.querySelector('.game_store ul.game_store_devproduct');

    let errorFrame = bottomTabContent.querySelector(":scope > .base_error");
    let loadingFrame = bottomTabContent.querySelector(":scope > .base_loading");
    errorFrame.style.display = 'none';

    if (storeOption.value === "Gamepasses") {

        
        if (isPassZero) {
            isDevZero = true;
            loadingFrame.style.display = 'none';
            tabStatus["game_store"] = "done";
            errorFrame.querySelector('p').textContent = "No gamepasses found."
            errorFrame.style.display = '';
            return
        }
        if (hasPassBeenLoaded) return;

        hasPassBeenLoaded = true;
        loadingFrame.style.display = '';
        tabStatus["game_store"] = "loading";
        let finishedQuerying = false;
        let cursor = "";

        while (!finishedQuerying) {
            let gpToProcess = {};
            let listOfIds = "";
            let gpQuery = await fetchByProxy(`https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?pageSize=50&pageToken=${cursor || ""}`, errorFrame, false, "Failed to retrieve gamepasses.");
            
            if (typeof gpQuery == "string") { // request failed, immediately abort
                hasPassBeenLoaded = false;
                loadingFrame.style.display = 'none';
                tabStatus["game_store"] = "done";
                return;
            }
            
            for (let i = 0; i < gpQuery.gamePasses.length; i++) {
                let gp = gpQuery.gamePasses[i];
                let gpExtraInfo = await fetchByProxy(`https://apis.roblox.com/game-passes/v1/game-passes/${gp.id}/product-info`, errorFrame, false, "Failed to retrieve information for gamepasses.")

                if (typeof gpExtraInfo == "string") {
                    gp.price = "Unknown"
                    gp.description = "(Could not load)"
                } else {
                    gp.price = gpExtraInfo.PriceInRobux || 0
                    gp.description = gpExtraInfo.Description
                }

                gpToProcess[gp.id] = gp
                gpToProcess[gp.id].layoutOrder = i + 1;


                listOfIds += gp.id + ","
            }

            if (gpQuery.nextPageToken) cursor = gpQuery.nextPageToken;
            else finishedQuerying = true;

            if (gpQuery.gamePasses.length == 0) {
                break;
            }

            listOfIds = listOfIds.substring(0, listOfIds.length - 1)
            let gpIconQuery = await fetchByProxy(`https://thumbnails.roblox.com/v1/game-passes?gamePassIds=${listOfIds}&size=150x150&format=Png&isCircular=false`, errorFrame, false, "Failed to retrieve some gamepass icons.")

            if (typeof gpIconQuery == "object") {
                for (let i = 0; i < gpIconQuery.data.length; i++) {
                    gpToProcess[gpIconQuery.data[i].targetId].iconUrl = gpIconQuery.data[i].imageUrl
                }
            }

            let finalisedGPToProcess = Object.values(gpToProcess);
            finalisedGPToProcess.sort((a, b) => {
                if (a.sortOrder < b.sortOrder) return -1;
                else return 1;
            });

            for (let i = 0; i < finalisedGPToProcess.length; i++) {
                storeNavigation.Gamepass.push(finalisedGPToProcess[i]);
            }
        }

        if (storeNavigation.Gamepass.length == 0) {
            isPassZero = true;
            loadingFrame.style.display = 'none';
            tabStatus["game_store"] = "done";
            errorFrame.querySelector('p').textContent = "No gamepasses found."
            errorFrame.style.display = '';
            return
        }

        let gpListFrame = bottomTabContent.querySelector('.game_store ul.game_store_pass')
        let gpTemplate = gpListFrame.querySelector('li.template');


        for (let i = 0; i < storeNavigation.Gamepass.length; i++) {
            let gp = storeNavigation.Gamepass[i];

            let newGpFrame = gpTemplate.cloneNode(true);
            newGpFrame.classList.remove("template");
            newGpFrame.querySelector('img').src = gp.iconUrl || "";
            newGpFrame.querySelector('div p:first-child').textContent = gp.name;
            if (gp.price) {
                let finalPrice = integerAbbreviator(gp.price, false);
                if (typeof finalPrice === "object") newGpFrame.querySelector('div p span').textContent = finalPrice.shortenedInt;
                else newGpFrame.querySelector('div p span').textContent = finalPrice

            } else newGpFrame.querySelector('div p span').textContent = (!gp.isForSale && "Offsale") || "Unknown"
            if (!gp.isForSale || !gp.price || gp.price <= 0) {
                newGpFrame.querySelector('div p img').style.display = 'none';
                newGpFrame.querySelector('div p span').style.color = 'rgba(0, 0, 0, 0.5)'
            }

            newGpFrame.querySelector('button.alert_trigger').setAttribute("data-gamepass-order-id", i)
            newGpFrame.querySelector('button.alert_trigger').addEventListener('click', inspectStoreHandler)
            gpListFrame.appendChild(newGpFrame);
        }

        loadingFrame.style.display = 'none';
        tabStatus["game_store"] = "done";

    } else {
        if (isDevZero) {
            isDevZero = true;
            loadingFrame.style.display = 'none';
            tabStatus["game_store"] = "done";
            errorFrame.querySelector('p').textContent = "No gamepasses found."
            errorFrame.style.display = '';
            return
        }
        if (hasDevProductsBeenLoaded) return;

        hasDevProductsBeenLoaded = true;
        loadingFrame.style.display = '';
        tabStatus["game_store"] = "loading";
        let finishedQuerying = false;
        let cursor = "";

        while (!finishedQuerying) {
            let productToProcess = {};
            let listOfIds = "";
            let productQuery = await fetchByProxy(`https://apis.roblox.com/developer-products/v2/universes/${universeId}/developerproducts?limit=100&cursor=${cursor}`, errorFrame, false, "Failed to fetch Developer Products.");
            
            if (typeof productQuery == "string") { // request failed, immediately abort
                hasPassBeenLoaded = false;
                loadingFrame.style.display = 'none';
                tabStatus["game_store"] = "done";
                return;
            }
            
            for (let i = 0; i < productQuery.developerProducts.length; i++) {
                let product = productQuery.developerProducts[i];
                productToProcess[product.DeveloperProductId] = product
                productToProcess[product.DeveloperProductId].layoutOrder = i + 1;

                listOfIds += product.DeveloperProductId + ","
            }

            if (productQuery.nextPageToken) cursor = productQuery.nextPageToken;
            else finishedQuerying = true;

            if (productQuery.developerProducts.length == 0) {
                break;
            }

            listOfIds = listOfIds.substring(0, listOfIds.length - 1)
            let productIconQuery = await fetchByProxy(`https://thumbnails.roblox.com/v1/developer-products/icons?developerProductIds=${listOfIds}&size=420x420&format=Png&isCircular=false`, errorFrame, false, "Failed to fetch some icons for Developer Products.")

            if (typeof productIconQuery === "object") {
                for (let i = 0; i < productIconQuery.data.length; i++) {
                    productToProcess[productIconQuery.data[i].targetId].iconUrl = productIconQuery.data[i].imageUrl
                }
            }

            let finalProductsToProcess = Object.values(productToProcess);
            finalProductsToProcess.sort((a, b) => {
                if (a.sortOrder < b.sortOrder) return -1;
                else return 1;
            });

            for (let i = 0; i < finalProductsToProcess.length; i++) {
                storeNavigation.DevProducts.push(finalProductsToProcess[i]);
            }
        }

        if (storeNavigation.DevProducts.length == 0) {
            isDevZero = true;
            loadingFrame.style.display = 'none';
            tabStatus["game_store"] = "done";
            errorFrame.querySelector('p').textContent = "No developer products found."
            errorFrame.style.display = '';
            return
        }

        let productListFrame = bottomTabContent.querySelector('.game_store ul.game_store_devproduct')
        let productTemplate = productListFrame.querySelector('li.template');


        for (let i = 0; i < storeNavigation.DevProducts.length; i++) {
            let product = storeNavigation.DevProducts[i];

            let newProduct = productTemplate.cloneNode(true);
            newProduct.classList.remove("template");
            newProduct.querySelector("img").src = product.iconUrl || "";
            newProduct.querySelector("div p:first-child").textContent = product.Name;

            if (product.PriceInRobux && product.IsForSale) {
                let finalPrice = integerAbbreviator(product.PriceInRobux, false)
                if (typeof finalPrice === "object") newProduct.querySelector("div p > span").textContent = finalPrice.shortenedInt
                else newProduct.querySelector("div p > span").textContent = finalPrice
                
            } else newProduct.querySelector("div p > span").textContent = "Offsale"
            
            if (!product.IsForSale || product.PriceInRobux <= 0) {
                newProduct.querySelector("div p > img").style.display = 'none';
                newProduct.querySelector("div p > span").style.color = 'rgba(0, 0, 0, 0.5)';
            }

            newProduct.querySelector("button.alert_trigger").setAttribute("data-devproduct-order-id", i);
            newProduct.querySelector("button.alert_trigger").addEventListener("click", inspectStoreHandler)
            productListFrame.appendChild(newProduct);
        }

        loadingFrame.style.display = 'none';
        tabStatus["game_store"] = "done";
    }
}


// GENERAL FUNCTIONS + SETUP
// =======================================================================================================================================

function hideAllBottomTabContent() {
    bottomTabContent.querySelectorAll(":scope > *:not(dialog)").forEach((bottomContentFrame) => {
        bottomContentFrame.style.display = 'none';
    })
}

function toggleBottomTab(event) {
    let selectedTab = bottomTabContent.querySelector("." + event.currentTarget.value)
    let loadingFrame = bottomTabContent.querySelector(":scope > .base_loading")
    let errorFrame = bottomTabContent.querySelector(":scope > .base_error")
    hideAllBottomTabContent()
    selectedTab.style.display = '';

    if (tabStatus[event.currentTarget.value] == "loading") loadingFrame.style.display = ''

    if (event.currentTarget.value == "game_servers") {
        if (tabStatus["game_servers"] == "done") {
            errorFrame.style.display = '';
            errorFrame.querySelector('p').textContent = "No more servers found."
        }
    } else if (event.currentTarget.value == "game_group_grid") {
        loadAllSubplaces()
    } else if (event.currentTarget.value == "game_badges") {
        loadAllBadges()
    } else if (event.currentTarget.value == "game_store") {
        loadStorePassProducts()
    }
}


indivHeaderBtn.forEach((button) => {
    button.addEventListener("change", toggleBottomTab)
    if (button.checked) {
        let changeEvent = new Event("change");
        button.dispatchEvent(changeEvent);
    }
})

// SERVERS SETUP
// =======================================================================================================================================

let serverDisabledTab = bottomTabContent.querySelector(".game_servers_disabled");
let serverEnableBtn = serverDisabledTab.querySelector("button")

let serverSort = bottomTabContent.querySelector(".game_servers select.game_server_filter");
serverSort.addEventListener("change", switchServerAscView)
switchServerAscView()

let filterFullServers = bottomTabContent.querySelector('.game_servers input[type="checkbox"][id="game_server_excludefull"]')
filterFullServers.addEventListener("change", toggleFullServerFilter)
toggleFullServerFilter()

let loadMoreBtn = bottomTabContent.querySelector('.game_servers button.game_server_loadmore')
loadMoreBtn.addEventListener('click', loadNewServers)

serverEnableBtn.addEventListener("click", () => {
    let serverBtn = bottomTabHeaders.querySelector(`input[name="toggleable_tab"][type="radio"][value="game_servers_disabled"]`)
    serverBtn.value = "game_servers"
    let changeEvent = new Event("change");
    serverBtn.dispatchEvent(changeEvent);
    loadNewServers();
})

// STORE SETUP
// =======================================================================================================================================

let storeOption = bottomTabContent.querySelector('.game_store > select');
storeOption.addEventListener("change", () => {switchStoreViewer(); loadStorePassProducts()})
switchStoreViewer()

let storeDialog = bottomTabContent.querySelector('dialog#store_dialog');
storeDialog.addEventListener("click", closeDialogOnBackdropClick)